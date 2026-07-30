const setups = {
  AAPL: {
    logo: "A",
    score: "5/5 Bullish",
    price: "$229.84",
    change: "+1.72%",
    entryClass: "positive",
    entryLabel: "Good entry",
    entryDetail: "Price confirmed above the planned trigger.",
    headline: "Momentum has confirmed above a key level.",
    reasons: [
      "Price reclaimed the breakout level and held on the retest.",
      "Options premium remains inside AO’s preferred range.",
      "The broader technology sector is supporting the move."
    ],
    trigger: "$228.60",
    invalidation: "$226.80",
    target: "$233.50",
    expiry: "Aug 7 · Weekly",
    contract: "AAPL $230 Call",
    premium: "$3.10",
    deployed: "$310",
    exposure: "$93",
    fit: true,
    fitDetail: "Uses 31% of your AO allocation.",
    quality: "Preferred"
  },
  QQQ: {
    logo: "Q",
    score: "4/5 Setup Building",
    price: "$703.46",
    change: "+0.41%",
    entryClass: "caution",
    entryLabel: "Waiting for confirmation",
    entryDetail: "The setup needs a clean break above the trigger.",
    headline: "Momentum is improving, but the entry is not confirmed.",
    reasons: [
      "Buyers are defending the morning support zone.",
      "Momentum is strengthening without full price confirmation.",
      "Waiting avoids chasing premium before the trigger."
    ],
    trigger: "$704.10",
    invalidation: "$701.80",
    target: "$707.25",
    expiry: "Today · 0DTE",
    contract: "QQQ $704 Call",
    premium: "$3.45",
    deployed: "$345",
    exposure: "$104",
    fit: true,
    fitDetail: "Uses 34.5% of your AO allocation.",
    quality: "In range"
  },
  SPY: {
    logo: "S",
    score: "3/5 No Trade",
    price: "$652.31",
    change: "+0.08%",
    entryClass: "caution",
    entryLabel: "No trade",
    entryDetail: "Conditions are mixed and offer no clean edge.",
    headline: "SPY is trapped between confirmation levels.",
    reasons: [
      "Price is rotating without sustained direction.",
      "The available premium does not compensate for the mixed setup.",
      "AO is preserving capital until the range resolves."
    ],
    trigger: "$653.10",
    invalidation: "$650.90",
    target: "$655.40",
    expiry: "Today · 0DTE",
    contract: "No contract selected",
    premium: "Unavailable",
    deployed: "$0",
    exposure: "$0",
    fit: false,
    fitDetail: "No qualifying AO contract while the setup is mixed.",
    quality: "Wait"
  },
  NVDA: {
    logo: "N",
    score: "1/5 Bearish",
    price: "$172.86",
    change: "−2.14%",
    entryClass: "negative",
    entryLabel: "Good entry",
    entryDetail: "Downside confirmed below the recovery level.",
    headline: "Sellers remain in control below resistance.",
    reasons: [
      "The attempted recovery failed beneath the invalidation level.",
      "Downside momentum remains aligned with the sector move.",
      "The selected put premium remains inside AO’s preferred range."
    ],
    trigger: "$173.20",
    invalidation: "$174.20",
    target: "$169.80",
    expiry: "Aug 7 · Weekly",
    contract: "NVDA $172.50 Put",
    premium: "$3.65",
    deployed: "$365",
    exposure: "$110",
    fit: true,
    fitDetail: "Uses 36.5% of your AO allocation.",
    quality: "Preferred"
  }
};

const tourSteps = [
  {
    view: "today",
    eyebrow: "Step 1 · Scan",
    title: "Start with the clearest setup.",
    text: "AO ranks the market from bullish to bearish and tells you whether the entry is ready, building, or a no-trade."
  },
  {
    view: "today",
    ticker: "AAPL",
    eyebrow: "Step 2 · Explain",
    title: "Understand the decision.",
    text: "The selected setup translates the underlying market evidence into plain-language reasons, a trigger, an invalidation, and a first target."
  },
  {
    view: "today",
    eyebrow: "Step 3 · Plan",
    title: "Match the contract to the risk.",
    text: "AO selects the contract, checks premium quality, and compares the capital and stop exposure with the trader’s saved plan."
  },
  {
    view: "discover",
    eyebrow: "Step 4 · Ask",
    title: "Research any ticker.",
    text: "AO Analyst synthesizes a ticker into one decision instead of making the trader combine separate charting, flow, news, and options tools."
  },
  {
    view: "trades",
    eyebrow: "Step 5 · Manage",
    title: "Stay disciplined after entry.",
    text: "Position Manager compares the open trade with its original plan and gives clear hold, protect, trim, or exit guidance. The trader stays in control."
  }
];

const byId = (id) => document.getElementById(id);
let selectedTicker = "AAPL";
let tourIndex = 0;
let toastTimer;

function showView(viewName) {
  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.toggle("active", view.dataset.view === viewName);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectTicker(ticker) {
  const setup = setups[ticker];
  if (!setup) return;
  selectedTicker = ticker;

  document.querySelectorAll(".signal-card").forEach((card) => {
    const selected = card.dataset.ticker === ticker;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  byId("tickerLogo").textContent = setup.logo;
  byId("tickerName").textContent = ticker;
  byId("setupScore").textContent = setup.score;
  byId("tickerPrice").innerHTML = `${setup.price} <strong>${setup.change}</strong>`;
  byId("entryStatus").className = `entry-status ${setup.entryClass}`;
  byId("entryLabel").textContent = setup.entryLabel;
  byId("entryDetail").textContent = setup.entryDetail;
  byId("setupHeadline").textContent = setup.headline;
  byId("reasonList").innerHTML = setup.reasons
    .map((reason) => `<li><i>✓</i><span>${reason}</span></li>`)
    .join("");
  byId("triggerLevel").textContent = setup.trigger;
  byId("invalidationLevel").textContent = setup.invalidation;
  byId("targetLevel").textContent = setup.target;
  byId("contractExpiry").textContent = setup.expiry;
  byId("contractName").textContent = setup.contract;
  byId("contractPremium").textContent = setup.premium;
  byId("capitalDeployed").textContent = setup.deployed;
  byId("stopExposure").textContent = setup.exposure;
  byId("qualityBadge").textContent = setup.quality;

  const fitStatus = byId("fitStatus");
  fitStatus.classList.toggle("over", !setup.fit);
  fitStatus.querySelector("span").textContent = setup.fit ? "✓" : "!";
  fitStatus.querySelector("strong").textContent = setup.fit ? "Fits your plan" : "No trade plan available";
  byId("fitDetail").textContent = setup.fitDetail;

  const trackButton = byId("trackTrade");
  trackButton.disabled = !setup.fit;
  trackButton.textContent = setup.fit ? "Track this plan" : "Waiting for a valid setup";
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function updateTour() {
  const step = tourSteps[tourIndex];
  showView(step.view);
  if (step.ticker) selectTicker(step.ticker);
  byId("tourCount").textContent = `${tourIndex + 1} of ${tourSteps.length}`;
  byId("tourProgress").style.width = `${((tourIndex + 1) / tourSteps.length) * 100}%`;
  byId("tourEyebrow").textContent = step.eyebrow;
  byId("tourTitle").textContent = step.title;
  byId("tourText").textContent = step.text;
  byId("tourBack").disabled = tourIndex === 0;
  byId("tourNext").textContent = tourIndex === tourSteps.length - 1 ? "Finish tour" : "Next";
}

function openTour() {
  tourIndex = 0;
  updateTour();
  byId("tourDrawer").hidden = false;
  byId("tourDrawer").classList.add("open");
}

function closeTour() {
  byId("tourDrawer").classList.remove("open");
  window.setTimeout(() => {
    if (!byId("tourDrawer").classList.contains("open")) {
      byId("tourDrawer").hidden = true;
    }
  }, 210);
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const ticker = button.dataset.selectTicker;
    if (ticker) selectTicker(ticker);
    showView(button.dataset.viewTarget);
  });
});

document.querySelectorAll(".signal-card").forEach((card) => {
  card.addEventListener("click", () => selectTicker(card.dataset.ticker));
});

byId("enterDemo").addEventListener("click", () => {
  byId("welcomeModal").classList.remove("active");
  byId("openTour").focus();
});

byId("openTour").addEventListener("click", openTour);
byId("closeTour").addEventListener("click", closeTour);

byId("tourBack").addEventListener("click", () => {
  if (tourIndex > 0) {
    tourIndex -= 1;
    updateTour();
  }
});

byId("tourNext").addEventListener("click", () => {
  if (tourIndex < tourSteps.length - 1) {
    tourIndex += 1;
    updateTour();
    return;
  }
  closeTour();
  showToast("Tour complete — explore any setup or ask AO Analyst.");
});

byId("trackTrade").addEventListener("click", () => {
  const setup = setups[selectedTicker];
  if (!setup.fit) return;
  byId("trackedTitle").textContent = setup.contract;
  byId("trackedPlan").hidden = false;
  showView("trades");
  showToast(`${setup.contract} added to the demo Position Manager.`);
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    byId("askInput").value = button.dataset.question;
    byId("askForm").requestSubmit();
  });
});

byId("askForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = byId("analystAnswer");
  answer.animate(
    [
      { opacity: 0.35, transform: "translateY(5px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 300, easing: "ease-out" }
  );
  showToast("AO Analyst refreshed the simulated answer.");
});

byId("simulateUpdate").addEventListener("click", () => {
  byId("managerStop").textContent = "$2.72 premium";
  byId("managerStopNote").textContent = "Locked above entry";
  byId("targetProgress").textContent = "First target reached";
  byId("nextDecision").textContent = "Trim 50% now";
  byId("nextDecisionNote").textContent = "Trail the remaining contract";
  showToast("Simulated update: first target reached.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTour();
    byId("welcomeModal").classList.remove("active");
  }
});

selectTicker("AAPL");
