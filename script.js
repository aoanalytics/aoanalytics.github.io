const DISCORD_INVITE_URL = "https://whop.com/alpha-omega-analytics/premium-discord-0e-7b63/";

const quizResults = {
  momentum: {
    title: "Momentum Day Trader",
    fit: "0DTE SPX, SPY, NDX, QQQ, IWM, and selective Lotto Friday calls",
    thesis: "You are built for speed, volatility, and clean confirmation. Your best trades happen when price, volume, VWAP, dealer levels, and market internals line up in the same direction.",
    edge: "Fast reads, strict invalidation, and the ability to act when momentum expands.",
    avoid: "Chasing extended candles, averaging down, or taking 0DTE contracts without a hard exit.",
    playbook: "Focus on liquid index contracts, wait for confirmation, define risk before entry, and treat every trade like the clock matters."
  },
  swing: {
    title: "Weekly Swing Trader",
    fit: "Weekly or monthly contracts based on technical breakouts, retests, and trend continuation",
    thesis: "You trade best when the chart gives you time to think. You want structure, trend, support, resistance, volume, and a setup that can work without needing the next candle to explode.",
    edge: "Patience, cleaner entries, and the ability to let a technical setup develop.",
    avoid: "Entering before confirmation, holding through broken levels, or buying premium when the chart is already stretched.",
    playbook: "Build a watchlist, wait for the level, use technical invalidation, and choose contracts with enough time for the move to mature."
  },
  leaps: {
    title: "LEAPS Dip Buyer",
    fit: "Longer-dated calls on quality names after meaningful pullbacks",
    thesis: "You think in months, not minutes. Your best opportunities come when strong names pull back into major support while the bigger trend or long-term thesis still makes sense.",
    edge: "Patience, bigger-picture thinking, and buying time instead of fighting short-term noise.",
    avoid: "Oversizing because the contract has time, buying every dip, or ignoring earnings and macro risk.",
    playbook: "Target quality names, wait for real discounts, size smaller, respect major support, and let time work for the thesis."
  }
};

function wireDiscordLinks() {
  const links = document.querySelectorAll(".discord-link");
  links.forEach((link) => {
    if (DISCORD_INVITE_URL.includes("replace-me")) {
      link.setAttribute("href", "#join");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector("#join")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    link.setAttribute("href", DISCORD_INVITE_URL);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  });
}

wireDiscordLinks();

function initTraderQuiz() {
  const form = document.querySelector("#traderQuiz");
  if (!form) return;

  const resultEl = document.querySelector("#quizResult");
  const resetButton = document.querySelector("#resetQuiz");
  const progressText = document.querySelector("#quizProgress");
  const progressBar = document.querySelector("#quizProgressBar");
  const questionNames = Array.from(new Set([...form.querySelectorAll("input[type='radio']")].map((input) => input.name)));

  function getAnsweredNames() {
    return questionNames.filter((name) => form.querySelector(`input[name="${name}"]:checked`));
  }

  function updateProgress() {
    const answered = getAnsweredNames().length;
    progressText.textContent = `${answered} / ${questionNames.length} answered`;
    progressBar.style.width = `${Math.round((answered / questionNames.length) * 100)}%`;
  }

  function renderResult(type) {
    const result = quizResults[type];
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <span class="result-kicker">Your trader type</span>
      <h3>${result.title}</h3>
      <p>${result.thesis}</p>
      <div class="result-grid">
        <div><strong>Best fit</strong><span>${result.fit}</span></div>
        <div><strong>Your edge</strong><span>${result.edge}</span></div>
        <div><strong>Watch out for</strong><span>${result.avoid}</span></div>
      </div>
      <p>${result.playbook}</p>
      <div class="result-cta">
        <a class="primary-action discord-link" href="#join">Join Discord</a>
        <a class="secondary-action" href="https://x.com/AO_Analytics" target="_blank" rel="noopener">Follow @AO_Analytics</a>
      </div>
    `;
    wireDiscordLinks();
    resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form.addEventListener("change", updateProgress);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answered = getAnsweredNames();
    if (answered.length < questionNames.length) {
      progressText.textContent = `Answer ${questionNames.length - answered.length} more to unlock your trader type`;
      progressText.style.color = "var(--gold)";
      return;
    }

    progressText.style.color = "var(--blue)";
    const score = { momentum: 0, swing: 0, leaps: 0 };
    questionNames.forEach((name) => {
      const selected = form.querySelector(`input[name="${name}"]:checked`);
      if (selected) score[selected.value] += 1;
    });

    const topScore = Math.max(...Object.values(score));
    const tiedTypes = Object.keys(score).filter((type) => score[type] === topScore);
    const contractPreference = form.querySelector('input[name="q6"]:checked')?.value;
    const winner = tiedTypes.includes(contractPreference) ? contractPreference : tiedTypes[0];
    renderResult(winner);
  });

  resetButton?.addEventListener("click", () => {
    form.reset();
    resultEl.hidden = true;
    resultEl.innerHTML = "";
    progressText.style.color = "var(--blue)";
    updateProgress();
  });

  updateProgress();
}

initTraderQuiz();
