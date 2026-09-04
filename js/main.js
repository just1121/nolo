/* ============================================================
   main.js — page wiring: target explorer, make cards, visitor
   personalization, FAQ analytics, nav toggle, debug panel.
   ============================================================ */
(function () {
  "use strict";
  var WSNoLo = window.WSNoLo;
  var C = WSNoLo.content;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function params() { return new URLSearchParams(window.location.search); }

  /* ---------- header nav toggle (mobile) ---------- */
  function initNav() {
    var toggle = qs("#ws-nolo-nav-toggle");
    var nav = qs("#ws-nolo-nav");
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
  }

  /* ---------- target explorer ---------- */
  var selectedTarget = null;

  function initExplorer() {
    if (!WSNoLo.features.targetExplorer) return;
    var controls = qs("#ws-nolo-explorer-controls");
    var panel = qs("#ws-nolo-explorer-panel");
    var ctaWrap = qs("#ws-nolo-explorer-cta");
    var ctaBtn = qs("#ws-nolo-explorer-build");

    C.targetExplorer.forEach(function (t) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ws-nolo-explorer__btn";
      btn.textContent = t.label;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        selectedTarget = t;
        qsa(".ws-nolo-explorer__btn", controls).forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        renderExplorerPanel(panel, t);
        ctaWrap.hidden = false;
        WSNoLo.visitor.set({ targetExplorerUsed: true });
        WSNoLo.track("nolo_target_explorer_used", { target: t.label, target_category: t.id });
        refreshWelcome();
      });
      controls.appendChild(btn);
    });

    ctaBtn.addEventListener("click", function () {
      if (selectedTarget) {
        WSNoLo.planner.prefill(selectedTarget.prefill, { source: "target-explorer" });
      }
      WSNoLo.planner.open();
    });
  }

  function renderExplorerPanel(panel, t) {
    panel.innerHTML = "";
    var inner = document.createElement("div");
    inner.className = "ws-nolo-explorer__content";
    var title = document.createElement("h3");
    title.textContent = t.title;
    var body = document.createElement("p");
    body.textContent = t.body;
    var qTitle = document.createElement("p");
    qTitle.className = "ws-nolo-explorer__qtitle";
    qTitle.textContent = "Primary questions";
    var ul = document.createElement("ul");
    t.questions.forEach(function (q) {
      var li = document.createElement("li");
      li.textContent = q;
      ul.appendChild(li);
    });
    var next = document.createElement("p");
    next.className = "ws-nolo-explorer__next";
    next.innerHTML = "<strong>Recommended next step:</strong> ";
    next.appendChild(document.createTextNode(t.nextStep));
    inner.appendChild(title);
    inner.appendChild(body);
    inner.appendChild(qTitle);
    inner.appendChild(ul);
    inner.appendChild(next);
    panel.appendChild(inner);
  }

  /* ---------- Test Track modal (mock) ----------
     Distinct from the Project Review lead form: Test Track is the
     bench-trial service (sample kit -> treated samples back), while
     Project Review is a consultation. */
  function openTestTrackModal() {
    var dlg = qs("#ws-nolo-testtrack-modal");
    if (!dlg) return;
    qs("#ws-nolo-tt-body").hidden = false;
    qs("#ws-nolo-tt-success").hidden = true;
    var note = qs("#ws-nolo-tt-brief-note");
    if (WSNoLo.planner.isCompleted()) {
      note.textContent = "Your No/Lo project brief will be attached to this request automatically.";
    } else {
      note.textContent = "Tip: build your No/Lo project first and the brief will be attached automatically.";
    }
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    }
    var title = qs("#ws-nolo-tt-title");
    title.setAttribute("tabindex", "-1");
    title.focus();
  }
  WSNoLo.openTestTrackModal = openTestTrackModal;

  function initTestTrackForm() {
    var form = qs("#ws-nolo-tt-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var company = form.elements.company.value.trim();
      var email = form.elements.email.value.trim();
      var err = qs("#ws-nolo-tt-error");
      if (!name || !company || !email) {
        [["name", name], ["company", company], ["email", email]].forEach(function (pair) {
          var input = form.elements[pair[0]];
          if (!pair[1]) input.setAttribute("aria-invalid", "true");
          else input.removeAttribute("aria-invalid");
          input.closest(".ws-nolo-field").classList.toggle("has-error", !pair[1]);
        });
        err.hidden = false;
        return;
      }
      err.hidden = true;
      var payload = {
        contact: { name: name, company: company, email: email, phone: form.elements.phone.value.trim(), note: form.elements.notes.value.trim() },
        project: WSNoLo.planner.getProject(),
        campaign: "use-ro-for-lo-or-no",
        source: "test-track"
      };
      console.log("MOCK SUBMISSION", payload);
      WSNoLo.track("nolo_testtrack_request_submitted", { visitor_state: WSNoLo.visitor.tier() });
      qs("#ws-nolo-tt-body").hidden = true;
      var success = qs("#ws-nolo-tt-success");
      success.hidden = false;
      qs("#ws-nolo-tt-payload").textContent = JSON.stringify(payload, null, 2);
      form.reset();
      var title = success.querySelector(".ws-nolo-modal__title");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus(); }
    });
  }

  /* ---------- CTAs ---------- */
  function initCTAs() {
    qsa("[data-analytics]").forEach(function (el) {
      el.addEventListener("click", function () {
        WSNoLo.track(el.getAttribute("data-analytics"), { cta: el.id || el.textContent.trim().toLowerCase() });
      });
    });
    // Every "build a project" CTA opens the planner modal.
    // #ws-nolo-final-primary is handled separately below (high-intent routing).
    qsa("a[href='#project-planner'], #ws-nolo-open-planner").forEach(function (el) {
      if (el.id === "ws-nolo-final-primary") return;
      el.addEventListener("click", function (e) {
        e.preventDefault();
        WSNoLo.planner.open();
      });
    });
    // Every Test Track link opens the Test Track modal directly rather than
    // scrolling to the section or leaving for winesecrets.com (nav, hero,
    // section copy and footer links included).
    qsa("a[href='#test-track'], a[href*='winesecrets.com/test-track']").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openTestTrackModal();
      });
    });
    qs("#ws-nolo-testtrack-plan").addEventListener("click", function () {
      openTestTrackModal();
    });
    qs("#ws-nolo-final-review").addEventListener("click", function () {
      WSNoLo.openReviewModal("final-cta");
    });
    // Final CTA primary: planner modal normally; for a high-intent visitor with
    // a completed project, "Put My Wine on the Test Track" routes to the lead
    // form with the planner project attached (spec §44).
    var finalPrimary = qs("#ws-nolo-final-primary");
    finalPrimary.addEventListener("click", function (e) {
      e.preventDefault();
      if (WSNoLo.visitor.tier() === "high-intent" && WSNoLo.planner.isCompleted()) {
        WSNoLo.track("nolo_testtrack_cta_clicked", { cta: "final_high_intent" });
        openTestTrackModal();
      } else {
        WSNoLo.planner.resume();
      }
    });
    // "Why RO?" collapsible counts as viewing the process section when opened.
    var proc = qs("#ws-nolo-process-details");
    if (proc) {
      proc.addEventListener("toggle", function () {
        if (proc.open) WSNoLo.visitor.set({ viewedProcess: true });
      });
    }
  }

  /* ---------- FAQ: ask-a-question box + topic groups ----------
     Matching is deterministic keyword scoring (no AI). Q&A data,
     keywords and contact info live in js/content.js. */
  // Includes domain words ("wine", "alcohol") that appear in nearly every
  // question and would otherwise cause phantom matches (e.g. "wine" prefix-
  // matching the "winery" keyword). Multiword keyword phrases like
  // "alcohol free" are matched against the full query and are unaffected.
  var STOPWORDS = ["a", "an", "and", "are", "at", "be", "can", "could", "do", "does", "for", "from", "how", "i", "if", "in", "is", "it", "my", "of", "on", "or", "our", "should", "so", "than", "that", "the", "their", "them", "then", "there", "this", "to", "us", "we", "what", "when", "which", "will", "with", "would", "you", "your", "wine", "wines", "winesecrets", "alcohol"];

  function faqContactBlock() {
    var info = C.contactInfo;
    var p = document.createElement("p");
    p.className = "ws-nolo-faq-contact";
    p.appendChild(document.createTextNode("Want to talk it through directly? Call "));
    var tel = document.createElement("a");
    tel.href = info.phoneHref;
    tel.textContent = info.phone;
    p.appendChild(tel);
    p.appendChild(document.createTextNode(" or email "));
    var mail = document.createElement("a");
    mail.href = "mailto:" + info.email;
    mail.textContent = info.email;
    p.appendChild(mail);
    p.appendChild(document.createTextNode("."));
    return p;
  }

  function renderQA(item, open) {
    var d = document.createElement("details");
    d.className = "ws-nolo-details";
    d.setAttribute("data-faq", item.id);
    if (open) d.open = true;
    var s = document.createElement("summary");
    s.textContent = item.q;
    var body = document.createElement("div");
    body.className = "ws-nolo-details__body";
    var a = document.createElement("p");
    a.textContent = item.a;
    body.appendChild(a);
    if (item.contact) body.appendChild(faqContactBlock());
    d.appendChild(s);
    d.appendChild(body);
    d.addEventListener("toggle", function () {
      if (d.open) WSNoLo.track("nolo_faq_opened", { faq_id: item.id });
    });
    return d;
  }

  function scoreFAQ(query) {
    var q = query.toLowerCase().replace(/[^a-z0-9.%\s-]/g, " ");
    var tokens = q.split(/\s+/).filter(function (t) {
      return t.length > 1 && STOPWORDS.indexOf(t) === -1;
    });
    if (!tokens.length) return [];
    return C.faq.items.map(function (item) {
      var score = 0;
      var qText = item.q.toLowerCase();
      var aText = item.a.toLowerCase();
      item.keywords.forEach(function (k) {
        if (k.indexOf(" ") !== -1) {
          if (q.indexOf(k) !== -1) score += 4;
        } else {
          var hit = tokens.some(function (t) {
            return t === k || (t.length >= 3 && (k.indexOf(t) === 0 || t.indexOf(k) === 0));
          });
          if (hit) score += 3;
        }
      });
      tokens.forEach(function (t) {
        if (qText.indexOf(t) !== -1) score += 1;
        else if (aText.indexOf(t) !== -1) score += 0.5;
      });
      return { item: item, score: score };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  function initFAQ() {
    // Topic groups (collapsed by default so the list stays short)
    var topicsWrap = qs("#ws-nolo-faq-topics");
    C.faq.topics.forEach(function (topic) {
      var items = C.faq.items.filter(function (i) { return i.topic === topic.id; });
      if (!items.length) return;
      var group = document.createElement("details");
      group.className = "ws-nolo-faqgroup";
      var s = document.createElement("summary");
      s.textContent = topic.label;
      var count = document.createElement("span");
      count.className = "ws-nolo-faqgroup__count";
      count.textContent = String(items.length);
      s.appendChild(count);
      group.appendChild(s);
      var inner = document.createElement("div");
      inner.className = "ws-nolo-faqgroup__body";
      items.forEach(function (i) { inner.appendChild(renderQA(i, false)); });
      group.appendChild(inner);
      topicsWrap.appendChild(group);
    });

    // Ask box
    var form = qs("#ws-nolo-ask-form");
    var input = qs("#ws-nolo-ask-input");
    var results = qs("#ws-nolo-ask-results");
    input.setAttribute("placeholder", C.faq.askPlaceholder);
    var debounce = null;
    var lastTrackedId = null;

    function renderAnswer(fromSubmit) {
      var query = input.value.trim();
      results.innerHTML = "";
      if (!query) { lastTrackedId = null; return; }
      var ranked = scoreFAQ(query);
      var best = ranked.length && ranked[0].score >= 2 ? ranked[0] : null;

      if (!best) {
        if (!fromSubmit && query.length < 6) return; // too little typed to call it a miss
        var card = document.createElement("div");
        card.className = "ws-nolo-answer ws-nolo-answer--miss";
        var msg = document.createElement("p");
        msg.className = "ws-nolo-answer__q";
        msg.textContent = C.faq.noMatch;
        card.appendChild(msg);
        card.appendChild(faqContactBlock());
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ws-nolo-btn ws-nolo-btn--secondary ws-nolo-btn--sm";
        btn.textContent = C.ctas.projectReview;
        btn.addEventListener("click", function () { WSNoLo.openReviewModal("faq"); });
        card.appendChild(btn);
        results.appendChild(card);
        return;
      }

      var card = document.createElement("div");
      card.className = "ws-nolo-answer";
      var label = document.createElement("p");
      label.className = "ws-nolo-answer__label";
      label.textContent = "Best answer";
      card.appendChild(label);
      var qEl = document.createElement("p");
      qEl.className = "ws-nolo-answer__q";
      qEl.textContent = best.item.q;
      card.appendChild(qEl);
      var aEl = document.createElement("p");
      aEl.textContent = best.item.a;
      card.appendChild(aEl);
      if (best.item.contact) card.appendChild(faqContactBlock());
      results.appendChild(card);

      var related = ranked.slice(1, 3).filter(function (r) { return r.score >= 2; });
      if (related.length) {
        var relLabel = document.createElement("p");
        relLabel.className = "ws-nolo-answer__label ws-nolo-answer__label--related";
        relLabel.textContent = "Related questions";
        results.appendChild(relLabel);
        related.forEach(function (r) { results.appendChild(renderQA(r.item, false)); });
      }

      if (best.item.id !== lastTrackedId) {
        lastTrackedId = best.item.id;
        WSNoLo.track("nolo_faq_opened", { faq_id: best.item.id, cta: "ask-box" });
      }
    }

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { renderAnswer(false); }, 250);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearTimeout(debounce);
      renderAnswer(true);
    });
  }

  /* ---------- section-view tracking for engagement ---------- */
  /* "Why RO?" (process) is tracked via its collapsible toggle in initCTAs. */
  function initSectionViews() {
    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          WSNoLo.visitor.set({ viewedTestTrack: true });
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    qsa("[data-visitor-section='testtrack']").forEach(function (s) { observer.observe(s); });
  }

  /* ---------- progressive messaging ---------- */
  function refreshWelcome() {
    if (!WSNoLo.features.visitorPersonalization) return;
    var slot = qs("#ws-nolo-welcome-slot");
    slot.innerHTML = "";
    var tier = WSNoLo.visitor.tier();
    var hasSaved = WSNoLo.planner && (WSNoLo.planner.isCompleted() || WSNoLo.visitor.get().plannerStarted);
    var isReturn = WSNoLo.visitor.isReturnVisit();

    var message = null;
    var buttonText = null;
    if (isReturn && hasSaved) {
      message = C.visitorMessages.welcomeBack;
      buttonText = C.ctas.continueProject;
    } else if (tier === "engaged" && !WSNoLo.planner.isCompleted()) {
      message = C.visitorMessages.engaged;
      buttonText = C.ctas.continueProject;
    }
    if (!message) return;

    var box = document.createElement("div");
    box.className = "ws-nolo-welcome";
    var p = document.createElement("p");
    p.textContent = message;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ws-nolo-btn ws-nolo-btn--secondary ws-nolo-btn--sm";
    btn.textContent = buttonText;
    btn.addEventListener("click", function () { WSNoLo.planner.resume(); });
    box.appendChild(p);
    box.appendChild(btn);
    slot.appendChild(box);
  }

  function refreshFinalCTA() {
    var tier = WSNoLo.visitor.tier();
    var title = qs("#ws-nolo-final-title");
    var body = qs("#ws-nolo-final-body");
    var primary = qs("#ws-nolo-final-primary");
    if (tier === "high-intent") {
      title.textContent = C.visitorMessages.highIntentTitle;
      body.innerHTML = ""; // direct-contact line below the buttons carries the detail
      primary.textContent = C.ctas.testTrack;
      // Click routing (Test Track modal vs. planner) is bound once in initCTAs.
      WSNoLo.visitor.set({ highIntentCTASeen: true });
    }
  }
  WSNoLo.refreshFinalCTA = refreshFinalCTA;

  /* ---------- debug panel (?debug=1, local only) ---------- */
  function initDebug() {
    var q = params();
    if (q.get("debug") !== "1") return;
    var panel = qs("#ws-nolo-debug");
    panel.hidden = false;

    function render() {
      var v = WSNoLo.visitor.get();
      var proj = WSNoLo.planner.getProject();
      var status = WSNoLo.planner.isCompleted() ? "completed" : (v.plannerStarted ? "in progress (step " + WSNoLo.planner.currentStep() + ")" : "not started");
      var cls = "—";
      try { cls = WSNoLo.classify(proj); } catch (e) {}
      var recent = WSNoLo._events.slice(-4).map(function (e) { return e.name; }).join(", ") || "—";
      panel.innerHTML =
        "<h2>WSNoLo debug</h2>" +
        "<dl>" +
        "<div><dt>Visit count</dt><dd>" + (v.visitCount || 1) + "</dd></div>" +
        "<div><dt>Engagement score</dt><dd>" + WSNoLo.visitor.score() + " (" + WSNoLo.visitor.tier() + ")</dd></div>" +
        "<div><dt>Planner status</dt><dd>" + status + "</dd></div>" +
        "<div><dt>Target category</dt><dd>" + cls + "</dd></div>" +
        "<div><dt>Project version</dt><dd>" + proj.version + "</dd></div>" +
        "<div><dt>Recent events</dt><dd>" + recent + "</dd></div>" +
        "</dl>";
      var resetV = document.createElement("button");
      resetV.textContent = "Reset visitor";
      resetV.addEventListener("click", function () { WSNoLo.visitor.reset(); render(); refreshWelcome(); });
      var resetP = document.createElement("button");
      resetP.textContent = "Reset project";
      resetP.addEventListener("click", function () { WSNoLo.planner.resetAll(); render(); });
      panel.appendChild(resetV);
      panel.appendChild(resetP);
    }
    WSNoLo.debugRefresh = render;
    render();
  }

  /* ---------- demo query-string states ---------- */
  function applyDemoParams() {
    var q = params();
    var visitor = q.get("visitor");
    if (visitor === "new") {
      WSNoLo.visitor.reset();
    } else if (visitor === "engaged") {
      WSNoLo.visitor.set({ targetExplorerUsed: true, plannerStarted: true });
    } else if (visitor === "high-intent") {
      WSNoLo.visitor.set({ plannerStarted: true, plannerCompleted: true });
    }
    if (q.get("planner") === "complete") {
      WSNoLo.planner.simulateComplete();
    }
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var visitorState = WSNoLo.visitor.init();
    initNav();
    initExplorer();
    initFAQ();
    initTestTrackForm();
    initSectionViews();
    WSNoLo.planner.init();
    initCTAs();
    applyDemoParams();
    refreshWelcome();
    refreshFinalCTA();
    initDebug();

    WSNoLo.track("nolo_page_view", { visitor_state: WSNoLo.visitor.tier() });
    if (WSNoLo.visitor.isReturnVisit()) {
      WSNoLo.track("nolo_return_visit", { visitor_state: WSNoLo.visitor.tier() });
    }
  });
})();
