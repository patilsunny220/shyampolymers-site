(function () {
  "use strict";

  // Header: transparent over the dark hero, solid once the page scrolls past it.
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  function updateHeader() {
    var limit = hero ? hero.offsetHeight - 80 : 40;
    header.classList.toggle("is-solid", window.scrollY > limit);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
  }
  toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // In-page links: scroll smoothly, and if anything cuts the smooth scroll short, finish the jump.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var settleTimer = null;
  function targetTop(el) {
    if (!el) return 0;
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 12);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var hash = a.getAttribute("href");
    var target = hash === "#top" ? null : document.getElementById(hash.slice(1));
    if (hash !== "#top" && !target) return;
    e.preventDefault();

    window.scrollTo({ top: targetTop(target), behavior: reduceMotion ? "auto" : "smooth" });
    if (history.pushState) history.pushState(null, "", hash);
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }

    clearTimeout(settleTimer);
    var lastY = -1, checks = 0;
    (function settle() {
      settleTimer = setTimeout(function () {
        var want = targetTop(target);
        var y = window.scrollY;
        if (Math.abs(y - want) <= 2) return;
        // Stopped short (or never started): jump the rest of the way.
        if (y === lastY || ++checks > 20) { window.scrollTo({ top: want, behavior: "auto" }); return; }
        lastY = y;
        settle();
      }, 120);
    })();
  });

  // Colour family tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      if (on && window.SPGranules) window.SPGranules.drawSwatches(panel);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  // Enquiry form. With data-endpoint set (Web3Forms, Formspree, etc.) it posts there;
  // otherwise it opens the visitor's email app with the request filled in.
  var form = document.getElementById("enquiry");
  var status = document.getElementById("form-status");
  function values(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }
  function say(msg, kind) {
    status.textContent = msg;
    status.className = "form-status" + (kind ? " " + kind : "");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var required = ["f-name", "f-company", "f-email"];
    var firstBad = null;
    required.forEach(function (id) {
      var el = document.getElementById(id);
      var bad = !el.value.trim() || (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      say("Please fill in your name, company and a valid email address.", "error");
      firstBad.focus();
      return;
    }

    function val(id) { return document.getElementById(id).value.trim(); }
    var data = {
      name: val("f-name"),
      company: val("f-company"),
      email: val("f-email"),
      phone: val("f-phone"),
      interest: values("interest").join(", "),
      send: values("send").join(", "),
      message: val("f-msg")
    };

    var endpoint = form.getAttribute("data-endpoint");
    if (endpoint) {
      say("Sending…");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(Object.assign({ subject: "Website enquiry from " + data.company }, data))
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        say("Thank you. We've received your request and will reply within one working day.", "ok");
      }).catch(function () {
        say("That didn't go through. Please email us at " + form.getAttribute("data-mailto") + ".", "error");
      });
      return;
    }

    var body = [
      "Name: " + data.name,
      "Company: " + data.company,
      "Email: " + data.email,
      "Phone: " + (data.phone || "-"),
      "Interested in: " + (data.interest || "-"),
      "Please send: " + (data.send || "-"),
      "",
      data.message
    ].join("\n");
    window.location.href = "mailto:" + form.getAttribute("data-mailto") +
      "?subject=" + encodeURIComponent("Sample request from " + data.company) +
      "&body=" + encodeURIComponent(body);
    say("Your email app should open with the request filled in. If it doesn't, write to " + form.getAttribute("data-mailto") + ".");
  });

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
