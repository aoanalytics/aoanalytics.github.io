/* tradewithao.com motion layer, Sep 2026. Vanilla JS, no libraries.
   Hero product tour, kinetic headings, #how scroll story, card spotlight, demo lightbox. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function mm(q) { return !!(window.matchMedia && matchMedia(q).matches); }
  var RM = mm('(prefers-reduced-motion: reduce)');
  var FINE = mm('(hover: hover) and (pointer: fine)');
  var HAS_IO = 'IntersectionObserver' in window;
  root.classList.toggle('motion', !RM);
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function restart(e, c) { e.classList.remove(c); requestAnimationFrame(function () { requestAnimationFrame(function () { e.classList.add(c); }); }); }

  /* ---------- real desk data, Sep 25, 2026 close ---------- */
  var EXP = ['Sep 25', 'Sep 28', 'Sep 29', 'Sep 30', 'Oct 1'];
  var HM = [
    [780, [74909, 158765, 26686, 281728, 23448]], [779, [10279, 21867, 34553, 67931, 10458]],
    [778, [28793, 43076, 24700, 41326, 8001]], [777, [41695, 96163, 22595, 75936, 13981]],
    [776, [90545, 45240, 24733, 2360, 12707]], [775, [261163, 141158, 24621, 333298, 17482]],
    [774, [395462, 80216, 17144, 26679, -3369]], [773, [527359, 150085, 26244, 34702, -2704]],
    [772, [3532111, 27506, 32227, 33181, 13926]], [771, [2534308, 34780, 31641, 75582, -3614]],
    [770, [-718478, 131633, 37433, 27090, -32231]], [769, [-114151, 68244, -21037, 37386, 4746]],
    [768, [-130427, 79372, -7299, 17537, 309]], [767, [-130749, -1546, -21579, -38272, -5250]],
    [766, [-57619, -26920, -34813, -20264, -6790]], [765, [-60882, -50342, -19011, -144289, -10421]],
    [764, [-65306, -30223, -27007, -17690, -4829]]
  ];
  var MAXL = Math.log(1 + 3532111);
  function fmt(k) { // input in $K
    var a = Math.abs(k), s = k < 0 ? '-' : '';
    if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'B';
    if (a >= 1e3) return s + (a / 1e3).toFixed(1) + 'M';
    return s + a + 'K';
  }
  var PLAN = [
    ['bull', 'Bull', 'Break and hold above 773. Targets 774, 775, 780.'],
    ['base', 'Base', 'Between support at 770 and resistance at 773. Expect chop in between.'],
    ['bear', 'Bear', 'Lose 770 on a close. Targets 767, 765, 761.']
  ];
  var ASKQ = "I'm holding NVDA calls for next Friday, should I be worried?";
  var ASKA = [
    'NVDA is still a wait trade. No clear edge for your Friday calls yet.',
    'Dealers have a 222.50 to 225 switch zone. A close below 222.50 is what would hurt a long call.',
    'The one-week expected move is 217.90 to 232.10, so a run toward 232 is still on the table if 225 holds.'
  ];
  var TAG = '<span class="sc-tag"><i></i>Real desk data, Sep 25, 2026 close</span>';
  function head(t, s) { return '<div class="sc-hd"><div><b>' + t + '</b><small>' + s + '</small></div>' + TAG + '</div>'; }
  function ty(t) { return '<span class="sr">' + t + '</span><span class="ty" aria-hidden="true" data-t="' + t + '"></span>'; }
  function ladder(items, lo, hi, band) {
    function y(p) { return ((hi - p) / (hi - lo)).toFixed(4); }
    var s = '<div class="lad"><i class="lad-ax"></i>';
    if (band) s += '<i class="lad-band" style="--y:' + y(band[1]) + ';--y2:' + y(band[0]) + '"></i>';
    items.forEach(function (it, i) {
      s += '<div class="lv ' + it[2] + '" style="--y:' + y(it[0]) + ';--i:' + i + '"><b>' + it[0] + '</b><i></i><span>' + it[1] + '</span></div>';
    });
    return s + '</div>';
  }

  /* ---------- tour scenes ---------- */
  function sceneHeat() {
    var r = '<div class="hm-r hm-h" role="row"><span role="columnheader">Strike</span>' +
      EXP.map(function (e) { return '<span role="columnheader">' + e + '</span>'; }).join('') + '</div>';
    HM.forEach(function (row, i) {
      var k = row[0], tag = k === 775 ? '<em>CW</em>' : k === 772 ? '<em class="sp">SPOT</em>' : '';
      r += '<div class="hm-r' + (k === 772 ? ' is-spot' : '') + '" role="row" style="--i:' + i + '"><span class="hm-k" role="rowheader">' + k + tag + '</span>';
      row[1].forEach(function (v, j) {
        var king = k === 772 && j === 0;
        var a = Math.pow(Math.log(1 + Math.abs(v)) / MAXL, 4) * 0.72 + 0.04;
        r += '<span role="cell" class="hm-c ' + (king ? 'king' : v < 0 ? 'n' : 'p') + '" style="--a:' + a.toFixed(2) + '">' + (king ? '<i aria-hidden="true">★</i>' : '') + fmt(v) + '</span>';
      });
      r += '</div>';
    });
    return '<div class="sc">' + head('SPY Dealer Heatmap', 'Net dealer gamma (GEX) by strike and expiry') +
      '<div class="hm-wrap"><div class="hm" role="table" aria-label="SPY net GEX by strike and expiry">' + r + '</div>' +
      '<div class="hm-side"><div class="king-card"><em>★ King node</em><b>772</b><span>Sep 25 expiry, +$3.53B</span><p>King node 772. SPY closed at 772.04.</p></div>' +
      '<div class="kv"><div><span>Spot</span><b>772.04</b></div><div><span>Gamma flip</span><b>746.11</b></div>' +
      '<div><span>Regime</span><b class="g">Positive gamma</b></div><div><span>Call wall</span><b>775</b></div><div><span>Put wall</span><b>761</b></div></div></div></div></div>';
  }
  function scenePlan() {
    var rows = PLAN.map(function (p) { return '<div class="gp ' + p[0] + '"><span class="gp-t">' + p[1] + '</span><p>' + ty(p[2]) + '</p></div>'; }).join('');
    var lad = ladder([[780, 'Bull target', 'g'], [775, 'Bull target', 'g'], [774, 'Bull target', 'g'], [773, 'Bull trigger', 'g'],
      [772.04, 'Spot', 's'], [770, 'Bear trigger', 'r'], [767, 'Bear target', 'r'], [765, 'Bear target', 'r'], [761, 'Bear target', 'r']], 758.5, 782, [770, 773]);
    return '<div class="sc">' + head('SPY Game Plan', 'Bull, base and bear, built from the dealer board') +
      '<div class="gp-wrap"><div class="gp-list">' + rows +
      '<p class="gp-note">Price is above the gamma flip at 746.11, where dealer hedging tends to calm moves.</p></div>' +
      '<div class="gp-lad">' + lad + '</div></div></div>';
  }
  function sceneFlow() {
    var sk = '<div class="fl-r fl-sk" aria-hidden="true">' + new Array(8).join('<span><i></i></span>') + '</div>';
    var stats = [['Contract', 'MSTR $144C', 'Oct 9, 2026, 14 DTE'], ['Premium', '$15.4M', 'Bought at the ask'], ['Size', '9,062', 'at about $17.00'],
      ['Open interest', '3,816', 'Size is 2.4× OI'], ['Read', 'Bullish', 'Likely opening'], ['Spot', '$158.32', 'At the print'],
      ['Break-even', '$161.00', 'Needs +1.7%'], ['Window', '12:09 to 12:14', 'PM ET']];
    return '<div class="sc">' + head('Alpha Flow', 'Unusual options flow, bought or sold, opening or closing') +
      '<div class="fl-tbl"><div class="fl-r fl-h"><span>Time (ET)</span><span>Ticker</span><span>Contract</span><span>Premium</span><span>Size</span><span>Side</span><span>Read</span></div>' +
      sk + '<div class="fl-r fl-hit"><span>12:09 to 12:14 PM</span><span><b>MSTR</b></span><span>$144C Oct 9</span><span><b>$15.4M</b></span><span>9,062</span><span>At the ask</span><span><em class="pill g">Bullish</em></span></div>' + sk + '</div>' +
      '<div class="fl-det">' + stats.map(function (s, i) { return '<div class="fl-s" style="--i:' + i + '"><span>' + s[0] + '</span><b>' + s[1] + '</b><small>' + s[2] + '</small></div>'; }).join('') + '</div>' +
      '<p class="fl-int"><em class="pill g">Likely opening</em>9,062 contracts bought at the ask in five minutes, more than twice the 3,816 already open, so this looks like new buying. MSTR needs about 1.7% by Oct 9 to break even.</p></div>';
  }
  function sceneAsk() {
    return '<div class="sc">' + head('Ask A&amp;O', 'Answers from the live desk, with the source') +
      '<div class="ak"><div class="ak-q">' + ty(ASKQ) + '</div><div class="ak-a"><span class="ak-av" aria-hidden="true">AO</span><div class="ak-b">' +
      ASKA.map(function (t, i) { return '<p style="--i:' + i + '">' + t + '</p>'; }).join('') +
      '<div class="ak-src" style="--i:3"><span>From: Dealer heatmap</span><span>From: Live option chain</span></div></div></div>' +
      '<div class="ak-in" aria-hidden="true"><span>Ask about any ticker</span><i>↵</i></div></div></div>';
  }

  /* ---------- typing ---------- */
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function typeOne(n, speed, done) {
    var t = n.getAttribute('data-t'), k = 0;
    if (RM) { n.textContent = t; done(); return; }
    n.textContent = ''; n.classList.add('caret');
    (function step() {
      k += 2; n.textContent = t.slice(0, k);
      if (k < t.length) later(step, speed);
      else later(function () { n.classList.remove('caret'); done(); }, 180);
    })();
  }
  function typeAll(nodes, speed, done) {
    var i = 0;
    (function next() { if (i >= nodes.length) { if (done) done(); return; } typeOne(nodes[i++], speed, next); })();
  }

  /* ---------- hero tour ---------- */
  function initTour() {
    var tour = $('#tour'); if (!tour) return;
    var stage = tour.closest('.stage'), view = $('.tour-view', tour), strip = $('.tour-tabs', tour);
    var tabs = $$('[role="tab"]', tour), bars = tabs.map(function (t) { return $('.pg i', t); });
    var cap = $('#tour-cap'), ctl = $('#tour-ctl');
    var CAP0 = cap ? cap.textContent : '', CAP1 = 'Real desk data, Sep 25, 2026 close. Values change in real time on the desk.';
    var panels = [$('#tp-0')];
    [sceneHeat, scenePlan, sceneFlow, sceneAsk].forEach(function (fn, i) {
      var p = d.createElement('div'); p.className = 'tp'; p.id = 'tp-' + (i + 1);
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'tt-' + (i + 1));
      p.innerHTML = fn(); view.appendChild(p); panels.push(p);
    });
    var players = [
      function (p) { restart(p, 'play'); },
      function (p) { restart(p, 'play'); },
      function (p) { p.classList.remove('done'); restart(p, 'play'); typeAll($$('.ty', p), 22, function () { p.classList.add('done'); }); },
      function (p) { restart(p, 'play'); },
      function (p) { p.classList.remove('ans'); restart(p, 'play'); later(function () { typeAll($$('.ty', p), 30, function () { p.classList.add('ans'); }); }, RM ? 0 : 250); }
    ];
    var DUR = [6000, 6500, 6500, 6500, 7500];
    var idx = 0, elapsed = 0, last = 0, holdUntil = 0, raf = 0, visible = false, hover = false, userPaused = false, seen = false;

    function setBar(p) { bars.forEach(function (b, j) { if (b) b.style.transform = 'scaleX(' + (j === idx ? p : 0) + ')'; }); }
    function show(i, focus) {
      clearTimers(); idx = i; elapsed = 0; setBar(0);
      tabs.forEach(function (t, j) { var on = j === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, j) {
        var on = j === i; p.classList.toggle('on', on);
        if (on) { p.removeAttribute('inert'); p.removeAttribute('aria-hidden'); }
        else { p.setAttribute('inert', ''); p.setAttribute('aria-hidden', 'true'); p.classList.remove('play'); }
      });
      stage.setAttribute('data-scene', i);
      if (cap) cap.textContent = i === 0 ? CAP0 : CAP1;
      if (focus) tabs[i].focus({ preventScroll: true });
      if (strip.scrollWidth > strip.clientWidth + 2) {
        var t = tabs[i], x = t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2;
        strip.scrollTo({ left: Math.max(0, x), behavior: RM ? 'auto' : 'smooth' });
      }
      players[i](panels[i]);
    }
    function running() { return !RM && visible && !d.hidden && !userPaused; }
    function tick(now) {
      raf = 0; if (!running()) return;
      var dt = last ? Math.min(100, now - last) : 0; last = now;
      if (now >= holdUntil && !hover) elapsed += dt;
      setBar(Math.min(1, elapsed / DUR[idx]));
      if (elapsed >= DUR[idx]) show((idx + 1) % panels.length);
      raf = requestAnimationFrame(tick);
    }
    function kick() { tour.classList.toggle('off', !visible || d.hidden); if (running() && !raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function pick(i, focus) { holdUntil = performance.now() + 12000; show(i, focus); kick(); }

    tabs.forEach(function (t, i) { t.addEventListener('click', function () { pick(i); }); });
    strip.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight') n = (idx + 1) % tabs.length; else if (k === 'ArrowLeft') n = (idx - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') n = 0; else if (k === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); pick(n, true); }
    });
    if (RM) tour.classList.add('still');
    else if (ctl) {
      ctl.hidden = false;
      ctl.addEventListener('click', function () {
        userPaused = !userPaused; ctl.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
        ctl.setAttribute('aria-label', userPaused ? 'Play tour' : 'Pause tour'); tour.classList.toggle('paused', userPaused); kick();
      });
    }
    if (FINE) {
      view.addEventListener('pointerenter', function () { hover = true; });
      view.addEventListener('pointerleave', function () { hover = false; });
    }
    tour.addEventListener('focusin', function (e) { if (view.contains(e.target)) hover = true; });
    tour.addEventListener('focusout', function () { hover = false; });
    d.addEventListener('visibilitychange', kick);
    show(0);
    if (HAS_IO) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !seen) { seen = true; players[idx](panels[idx]); }
        kick();
      }, { rootMargin: '0px 0px -12% 0px' }).observe(tour);
    } else { visible = true; kick(); }
  }

  /* ---------- kinetic headings ---------- */
  var G1 = [48, 209, 88], G2 = [100, 210, 255];
  function mix(t) { return 'rgb(' + G1.map(function (c, i) { return Math.round(c + (G2[i] - c) * t); }).join(',') + ')'; }
  function initKinetic() {
    if (RM) return;
    var hs = $$('.hero h1, h2.h');
    var io = HAS_IO ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('kin-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' }) : null;
    hs.forEach(function (hd) {
      var full = hd.textContent.replace(/\s+/g, ' ').trim(), frag = d.createDocumentFragment(), n = 0, grad = [], total = 0;
      [].slice.call(hd.childNodes).forEach(function (node) {
        var g = node.nodeType === 1;
        node.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(d.createTextNode(' ')); return; }
          var s = d.createElement('span'); s.className = 'kw' + (g ? ' g' : ''); s.textContent = w;
          s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', n++); frag.appendChild(s);
          if (g) { grad.push(s); total += w.length; }
        });
      });
      var acc = 0;
      grad.forEach(function (s) { var a = acc / total; acc += s.textContent.length; s.style.backgroundImage = 'linear-gradient(90deg,' + mix(a) + ',' + mix(acc / total) + ')'; });
      hd.setAttribute('aria-label', full); hd.textContent = ''; hd.appendChild(frag); hd.classList.add('kin');
      if (io) io.observe(hd); else hd.classList.add('kin-in');
    });
  }

  /* ---------- #how scroll story ---------- */
  function svHd(n, t, s) { return '<div class="sv-hd"><em>' + n + '</em><b>' + t + '</b><small>' + s + '</small></div>'; }
  var SV = [
    function () {
      return svHd('01 Level', 'SPY dealer ladder', 'Real desk data, Sep 25, 2026 close') +
        ladder([[775, 'Call wall', 'g'], [772.04, 'SPY', 's'], [761, 'Put wall', 'r'], [746.11, 'Gamma flip', 'y']], 742, 779) +
        '<p class="sv-note">Price above the flip: positive gamma.</p>';
    },
    function () {
      return svHd('02 Tape', 'Holding or rejecting the level?', 'Illustrative shape, not live data') +
        '<div class="tape"><svg viewBox="0 0 400 170" preserveAspectRatio="none" aria-hidden="true">' +
        '<path class="vw" d="M0 146 C 90 132, 180 112, 260 92 S 360 66, 400 58"/>' +
        '<path class="px" d="M0 150 L24 138 L44 144 L70 124 L92 130 L118 110 L136 118 L160 98 L184 106 L206 88 L226 96 L252 76 L274 84 L300 62 L322 70 L348 50 L370 56 L400 38"/>' +
        '</svg><i class="tape-cover"></i></div><div class="sv-leg"><span class="px">Price</span><span class="vw">VWAP</span></div>';
    },
    function () {
      return svHd('03 Flow', 'The print behind the read', 'Real desk data, Sep 25, 2026') +
        '<div class="sv-print"><div><b>MSTR $144C</b><span>Oct 9, 2026, 14 DTE</span></div><em class="pill g">Bullish</em>' +
        '<dl><div><dt>Premium</dt><dd>$15.4M</dd></div><div><dt>Size</dt><dd>9,062</dd></div><div><dt>Side</dt><dd>At the ask</dd></div><div><dt>Window</dt><dd>12:09 to 12:14 PM</dd></div></dl>' +
        '<p>More than twice the 3,816 already open. Likely opening.</p></div>';
    },
    function () {
      function seg(c, a, b) { return '<i class="' + c + '" style="--l:' + (a / 390 * 100).toFixed(2) + '%;--w:' + ((b - a) / 390 * 100).toFixed(2) + '%"></i>'; }
      return svHd('04 Session', 'Where you are in the day', '9:30 to 4:00 ET') +
        '<div class="tl">' + seg('o', 0, 15) + seg('a', 70, 72) + seg('m', 120, 270) + seg('p', 330, 390) + '</div>' +
        '<div class="tl-ax"><span>9:30</span><span>4:00</span></div>' +
        '<ul class="tl-leg"><li class="o">Opening 15<small>Reads paused while IV settles</small></li><li class="a">10:40 window<small>The algo window</small></li>' +
        '<li class="m">Midday<small>Chop is common</small></li><li class="p">Power hour<small>Into the close</small></li></ul>';
    },
    function () {
      return svHd('= One read', 'Lean calls, lean puts, or wait', 'Example of the read format') +
        '<div class="sv-checks"><span>Level</span><span>Tape</span><span>Flow</span><span>Session</span></div>' +
        '<div class="readline sv-read"><span class="tag g">CALLS LEAN</span><span class="t">SPX</span><span>Bottom snipe. Holding the put wall as VIX rolls over from its high.</span></div>';
    }
  ];
  function initStory() {
    var story = $('#story'); if (!story) return;
    var steps = $$('.step', story), card = d.createElement('div');
    card.className = 'story-card'; card.setAttribute('aria-hidden', 'true');
    card.innerHTML = SV.map(function (f) { return '<div class="sv">' + f() + '</div>'; }).join('');
    story.appendChild(card); story.classList.add('on');
    var svs = $$('.sv', card), cur = -1;
    function act(i) {
      if (i === cur || i < 0) return; cur = i;
      steps.forEach(function (s, j) { s.classList.toggle('act', j === i); });
      svs.forEach(function (s, j) { s.classList.toggle('on', j === i); });
    }
    act(0);
    if (!HAS_IO) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) act(steps.indexOf(e.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- spotlight ---------- */
  function initSpot() {
    if (RM || !FINE) return;
    $$('.prod, .rule, .learn a, .step, .pcard').forEach(function (e) { e.classList.add('spot'); });
    var tgt = null, x = 0, y = 0, raf = 0;
    d.addEventListener('pointermove', function (ev) {
      var t = ev.target.closest ? ev.target.closest('.spot') : null; if (!t) return;
      tgt = t; x = ev.clientX; y = ev.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; var r = tgt.getBoundingClientRect();
        tgt.style.setProperty('--mx', (x - r.left) + 'px'); tgt.style.setProperty('--my', (y - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---------- header shadow ---------- */
  function initHeader() {
    var hdr = $('.hdr'); if (!hdr) return;
    var raf = 0;
    function upd() { raf = 0; hdr.classList.toggle('scrolled', (window.scrollY || 0) > 8); }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  /* ---------- demo lightbox ---------- */
  function initDemo() {
    var btn = $('#demo-open'), dlg = $('#demo-dlg'); if (!btn || !dlg) return;
    var vid = $('video', dlg), x = $('#demo-close', dlg), back = null;
    function close() { if (dlg.open) dlg.close(); }
    btn.addEventListener('click', function () {
      back = d.activeElement;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      if (x) x.focus();
      if (!RM && vid) { vid.muted = true; var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    });
    if (x) x.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { if (vid) vid.pause(); if (back && back.focus) back.focus(); });
  }

  function init() { initTour(); initKinetic(); initStory(); initSpot(); initHeader(); initDemo(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
