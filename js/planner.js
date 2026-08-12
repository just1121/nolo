/* ============================================================
   planner.js — No/Lo Project Planner.
   Deterministic, inspectable logic. No AI, no cost estimates,
   no processing recipes, no regulatory determinations.
   Copy lives in js/content.js. State: localStorage
   (ws_nolo_project_v1) — contact info is NEVER stored.
   ============================================================ */
(function () {
  "use strict";
  window.WSNoLo = window.WSNoLo || {};
  var C = null; // content, bound at init
  var KEY = "ws_nolo_project_v1";

  /* ---------- storage ---------- */
  var storageOk = (function () {
    try {
      localStorage.setItem("ws_nolo_test", "1");
      localStorage.removeItem("ws_nolo_test");
      return true;
    } catch (e) { return false; }
  })();

  function saveState() {
    if (!storageOk) return;
    try {
      // Free-text fields are persisted only because the user explicitly
      // typed them into the planner. Contact info is never stored.
      localStorage.setItem(KEY, JSON.stringify({ project: project, lastStep: currentStep, completed: completed }));
    } catch (e) {}
  }
  function loadState() {
    if (!storageOk) return null;
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.project || parsed.project.version !== 1) return null;
      // Structural validation: a hand-edited or corrupted payload with the
      // right version must not be able to crash init with a TypeError.
      var p = parsed.project;
      var isObj = function (o) { return o && typeof o === "object"; };
      if (!isObj(p.wine) || !isObj(p.target) || !isObj(p.project) ||
          !isObj(p.project.chemistry) || !isObj(p.priorities) || !isObj(p.metadata)) return null;
      return parsed;
    } catch (e) { return null; }
  }
  function clearState() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  /* ---------- data model (spec §12) ---------- */
  function defaultProject() {
    var now = new Date().toISOString();
    return {
      version: 1,
      wine: { wineType: "", varietalStyle: "", vintage: "", format: "", productionStatus: [] },
      target: { currentABV: null, mode: "", targetABV: null, targetMin: null, targetMax: null, direction: "", lotSize: null, lotUnit: "gal", intent: "" },
      project: { filtrationState: "", timeline: "", locationPreference: "", analyses: [], chemistry: { pH: null, ta: null, rs: null } },
      priorities: { concerns: [], hesitation: "", successDefinition: "" },
      metadata: { createdAt: now, updatedAt: now, source: "direct" }
    };
  }

  var project = defaultProject();
  var currentStep = 1;
  var completed = false;
  var startedTracked = false;

  var els = {};

  /* ---------- helpers ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "text") el.textContent = attrs[k];
        else if (k === "html") el.innerHTML = attrs[k];
        else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }
  function optionLabel(list, value) {
    for (var i = 0; i < list.length; i++) if (list[i].value === value) return list[i].label;
    return value || "—";
  }
  function markStarted() {
    if (!startedTracked) {
      startedTracked = true;
      WSNoLo.visitor.set({ plannerStarted: true });
      WSNoLo.track("nolo_planner_started", { planner_step: currentStep });
    }
  }

  /* ---------- field builders ---------- */
  function fieldWrap(id, labelText, control, opts) {
    opts = opts || {};
    var label = h("label", { for: id, text: labelText });
    if (opts.required) {
      label.appendChild(h("span", { "aria-hidden": "true", text: " *", class: "ws-nolo-req" }));
      control.setAttribute("aria-required", "true");
    }
    var wrap = h("div", { class: "ws-nolo-field", "data-field": id }, [label, control]);
    if (opts.help) wrap.appendChild(h("p", { class: "ws-nolo-field__help", text: opts.help }));
    wrap.appendChild(h("p", { class: "ws-nolo-error", id: id + "-error", hidden: true }));
    return wrap;
  }
  function select(id, name, options, opts) {
    opts = opts || {};
    var s = h("select", { id: id, name: name });
    if (!opts.noEmpty) s.appendChild(h("option", { value: "", text: opts.emptyLabel || "Select…" }));
    options.forEach(function (o) { s.appendChild(h("option", { value: o.value, text: o.label })); });
    return s;
  }
  function radioGroup(idBase, name, options, legendText, required) {
    var legend = h("legend", { text: legendText });
    if (required) legend.appendChild(h("span", { "aria-hidden": "true", text: " *", class: "ws-nolo-req" }));
    var fs = h("fieldset", { class: "ws-nolo-choices", id: idBase, "data-field": idBase }, [legend]);
    options.forEach(function (o, i) {
      var id = idBase + "-" + o.value;
      var input = h("input", { type: "radio", id: id, name: name, value: o.value });
      if (required) input.setAttribute("aria-required", "true");
      var lab = h("label", { for: id, text: o.label });
      fs.appendChild(h("div", { class: "ws-nolo-choice" }, [input, lab]));
    });
    fs.appendChild(h("p", { class: "ws-nolo-error", id: idBase + "-error", hidden: true }));
    return fs;
  }
  function checkboxGroup(idBase, name, options, legendText, help) {
    var fs = h("fieldset", { class: "ws-nolo-choices", id: idBase, "data-field": idBase }, [h("legend", { text: legendText })]);
    if (help) fs.appendChild(h("p", { class: "ws-nolo-field__help", text: help }));
    options.forEach(function (o) {
      var id = idBase + "-" + o.value;
      var input = h("input", { type: "checkbox", id: id, name: name, value: o.value });
      var lab = h("label", { for: id, text: o.label });
      fs.appendChild(h("div", { class: "ws-nolo-choice" }, [input, lab]));
    });
    fs.appendChild(h("p", { class: "ws-nolo-error", id: idBase + "-error", hidden: true }));
    return fs;
  }

  /* ---------- step rendering ---------- */
  function renderProgress() {
    var wrap = els.progress;
    wrap.innerHTML = "";
    if (completed || currentStep === 5) {
      // results view handles its own heading
    }
    var ol = h("ol", { class: "ws-nolo-progress" });
    C.planner.steps.forEach(function (s) {
      var li = h("li", {
        class: "ws-nolo-progress__item" + (s.num === currentStep ? " is-current" : "") + (s.num < currentStep ? " is-done" : ""),
        "aria-current": s.num === currentStep ? "step" : null
      });
      li.appendChild(h("span", { class: "ws-nolo-progress__num", text: String(s.num) }));
      li.appendChild(h("span", { class: "ws-nolo-progress__label", text: s.label }));
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    wrap.appendChild(h("p", { class: "ws-nolo-progress__compact", text: "Step " + currentStep + " of 5" }));
  }

  function announceStep() {
    var s = C.planner.steps[currentStep - 1];
    els.announce.textContent = "Step " + currentStep + " of 5: " + s.label;
  }

  function stepSection(title, children) {
    var sec = h("div", { class: "ws-nolo-step" }, [h("h4", { class: "ws-nolo-step__title", text: title })]);
    children.forEach(function (c) { sec.appendChild(c); });
    return sec;
  }

  function renderStep1() {
    var o = C.planner.options;
    var wineType = select("ws-p-winetype", "wineType", o.wineType);
    var varietal = h("input", { type: "text", id: "ws-p-varietal", name: "varietalStyle", placeholder: "Cabernet Sauvignon", autocomplete: "off" });
    var vintage = h("input", { type: "text", id: "ws-p-vintage", name: "vintage", placeholder: "YYYY / NV / Other", autocomplete: "off" });
    return stepSection("The wine", [
      fieldWrap("ws-p-winetype", "Wine type", wineType, { required: true }),
      fieldWrap("ws-p-varietal", "Varietal / style", varietal),
      fieldWrap("ws-p-vintage", "Vintage", vintage),
      checkboxGroup("ws-p-status", "productionStatus", o.productionStatus, "Production status", "Optional — select all that apply."),
      radioGroup("ws-p-format", "format", o.format, "Still or sparkling", true)
    ]);
  }

  function renderStep2() {
    var o = C.planner.options;
    var abv = h("input", { type: "number", id: "ws-p-currentabv", name: "currentABV", min: "0", max: "25", step: "0.1", inputmode: "decimal" });
    var modeGroup = radioGroup("ws-p-mode", "mode", [
      { value: "exact", label: "Exact target" },
      { value: "range", label: "Range" },
      { value: "unsure", label: "I want to explore multiple targets" }
    ], "Desired target", true);

    // NOTE: wrapper ids must NOT collide with the radio input ids
    // (ws-p-mode-exact etc.) generated by radioGroup("ws-p-mode", ...).
    var exactWrap = h("div", { class: "ws-nolo-subfields", id: "ws-p-modefields-exact", hidden: true }, [
      fieldWrap("ws-p-targetabv", "Target ABV (%)", h("input", { type: "number", id: "ws-p-targetabv", name: "targetABV", min: "0", max: "25", step: "0.1", inputmode: "decimal" }), { required: true })
    ]);
    var rangeWrap = h("div", { class: "ws-nolo-subfields ws-nolo-subfields--row", id: "ws-p-modefields-range", hidden: true }, [
      fieldWrap("ws-p-targetmin", "From (%)", h("input", { type: "number", id: "ws-p-targetmin", name: "targetMin", min: "0", max: "25", step: "0.1", inputmode: "decimal" }), { required: true }),
      fieldWrap("ws-p-targetmax", "To (%)", h("input", { type: "number", id: "ws-p-targetmax", name: "targetMax", min: "0", max: "25", step: "0.1", inputmode: "decimal" }), { required: true })
    ]);
    var unsureWrap = h("div", { class: "ws-nolo-subfields", id: "ws-p-modefields-unsure", hidden: true }, [
      fieldWrap("ws-p-direction", "Which direction are you considering?", select("ws-p-direction", "direction", o.direction))
    ]);

    var lotRow = h("div", { class: "ws-nolo-subfields ws-nolo-subfields--row" }, [
      fieldWrap("ws-p-lotsize", "Lot size", h("input", { type: "number", id: "ws-p-lotsize", name: "lotSize", min: "0", step: "any", inputmode: "decimal" }), { required: true }),
      fieldWrap("ws-p-lotunit", "Unit", select("ws-p-lotunit", "lotUnit", o.lotUnit, { noEmpty: true }))
    ]);

    return stepSection("The target", [
      fieldWrap("ws-p-currentabv", "Current ABV (%)", abv, { required: true }),
      modeGroup, exactWrap, rangeWrap, unsureWrap,
      lotRow,
      fieldWrap("ws-p-intent", "Project intent", select("ws-p-intent", "intent", o.intent), { required: true })
    ]);
  }

  function renderStep3() {
    var o = C.planner.options;
    var chem = h("details", { class: "ws-nolo-details ws-nolo-details--form", id: "ws-p-chem" }, [
      h("summary", { text: "Add wine chemistry (optional)" }),
      h("div", { class: "ws-nolo-subfields ws-nolo-subfields--row" }, [
        fieldWrap("ws-p-ph", "pH", h("input", { type: "number", id: "ws-p-ph", name: "pH", min: "0", max: "14", step: "0.01", inputmode: "decimal" })),
        fieldWrap("ws-p-ta", "TA (g/L)", h("input", { type: "number", id: "ws-p-ta", name: "ta", min: "0", step: "0.1", inputmode: "decimal" })),
        fieldWrap("ws-p-rs", "RS (g/L)", h("input", { type: "number", id: "ws-p-rs", name: "rs", min: "0", step: "0.1", inputmode: "decimal" }))
      ]),
      // Chemistry values are stored for the project brief only.
      // They are NOT used to generate process predictions in v1.
      h("p", { class: "ws-nolo-field__help", text: "Stored for your project brief. Not used to calculate any processing prediction." })
    ]);
    return stepSection("The project", [
      radioGroup("ws-p-filtration", "filtrationState", o.filtrationState, "Current filtration state"),
      radioGroup("ws-p-timeline", "timeline", o.timeline, "Bottling / production timeline"),
      radioGroup("ws-p-location", "locationPreference", o.locationPreference, "Processing location preference"),
      checkboxGroup("ws-p-analyses", "analyses", o.analyses, "Existing analyses"),
      chem
    ]);
  }

  function renderStep4() {
    var o = C.planner.options;
    var concerns = checkboxGroup("ws-p-concerns", "concerns", o.concerns, "What are you most concerned about?", "Choose up to three.");
    var hesitation = h("textarea", { id: "ws-p-hesitation", name: "hesitation", rows: "3" });
    var success = h("textarea", { id: "ws-p-success", name: "successDefinition", rows: "3" });
    return stepSection("Your priorities", [
      concerns,
      fieldWrap("ws-p-hesitation", "What would make you hesitate to move forward?", hesitation),
      fieldWrap("ws-p-success", "What would be a successful trial?", success)
    ]);
  }

  function renderNav() {
    var nav = h("div", { class: "ws-nolo-planner__nav" });
    if (currentStep > 1) {
      var back = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", id: "ws-nolo-back", text: "Back" });
      back.addEventListener("click", function () { syncFromForm(); goToStep(currentStep - 1); });
      nav.appendChild(back);
    }
    var next = h("button", { type: "submit", class: "ws-nolo-btn ws-nolo-btn--primary", id: "ws-nolo-next", text: currentStep === 4 ? "Build My Project Brief" : "Next" });
    nav.appendChild(next);
    return nav;
  }

  function renderCurrentStep() {
    renderProgress();
    var form = els.form;
    form.innerHTML = "";
    form.hidden = false;
    els.results.hidden = true;
    var body;
    if (currentStep === 1) body = renderStep1();
    if (currentStep === 2) body = renderStep2();
    if (currentStep === 3) body = renderStep3();
    if (currentStep === 4) body = renderStep4();
    if (currentStep === 1 || currentStep === 2) {
      body.insertBefore(
        h("p", { class: "ws-nolo-field__help", text: "Fields marked * are required." }),
        body.children[1] || null
      );
    }
    form.appendChild(body);
    form.appendChild(renderNav());
    hydrateForm();
    bindModeToggle();
    announceStep();
  }

  /* ---------- form <-> state sync ---------- */
  function setVal(id, v) { var el = document.getElementById(id); if (el && v != null && v !== "") el.value = v; }
  function setChecked(name, values) {
    values = values || [];
    els.form.querySelectorAll("input[name='" + name + "']").forEach(function (i) {
      if (i.type === "checkbox") i.checked = values.indexOf(i.value) !== -1;
    });
  }
  function setRadio(name, value) {
    var el = els.form.querySelector("input[name='" + name + "'][value='" + value + "']");
    if (el) el.checked = true;
  }

  function hydrateForm() {
    if (currentStep === 1) {
      setVal("ws-p-winetype", project.wine.wineType);
      setVal("ws-p-varietal", project.wine.varietalStyle);
      setVal("ws-p-vintage", project.wine.vintage);
      setChecked("productionStatus", project.wine.productionStatus);
      if (project.wine.format) setRadio("format", project.wine.format);
    }
    if (currentStep === 2) {
      setVal("ws-p-currentabv", project.target.currentABV);
      if (project.target.mode) setRadio("mode", project.target.mode);
      setVal("ws-p-targetabv", project.target.targetABV);
      setVal("ws-p-targetmin", project.target.targetMin);
      setVal("ws-p-targetmax", project.target.targetMax);
      setVal("ws-p-direction", project.target.direction);
      setVal("ws-p-lotsize", project.target.lotSize);
      setVal("ws-p-lotunit", project.target.lotUnit || "gal");
      setVal("ws-p-intent", project.target.intent);
      toggleModeFields();
    }
    if (currentStep === 3) {
      if (project.project.filtrationState) setRadio("filtrationState", project.project.filtrationState);
      if (project.project.timeline) setRadio("timeline", project.project.timeline);
      if (project.project.locationPreference) setRadio("locationPreference", project.project.locationPreference);
      setChecked("analyses", project.project.analyses);
      setVal("ws-p-ph", project.project.chemistry.pH);
      setVal("ws-p-ta", project.project.chemistry.ta);
      setVal("ws-p-rs", project.project.chemistry.rs);
      var chem = project.project.chemistry;
      if (chem.pH != null || chem.ta != null || chem.rs != null) {
        var d = document.getElementById("ws-p-chem"); if (d) d.open = true;
      }
    }
    if (currentStep === 4) {
      setChecked("concerns", project.priorities.concerns);
      setVal("ws-p-hesitation", project.priorities.hesitation);
      setVal("ws-p-success", project.priorities.successDefinition);
    }
  }

  function num(id) {
    var el = document.getElementById(id);
    if (!el || el.value === "") return null;
    var n = parseFloat(el.value);
    return isNaN(n) ? null : n;
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function checkedVals(name) {
    return Array.prototype.map.call(
      els.form.querySelectorAll("input[name='" + name + "']:checked"),
      function (i) { return i.value; }
    );
  }
  function radioVal(name) {
    var el = els.form.querySelector("input[name='" + name + "']:checked");
    return el ? el.value : "";
  }

  function syncFromForm() {
    if (currentStep === 1) {
      project.wine.wineType = val("ws-p-winetype");
      project.wine.varietalStyle = val("ws-p-varietal");
      project.wine.vintage = val("ws-p-vintage");
      project.wine.productionStatus = checkedVals("productionStatus");
      project.wine.format = radioVal("format");
    }
    if (currentStep === 2) {
      project.target.currentABV = num("ws-p-currentabv");
      project.target.mode = radioVal("mode");
      project.target.targetABV = num("ws-p-targetabv");
      project.target.targetMin = num("ws-p-targetmin");
      project.target.targetMax = num("ws-p-targetmax");
      project.target.direction = val("ws-p-direction");
      project.target.lotSize = num("ws-p-lotsize");
      project.target.lotUnit = val("ws-p-lotunit") || "gal";
      project.target.intent = val("ws-p-intent");
    }
    if (currentStep === 3) {
      project.project.filtrationState = radioVal("filtrationState");
      project.project.timeline = radioVal("timeline");
      project.project.locationPreference = radioVal("locationPreference");
      project.project.analyses = checkedVals("analyses");
      project.project.chemistry = { pH: num("ws-p-ph"), ta: num("ws-p-ta"), rs: num("ws-p-rs") };
    }
    if (currentStep === 4) {
      project.priorities.concerns = checkedVals("concerns");
      project.priorities.hesitation = val("ws-p-hesitation");
      project.priorities.successDefinition = val("ws-p-success");
    }
    project.metadata.updatedAt = new Date().toISOString();
    saveState();
  }

  function bindModeToggle() {
    els.form.querySelectorAll("input[name='mode']").forEach(function (r) {
      r.addEventListener("change", toggleModeFields);
    });
  }
  function toggleModeFields() {
    var mode = radioVal("mode");
    var exact = document.getElementById("ws-p-modefields-exact");
    var range = document.getElementById("ws-p-modefields-range");
    var unsure = document.getElementById("ws-p-modefields-unsure");
    if (exact) exact.hidden = mode !== "exact";
    if (range) range.hidden = mode !== "range";
    if (unsure) unsure.hidden = mode !== "unsure";
  }

  /* ---------- validation ---------- */
  function showError(idBase, message) {
    var err = document.getElementById(idBase + "-error");
    if (err) { err.textContent = message; err.hidden = false; }
    var input = document.getElementById(idBase);
    var target = input || document.querySelector("[data-field='" + idBase + "']");
    if (input) {
      // aria-invalid is not valid on a fieldset group; describedby is.
      if (input.tagName !== "FIELDSET") input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", idBase + "-error");
    }
    if (target) target.closest(".ws-nolo-field, .ws-nolo-choices").classList.add("has-error");
    return false;
  }
  function clearErrors() {
    els.form.querySelectorAll(".ws-nolo-error").forEach(function (e) { e.hidden = true; e.textContent = ""; });
    els.form.querySelectorAll(".has-error").forEach(function (e) { e.classList.remove("has-error"); });
    els.form.querySelectorAll("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); });
    els.form.querySelectorAll("[aria-describedby]").forEach(function (e) { e.removeAttribute("aria-describedby"); });
  }

  function validateStep() {
    clearErrors();
    var E = C.planner.errors;
    var ok = true;
    if (currentStep === 1) {
      if (!val("ws-p-winetype")) ok = showError("ws-p-winetype", "Please select a wine type.");
      if (!radioVal("format")) ok = showError("ws-p-format", "Please choose still, sparkling, or planning stage.");
    }
    if (currentStep === 2) {
      var cur = num("ws-p-currentabv");
      if (cur == null) ok = showError("ws-p-currentabv", "Please enter the current ABV.");
      else if (cur <= 0 || cur >= 25) ok = showError("ws-p-currentabv", E.checkValue);
      var mode = radioVal("mode");
      if (!mode) ok = showError("ws-p-mode", "Please choose a target mode.");
      if (mode === "exact") {
        var t = num("ws-p-targetabv");
        if (t == null) ok = showError("ws-p-targetabv", "Please enter a target ABV.");
        else if (t < 0 || t > 25) ok = showError("ws-p-targetabv", E.checkValue);
        else if (cur != null && t >= cur) ok = showError("ws-p-targetabv", E.targetHigher);
      }
      if (mode === "range") {
        var mn = num("ws-p-targetmin"), mx = num("ws-p-targetmax");
        if (mn == null) ok = showError("ws-p-targetmin", "Please enter the low end of your range.");
        if (mx == null) ok = showError("ws-p-targetmax", "Please enter the high end of your range.");
        if (mn != null && mx != null && mn > mx) ok = showError("ws-p-targetmin", "The low end should not exceed the high end.");
        if (mn != null && (mn < 0 || mn > 25)) ok = showError("ws-p-targetmin", E.checkValue);
        if (mx != null && cur != null && mx >= cur) ok = showError("ws-p-targetmax", E.targetHigher);
      }
      var lot = num("ws-p-lotsize");
      if (lot == null) ok = showError("ws-p-lotsize", "Please enter a lot size.");
      else if (lot <= 0) ok = showError("ws-p-lotsize", E.lotZero);
      if (!val("ws-p-intent")) ok = showError("ws-p-intent", "Please select the primary project intent.");
    }
    if (currentStep === 3) {
      var ph = num("ws-p-ph");
      if (ph != null && (ph < 2 || ph > 5)) ok = showError("ws-p-ph", E.checkValue);
    }
    if (currentStep === 4) {
      var concerns = checkedVals("concerns");
      if (concerns.length > 3) ok = showError("ws-p-concerns", E.concernsMax);
    }
    if (!ok) els.announce.textContent = C.planner.errors.required;
    return ok;
  }

  /* ---------- classification (spec §11.1) ----------
     UI/marketing categories ONLY.
     DO NOT PRESENT THESE INTERNAL CLASSIFICATIONS AS LEGAL DEFINITIONS. */
  function classify(p) {
    var t = p.target;
    if (t.mode === "unsure") return "TARGET_EXPLORATION";
    var target;
    if (t.mode === "range") {
      if (t.targetMin == null || t.targetMax == null) return "TARGET_EXPLORATION";
      // A range that includes 0 is a 0.0% feasibility question first.
      if (t.targetMin === 0) return "ZERO_FEASIBILITY";
      // Classify ranges by midpoint so the brief matches the explorer band
      // the user selected (e.g. 0.5–3% reads as substantial dealcoholization,
      // not as a ≤0.5% non-alcoholic project).
      target = (t.targetMin + t.targetMax) / 2;
    } else {
      target = t.targetABV;
    }
    if (target == null) return "TARGET_EXPLORATION";
    if (target === 0) return "ZERO_FEASIBILITY";
    if (target <= 0.5) return "NON_ALCOHOLIC";
    if (target < 3) return "SUBSTANTIAL_DEALC";
    if (target < 7) return "LOW_ALCOHOL";
    if (t.currentABV != null && (t.currentABV - target) >= 1) return "MODERATE_ADJUSTMENT";
    return "MINOR_ADJUSTMENT";
  }
  WSNoLo.classify = classify; // exposed for debug panel

  /* ---------- result assembly ---------- */
  function targetDisplay(t) {
    if (t.mode === "unsure") {
      var d = optionLabel(C.planner.options.direction, t.direction);
      return t.direction ? "Exploring multiple targets (" + d + ")" : "Exploring multiple targets";
    }
    if (t.mode === "range") return t.targetMin + "–" + t.targetMax + "%";
    if (t.targetABV === 0) return "0.0%";
    if (t.targetABV != null && t.targetABV <= 0.5) return "≤0.5%";
    return t.targetABV + "%";
  }
  function wineDisplay(w) {
    var bits = [];
    if (w.vintage) bits.push(w.vintage);
    if (w.varietalStyle) bits.push(w.varietalStyle);
    if (!bits.length) bits.push(optionLabel(C.planner.options.wineType, w.wineType));
    else if (w.wineType && !w.varietalStyle) bits.push(optionLabel(C.planner.options.wineType, w.wineType));
    return bits.join(" ");
  }
  function lotDisplay(t) {
    if (t.lotSize == null) return "—";
    return t.lotSize.toLocaleString("en-US") + " " + (t.lotUnit === "L" ? "liters" : "gallons");
  }

  function buildQuestions(p, cls) {
    var R = C.results;
    var list = [R.baseQuestions[0]];
    (R.classificationQuestions[cls] || []).forEach(function (q) { list.push(q); });
    p.priorities.concerns.forEach(function (c) {
      if (R.concernQuestions[c]) list.push(R.concernQuestions[c]);
    });
    if (p.wine.format === "sparkling" || p.wine.wineType === "sparkling") list.push(R.sparklingQuestion);
    list.push(R.baseQuestions[1]);
    // dedupe, preserve order
    var seen = {};
    return list.filter(function (q) {
      if (seen[q]) return false;
      seen[q] = true;
      return true;
    });
  }

  function summaryRows(p) {
    var rows = [
      ["Wine", wineDisplay(p.wine)],
      ["Lot", lotDisplay(p.target)],
      ["Starting ABV", p.target.currentABV != null ? p.target.currentABV + "%" : "—"],
      ["Target", targetDisplay(p.target)],
      ["Primary goal", optionLabel(C.planner.options.intent, p.target.intent)]
    ];
    if (p.priorities.concerns.length) {
      rows.push(["Primary concern", optionLabel(C.planner.options.concerns, p.priorities.concerns[0])]);
    }
    return rows;
  }

  /* ---------- results rendering ---------- */
  function renderResults() {
    var p = project;
    var cls = classify(p);
    var R = C.results;
    var info = R.classifications[cls];
    var questions = buildQuestions(p, cls);

    // Only fire completion tracking on the first completion — not when a
    // saved brief is restored on page load or rebuilt after an edit.
    var firstCompletion = !completed;
    completed = true;
    saveState();
    if (firstCompletion) {
      WSNoLo.visitor.set({ plannerCompleted: true });
      WSNoLo.track("nolo_planner_completed", {
        target_category: cls,
        wine_type: p.wine.wineType,
        lot_size_band: WSNoLo.lotSizeBand(p.target.lotSize, p.target.lotUnit),
        primary_concern: p.priorities.concerns[0] || null,
        project_intent: p.target.intent
      });
    }

    els.form.hidden = true;
    var r = els.results;
    r.hidden = false;
    r.innerHTML = "";

    r.appendChild(h("p", { class: "ws-nolo-eyebrow", text: "Your No/Lo Project" }));

    var dl = h("dl", { class: "ws-nolo-brief" });
    summaryRows(p).forEach(function (row) {
      dl.appendChild(h("div", { class: "ws-nolo-brief__row" }, [
        h("dt", { text: row[0] }), h("dd", { text: row[1] })
      ]));
    });
    r.appendChild(dl);

    r.appendChild(h("div", { class: "ws-nolo-classification" }, [
      h("p", { class: "ws-nolo-classification__label", text: "Project classification" }),
      h("p", { class: "ws-nolo-classification__value", text: info.label }),
      h("p", { text: info.blurb })
    ]));

    var qwrap = h("div", { class: "ws-nolo-questions" }, [
      h("h4", { text: "Questions to resolve before commercial processing" })
    ]);
    var ul = h("ul");
    questions.forEach(function (q) { ul.appendChild(h("li", { text: q })); });
    qwrap.appendChild(ul);
    r.appendChild(qwrap);

    var next = h("div", { class: "ws-nolo-nextstep" }, [
      h("h4", { text: "Recommended next step" }),
      h("p", { text: info.nextStep })
    ]);
    r.appendChild(next);

    var primary = h("button", {
      type: "button", class: "ws-nolo-btn ws-nolo-btn--primary",
      text: info.primaryCta === "review" ? C.ctas.projectReview : C.ctas.testTrackThis
    });
    primary.addEventListener("click", function () {
      if (info.primaryCta === "review") {
        openReviewModal("review");
      } else {
        // Test Track (bench trials) has its own modal — it is a different
        // offer than the Project Review consultation.
        WSNoLo.track("nolo_testtrack_cta_clicked", { target_category: cls, cta: "brief_primary" });
        if (WSNoLo.openTestTrackModal) WSNoLo.openTestTrackModal();
        else openReviewModal("testtrack");
      }
    });
    r.appendChild(h("div", { class: "ws-nolo-center" }, [primary]));

    var actions = h("div", { class: "ws-nolo-brief-actions" });
    if (WSNoLo.features.printBrief) {
      var printBtn = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", text: "Print / Save Project Brief" });
      printBtn.addEventListener("click", function () {
        WSNoLo.track("nolo_project_brief_printed", { target_category: cls });
        window.print();
      });
      actions.appendChild(printBtn);
    }
    if (WSNoLo.features.emailBrief) {
      var emailBtn = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", text: "Email This Brief to Myself" });
      emailBtn.addEventListener("click", function () {
        WSNoLo.track("nolo_project_brief_email_clicked", { target_category: cls });
        var body = briefPlainText(p, info, questions);
        // Local prototype: mailto handoff. Production: server-side email.
        window.location.href = "mailto:?subject=" + encodeURIComponent("Winesecrets No/Lo Project Brief") + "&body=" + encodeURIComponent(body);
      });
      actions.appendChild(emailBtn);
    }
    var reviewBtn = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", text: C.ctas.projectReview });
    reviewBtn.addEventListener("click", function () { openReviewModal("review"); });
    actions.appendChild(reviewBtn);

    var editBtn = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", text: "Edit Project" });
    editBtn.addEventListener("click", function () {
      // Editing invalidates the generated brief: a reload mid-edit must resume
      // the form at the saved step, not re-render a brief from unvalidated state.
      completed = false;
      saveState();
      goToStep(1);
    });
    actions.appendChild(editBtn);

    var overBtn = h("button", { type: "button", class: "ws-nolo-btn ws-nolo-btn--ghost", text: "Start Over" });
    overBtn.addEventListener("click", function () {
      project = defaultProject();
      completed = false;
      startedTracked = false;
      clearState();
      clearPrintBrief();
      goToStep(1);
    });
    actions.appendChild(overBtn);
    r.appendChild(actions);

    r.appendChild(h("p", { class: "ws-nolo-microcopy", text: R.disclaimer }));

    renderProgressDone();
    els.announce.textContent = "Step 5 of 5: Your project brief is ready.";
    buildPrintBrief(p, info, questions);
    if (WSNoLo.refreshFinalCTA) WSNoLo.refreshFinalCTA();
  }

  function renderProgressDone() {
    currentStep = 5;
    renderProgress();
  }

  function briefPlainText(p, info, questions) {
    var lines = [
      "WINESECRETS — USE RO FOR LO OR NO",
      "NO/LO PROJECT BRIEF", ""
    ];
    summaryRows(p).forEach(function (r) { lines.push(r[0] + ": " + r[1]); });
    lines.push("", "Classification: " + info.label, "", "Questions to resolve:");
    questions.forEach(function (q) { lines.push("• " + q); });
    lines.push("", "Recommended next step: " + info.nextStep, "", "Generated: " + new Date().toLocaleDateString("en-US"), "", C.results.disclaimer, "", "Winesecrets — winesecrets.com");
    return lines.join("\n");
  }

  /* ---------- print brief ---------- */
  function buildPrintBrief(p, info, questions) {
    var el = document.getElementById("ws-nolo-print-brief");
    el.innerHTML = "";
    el.appendChild(h("p", { class: "ws-nolo-print-brief__brand", text: "Winesecrets" }));
    el.appendChild(h("p", { class: "ws-nolo-print-brief__campaign", text: "USE RO FOR LO OR NO" }));
    el.appendChild(h("h1", { text: "No/Lo Project Brief" }));
    var dl = h("dl");
    summaryRows(p).forEach(function (r) {
      dl.appendChild(h("div", {}, [h("dt", { text: r[0] }), h("dd", { text: r[1] })]));
    });
    el.appendChild(dl);
    el.appendChild(h("h2", { text: "Project classification" }));
    el.appendChild(h("p", { text: info.label + " — " + info.blurb }));
    el.appendChild(h("h2", { text: "Questions to resolve" }));
    var ul = h("ul");
    questions.forEach(function (q) { ul.appendChild(h("li", { text: q })); });
    el.appendChild(ul);
    el.appendChild(h("h2", { text: "Recommended next step" }));
    el.appendChild(h("p", { text: info.nextStep }));
    el.appendChild(h("p", { class: "ws-nolo-print-brief__meta", text: "Generated: " + new Date().toLocaleDateString("en-US") }));
    el.appendChild(h("p", { class: "ws-nolo-print-brief__meta", text: C.results.disclaimer }));
    el.appendChild(h("p", { class: "ws-nolo-print-brief__meta", text: "Winesecrets — winesecrets.com" }));
    document.body.classList.add("ws-nolo-has-brief");
  }

  function clearPrintBrief() {
    document.body.classList.remove("ws-nolo-has-brief");
    var el = document.getElementById("ws-nolo-print-brief");
    if (el) el.innerHTML = "";
  }

  /* ---------- lead capture (mock) ---------- */
  function openReviewModal(context) {
    WSNoLo.track("nolo_project_review_opened", { cta: context || "review" });
    var dlg = document.getElementById("ws-nolo-review-modal");
    document.getElementById("ws-nolo-review-body").hidden = false;
    document.getElementById("ws-nolo-review-success").hidden = true;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  WSNoLo.openReviewModal = openReviewModal;

  /* Single integration function — swap for the production endpoint later. */
  function submitNoLoProject(payload) {
    console.log("MOCK SUBMISSION", payload);
    return Promise.resolve({ ok: true });
  }

  function bindReviewForm() {
    var form = document.getElementById("ws-nolo-review-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var company = form.elements.company.value.trim();
      var email = form.elements.email.value.trim();
      var formError = document.getElementById("ws-nolo-review-error");
      if (!name || !company || !email) {
        [["name", name], ["company", company], ["email", email]].forEach(function (pair) {
          var input = form.elements[pair[0]];
          if (!pair[1]) input.setAttribute("aria-invalid", "true");
          else input.removeAttribute("aria-invalid");
          input.closest(".ws-nolo-field").classList.toggle("has-error", !pair[1]);
        });
        if (formError) formError.hidden = false;
        return;
      }
      if (formError) formError.hidden = true;
      var payload = {
        contact: {
          name: name, company: company, email: email,
          phone: form.elements.phone.value.trim(),
          preferredContact: form.elements.preferredContact.value,
          note: form.elements.note.value.trim()
        },
        project: project,
        campaign: "use-ro-for-lo-or-no",
        source: "nolo-project-planner"
      };
      submitNoLoProject(payload).then(function () {
        WSNoLo.track("nolo_project_review_submitted", { target_category: classify(project) });
        document.getElementById("ws-nolo-review-body").hidden = true;
        var success = document.getElementById("ws-nolo-review-success");
        success.hidden = false;
        document.getElementById("ws-nolo-review-payload").textContent = JSON.stringify(payload, null, 2);
        form.reset();
        // Keep keyboard/screen-reader users oriented: the focused submit
        // button was just hidden, so move focus to the success heading.
        var title = success.querySelector(".ws-nolo-modal__title");
        if (title) { title.setAttribute("tabindex", "-1"); title.focus(); }
      });
    });
  }

  /* ---------- navigation ---------- */
  function goToStep(n, opts) {
    currentStep = Math.min(Math.max(n, 1), 4);
    renderCurrentStep();
    saveState();
    if (!opts || opts.focus !== false) {
      var title = els.form.querySelector(".ws-nolo-step__title");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    }
  }

  /* ---------- public API ---------- */
  WSNoLo.planner = {
    storageOk: storageOk,
    getProject: function () { return project; },
    isCompleted: function () { return completed; },
    currentStep: function () { return currentStep; },

    /* Pre-populate the target from explorer / cards / Test Track CTA. */
    prefill: function (patch, meta) {
      markStarted();
      if (patch) {
        project.target.mode = patch.mode || project.target.mode;
        if (patch.mode === "exact") {
          project.target.targetABV = patch.targetABV;
          project.target.targetMin = null; project.target.targetMax = null;
          project.target.direction = "";
        } else if (patch.mode === "range") {
          project.target.targetMin = patch.targetMin;
          project.target.targetMax = patch.targetMax;
          project.target.targetABV = null;
          project.target.direction = "";
        } else if (patch.mode === "unsure") {
          project.target.direction = patch.direction || "";
          project.target.targetABV = null;
          project.target.targetMin = null; project.target.targetMax = null;
        }
      }
      if (meta && meta.source) project.metadata.source = meta.source;
      project.metadata.updatedAt = new Date().toISOString();
      saveState();
      if (completed && els.form.hidden) {
        // A completed brief is on screen but the user just chose a new
        // target: reopen the form at step 2 so the prefill is visible
        // and editable instead of leaving a stale brief displayed.
        completed = false;
        saveState();
        goToStep(2, { focus: false });
      } else if (!els.form.hidden) {
        // Mid-planner: refresh the visible step so the prefill shows up.
        renderCurrentStep();
      }
    },

    open: function () {
      var dlg = document.getElementById("ws-nolo-planner-modal");
      if (dlg) {
        if (!dlg.open) {
          if (typeof dlg.showModal === "function") dlg.showModal();
          else dlg.setAttribute("open", "");
        }
        var title = document.getElementById("ws-nolo-planner-modal-title");
        if (title) { title.setAttribute("tabindex", "-1"); title.focus(); }
      } else {
        // Fallback if the planner is ever rendered inline again.
        var section = document.getElementById("project-planner");
        if (section) section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    },

    resume: function () {
      if (completed) { renderResults(); }
      this.open();
    },

    resetAll: function () {
      project = defaultProject();
      completed = false;
      startedTracked = false;
      clearState();
      clearPrintBrief();
      goToStep(1, { focus: false });
    },

    /* Demo helper (?planner=complete) — loads the spec §56 demo scenario. */
    simulateComplete: function () {
      project = defaultProject();
      project.wine = { wineType: "red", varietalStyle: "Cabernet Sauvignon", vintage: "2026", format: "still", productionStatus: ["finished"] };
      project.target = { currentABV: 13.7, mode: "exact", targetABV: 0.5, targetMin: null, targetMax: null, direction: "", lotSize: 6500, lotUnit: "gal", intent: "extend" };
      project.project = { filtrationState: "crossflow", timeline: "3-6m", locationPreference: "either", analyses: ["abv", "ph"], chemistry: { pH: null, ta: null, rs: null } };
      project.priorities = { concerns: ["mouthfeel"], hesitation: "", successDefinition: "" };
      startedTracked = true;
      renderResults();
    },

    init: function () {
      C = WSNoLo.content;
      els.form = document.getElementById("ws-nolo-planner-form");
      els.results = document.getElementById("ws-nolo-planner-results");
      els.progress = document.getElementById("ws-nolo-planner-progress");
      els.announce = document.getElementById("ws-nolo-planner-announce");

      if (!storageOk) document.getElementById("ws-nolo-storage-note").hidden = false;

      var saved = loadState();
      if (saved) {
        project = saved.project;
        completed = !!saved.completed;
        currentStep = Math.min(saved.lastStep || 1, 4);
        startedTracked = true; // don't re-fire started event for a restored project
      }

      els.form.addEventListener("submit", function (e) {
        e.preventDefault();
        syncFromForm();
        if (!validateStep()) return;
        WSNoLo.track("nolo_planner_step_completed", { planner_step: currentStep });
        if (currentStep < 4) goToStep(currentStep + 1);
        else renderResults();
      });
      els.form.addEventListener("change", function () {
        markStarted();
        syncFromForm();
      });

      bindReviewForm();

      if (completed) {
        // Restore straight to the brief so a returning visitor sees their result.
        renderResults();
      } else {
        renderCurrentStep();
      }
    }
  };

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
})();
