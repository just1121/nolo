/* ============================================================
   visitor.js — first-party visitor state + engagement scoring.
   localStorage only. No fingerprinting, no third-party tracking,
   no cross-site identity, no hidden enrichment.
   Production: revisit under privacy review (CCPA/CPRA, GPC).
   ============================================================ */
(function () {
  "use strict";
  window.WSNoLo = window.WSNoLo || {};

  var KEY = "ws_nolo_visitor_v1";
  var NEW_VISIT_GAP_MS = 30 * 60 * 1000; // 30 min of inactivity = a new visit

  function safeGet() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function safeSet(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function freshState(now) {
    return {
      firstSeen: now, lastSeen: now, visitCount: 1,
      plannerStarted: false, plannerCompleted: false,
      viewedProcess: false, viewedTestTrack: false,
      targetExplorerUsed: false, highIntentCTASeen: false
    };
  }

  var state = null;
  var isReturnVisit = false;

  WSNoLo.visitor = {
    init: function () {
      var now = new Date().toISOString();
      var stored = safeGet();
      if (!stored) {
        state = freshState(now);
      } else {
        state = stored;
        var gap = Date.now() - Date.parse(stored.lastSeen || stored.firstSeen || now);
        if (isNaN(gap) || gap > NEW_VISIT_GAP_MS) {
          state.visitCount = (state.visitCount || 0) + 1;
          isReturnVisit = true;
        }
        state.lastSeen = now;
      }
      safeSet(state);
      return state;
    },
    get: function () { return state || this.init(); },
    isReturnVisit: function () { return isReturnVisit; },
    set: function (patch) {
      state = state || this.init();
      var changed = false;
      for (var k in patch) {
        if (state[k] !== patch[k]) { state[k] = patch[k]; changed = true; }
      }
      if (changed) {
        state.lastSeen = new Date().toISOString();
        safeSet(state);
        if (WSNoLo.debugRefresh) WSNoLo.debugRefresh();
      }
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = freshState(new Date().toISOString());
      isReturnVisit = false;
      safeSet(state);
      if (WSNoLo.debugRefresh) WSNoLo.debugRefresh();
    },
    /* Engagement score per spec §18.2 (example weighting) */
    score: function () {
      var s = this.get();
      var score = 0;
      if ((s.visitCount || 1) > 1) score += 1;
      if (s.targetExplorerUsed) score += 1;
      if (s.plannerStarted) score += 2;
      if (s.plannerCompleted) score += 3;
      if (s.viewedProcess) score += 1;
      if (s.viewedTestTrack) score += 1;
      return score;
    },
    /* Messaging tiers per spec §18.3 */
    tier: function () {
      var s = this.get();
      if (s.plannerCompleted || this.score() >= 4) return "high-intent";
      if (s.targetExplorerUsed || s.plannerStarted) return "engaged";
      return "new";
    }
  };
})();
