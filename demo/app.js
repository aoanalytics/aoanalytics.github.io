(function () {
  "use strict";

  var EXPRESS_ROUTES = Object.freeze(["#today", "#express", "#discover", "#trades", "#learn"]);
  var PRO_TABS = Object.freeze(["signals", "setups", "dealer", "news", "paper", "performance"]);
  var FIXTURE_PATHS = Object.freeze({
    market: "./data/market-snapshot.json",
    intraday: "./data/intraday-scanner.json",
    weekly: "./data/weekly-watchlist.json",
    topSetups: "./data/top-setups.json",
    dealer: "./data/dealer-matrix.json",
    news: "./data/news-calendar.json",
    paper: "./data/paper-trading.json",
    performance: "./data/performance.json",
    chat: "./data/ao-chat-responses.json"
  });

  var state = {
    data: null,
    fixtures: {},
    selectedTicker: "SPY",
    mode: null,
    proScrollY: 0,
    proTab: "signals",
    expressDirection: "all",
    expressCategory: "all",
    proDirection: "all",
    proSearch: "",
    pinned: new Set()
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function make(tagName, className, textValue) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (textValue !== undefined) node.textContent = textValue;
    return node;
  }

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function money(value, decimals) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Unavailable";
    return "$" + value.toLocaleString("en-US", {
      minimumFractionDigits: decimals == null ? 2 : decimals,
      maximumFractionDigits: decimals == null ? 2 : decimals
    });
  }

  function percent(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
  }

  function text(value, fallback) {
    return value == null || value === "" ? (fallback || "Unavailable") : String(value);
  }

  function selectedSetup() {
    if (!state.data || !Array.isArray(state.data.setups)) return null;
    return state.data.setups.find(function (setup) {
      return setup.ticker === state.selectedTicker;
    }) || state.data.setups[0] || null;
  }

  function displayDirection(setup) {
    if (setup.directionLabel) return setup.directionLabel;
    if (setup.direction === "calls") return "Calls";
    if (setup.direction === "puts") return "Puts";
    return "Wait";
  }

  function stateDisplay(setup) {
    var customerStates = {
      5: "5/5 Bullish",
      4: "4/5 Bullish Setup Building",
      3: "3/5 No Trade",
      2: "2/5 Bearish Setup Building",
      1: "1/5 Bearish"
    };
    return customerStates[setup.score] || setup.score + "/5 · " + displayDirection(setup);
  }

  function labelDisplay(setup) {
    return setup.label || setup.entryStatus || "Frozen AO closing state";
  }

  function directionTone(setup) {
    if (setup.direction === "calls") return "calls";
    if (setup.direction === "puts") return "puts";
    return "wait";
  }

  function expressTone(setup) {
    if (setup.direction === "calls") return "bullish";
    if (setup.direction === "puts") return "bearish";
    return "caution";
  }

  function contractStatus(setup) {
    return setup.contract && setup.contract.label ? setup.contract.label : "No AO contract for this state";
  }

  function premiumStatus(setup) {
    return setup.contract && typeof setup.contract.premium === "number"
      ? money(setup.contract.premium) + " · frozen close"
      : "Unavailable";
  }

  function confidenceStatus(setup) {
    if (typeof setup.confidence !== "number") return "Unavailable";
    return String(setup.confidence) + "%" + (setup.confidenceTier ? " · " + setup.confidenceTier : "");
  }

  function locationStatus(setup) {
    return setup.locationQuality || setup.entryStatus || "Frozen close";
  }

  function technicalStatus(setup) {
    return Array.isArray(setup.technical) && setup.technical.length
      ? setup.technical
      : [setup.summary || labelDisplay(setup)];
  }

  function appendPair(list, term, description, className) {
    var wrapper = make("div", className || "");
    wrapper.append(make("dt", "", term), make("dd", "", description));
    list.append(wrapper);
  }

  function setupTimestamp(setup) {
    if (!setup.receivedAt) return "Closing timestamp unavailable";
    var date = new Date(setup.receivedAt);
    if (Number.isNaN(date.getTime())) return "Closing timestamp unavailable";
    return "Captured " + new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short"
    }).format(date);
  }

  function makeExpressCard(setup) {
    var article = make("article", "ao-express-card ao-express-card--" + expressTone(setup));
    article.dataset.ticker = setup.ticker;

    var header = make("header");
    var identity = make("div");
    identity.append(
      make("span", "ao-express-card-rank", "Closing state · " + setup.surface),
      make("h3", "", setup.ticker),
      make("p", "", money(setup.price) + " · " + percent(setup.changePct)),
      make("small", "", stateDisplay(setup) + " · " + labelDisplay(setup))
    );
    var score = make("div", "ao-express-confirmation");
    score.append(make("span", "", "AO score"), make("strong", "", setup.score + "/5"));
    header.append(identity, score);

    var frozen = make("div", "ao-express-state ao-express-state--caution");
    frozen.append(make("span", "", "Frozen close"), make("strong", "", setup.entryStatus || setupTimestamp(setup)));

    var values = make("dl", "ao-express-card-grid");
    appendPair(values, "AO contract", contractStatus(setup), "ao-express-value ao-express-value--unavailable");
    appendPair(values, "Premium", premiumStatus(setup), "ao-express-value ao-express-value--unavailable");
    appendPair(values, "Confidence", confidenceStatus(setup), "ao-express-value");
    appendPair(values, "Location", locationStatus(setup), "ao-express-value");

    var actions = make("div", "ao-express-card-actions");
    var review = make("button", "ao-express-primary", "Review setup");
    review.type = "button";
    review.setAttribute("aria-label", "Review " + setup.ticker + " setup");
    review.addEventListener("click", function () {
      selectTicker(setup.ticker, true);
    });
    var pin = make("button", "", state.pinned.has(setup.ticker) ? "Unpin" : "Pin");
    pin.type = "button";
    pin.dataset.pinButton = setup.ticker;
    pin.setAttribute("aria-label", (state.pinned.has(setup.ticker) ? "Unpin " : "Pin ") + setup.ticker + " setup");
    pin.setAttribute("aria-pressed", state.pinned.has(setup.ticker) ? "true" : "false");
    pin.addEventListener("click", function () {
      togglePinned(setup.ticker);
    });
    actions.append(review, pin);

    var analysis = make("details", "ao-express-analysis");
    analysis.append(make("summary", "", "Closing technical context"));
    var analysisGrid = make("div", "ao-express-analysis-grid");
    technicalStatus(setup).forEach(function (segment) {
      var item = make("div");
      item.append(make("span", "", segment));
      analysisGrid.append(item);
    });
    analysis.append(analysisGrid);

    var footer = make("footer", "", "Historical AO output · Read-only · No execution");
    article.append(header, frozen, values, actions, analysis, footer);
    return article;
  }

  function expressMatches(setup) {
    var eligible = (setup.score === 5 || setup.score === 1) && (setup.direction === "calls" || setup.direction === "puts");
    var directionMatch = state.expressDirection === "all" || setup.direction === state.expressDirection;
    var categoryMatch = state.expressCategory === "all"
      || setup.category === state.expressCategory
      || (state.expressCategory === "weekly" && setup.category === "weekly-short-dated");
    return eligible && directionMatch && categoryMatch;
  }

  function renderExpressCards() {
    var eligible = state.data.setups.filter(function (setup) {
      return (setup.score === 5 || setup.score === 1) && (setup.direction === "calls" || setup.direction === "puts");
    });
    var filtered = state.data.setups.filter(expressMatches);
    var visible = filtered.slice(0, 10);
    var grid = byId("express-setup-grid");
    grid.replaceChildren();
    visible.forEach(function (setup) {
      grid.append(makeExpressCard(setup));
    });
    byId("express-empty").hidden = visible.length !== 0;
    byId("express-count").textContent = visible.length + " shown · " + eligible.length + " high-conviction states before filters";

    var pinned = state.data.setups.filter(function (setup) {
      return state.pinned.has(setup.ticker);
    });
    var pinnedSection = byId("express-pinned");
    var pinnedGrid = byId("pinned-grid");
    pinnedGrid.replaceChildren();
    pinned.forEach(function (setup) {
      pinnedGrid.append(makeExpressCard(setup));
    });
    pinnedSection.hidden = pinned.length === 0;
  }

  function togglePinned(ticker) {
    if (state.pinned.has(ticker)) state.pinned.delete(ticker);
    else state.pinned.add(ticker);
    renderExpressCards();
    updateSelectedDisplay();
    window.requestAnimationFrame(function () {
      var replacement = document.querySelector('#express-setup-grid [data-pin-button="' + ticker + '"]');
      if (replacement) {
        replacement.focus();
        return;
      }
      var fallback = byId("setup-monitor-title");
      fallback.setAttribute("tabindex", "-1");
      fallback.focus();
    });
  }

  function makeIntradayCard(setup) {
    var article = make("article", "zdte-card");
    article.dataset.ticker = setup.ticker;
    article.setAttribute("aria-current", setup.ticker === state.selectedTicker ? "true" : "false");
    article.classList.toggle("selected", setup.ticker === state.selectedTicker);
    article.append(
      make("span", "zdte-warning-chip", "FROZEN CLOSE · READ ONLY"),
      make("div", "section-label", setup.surface),
      make("h3", "", setup.ticker + " · " + money(setup.price))
    );
    var score = make("span", "score-badge score-" + setup.score, setup.score + "/5");
    var signal = make("span", "signal-badge signal-" + directionTone(setup), displayDirection(setup));
    var badges = make("div", "demo-card-badges");
    badges.append(score, signal);
    article.append(badges, make("p", "demo-main-label", labelDisplay(setup)));
    var details = make("dl", "demo-mini-data");
    appendPair(details, "Contract", contractStatus(setup));
    appendPair(details, "Confidence", confidenceStatus(setup));
    article.append(details);
    var button = make("button", "", "Select " + setup.ticker);
    button.className = "demo-state-action";
    button.type = "button";
    button.setAttribute("aria-label", "Select " + setup.ticker + " closing state");
    button.addEventListener("click", function () {
      selectTicker(setup.ticker, false);
    });
    article.append(button);
    return article;
  }

  function renderIntraday() {
    var grid = byId("pro-intraday-grid");
    grid.replaceChildren();
    state.data.setups.filter(function (setup) {
      return setup.category === "0dte";
    }).forEach(function (setup) {
      grid.append(makeIntradayCard(setup));
    });
  }

  function proMatches(setup) {
    var directionMatch = state.proDirection === "all" || setup.direction === state.proDirection;
    var searchMatch = !state.proSearch || setup.ticker.toLowerCase().includes(state.proSearch);
    return setup.category !== "0dte" && directionMatch && searchMatch;
  }

  function makeStateRow(setup) {
    var row = make("tr");
    row.dataset.ticker = setup.ticker;
    row.setAttribute("aria-selected", setup.ticker === state.selectedTicker ? "true" : "false");
    if (setup.ticker === state.selectedTicker) row.classList.add("is-selected");

    var ticker = make("td");
    ticker.append(make("strong", "", setup.ticker), make("small", "", setup.surface));
    var scoreCell = make("td");
    scoreCell.append(make("span", "score-badge score-" + setup.score, setup.score + "/5"), make("small", "", stateDisplay(setup)));
    var direction = make("td");
    direction.append(make("span", "demo-state-pill " + directionTone(setup), displayDirection(setup)));
    var technical = make("td", "", technicalStatus(setup).join(" · "));
    var action = make("td");
    var review = make("button", "", "Review");
    review.className = "demo-state-action";
    review.type = "button";
    review.setAttribute("aria-label", "Review " + setup.ticker + " closing state");
    review.addEventListener("click", function () {
      selectTicker(setup.ticker, true);
    });
    action.append(review);
    [ticker, scoreCell, direction, make("td", "", confidenceStatus(setup)), make("td", "", locationStatus(setup)), make("td", "", contractStatus(setup)), technical, action].forEach(function (cell) {
      row.append(cell);
    });
    return row;
  }

  function makeUnavailableRow(item) {
    var row = make("tr", "demo-unavailable-row");
    row.dataset.ticker = item.ticker;
    var ticker = make("td");
    ticker.append(make("strong", "", item.ticker), make("small", "", item.surface));
    var status = make("td", "", item.reason);
    status.colSpan = 6;
    var action = make("td");
    var button = make("button", "", "Unavailable");
    button.className = "demo-state-action";
    button.type = "button";
    button.disabled = true;
    button.title = item.reason;
    action.append(button);
    row.append(ticker, status, action);
    return row;
  }

  function renderStateTable() {
    var filtered = state.data.setups.filter(proMatches);
    var body = byId("pro-state-rows");
    body.replaceChildren();
    filtered.forEach(function (setup) {
      body.append(makeStateRow(setup));
    });
    var unavailable = Array.isArray(state.data.unavailableSymbols) ? state.data.unavailableSymbols.filter(function (item) {
      return state.proDirection === "all" && (!state.proSearch || item.ticker.toLowerCase().includes(state.proSearch));
    }) : [];
    unavailable.forEach(function (item) {
      body.append(makeUnavailableRow(item));
    });
    byId("pro-state-empty").hidden = filtered.length + unavailable.length !== 0;
  }

  function renderDealerControls() {
    var controls = byId("dealer-ticker-controls");
    controls.replaceChildren();
    state.data.primaryTickers.forEach(function (ticker) {
      var button = make("button", "", ticker);
      button.type = "button";
      button.dataset.dealerTicker = ticker;
      button.setAttribute("aria-label", "Show " + ticker + " dealer context");
      button.setAttribute("aria-pressed", ticker === state.selectedTicker ? "true" : "false");
      button.addEventListener("click", function () {
        selectTicker(ticker, false);
      });
      controls.append(button);
    });
  }

  function quoteFor(ticker) {
    var quotes = state.fixtures.market && state.fixtures.market.quotes;
    return Array.isArray(quotes) ? quotes.find(function (quote) { return quote.ticker === ticker; }) : null;
  }

  function levelsFor(ticker) {
    var levels = state.fixtures.market && state.fixtures.market.keyLevels;
    return levels && levels[ticker] ? levels[ticker] : null;
  }

  function dealerFor(ticker) {
    var views = state.fixtures.dealer && state.fixtures.dealer.views;
    return Array.isArray(views) ? views.find(function (view) { return view.ticker === ticker; }) : null;
  }

  function renderMacroPanel() {
    var target = byId("macro-data");
    if (!target) return;
    target.replaceChildren(make("div", "side-section-title", "MACRO DATA · FROZEN CLOSE"));
    var rows = state.fixtures.market && state.fixtures.market.macro;
    (Array.isArray(rows) ? rows : []).forEach(function (item) {
      var row = make("div", "macro-row");
      var change = make("span", "macro-change " + (item.changePct >= 0 ? "positive" : "negative"), percent(item.changePct));
      row.append(make("span", "macro-label", item.label), make("span", "macro-price", item.value), change);
      target.append(row);
    });
  }

  function renderBigMovers() {
    var target = byId("big-movers-content");
    if (!target) return;
    target.replaceChildren();
    var movers = state.fixtures.market && state.fixtures.market.bigMovers;
    (Array.isArray(movers) ? movers : []).forEach(function (item) {
      var card = make("article", "demo-mover-card " + (item.changePct >= 0 ? "calls" : "puts"));
      card.append(make("strong", "", item.ticker), make("span", "", money(item.price)), make("b", "", percent(item.changePct)));
      target.append(card);
    });
  }

  function renderJuice() {
    var target = byId("juice-content");
    var items = state.fixtures.topSetups && state.fixtures.topSetups.items;
    if (!target || !Array.isArray(items)) return;
    target.replaceChildren();
    items.slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 5).forEach(function (item) {
      var row = make("button", "demo-juice-row " + directionTone(item));
      row.type = "button";
      row.append(make("b", "", "#" + item.rank + " " + item.ticker), make("span", "", item.contract), make("strong", "", item.score + "/5"));
      row.addEventListener("click", function () { selectTicker(item.ticker, false); });
      target.append(row);
    });
  }

  function renderNewsTicker() {
    var story = document.querySelector(".demo-ticker-story");
    var count = document.querySelector(".demo-news-count");
    var items = state.fixtures.news && state.fixtures.news.news;
    if (!story || !Array.isArray(items) || !items.length) return;
    story.textContent = items.slice(0, 4).map(function (item) { return item.headline; }).join("  ·  ");
    count.textContent = items.length + " frozen stories";
  }

  function renderTopSetups() {
    var grid = byId("top-setups-grid");
    if (!grid) return;
    grid.replaceChildren();
    var items = state.fixtures.topSetups && state.fixtures.topSetups.items;
    (Array.isArray(items) ? items : []).slice().sort(function (a, b) { return a.rank - b.rank; }).forEach(function (item) {
      var card = make("article", "demo-top-card " + directionTone(item));
      var header = make("header");
      var title = make("div");
      title.append(make("span", "section-label", "#" + item.rank + " · " + item.surface), make("h2", "", item.ticker));
      header.append(title, make("span", "score-badge score-" + item.score, item.score + "/5"));
      var contract = make("dl", "demo-mini-data");
      appendPair(contract, "AO Best Contract", item.contract);
      appendPair(contract, "Frozen premium", money(item.premium));
      appendPair(contract, "Confirmation", item.confirmation + "%");
      card.append(header, contract, make("p", "", item.summary), make("small", "", item.volumeMultiple.toFixed(1) + "× average options volume · Frozen close"));
      var button = make("button", "demo-state-action", "View setup");
      button.type = "button";
      button.addEventListener("click", function () {
        selectTicker(item.ticker, false);
        setProTab("signals", true);
      });
      card.append(button);
      grid.append(card);
    });
  }

  function renderDealerView() {
    var root = byId("dealer-view-content");
    if (!root) return;
    var dealer = dealerFor(state.selectedTicker) || dealerFor("SPX");
    if (!dealer) {
      root.textContent = "Dealer fixture unavailable. Other demo sections remain available.";
      return;
    }
    root.replaceChildren();
    var summary = make("div", "demo-dealer-summary");
    [
      ["Spot Price", money(dealer.spot), "Frozen underlying close"],
      ["Gamma Flip / Zero Gamma", money(dealer.gammaFlip), "Dealer-regime boundary"],
      ["Net Dealer Regime", dealer.regime, "Structural context"],
      ["Chain Health", dealer.chainHealth, "Read-only fixture"]
    ].forEach(function (item) {
      var card = make("div");
      card.append(make("span", "", item[0]), make("strong", "", item[1]), make("small", "", item[2]));
      summary.append(card);
    });
    var main = make("div", "demo-dealer-main");
    var ladder = make("section", "panel");
    var ladderHeader = make("header", "flex-between");
    var ladderTitle = make("div");
    ladderTitle.append(make("div", "section-label", "GAMMA GRAVITY LADDER"), make("h2", "", dealer.ticker + " · " + dealer.expiry));
    ladderHeader.append(ladderTitle, make("span", "tag tag-sim", "FROZEN CLOSE"));
    var scroll = make("div", "table-scroll");
    var table = make("table", "demo-dealer-table");
    var head = make("thead");
    var headRow = make("tr");
    ["Strike", "Net GEX", "Pressure / Role"].forEach(function (label) { headRow.append(make("th", "", label)); });
    head.append(headRow);
    var body = make("tbody");
    dealer.levels.forEach(function (level) {
      var row = make("tr");
      row.append(make("td", "", money(level.strike)), make("td", level.gex >= 0 ? "text-green" : "text-red", (level.gex >= 0 ? "+" : "") + level.gex.toFixed(1)), make("td", "", level.role));
      body.append(row);
    });
    table.append(head, body);
    scroll.append(table);
    ladder.append(ladderHeader, make("p", "demo-source-note", dealer.summary), scroll);
    var nearest = make("aside", "panel");
    nearest.append(make("div", "section-label", "NEAREST AO LEVELS"));
    var nearestGrid = make("div", "demo-nearest-levels");
    [["Call wall", dealer.callWall], ["Put wall", dealer.putWall], ["Magnet", dealer.magnet], ["Gamma flip", dealer.gammaFlip]].forEach(function (entry) {
      var item = make("div");
      item.append(make("span", "", entry[0]), make("strong", "", money(entry[1])), make("small", "", "Frozen structural level"));
      nearestGrid.append(item);
    });
    nearest.append(nearestGrid);
    main.append(ladder, nearest);
    root.append(summary, main);
  }

  function renderNewsCalendar() {
    var panel = byId("pro-panel-news");
    var data = state.fixtures.news;
    if (!panel || !data) return;
    panel.replaceChildren();
    var layout = make("div", "demo-news-layout");
    var alert = make("article", "panel demo-news-full");
    alert.append(make("div", "section-label", "BREAKING MARKET ALERT · FROZEN"), make("p", "", data.marketAlert));
    var calendar = make("article", "panel");
    var calHead = make("header", "flex-between");
    var calTitle = make("div");
    calTitle.append(make("div", "section-label", "ECONOMIC CALENDAR"), make("h2", "", "Next 7 days from frozen close"));
    calHead.append(calTitle, make("span", "tag tag-sim", "FROZEN"));
    var calScroll = make("div", "table-scroll");
    var calTable = make("table");
    var calThead = make("thead");
    var calHeadRow = make("tr");
    ["Date / Time", "Impact", "Event", "Actual", "Forecast", "Previous"].forEach(function (label) { calHeadRow.append(make("th", "", label)); });
    calThead.append(calHeadRow);
    var calBody = make("tbody");
    data.economicCalendar.slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
      var row = make("tr");
      [item.date, item.impact, item.event, item.actual, item.forecast, item.previous].forEach(function (value) { row.append(make("td", "", value)); });
      calBody.append(row);
    });
    calTable.append(calThead, calBody); calScroll.append(calTable); calendar.append(calHead, calScroll);
    var earnings = make("article", "panel");
    earnings.append(make("div", "section-label", "EARNINGS THIS WEEK"), make("h2", "", "Watchlist · BMO · AMC"));
    var week = make("div", "demo-week-grid");
    data.earnings.slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
      var day = make("div"); day.append(make("strong", "", item.day), make("span", "", item.ticker + " · " + item.timing)); week.append(day);
    });
    earnings.append(week);
    var news = make("article", "panel demo-news-full");
    news.append(make("div", "section-label", "MARKET NEWS"), make("h2", "", data.news.length + " frozen stories from the closing session"));
    var newsGrid = make("div", "demo-news-grid");
    data.news.slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
      var story = make("article", "demo-news-card " + item.sentiment.toLowerCase());
      story.append(make("strong", "", item.headline), make("span", "", item.sentiment + " · " + item.impact + " impact · " + item.source + " · " + item.age), make("small", "", item.tickers.join(" · ")));
      newsGrid.append(story);
    });
    news.append(newsGrid);
    layout.append(alert, calendar, earnings, news);
    panel.append(layout);
  }

  function renderPaperTrading() {
    var panel = byId("pro-panel-paper");
    var data = state.fixtures.paper;
    if (!panel || !data) return;
    panel.replaceChildren();
    var header = make("header", "demo-page-header flex-between");
    var title = make("div"); title.append(make("div", "section-label", "PAPER TRADING"), make("h1", "", "Paper Trading"), make("p", "", data.disclosure));
    header.append(title, make("span", "tag tag-sim", "READ ONLY · DEMO POSITIONS"));
    panel.append(header);
    function positionTable(items, recent) {
      var section = make("section", "panel");
      section.append(make("div", "section-label", recent ? "RECENT EXAMPLE TRADES" : "OPEN EXAMPLE POSITIONS"));
      var scroll = make("div", "table-scroll");
      var table = make("table");
      var thead = make("thead"); var trh = make("tr");
      (recent ? ["Contract", "Entry → Exit", "P&L", "Score", "Status", "Analysis"] : ["Contract", "Entry", "Current", "P&L", "Time Open", "Score", "Status"]).forEach(function (label) { trh.append(make("th", "", label)); });
      thead.append(trh); var tbody = make("tbody");
      items.slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
        var row = make("tr");
        var values = recent
          ? [item.contract, money(item.entry) + " → " + money(item.exit), (item.pnlDollars >= 0 ? "+" : "") + money(item.pnlDollars, 0), item.score, item.status, item.analysis]
          : [item.contract, money(item.entry), money(item.current), (item.pnlDollars >= 0 ? "+" : "") + money(item.pnlDollars, 0) + " · " + percent(item.pnlPct), item.timeOpen, item.score, item.status];
        values.forEach(function (value, index) { row.append(make("td", index === 3 && !recent ? (item.pnlDollars >= 0 ? "text-green" : "text-red") : "", value)); });
        tbody.append(row);
      });
      table.append(thead, tbody); scroll.append(table); section.append(scroll); return section;
    }
    panel.append(positionTable(data.openPositions, false), positionTable(data.recentTrades, true));
  }

  function renderPerformance() {
    var panel = byId("pro-panel-performance");
    var data = state.fixtures.performance;
    if (!panel || !data) return;
    panel.replaceChildren();
    var header = make("header", "demo-page-header flex-between");
    var title = make("div"); title.append(make("div", "section-label", "PERFORMANCE ANALYTICS"), make("h1", "", "Performance Analytics"), make("p", "", data.disclosure));
    header.append(title, make("span", "tag tag-sim", "HISTORICAL-DEMO PLACEHOLDER"));
    var coverage = make("div", "demo-performance-coverage");
    data.coverage.forEach(function (item) { var card = make("article", "panel"); card.append(make("span", "section-label", item.label), make("strong", "", item.value)); coverage.append(card); });
    var legend = make("section", "panel"); legend.append(make("div", "section-label", "SCORING SYSTEM"));
    var scores = make("div", "demo-score-legend");
    data.scoreBands.forEach(function (item) { var row = make("div"); row.append(make("b", "score-badge score-" + item.score.charAt(0), item.score), make("span", "", item.label), make("small", "", "Historical result not included")); scores.append(row); });
    legend.append(scores);
    var placeholderGrid = make("div", "demo-performance-grid");
    ["Win Rate by Hour (ET)", "Win Rate by Signal Score", "EOD Trade Analysis", "Your Edge Profile"].forEach(function (label) {
      var card = make("article", "panel demo-performance-placeholder"); card.append(make("div", "section-label", label.toUpperCase()), make("h2", "", "Approved results not included"), make("p", "", "The production analysis module is represented without fabricated trades, returns, win rates or recommendations.")); placeholderGrid.append(card);
    });
    panel.append(header, coverage, legend, placeholderGrid);
  }

  function updateTechnicalLists(setup) {
    document.querySelectorAll("[data-selected-technical]").forEach(function (list) {
      list.replaceChildren();
      technicalStatus(setup).forEach(function (segment) {
        list.append(make("li", "", segment));
      });
    });
  }

  function updateSelectedDisplay() {
    var setup = selectedSetup();
    if (!setup) return;

    setAllText("[data-selected-ticker]", setup.ticker);
    setAllText("[data-selected-score]", stateDisplay(setup));
    setAllText("[data-selected-score-badge]", setup.score + "/5");
    setAllText("[data-selected-score-short]", setup.score + "/5");
    setAllText("[data-selected-direction]", displayDirection(setup));
    setAllText("[data-selected-label]", labelDisplay(setup));
    setAllText("[data-selected-contract]", contractStatus(setup));
    setAllText("[data-selected-premium]", premiumStatus(setup));
    setAllText("[data-selected-confidence]", confidenceStatus(setup));
    setAllText("[data-selected-location]", locationStatus(setup));
    setAllText("[data-selected-price]", money(setup.price));
    setAllText("[data-selected-change]", percent(setup.changePct));
    var levels = levelsFor(setup.ticker);
    var dealer = dealerFor(setup.ticker);
    setAllText("[data-selected-pdh]", levels ? money(levels.pdh) : "Unavailable");
    setAllText("[data-selected-pdl]", levels ? money(levels.pdl) : "Unavailable");
    setAllText("[data-selected-magnet]", levels ? money(levels.magnet) : "Unavailable");
    setAllText("[data-selected-trigger-up]", levels ? money(levels.triggerUp) : "Unavailable");
    setAllText("[data-selected-trigger-down]", levels ? money(levels.triggerDown) : "Unavailable");
    setAllText("[data-selected-dealer]", dealer ? dealer.summary : "Dealer context is available for SPY, QQQ, IWM, SPX and NDX.");
    setAllText("[data-selected-risk]", levels
      ? "Breaks above " + money(levels.triggerUp) + " or below " + money(levels.triggerDown) + " change the frozen setup context."
      : "Use the displayed AO score, confirmation and contract as read-only historical context.");
    updateTechnicalLists(setup);

    document.querySelectorAll("[data-primary-ticker]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.primaryTicker === setup.ticker ? "true" : "false");
    });
    document.querySelectorAll("[data-dealer-ticker]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.dealerTicker === setup.ticker ? "true" : "false");
    });

    var scoreBadge = document.querySelector("[data-selected-score-badge]");
    if (scoreBadge) scoreBadge.className = "score-badge score-" + setup.score;
    var signalBadge = document.querySelector("[data-selected-direction]");
    if (signalBadge) signalBadge.className = "signal-badge signal-" + directionTone(setup);
    var sideDecision = byId("side-decision");
    sideDecision.classList.remove("calls", "puts", "wait");
    sideDecision.classList.add(directionTone(setup));

    document.querySelectorAll(".zdte-card[data-ticker]").forEach(function (card) {
      var selected = card.dataset.ticker === setup.ticker;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-current", selected ? "true" : "false");
    });
    document.querySelectorAll("#pro-state-rows tr[data-ticker]").forEach(function (row) {
      var selected = row.dataset.ticker === setup.ticker;
      row.classList.toggle("is-selected", selected);
      row.setAttribute("aria-selected", selected ? "true" : "false");
    });
    renderDealerView();
  }

  function selectTicker(ticker, focusDecision) {
    var exists = state.data.setups.some(function (setup) {
      return setup.ticker === ticker;
    });
    if (!exists) return;
    state.selectedTicker = ticker;
    updateSelectedDisplay();
    if (focusDecision) {
      var target = state.mode === "pro" ? document.querySelector(".main-signal-panel") : byId("express-decision-title");
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function setProTab(tab, focusPanel) {
    if (!PRO_TABS.includes(tab)) tab = "signals";
    state.proTab = tab;
    document.querySelectorAll("[data-pro-tab]").forEach(function (button) {
      var active = button.dataset.proTab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.setAttribute("tabindex", active ? "0" : "-1");
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.querySelectorAll("[data-pro-panel]").forEach(function (panel) {
      var active = panel.dataset.proPanel === tab;
      panel.hidden = !active;
      panel.setAttribute("tabindex", active ? "0" : "-1");
    });
    if (focusPanel) {
      var panel = document.querySelector('[data-pro-panel="' + tab + '"]');
      panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setMode(mode) {
    var previousMode = state.mode;
    if (previousMode === "pro" && mode === "express") state.proScrollY = window.scrollY || 0;
    state.mode = mode;
    var express = byId("ao-beginner-root");
    var pro = byId("app");
    var isExpress = mode === "express";
    express.hidden = !isExpress;
    express.inert = !isExpress;
    express.setAttribute("aria-hidden", isExpress ? "false" : "true");
    pro.hidden = isExpress;
    pro.inert = isExpress;
    pro.setAttribute("aria-hidden", isExpress ? "true" : "false");
    document.querySelectorAll("[data-mode-toggle]").forEach(function (toggle) {
      var checked = isExpress;
      toggle.setAttribute("aria-checked", checked ? "true" : "false");
      var status = toggle.querySelector("b");
      if (status) status.textContent = checked ? "ON" : "OFF";
    });
    document.querySelector(".ao-demo-skip").setAttribute("href", isExpress ? "#setup-monitor" : "#closing-states-title");
    document.body.classList.toggle("ao-express-active", isExpress);
    if (previousMode !== null && previousMode !== mode) {
      var targetScrollY = isExpress ? 0 : state.proScrollY;
      window.requestAnimationFrame(function () {
        window.scrollTo(0, targetScrollY);
        var focusTarget = isExpress
          ? document.querySelector("#ao-beginner-root [data-mode-toggle]")
          : document.querySelector("#app [data-mode-toggle]");
        if (focusTarget) focusTarget.focus({ preventScroll: true });
      });
    }
  }

  function applyRoute() {
    var hash = window.location.hash.toLowerCase();
    if (!hash) {
      window.history.replaceState(null, "", "#today");
      hash = "#today";
    }
    if (hash === "#pro") {
      setMode("pro");
      setProTab(state.proTab, false);
      return;
    }
    if (EXPRESS_ROUTES.includes(hash)) {
      setMode("express");
      return;
    }
    setMode("pro");
    setProTab(state.proTab, false);
  }

  function setExpressFilter(group, value) {
    if (group === "direction") state.expressDirection = value;
    if (group === "category") state.expressCategory = value;
    document.querySelectorAll('[data-filter-group="' + group + '"] [data-filter-value]').forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.filterValue === value ? "true" : "false");
    });
    renderExpressCards();
  }

  function setProDirection(value) {
    state.proDirection = value;
    document.querySelectorAll("[data-pro-direction]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.proDirection === value ? "true" : "false");
    });
    renderStateTable();
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog, returnFocus) {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    if (returnFocus) returnFocus.focus();
  }

  function chatTemplate(intent) {
    var responses = state.fixtures.chat && state.fixtures.chat.responses;
    if (!Array.isArray(responses)) return null;
    return responses.find(function (item) { return item.intent === intent; })
      || responses.find(function (item) { return item.intent === "default"; });
  }

  function inferChatIntent(question) {
    var value = String(question || "").toLowerCase();
    if (/contract|strike|premium/.test(value)) return "contract";
    if (/risk|level|stop|target|break/.test(value)) return "risk";
    if (/dealer|gamma|gex|position/.test(value)) return "dealer";
    if (/macro|vix|bond|dollar|bitcoin/.test(value)) return "macro";
    if (/setup|score|signal|confirm/.test(value)) return "setup";
    return "default";
  }

  function answerChat(intent) {
    var setup = selectedSetup();
    var template = chatTemplate(intent);
    if (!setup || !template) return "Frozen AO Analyst content is unavailable for this question.";
    var levels = levelsFor(setup.ticker);
    var dealer = dealerFor(setup.ticker);
    return template.response
      .replaceAll("{ticker}", setup.ticker)
      .replaceAll("{state}", stateDisplay(setup))
      .replaceAll("{confirmation}", typeof setup.confidence === "number" ? setup.confidence : "—")
      .replaceAll("{technical}", technicalStatus(setup).join("; "))
      .replaceAll("{contract}", contractStatus(setup))
      .replaceAll("{premium}", premiumStatus(setup))
      .replaceAll("{triggerUp}", levels ? money(levels.triggerUp) : "the displayed resistance")
      .replaceAll("{triggerDown}", levels ? money(levels.triggerDown) : "the displayed support")
      .replaceAll("{dealerSummary}", dealer ? dealer.summary : "Dealer context is available for the five core index views in this frozen demo.");
  }

  function showChatAnswer(intent) {
    var response = byId("analyst-response");
    response.textContent = answerChat(intent);
    response.dataset.intent = intent;
  }

  function bindInteractions() {
    document.querySelector(".ao-demo-skip").addEventListener("click", function (event) {
      event.preventDefault();
      var target = state.mode === "pro" ? byId("closing-states-title") : byId("setup-monitor");
      target.setAttribute("tabindex", "-1");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.requestAnimationFrame(function () {
        target.focus({ preventScroll: true });
      });
    });

    document.querySelectorAll("[data-mode-toggle]").forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        window.location.hash = state.mode === "express" ? "#pro" : "#today";
      });
    });

    document.querySelectorAll("[data-pro-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        setProTab(button.dataset.proTab, true);
      });
      button.addEventListener("keydown", function (event) {
        var currentIndex = PRO_TABS.indexOf(button.dataset.proTab);
        var nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % PRO_TABS.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + PRO_TABS.length) % PRO_TABS.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = PRO_TABS.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        var nextTab = PRO_TABS[nextIndex];
        setProTab(nextTab, false);
        document.querySelector('[data-pro-tab="' + nextTab + '"]').focus();
      });
    });

    document.querySelectorAll("[data-primary-ticker]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectTicker(button.dataset.primaryTicker, false);
      });
    });

    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      group.querySelectorAll("[data-filter-value]").forEach(function (button) {
        button.addEventListener("click", function () {
          setExpressFilter(group.dataset.filterGroup, button.dataset.filterValue);
        });
      });
    });

    document.querySelector("[data-reset-filters]").addEventListener("click", function () {
      setExpressFilter("direction", "all");
      setExpressFilter("category", "all");
    });

    document.querySelectorAll("[data-pro-direction]").forEach(function (button) {
      button.addEventListener("click", function () {
        setProDirection(button.dataset.proDirection);
      });
    });

    byId("pro-search").addEventListener("input", function (event) {
      state.proSearch = event.target.value.trim().toLowerCase();
      renderStateTable();
    });

    var analystDialog = byId("analyst-dialog");
    var analystLauncher = byId("analyst-launcher");
    analystLauncher.addEventListener("click", function () {
      openDialog(analystDialog);
      showChatAnswer("default");
    });
    byId("analyst-close").addEventListener("click", function () {
      closeDialog(analystDialog, analystLauncher);
    });
    analystDialog.addEventListener("click", function (event) {
      if (event.target === analystDialog) closeDialog(analystDialog, analystLauncher);
    });
    document.querySelectorAll("[data-chat-intent]").forEach(function (button) {
      button.addEventListener("click", function () {
        showChatAnswer(button.dataset.chatIntent);
      });
    });
    var chatForm = byId("analyst-form");
    if (chatForm) chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = byId("analyst-question");
      showChatAnswer(inferChatIntent(input.value));
      input.value = "";
    });
    var setupDialog = byId("setup-dialog");
    var setupLauncher = byId("open-setup-card");
    setupLauncher.addEventListener("click", function () {
      openDialog(setupDialog);
    });
    byId("setup-dialog-close").addEventListener("click", function () {
      closeDialog(setupDialog, setupLauncher);
    });
    setupDialog.addEventListener("click", function (event) {
      if (event.target === setupDialog) closeDialog(setupDialog, setupLauncher);
    });

    window.addEventListener("hashchange", applyRoute);
  }

  function confidenceTier(value) {
    if (value >= 85) return "HIGH";
    if (value >= 70) return "MODERATE";
    if (value >= 50) return "LOW";
    return "AVOID";
  }

  function buildData(fixtures) {
    var market = fixtures.market || {
      session: { date: "July 31, 2026", label: "Frozen close" },
      disclosure: "Investor Demo — Frozen historical market snapshot. Live market data, brokerage connectivity and trade execution are disabled.",
      selectedTicker: "SPX",
      quotes: [], keyLevels: {}, macro: [], bigMovers: []
    };
    var setups = [];
    var seen = new Set();
    function addSetup(item, defaults) {
      if (!item || !item.ticker || seen.has(item.ticker)) return;
      var quote = (market.quotes || []).find(function (entry) { return entry.ticker === item.ticker; }) || {};
      var score = Number(item.score || defaults.score || 3);
      var direction = item.direction || defaults.direction || (score >= 4 ? "calls" : score <= 2 ? "puts" : "chop");
      setups.push({
        stableKey: item.stableKey || "setup-" + item.ticker.toLowerCase(),
        displayOrder: setups.length + 1,
        ticker: item.ticker,
        surface: item.surface || defaults.surface || "Weekly / short-dated",
        category: item.category || defaults.category || "weekly-short-dated",
        score: score,
        direction: direction,
        directionLabel: direction === "calls" ? "Calls" : direction === "puts" ? "Puts" : "Wait",
        label: item.entryStatus || item.summary || item.state || defaults.label,
        price: typeof item.price === "number" ? item.price : quote.price,
        changePct: typeof item.changePct === "number" ? item.changePct : quote.changePct,
        confidence: typeof item.confirmation === "number" ? item.confirmation : 75,
        confidenceTier: confidenceTier(typeof item.confirmation === "number" ? item.confirmation : 75),
        locationQuality: item.entryStatus || defaults.label || "Frozen close",
        entryStatus: item.entryStatus || defaults.label || "Frozen close",
        contract: item.contract && typeof item.contract === "object"
          ? item.contract
          : item.contract ? { label: item.contract, premium: item.premium, status: "Frozen close" } : null,
        planFit: item.planFit || "Read-only demo plan",
        tradePlan: item.tradePlan || "No live execution",
        technical: item.technical || [item.summary || defaults.label || "Frozen AO close"],
        summary: item.summary || defaults.label || "Frozen AO close"
      });
      seen.add(item.ticker);
    }
    var intraday = fixtures.intraday && fixtures.intraday.items;
    (Array.isArray(intraday) ? intraday : []).slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
      addSetup(item, { surface: "0DTE", category: "0dte", label: "3/5 No Trade" });
    });
    var groups = fixtures.weekly && fixtures.weekly.groups;
    (Array.isArray(groups) ? groups : []).slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (group) {
      group.items.slice().sort(function (a, b) { return a.displayOrder - b.displayOrder; }).forEach(function (item) {
        addSetup(item, { score: group.score, surface: "Weekly / short-dated", category: "weekly-short-dated", label: group.label });
      });
    });
    var top = fixtures.topSetups && fixtures.topSetups.items;
    (Array.isArray(top) ? top : []).slice().sort(function (a, b) { return a.rank - b.rank; }).forEach(function (item) {
      addSetup(item, { surface: item.surface, category: "weekly-short-dated", label: item.summary });
    });
    return {
      session: market.session,
      disclosure: market.disclosure,
      defaultTicker: market.selectedTicker || "SPX",
      primaryTickers: ["SPY", "QQQ", "IWM", "SPX", "NDX"],
      unavailableSymbols: [],
      setups: setups,
      performanceCoverage: { closingTickerStates: setups.length, trackedExtremeEvents: top && top.length ? top.length : 0 }
    };
  }

  function validateSnapshot(data) {
    if (!data || !data.session || !Array.isArray(data.setups) || data.setups.length === 0) return false;
    return data.setups.every(function (setup) {
      return typeof setup.stableKey === "string" && typeof setup.ticker === "string" && typeof setup.score === "number" && typeof setup.direction === "string";
    });
  }

  function initialize(data) {
    if (!validateSnapshot(data)) throw new Error("Frozen snapshot schema is invalid");
    state.data = data;
    state.selectedTicker = data.defaultTicker || data.setups[0].ticker;
    byId("demo-disclosure-text").textContent = data.disclosure;
    byId("demo-session-date").textContent = "Session: " + data.session.date + " · after market close";

    document.querySelectorAll(".ao-express-time-chip").forEach(function (node) { node.textContent = "JUL 31 · 4:05 PM EDT"; });
    document.querySelectorAll(".demo-clock").forEach(function (node) { node.textContent = "4:05:00 PM EDT"; });
    document.querySelectorAll(".demo-market-state").forEach(function (node) { node.textContent = "CLOSED · JUL 31"; });
    document.querySelectorAll(".demo-power-state").forEach(function (node) { node.textContent = "FROZEN CLOSE"; });

    renderExpressCards();
    renderIntraday();
    renderStateTable();
    renderMacroPanel();
    renderJuice();
    renderBigMovers();
    renderNewsTicker();
    renderTopSetups();
    renderNewsCalendar();
    renderPaperTrading();
    renderPerformance();
    renderDealerControls();
    updateSelectedDisplay();

    var coverage = data.performanceCoverage;
    byId("juice-summary").textContent = coverage.trackedExtremeEvents + " ranked frozen setups across calls and puts. Stable order is retained from the fixture; no return or customer-performance claim is included.";

    bindInteractions();
    applyRoute();
    byId("loading-state").hidden = true;
    byId("load-error").hidden = true;
    byId("analyst-launcher").hidden = false;
    document.documentElement.dataset.demoReady = "true";
  }

  function showLoadError() {
    byId("loading-state").hidden = true;
    byId("load-error").hidden = false;
    byId("ao-beginner-root").hidden = true;
    byId("app").hidden = true;
  }

  function fetchFixture(path) {
    return fetch(path, { cache: "no-store", credentials: "same-origin" }).then(function (response) {
      if (!response.ok) throw new Error("Fixture request failed: " + path);
      return response.json();
    });
  }

  byId("analyst-launcher").hidden = true;
  Promise.allSettled(Object.keys(FIXTURE_PATHS).map(function (key) {
    return fetchFixture(FIXTURE_PATHS[key]).then(function (value) { return { key: key, value: value }; });
  })).then(function (results) {
    results.forEach(function (result) {
      if (result.status === "fulfilled") state.fixtures[result.value.key] = result.value.value;
    });
    var data = buildData(state.fixtures);
    initialize(data);
  }).catch(showLoadError);
})();
