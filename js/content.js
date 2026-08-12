/* ============================================================
   Winesecrets — Use RO for Lo or No
   content.js — editable copy + config for the INTERACTIVE parts
   of the page: target explorer, make cards, planner fields,
   result logic wording, visitor messaging, CTAs, feature flags.
   Static page-section copy (hero, market, quality, test track,
   process, concerns, proof, regulatory, FAQ) lives in index.html
   — see the README "Where things live" table.
   Status labels: [APPROVED CONCEPT] [VERIFY TECHNICAL]
   [VERIFY OPERATIONS] [VERIFY REGULATORY] [VERIFY PROOF] [FUTURE]
   ============================================================ */
(function () {
  "use strict";
  window.WSNoLo = window.WSNoLo || {};

  /* ---- Feature flags (staged review) ---- */
  WSNoLo.features = {
    targetExplorer: true,
    projectPlanner: true,
    visitorPersonalization: true,
    regulatoryNavigator: false,   // [FUTURE]
    liveLeadSubmission: false,    // must remain false until CRM integration is approved
    printBrief: true,
    emailBrief: true              // mocked via mailto: in the local prototype
  };

  WSNoLo.content = {
    ctas: {
      buildProject: "Build Your No/Lo Project",
      continueProject: "Continue Project",
      testTrack: "Put My Wine on the Test Track",
      testTrackThis: "Put This Wine on the Test Track",
      projectReview: "Request a No/Lo Project Review"
    },

    /* ---- Progressive messaging (visitor personalization) ---- */
    visitorMessages: {
      engaged: "Planning a No/Lo project? Finish your project brief.",
      welcomeBack: "Welcome back. Continue your No/Lo project.",
      highIntentTitle: "You've done the homework. Now taste it."
    },

    /* ============================================
       TARGET EXPLORER
       Ranges are planning categories only.
       [VERIFY REGULATORY] exact ranges may be
       adjusted after regulatory/technical review.
       ============================================ */
    targetExplorer: [
      {
        id: "10plus",
        label: "10%+",
        title: "A modest adjustment",
        body: "You may be exploring a modest alcohol adjustment rather than a dedicated No/Lo product.",
        questions: ["Sensory balance", "Intended style", "Tax/label implications where relevant", "Whether several targets should be tasted"],
        nextStep: "Compare a small set of target ABVs.",
        prefill: { mode: "unsure", direction: "modest" }
      },
      {
        id: "7to10",
        label: "7–10%",
        title: "A clearly lower-alcohol style",
        body: "You are moving toward a clearly lower-alcohol style while remaining closer to conventional wine structure.",
        questions: ["Base-wine balance", "Acidity and palate weight", "Expected consumer/style position", "Final labeling pathway"],
        nextStep: "Taste at more than one target before selecting the commercial specification.",
        prefill: { mode: "range", targetMin: 7, targetMax: 10 }
      },
      {
        id: "3to7",
        label: "3–<7%",
        title: "More than a routine adjustment",
        body: "At this level the project becomes more than a routine alcohol adjustment.",
        questions: ["Base-wine suitability", "Mouthfeel and acidity", "Stability", "Packaging", "Labeling framework", "Sensory target"],
        nextStep: "Build a project brief and plan controlled trials.",
        prefill: { mode: "range", targetMin: 3, targetMax: 7 }
      },
      {
        id: "05to3",
        label: "0.5–<3%",
        title: "A substantial dealcoholization project",
        body: "This is a substantial dealcoholization project.",
        questions: ["Aroma and palate balance", "Stability strategy", "Base-wine selection", "Residual sugar / acidity balance", "Packaging", "Labeling"],
        nextStep: "Project review plus target-level trials.",
        prefill: { mode: "range", targetMin: 0.5, targetMax: 3 }
      },
      {
        id: "le05",
        label: "≤0.5%",
        title: "A non-alcoholic wine",
        body: "You are considering a non-alcoholic wine. At this level, reaching the ABV is only one part of the project. Base-wine suitability, sensory balance, stability, packaging and labeling pathway should be considered together.",
        questions: ["Base-wine suitability", "Sensory balance", "Stability", "Packaging", "Labeling pathway"],
        nextStep: "Evaluate multiple targets before commercial processing.",
        prefill: { mode: "exact", targetABV: 0.5 }
      },
      {
        id: "zero",
        label: "0.0%",
        title: "A 0.0% concept",
        body: "A 0.0% concept should begin with feasibility, analytical and regulatory planning rather than assuming it follows the same path as every ≤0.5% product.",
        questions: ["Analytical feasibility", "Definition/claim review", "Production pathway review"],
        nextStep: "Request a project review before setting the commercial specification.",
        prefill: { mode: "exact", targetABV: 0 }
      },
      {
        id: "notsure",
        label: "Not sure",
        title: "You do not need to choose the number first",
        body: "You do not need to choose the number first. Test Track is designed to help your team compare treated samples and identify the alcohol level where the wine works best.",
        questions: ["Which targets are worth comparing", "What a successful trial would look like", "Which wine or lot to trial first"],
        nextStep: "Trial a set of targets and choose by taste.",
        prefill: { mode: "unsure", direction: "notsure" }
      }
    ],

    /* ============================================
       CONTACT (direct outreach shown in FAQ answers)
       Email is temporary per Jay: marketing@winesecrets.com.
       Phone sampled from winesecrets.com/contact-us (2026-08-12).
       ============================================ */
    contactInfo: {
      email: "marketing@winesecrets.com",
      phone: "707-824-2022",
      phoneHref: "tel:+17078242022"
    },

    /* ============================================
       FAQ — merged "common concerns" + FAQ pool.
       Surfaced through the ask-a-question box and
       collapsible topic groups. Matching is plain
       keyword scoring — deterministic, no AI.
       `contact: true` appends the direct-contact block.
       ============================================ */
    faq: {
      askPlaceholder: "e.g. Will the wine taste thin?",
      noMatch: "We don't have an instant answer for that one — but a real person does.",
      topics: [
        { id: "flavor", label: "Flavor & wine quality" },
        { id: "process", label: "Process & technology" },
        { id: "trials", label: "Trials & Test Track" },
        { id: "working", label: "Working with Winesecrets" }
      ],
      items: [
        {
          id: "thin", topic: "flavor", q: "Will it taste thin?",
          keywords: ["thin", "watery", "body", "light", "diluted", "weak", "flat"],
          a: "It can. Removing ethanol changes the sensory balance of wine. That is one reason Winesecrets recommends comparing target levels before selecting the commercial specification."
        },
        {
          id: "ourwine", topic: "flavor", q: "Will it still taste like our wine?",
          keywords: ["taste like", "character", "brand", "same wine", "style", "identity", "still taste"],
          a: "That should be part of the standard. The goal is not simply to reach a lower number; it is to identify a target where aroma, texture, balance and finish still make sense for the wine and the brand."
        },
        {
          id: "same-target", topic: "flavor", q: "Can every wine be taken to the same target with the same result?",
          keywords: ["every wine", "same result", "vary", "different wines", "consistent", "all wines"],
          a: "No. Wine style, starting composition, target ABV and sensory priorities matter. Every project deserves project-specific evaluation rather than one-size-fits-all promises."
        },
        {
          id: "predict", topic: "flavor", q: "Can Winesecrets tell us exactly what the final wine will taste like?",
          keywords: ["exactly", "predict", "guarantee", "promise", "final taste", "know in advance"],
          a: "The purpose of trialing is to replace prediction with tasting. The team can evaluate treated samples directly before selecting the production target."
        },
        {
          id: "what-happens", topic: "flavor", q: "What happens to wine when alcohol is removed?",
          keywords: ["happens", "change", "changes", "aroma", "texture", "balance", "finish", "sensory", "affect", "mouthfeel"],
          a: "Alcohol contributes to aroma perception, palate weight, texture and finish, so changing it substantially can shift the sensory balance of the wine. How much depends on the wine, the starting composition and the depth of the adjustment. That is why Winesecrets recommends comparing several targets before selecting a commercial specification."
        },
        {
          id: "choose-target", topic: "flavor", q: "How do we choose the right target ABV?",
          keywords: ["choose", "right target", "which target", "level", "decide", "pick", "abv"],
          a: "By taste. Alcohol influences wine balance, aroma perception, body and finish. Trialing more than one target allows a winery to select the final alcohol level by tasting the wine rather than choosing the specification in isolation. Style intent, stability and the labeling pathway for the finished product also inform the choice."
        },
        {
          id: "what-is-dealc", topic: "process", q: "What is wine dealcoholization?",
          keywords: ["dealcoholization", "dealcoholized", "dealc", "definition", "meaning", "alcohol removal"],
          a: "Wine dealcoholization is the controlled reduction of ethanol from wine to achieve a lower target alcohol concentration. Winesecrets uses reverse osmosis as a selective separation step, followed by controlled ethanol removal and reintegration of the adjusted permeate. Because alcohol contributes to aroma perception, body and finish, Winesecrets recommends trialing more than one target before selecting the final specification."
        },
        {
          id: "how-ro", topic: "process", q: "How does Winesecrets use reverse osmosis for alcohol removal?",
          keywords: ["reverse osmosis", "membrane", "permeate", "how it works", "technology", "ro work"],
          a: "Reverse osmosis separates a permeate stream containing water and ethanol from larger wine components. Ethanol is then reduced from that permeate through a controlled process, and the adjusted stream is returned to the wine. This allows precision targeting of the final alcohol level as part of a complete production workflow rather than a single-step treatment."
        },
        {
          id: "ro-whole", topic: "process", q: "Is RO the whole process?",
          keywords: ["whole process", "entire", "only ro", "just ro", "complete process"],
          a: "No. In the Winesecrets workflow, reverse osmosis separates a permeate stream. Ethanol is then reduced from that stream before the adjusted permeate is returned to the wine. Final target adjustment completes the workflow. “Use RO for Lo or No” is campaign shorthand for that complete process — the purpose is to make the intervention controlled and selective as part of the full production workflow."
        },
        {
          id: "under-05", topic: "process", q: "What should we consider for ≤0.5% wine?",
          keywords: ["0.5", "non-alcoholic", "nonalcoholic", "na wine", "zero", "0.0", "alcohol free", "alcohol-free"],
          a: "At this level, reaching the ABV is only one part of the project. Base-wine suitability, sensory balance, stability strategy, packaging and the labeling pathway should be considered together, and multiple targets should be evaluated before commercial processing. Test Track exists for exactly this situation: evaluate the wine at several targets, then set the specification from what the team actually tastes."
        },
        {
          id: "commit-lot", topic: "trials", q: "Do we have to commit an entire lot to find out?",
          keywords: ["commit", "entire lot", "whole lot", "risk", "gamble", "full lot"],
          a: "No. Start with controlled trials. Test Track is designed to let your team taste treated wine before deciding how to proceed at production scale."
        },
        {
          id: "trial-first", topic: "trials", q: "Can we trial our wine before treating a full lot?",
          keywords: ["trial", "sample", "before", "bench", "try", "test first", "small scale"],
          a: "Yes. That is what Test Track is for. Your team submits a small wine sample, selected alcohol targets are trialed at small scale, and treated samples come back for side-by-side evaluation. You choose the direction before any commercial lot is committed — by taste, not guesswork. Winesecrets will confirm trial timing during project review."
        },
        {
          id: "what-is-testtrack", topic: "trials", q: "What is Test Track?",
          keywords: ["test track", "testtrack", "bench trial", "trial service"],
          a: "Test Track is the Winesecrets bench-trial service. Your team sends a small wine sample, selected treatment levels are trialed, and treated samples are returned so you can taste the results side by side before committing a full lot. After selecting the preferred result, the project scales to commercial treatment. Winesecrets will confirm trial timing during project review."
        },
        {
          id: "at-winery", topic: "working", contact: true, q: "Can treatment be performed at our winery?",
          keywords: ["our winery", "winery", "on-site", "onsite", "on site", "mobile", "location", "come to us", "facility", "service", "at our"],
          a: "Depending on project scope, Winesecrets can offer mobile alcohol-adjustment workflows in addition to centralized treatment. Whether at-winery treatment fits a specific No/Lo project depends on the target level, the equipment required and the logistics involved. Note your location preference in the project brief and Winesecrets will confirm the appropriate approach during project review."
        },
        {
          id: "lot-sizes", topic: "working", contact: true, q: "What lot sizes can Winesecrets evaluate?",
          keywords: ["lot size", "lot sizes", "gallons", "liters", "volume", "minimum", "maximum", "capacity", "how big", "how small"],
          a: "Projects range from bench-scale Test Track trials to commercial-scale lots. Practical scope depends on the wine, the target and logistics, so include your lot size in the project brief and Winesecrets will confirm the appropriate approach during project review. Lot size also helps determine whether mobile treatment or centralized processing is the better fit for the project."
        },
        {
          id: "finished-wine", topic: "working", q: "Can Winesecrets work with finished wine?",
          keywords: ["finished", "bottled", "bottling", "ready", "blended", "already made"],
          a: "Many No/Lo projects involve finished or nearly finished wine, and others begin from base wine earlier in development. Production status — blending, oak, fining, filtration — is captured in the project brief and reviewed with your team so trials reflect the wine you intend to treat. If you are unsure whether the wine is ready for treatment, note its status in the planner and raise it during project review."
        },
        {
          id: "what-info", topic: "working", q: "What information should we have before starting a No/Lo project?",
          keywords: ["information", "need to know", "prepare", "start", "starting", "begin", "checklist", "get ready"],
          a: "Useful starting points are the wine type and style, current ABV, lot size, the target level or direction you are considering, production status, filtration state and any available analyses such as pH, TA and RS. The Project Planner on this page organizes exactly this information into a preliminary brief. None of it needs to be final before you start — “not sure” is an acceptable answer throughout."
        },
        {
          id: "labeling", topic: "working", contact: true, q: "How do labeling rules change at different ABV levels?",
          keywords: ["label", "labeling", "labels", "regulatory", "regulation", "ttb", "compliance", "legal", "rules", "tax"],
          a: "The intended finished alcohol level may affect labeling, regulatory jurisdiction, claims and packaging decisions. Requirements differ across categories such as 0.0%, ≤0.5% and higher levels. Build the labeling review into the project timeline early rather than after processing decisions are made. Confirm current requirements with the appropriate regulatory authority and qualified advisors; this page is planning guidance, not legal advice."
        },
        {
          id: "pricing", topic: "working", contact: true, q: "How do we get project pricing?",
          keywords: ["price", "pricing", "cost", "costs", "quote", "rate", "budget", "expensive", "fee", "how much"],
          a: "Project scope depends on the wine, lot size, target and logistics, so pricing is provided through a project review rather than an online calculator. Build your project brief with the planner, then request a No/Lo Project Review and a Winesecrets team member will follow up. The review also covers timing, logistics and trial design, so the discussion reflects the actual project rather than a generic rate."
        }
      ]
    },

    /* ============================================
       PLANNER FIELD SCHEMA
       ============================================ */
    planner: {
      intro: "No email is required to see your result.",
      steps: [
        { num: 1, key: "wine", label: "The Wine" },
        { num: 2, key: "target", label: "The Target" },
        { num: 3, key: "project", label: "The Project" },
        { num: 4, key: "priorities", label: "Your Priorities" },
        { num: 5, key: "brief", label: "Your Project Brief" }
      ],
      options: {
        wineType: [
          { value: "red", label: "Red" },
          { value: "white", label: "White" },
          { value: "rose", label: "Rosé" },
          { value: "sparkling", label: "Sparkling" },
          { value: "dessert", label: "Dessert / fortified" },
          { value: "other", label: "Other" }
        ],
        productionStatus: [
          { value: "base", label: "Base wine / early development" },
          { value: "finished", label: "Finished wine" },
          { value: "blended", label: "Blended" },
          { value: "oak", label: "Oak aged" },
          { value: "fined", label: "Fined" },
          { value: "filtered", label: "Filtered" },
          { value: "bottling-ready", label: "Bottling-ready" },
          { value: "unsure", label: "Not sure / mixed status" }
        ],
        format: [
          { value: "still", label: "Still" },
          { value: "sparkling", label: "Sparkling" },
          { value: "planning", label: "Not sure / planning stage" }
        ],
        direction: [
          { value: "modest", label: "Modest reduction" },
          { value: "lower", label: "Lower-alcohol wine" },
          { value: "verylow", label: "Very-low-alcohol wine" },
          { value: "na", label: "≤0.5% non-alcoholic" },
          { value: "zero", label: "0.0% concept" },
          { value: "notsure", label: "Not sure" }
        ],
        lotUnit: [
          { value: "gal", label: "Gallons" },
          { value: "L", label: "Liters" }
        ],
        intent: [
          { value: "sku", label: "Launch a No/Lo SKU" },
          { value: "extend", label: "Extend an existing brand" },
          { value: "rd", label: "R&D / feasibility" },
          { value: "style", label: "Lower alcohol for style" },
          { value: "correct", label: "Correct an existing lot" },
          { value: "bulk", label: "Private label / bulk program" },
          { value: "other", label: "Other" }
        ],
        filtrationState: [
          { value: "unfiltered", label: "Unfiltered" },
          { value: "coarse", label: "Coarse filtered" },
          { value: "crossflow", label: "Crossflow / membrane filtered" },
          { value: "sterile", label: "Sterile / final filtered" },
          { value: "unsure", label: "Not sure" }
        ],
        timeline: [
          { value: "30d", label: "Within 30 days" },
          { value: "1-3m", label: "1–3 months" },
          { value: "3-6m", label: "3–6 months" },
          { value: "6m+", label: "6+ months" },
          { value: "none", label: "Exploratory / no date" }
        ],
        locationPreference: [
          { value: "winery", label: "Prefer treatment at our winery" },
          { value: "ship", label: "Can ship / centralized treatment is possible" },
          { value: "either", label: "Either" },
          { value: "unsure", label: "Not sure" }
        ],
        analyses: [
          { value: "abv", label: "ABV confirmed" },
          { value: "ph", label: "pH available" },
          { value: "ta", label: "TA available" },
          { value: "rs", label: "RS available" },
          { value: "micro", label: "Micro/stability data available" },
          { value: "none", label: "None / not sure" }
        ],
        concerns: [
          { value: "aroma", label: "Aroma" },
          { value: "varietal", label: "Varietal character" },
          { value: "mouthfeel", label: "Mouthfeel / body" },
          { value: "acidity", label: "Acidity / balance" },
          { value: "finish", label: "Finish" },
          { value: "sweetness", label: "Sweetness" },
          { value: "color", label: "Color" },
          { value: "tannin", label: "Tannin" },
          { value: "micro", label: "Microbiological stability" },
          { value: "brand", label: "Brand consistency" },
          { value: "repeatability", label: "Repeatability" },
          { value: "timeline", label: "Production timeline" },
          { value: "yield", label: "Wine loss / yield" },
          { value: "cost", label: "Cost" },
          { value: "packaging", label: "Packaging" },
          { value: "compliance", label: "Labeling / compliance" },
          { value: "scaleup", label: "Scale-up" },
          { value: "notsure", label: "Not sure" }
        ]
      },
      errors: {
        required: "Complete the highlighted fields to build your project brief.",
        checkValue: "Please check this value. If it is intentional, contact Winesecrets directly.",
        targetHigher: "Your target is higher than the starting ABV. If you're trying to increase alcohol rather than remove it, Winesecrets can help with alcohol adjustment. Review the value or contact us.",
        lotZero: "Please enter a lot size greater than zero.",
        concernsMax: "Choose up to three concerns."
      }
    },

    /* ============================================
       RESULT LOGIC COPY
       Internal classifications are UI/marketing
       categories only.
       DO NOT PRESENT THESE INTERNAL CLASSIFICATIONS
       AS LEGAL DEFINITIONS.
       ============================================ */
    results: {
      classifications: {
        TARGET_EXPLORATION: {
          label: "Target Exploration",
          blurb: "You are still choosing the number — which is a legitimate starting point. The goal of this project is to identify the alcohol level where the wine works best.",
          nextStep: "Test this wine at several target alcohol levels before selecting the commercial specification.",
          primaryCta: "testtrack"
        },
        ZERO_FEASIBILITY: {
          label: "0.0% Feasibility Project",
          blurb: "A 0.0% concept should begin with feasibility, analytical and regulatory planning rather than assuming it follows the same path as every ≤0.5% product.",
          nextStep: "Request a project review before setting the commercial specification.",
          primaryCta: "review"
        },
        NON_ALCOHOLIC: {
          label: "Non-Alcoholic Project",
          blurb: "Reaching ≤0.5% is only one part of this project. Base-wine suitability, sensory balance, stability, packaging and labeling pathway should be planned together.",
          nextStep: "Evaluate this wine at multiple targets before commercial processing.",
          primaryCta: "testtrack"
        },
        SUBSTANTIAL_DEALC: {
          label: "Substantial Dealcoholization",
          blurb: "This is a substantial dealcoholization project. Sensory balance, stability strategy and packaging decisions should be planned alongside the treatment itself.",
          nextStep: "Plan a project review plus target-level trials before committing the lot.",
          primaryCta: "testtrack"
        },
        LOW_ALCOHOL: {
          label: "Low-Alcohol Development",
          blurb: "At this level the project becomes more than a routine alcohol adjustment. Base-wine suitability and the sensory target deserve deliberate evaluation.",
          nextStep: "Taste this wine at more than one target before selecting the commercial specification.",
          primaryCta: "testtrack"
        },
        MODERATE_ADJUSTMENT: {
          label: "Moderate Adjustment",
          blurb: "This looks like a meaningful alcohol adjustment while remaining close to conventional wine structure.",
          nextStep: "Compare a small set of target ABVs before selecting the final specification.",
          primaryCta: "testtrack"
        },
        MINOR_ADJUSTMENT: {
          label: "Minor Adjustment",
          blurb: "This looks like a fine-tuning adjustment rather than a No/Lo development project. It is still worth confirming the target by taste.",
          nextStep: "Compare a small set of target ABVs, or discuss precision alcohol adjustment directly with Winesecrets.",
          primaryCta: "testtrack"
        }
      },

      /* Base questions always shown */
      baseQuestions: [
        "Which target ABVs should be compared sensorially?",
        "What production and bottling timeline should be built around treatment?"
      ],

      /* Added by classification */
      classificationQuestions: {
        TARGET_EXPLORATION: [
          "Which direction — modest reduction, low-alcohol or non-alcoholic — fits the brand?",
          "What would a successful trial look like for the team?"
        ],
        ZERO_FEASIBILITY: [
          "Is 0.0% analytically feasible for this wine and process pathway?",
          "What definition and claim review applies to a 0.0% product?",
          "What production pathway review is required before specification?",
          "Is the base wine suitable for the intended level of dealcoholization?",
          "What stability strategy is appropriate after processing?",
          "What packaging implications follow from the target?",
          "What labeling framework applies to the intended finished product?",
          "What is the sensory target for the finished wine?"
        ],
        NON_ALCOHOLIC: [
          "Is the base wine suitable for the intended level of dealcoholization?",
          "What stability strategy is appropriate after processing?",
          "What packaging implications follow from the target?",
          "What labeling framework applies to the intended finished product?",
          "What is the sensory target for the finished wine?"
        ],
        SUBSTANTIAL_DEALC: [
          "Is the base wine suitable for the intended level of dealcoholization?",
          "How does the target affect palate weight and acidity perception?",
          "What stability strategy is appropriate after processing?",
          "What labeling framework applies to the intended finished product?"
        ],
        LOW_ALCOHOL: [
          "Is the base wine suited to the intended style at the lower level?",
          "How does the target affect palate weight and acidity perception?",
          "What labeling framework applies to the intended finished product?"
        ],
        MODERATE_ADJUSTMENT: [
          "How does the adjustment affect sensory balance and intended style?",
          "Are there tax or label implications at the adjusted level?"
        ],
        MINOR_ADJUSTMENT: [
          "How does the adjustment affect sensory balance and intended style?"
        ]
      },

      /* Added by selected concerns */
      concernQuestions: {
        mouthfeel: "How does body change across candidate ABV targets?",
        aroma: "How does aromatic expression compare across treated samples?",
        varietal: "How is varietal character perceived at each candidate target?",
        acidity: "How should acidity and balance be evaluated across targets?",
        finish: "How does finish length and character compare across targets?",
        sweetness: "What residual-sugar strategy supports balance at the target level?",
        color: "How should color be monitored through treatment and reintegration?",
        tannin: "How is tannin perception affected at the candidate targets?",
        micro: "What microbiological stability plan is appropriate for the finished product?",
        brand: "What sensory standard must the finished wine meet to carry the brand?",
        repeatability: "How will the selected specification be reproduced lot to lot?",
        timeline: "What trial, production and bottling schedule is realistic for this lot?",
        yield: "How should wine loss and yield be reviewed for this project?", // [VERIFY TECHNICAL] no yield numbers in v1
        cost: "What production variables most affect project scope and cost?", // no cost estimates without Winesecrets pricing logic
        packaging: "What packaging decisions follow from the target level?",
        compliance: "Which labeling and regulatory requirements should be reviewed before packaging?",
        scaleup: "What does scale-up look like after a successful trial?"
      },

      /* Added when wine format is sparkling */
      sparklingQuestion: "How should carbonation and final package be considered in the post-treatment plan?",

      disclaimer: "This project brief is preliminary planning information and does not constitute a processing specification, regulatory determination, or legal advice."
    }
  };
})();
