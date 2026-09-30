/*
 * Hero particle slider for Shyam Polymers.
 * Acetate "granules" gather into the wordmark, then into a spectacle frame, and back.
 * Move the pointer through them to push them aside; click or tap to scatter them.
 *
 * To use the real logo instead of the typed wordmark, set LOGO_SRC to an image path
 * (a PNG with a transparent background works best).
 */
(function () {
  "use strict";

  var LOGO_SRC = "";            // e.g. "images/logo.png"
  var WORDMARK = "Shyam Polymers";
  var WORDMARK_FONT = "Marcellus";
  var SLIDE_MS = [7000, 4500];  // how long each slide holds: wordmark, spectacles

  // Granule colours for the shapes (weighted) and for the loose background granules.
  var SHAPE_COLOURS = [["#f3d19a", 5], ["#e6b26a", 6], ["#d08b3a", 5], ["#f6ead3", 3], ["#b8692a", 3], ["#fff6e6", 1]];
  var LOOSE_COLOURS = ["#6b3a17", "#8e4e1c", "#b8692a", "#4a3222", "#d08b3a", "#2f3a33"];

  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var hero = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = 1;
  var particles = [];
  var slides = [];
  var slide = 0;
  var slideTimer = null;
  var running = false;
  var booted = false;
  var visible = true;
  var frame = 0;
  var logoImg = null;
  var pointer = { x: -9999, y: -9999, on: false };

  var weighted = [];
  SHAPE_COLOURS.forEach(function (c) { for (var i = 0; i < c[1]; i++) weighted.push(c[0]); });
  function shapeColour() { return weighted[(Math.random() * weighted.length) | 0]; }
  function looseColour() { return LOOSE_COLOURS[(Math.random() * LOOSE_COLOURS.length) | 0]; }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // The box the shapes are drawn into: upper part of the hero, clear of the headline.
  function shapeBox() {
    var narrow = W < 700;
    var top = Math.max(76, H * 0.1);
    var bottom = H * (narrow ? 0.44 : 0.5);
    var side = W * (narrow ? 0.06 : 0.1);
    return { x: side, y: top, w: W - side * 2, h: Math.max(80, bottom - top) };
  }

  function roundRectPath(o, x, y, w, h, r) {
    if (w <= 0 || h <= 0) return;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    o.moveTo(x + r, y);
    o.arcTo(x + w, y, x + w, y + h, r);
    o.arcTo(x + w, y + h, x, y + h, r);
    o.arcTo(x, y + h, x, y, r);
    o.arcTo(x, y, x + w, y, r);
    o.closePath();
  }

  function drawWordmark(o) {
    var b = shapeBox();
    o.fillStyle = "#000";
    if (logoImg) {
      var s = Math.min(b.w / logoImg.width, b.h / logoImg.height);
      var lw = logoImg.width * s, lh = logoImg.height * s;
      o.drawImage(logoImg, (W - lw) / 2, b.y + (b.h - lh) / 2, lw, lh);
      return;
    }
    o.textAlign = "center";
    o.textBaseline = "middle";
    var family = "'" + WORDMARK_FONT + "', Georgia, serif";
    var twoLines = W < 640;
    var lines = twoLines ? WORDMARK.split(" ") : [WORDMARK];
    var size = twoLines ? b.h / 2.3 : b.h / 1.6;
    size = Math.min(size, 190);
    o.font = size + "px " + family;
    var widest = Math.max.apply(null, lines.map(function (l) { return o.measureText(l).width; }));
    if (widest > b.w) { size *= b.w / widest; o.font = size + "px " + family; }
    o.lineWidth = Math.max(1, size * 0.02);
    o.strokeStyle = "#000";
    var lineH = size * 1.02;
    var startY = b.y + b.h / 2 - (lineH * (lines.length - 1)) / 2;
    lines.forEach(function (l, i) {
      o.fillText(l, W / 2, startY + i * lineH);
      o.strokeText(l, W / 2, startY + i * lineH);
    });
  }

  // A chunky acetate frame: two lenses with a heavier brow line, a keyhole bridge and short temples.
  function drawSpectacles(o) {
    var b = shapeBox();
    var lensW = Math.min(b.w / 2.9, b.h * 1.25);
    var lensH = lensW * 0.74;
    var bridge = lensW * 0.3;
    var rim = Math.max(6, lensW * 0.1);
    var cx = W / 2, cy = b.y + b.h / 2 + lensH * 0.04;
    var top = cy - lensH / 2;
    var lx = cx - bridge / 2 - lensW;
    var rx = cx + bridge / 2;
    o.fillStyle = "#000";
    [lx, rx].forEach(function (x) {
      o.beginPath();
      roundRectPath(o, x, top, lensW, lensH, lensH * 0.42);
      roundRectPath(o, x + rim, top + rim * 1.45, lensW - rim * 2, lensH - rim * 2.35, lensH * 0.34);
      o.fill("evenodd");
    });
    o.strokeStyle = "#000";
    o.lineCap = "round";
    o.lineWidth = rim * 0.85;
    o.beginPath();
    o.moveTo(lx + lensW - rim * 0.3, top + lensH * 0.3);
    o.quadraticCurveTo(cx, top - lensH * 0.02, rx + rim * 0.3, top + lensH * 0.3);
    o.stroke();
    o.lineWidth = rim * 0.75;
    o.beginPath();
    o.moveTo(lx + rim * 0.4, top + rim * 0.7);
    o.lineTo(lx - lensW * 0.2, top + rim * 0.25);
    o.moveTo(rx + lensW - rim * 0.4, top + rim * 0.7);
    o.lineTo(rx + lensW + lensW * 0.2, top + rim * 0.25);
    o.stroke();
  }

  function sample(draw, gap) {
    var off = document.createElement("canvas");
    off.width = W; off.height = H;
    var o = off.getContext("2d");
    draw(o);
    var data = o.getImageData(0, 0, W, H).data;
    var pts = [];
    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        if (data[(y * W + x) * 4 + 3] > 120) {
          pts.push([x + (Math.random() - 0.5) * gap * 0.5, y + (Math.random() - 0.5) * gap * 0.5]);
        }
      }
    }
    return pts;
  }

  function makeParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
      tx: 0, ty: 0, held: false,
      c: shapeColour(), lc: looseColour(),
      s: 1.6 + Math.random() * 1.4,
      ph: Math.random() * 6.283
    };
  }

  function assign(index, burst) {
    var pts = shuffle(slides[index].slice());
    var order = shuffle(particles.map(function (_, i) { return i; }));
    for (var k = 0; k < order.length; k++) {
      var p = particles[order[k]];
      if (k < pts.length) { p.tx = pts[k][0]; p.ty = pts[k][1]; p.held = true; }
      else { p.held = false; }
      if (burst) { p.vx += (Math.random() - 0.5) * burst; p.vy += (Math.random() - 0.5) * burst; }
    }
  }

  function build() {
    var rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    var gap = 4;
    slides = [sample(drawWordmark, gap), sample(drawSpectacles, gap)];
    var most = Math.max(slides[0].length, slides[1].length);
    var loose = Math.round((W * H) / (W < 700 ? 5200 : 4200));
    var total = most + loose;
    while (particles.length < total) particles.push(makeParticle());
    particles.length = total;
    assign(slide, 0);

    if (reduceMotion) {
      particles.forEach(function (p) { if (p.held) { p.x = p.tx; p.y = p.ty; } });
      draw();
    }
  }

  var t = 0;
  function step() {
    t += 1;
    var R = W < 700 ? 60 : 95, R2 = R * R;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.held) {
        p.vx += (p.tx - p.x) * 0.05;
        p.vy += (p.ty - p.y) * 0.05;
        p.vx *= 0.8; p.vy *= 0.8;
      } else {
        p.vx += Math.cos(t * 0.01 + p.ph) * 0.03;
        p.vy += Math.sin(t * 0.012 + p.ph * 1.7) * 0.03 - 0.004;
        p.vx *= 0.97; p.vy *= 0.97;
      }
      if (pointer.on) {
        var dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          var d = Math.sqrt(d2), f = (1 - d / R);
          f = f * f * 9;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
      }
      p.x += p.vx; p.y += p.vy;
      if (!p.held) {
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      }
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var buckets = {};
    var i, p, key;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      key = p.held ? "h" + p.c : "l" + p.lc;
      (buckets[key] || (buckets[key] = [])).push(p);
    }
    for (key in buckets) {
      var held = key.charAt(0) === "h";
      ctx.globalAlpha = held ? 1 : 0.55;
      ctx.fillStyle = key.slice(1);
      ctx.beginPath();
      var list = buckets[key];
      for (i = 0; i < list.length; i++) {
        p = list[i];
        var s = held ? p.s : p.s * 0.9;
        ctx.rect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    step();
    draw();
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (!booted || running || reduceMotion || !visible || document.hidden) return;
    running = true;
    frame = requestAnimationFrame(loop);
    scheduleSlide();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    clearTimeout(slideTimer);
  }
  function scheduleSlide() {
    clearTimeout(slideTimer);
    slideTimer = setTimeout(function () {
      slide = (slide + 1) % slides.length;
      assign(slide, 10);
      if (running) scheduleSlide();
    }, SLIDE_MS[slide] || 5000);
  }

  function scatter() {
    if (reduceMotion) return;
    particles.forEach(function (p) {
      if (p.held) {
        var a = Math.random() * 6.283, v = 8 + Math.random() * 22;
        p.vx += Math.cos(a) * v; p.vy += Math.sin(a) * v;
      }
    });
  }

  function localPoint(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  hero.addEventListener("pointermove", function (e) {
    var q = localPoint(e);
    pointer.x = q.x; pointer.y = q.y; pointer.on = true;
  });
  hero.addEventListener("pointerleave", function () { pointer.on = false; });
  hero.addEventListener("pointercancel", function () { pointer.on = false; });
  hero.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") pointer.on = false; });
  hero.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("a, button")) return;
    scatter();
  });

  var resizeTimer = null, lastW = 0, lastH = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var r = hero.getBoundingClientRect();
      // Phones resize the viewport while scrolling; only rebuild for real size changes.
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 120) return;
      lastW = r.width; lastH = r.height;
      build();
    }, 180);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  // Test hook: SPHero.show(1) snaps the granules straight into slide 1 (the spectacles).
  window.SPHero = {
    show: function (i) {
      if (!booted) return;
      slide = i % slides.length;
      assign(slide, 0);
      particles.forEach(function (p) { if (p.held) { p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0; } });
      draw();
      if (running) scheduleSlide();
    }
  };

  var hint = document.querySelector(".hero-hint");
  if (hint && window.matchMedia && window.matchMedia("(hover: none)").matches) {
    hint.textContent = "Touch the granules · tap to scatter";
  }
  if (hint && reduceMotion) hint.hidden = true;

  function boot() {
    var r = hero.getBoundingClientRect();
    lastW = r.width; lastH = r.height;
    build();
    booted = true;
    start();
  }

  function whenFontReady(cb) {
    if (!document.fonts || !document.fonts.load) return cb();
    var done = false;
    var finish = function () { if (!done) { done = true; cb(); } };
    document.fonts.load("100px '" + WORDMARK_FONT + "'").then(finish, finish);
    setTimeout(finish, 2500);
  }

  if (LOGO_SRC) {
    var img = new Image();
    img.onload = function () { logoImg = img; boot(); };
    img.onerror = function () { whenFontReady(boot); };
    img.src = LOGO_SRC;
  } else {
    whenFontReady(boot);
  }
})();
