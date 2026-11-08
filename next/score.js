/* Alfred site scorecard (Nov 8, 2026): live numbers from the public paper record, two views: at the mid and after
   estimated costs. Nothing is hand-typed: if the record can't be reached, the card says so. */
(function () {
  var API = "https://dashboard.tradewithao.com/api/public/track-record";
  var box = document.getElementById("score"), note = document.getElementById("score-note");
  if (!box) return;
  function pct(v, d) { if (v == null || !isFinite(v)) return "—"; var n = Number(v); return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d == null ? 0 : d) + "%"; }
  function tone(v) { return v > 0 ? "up" : v < 0 ? "down" : ""; }
  function stat(label, value, cls, sub) { return '<div class="stat"><small>' + label + '</small><b class="' + (cls || "") + '">' + value + "</b><span>" + sub + "</span></div>"; }
  function render(d, view) {
    var o = d.overall || {}, a = d.allocator || {}, acc = (a.account || {})[view === "costs" ? "afterCosts" : "mid"] || {}, spy = a.spy || {};
    var wr = view === "costs" ? (a.winRate || {}).afterCosts : o.winRate;
    var pf = o.losses && o.avgLossPct ? (o.wins * o.avgWinPct) / (o.losses * Math.abs(o.avgLossPct)) : null;
    box.innerHTML =
      stat("Picks closed", String(o.closed || 0), "", (o.wins || 0) + " green, " + (o.losses || 0) + " red") +
      stat("Closed green", wr == null ? "—" : wr + "%", wr >= 55 ? "up" : "warn", "Reached +30% at some point: " + (o.reached30Rate == null ? "—" : o.reached30Rate + "%")) +
      stat("Average winner · loser", pct(o.avgWinPct) + " · " + pct(o.avgLossPct), "", "Profit factor " + (pf ? pf.toFixed(2) : "—") + " at the mid") +
      stat("$10K account vs SPY", pct(acc.returnPct, 1), tone(acc.returnPct), "SPY " + pct(spy.returnPct, 1) + " · worst drop " + pct(acc.maxDrawdownPct, 1));
    note.textContent = "Official picks " + (a.from || "") + " to " + (a.to || "") + ". " + (view === "costs" ? "After estimated costs: buying at the ask, selling at the bid, plus fees." : "At the mid price between bid and ask; real fills cost more (switch to after costs).") +
      " $10K account: 10% of the balance per pick, compounding. Paper trading on live quotes, not live trading.";
  }
  var data = null, view = "mid";
  var tg = document.createElement("div"); tg.className = "toggle"; tg.setAttribute("role", "group"); tg.setAttribute("aria-label", "Price used");
  tg.innerHTML = '<button type="button" data-v="mid" aria-pressed="true">At the mid</button><button type="button" data-v="costs" aria-pressed="false">After estimated costs</button>';
  box.parentNode.insertBefore(tg, box);
  tg.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; view = b.getAttribute("data-v");
    Array.prototype.forEach.call(tg.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    if (data) render(data, view);
  });
  fetch(API, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d || !d.ok) throw new Error("no record");
    data = d; render(d, view);
    if (typeof window.aoRecordExtras === "function") window.aoRecordExtras(d);
  }).catch(function () { box.innerHTML = '<div class="stat"><small>Track record</small><b>Unavailable</b><span>The live record could not be reached. <a href="/record/">Open the full record</a>.</span></div>'; });
})();
