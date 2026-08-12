/* ============================================================
   analytics.js — clean event layer.
   Local prototype: events log to the console and to the debug
   panel. Production: replace the `send` function with the
   approved analytics integration (GA4/GTM/etc.).
   Rules:
   - never send raw free-text fields;
   - never send exact lot sizes (use bands);
   - do not send winery/project identity data without approval.
   ============================================================ */
(function () {
  "use strict";
  window.WSNoLo = window.WSNoLo || {};

  var events = [];
  WSNoLo._events = events;

  /* Lot-size bands for analytics only — never expose as production limits. */
  WSNoLo.lotSizeBand = function (amount, unit) {
    if (amount == null || isNaN(amount)) return null;
    var gal = unit === "L" ? amount / 3.78541 : amount;
    if (gal < 500) return "<500 gal";
    if (gal < 2000) return "500–1,999";
    if (gal < 5000) return "2,000–4,999";
    if (gal < 10000) return "5,000–9,999";
    if (gal < 25000) return "10,000–24,999";
    return "25,000+";
  };

  /* Allowed property keys — everything else is stripped. */
  var ALLOWED = ["target", "target_category", "wine_type", "lot_size_band", "primary_concern", "project_intent", "planner_step", "visitor_state", "faq_id", "cta"];

  function send(name, props) {
    // PRODUCTION INTEGRATION POINT — replace console logging with the
    // approved analytics call. Keep the property allowlist.
    if (window.console && console.info) {
      console.info("[WSNoLo analytics]", name, props || {});
    }
  }

  WSNoLo.track = function (name, props) {
    var clean = {};
    if (props) {
      for (var k in props) {
        if (ALLOWED.indexOf(k) !== -1 && props[k] != null && props[k] !== "") clean[k] = props[k];
      }
    }
    var evt = { name: name, props: clean, at: new Date().toISOString() };
    events.push(evt);
    send(name, clean);
    if (WSNoLo.debugRefresh) WSNoLo.debugRefresh();
  };
})();
