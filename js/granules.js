/*
 * Draws acetate granules on canvases: colour swatches, the mixed granule field,
 * and the havana strip on the sustainability band. Seeded, so every visit looks the same.
 */
(function () {
  "use strict";

  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hexToRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(rgb, target, amt) {
    return rgb.map(function (v, i) { return Math.round(v + (target[i] - v) * amt); });
  }
  function css(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (a == null ? 1 : a) + ")"; }
  function seedFrom(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function fit(canvas) {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  // One granule: a short cylinder seen from a random angle, drawn as a lit ellipse.
  function granule(ctx, x, y, rx, ry, rot, spec, rand) {
    var base = spec.rgb;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.beginPath();
    ctx.ellipse(1.5, 2.5, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,16,12,0.18)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();

    if (spec.kind === "crystal") {
      ctx.fillStyle = css(base, 0.55);
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
      var cg = ctx.createLinearGradient(-rx, -ry, rx, ry);
      cg.addColorStop(0, "rgba(255,255,255,0.55)");
      cg.addColorStop(0.45, "rgba(255,255,255,0.05)");
      cg.addColorStop(1, css(mix(base, [0, 0, 0], 0.35), 0.45));
      ctx.fillStyle = cg;
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    } else {
      var g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.45, 1, 0, 0, rx * 1.1);
      g.addColorStop(0, css(mix(base, [255, 255, 255], spec.kind === "pearl" ? 0.5 : 0.28)));
      g.addColorStop(0.55, css(base));
      g.addColorStop(1, css(mix(base, [0, 0, 0], 0.38)));
      ctx.fillStyle = g;
      ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

      if (spec.kind === "tortoise") {
        var n = 3 + ((rand() * 4) | 0);
        for (var i = 0; i < n; i++) {
          var sx = (rand() - 0.5) * rx * 1.8, sy = (rand() - 0.5) * ry * 1.8, sr = rx * (0.18 + rand() * 0.35);
          var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
          sg.addColorStop(0, css(spec.spot, 0.9));
          sg.addColorStop(1, css(spec.spot, 0));
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.ellipse(sx, sy, sr * 1.4, sr, rand() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (spec.kind === "pearl") {
        var pg = ctx.createLinearGradient(-rx, ry, rx, -ry);
        pg.addColorStop(0.2, "rgba(255,255,255,0)");
        pg.addColorStop(0.5, "rgba(255,255,255,0.35)");
        pg.addColorStop(0.8, "rgba(255,255,255,0)");
        ctx.fillStyle = pg;
        ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
      }
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(-rx * 0.28, -ry * 0.42, rx * 0.34, ry * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255," + (spec.kind === "crystal" ? 0.6 : 0.32) + ")";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = spec.kind === "crystal" ? "rgba(255,255,255,0.7)" : css(mix(base, [0, 0, 0], 0.5), 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function pile(canvas, pickSpec, seed, density, ground) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h;
    var rand = rng(seed);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);
    var size = Math.max(7, Math.min(w, h) / density);
    var count = Math.round((w * h) / (size * size * 1.25));
    var items = [];
    for (var i = 0; i < count; i++) {
      items.push({ x: rand() * (w + size * 2) - size, y: rand() * (h + size * 2) - size, r: rand(), spec: pickSpec(rand) });
    }
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) {
      var rx = size * (0.62 + it.r * 0.3);
      var ry = rx * (0.62 + rand() * 0.3);
      granule(ctx, it.x, it.y, rx, ry, rand() * Math.PI, it.spec, rand);
    });
  }

  function specFrom(el) {
    return {
      kind: el.getAttribute("data-kind") || "solid",
      rgb: hexToRgb(el.getAttribute("data-base") || "#c98a3e"),
      spot: hexToRgb(el.getAttribute("data-spot") || "#3e1c09")
    };
  }

  var FIELD_MIX = [
    { kind: "tortoise", rgb: hexToRgb("#c98a3e"), spot: hexToRgb("#3e1c09"), w: 5 },
    { kind: "tortoise", rgb: hexToRgb("#e2bd7c"), spot: hexToRgb("#8a5220"), w: 3 },
    { kind: "crystal", rgb: hexToRgb("#e9eef0"), w: 4 },
    { kind: "crystal", rgb: hexToRgb("#e4c893"), w: 2 },
    { kind: "solid", rgb: hexToRgb("#15171a"), w: 3 },
    { kind: "solid", rgb: hexToRgb("#ece3cf"), w: 2 },
    { kind: "tortoise", rgb: hexToRgb("#7a4318"), spot: hexToRgb("#1e0d04"), w: 2 },
    { kind: "solid", rgb: hexToRgb("#1f4a36"), w: 1 }
  ];
  var fieldBag = [];
  FIELD_MIX.forEach(function (s) { for (var i = 0; i < s.w; i++) fieldBag.push(s); });

  function drawSwatch(c) {
    var spec = specFrom(c);
    var ground = spec.kind === "crystal" ? "#dfe3dc" : "#e9ebe5";
    pile(c, function () { return spec; }, seedFrom(c.getAttribute("data-base") + spec.kind), 7.5, ground);
  }
  function drawField(c) {
    pile(c, function (rand) { return fieldBag[(rand() * fieldBag.length) | 0]; }, 1978, 13, "#e3e6df");
  }

  function drawHavanaBand(c) {
    var f = fit(c), ctx = f.ctx, w = f.w, h = f.h, rand = rng(412);
    var g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#d9a75c"); g.addColorStop(0.5, "#c98b3e"); g.addColorStop(1, "#b5742c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    var n = Math.round(w / 6);
    for (var i = 0; i < n; i++) {
      var x = rand() * w, y = rand() * h, r = 2 + rand() * 9;
      var dark = rand() < 0.6;
      var rg = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
      rg.addColorStop(0, dark ? "rgba(52,24,8,0.9)" : "rgba(150,78,26,0.6)");
      rg.addColorStop(1, dark ? "rgba(52,24,8,0)" : "rgba(150,78,26,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2.2, r, rand() * 0.6 - 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAll(root) {
    (root || document).querySelectorAll(".swatch canvas").forEach(function (c) {
      if (c.offsetParent !== null) drawSwatch(c);
    });
    document.querySelectorAll(".granule-field").forEach(drawField);
    document.querySelectorAll(".havana-band").forEach(drawHavanaBand);
  }

  window.SPGranules = { drawAll: drawAll, drawSwatches: function (panel) {
    panel.querySelectorAll("canvas").forEach(drawSwatch);
  } };

  var lastW = window.innerWidth;
  window.addEventListener("resize", function () {
    if (Math.abs(window.innerWidth - lastW) < 2) return;
    lastW = window.innerWidth;
    clearTimeout(drawAll._t);
    drawAll._t = setTimeout(drawAll, 200);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { drawAll(); });
  else drawAll();
})();
