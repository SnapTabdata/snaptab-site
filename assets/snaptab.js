// SnapTab 官网脚本（2026-11 改版）：手机菜单 + 试用申请表单（提交到 version.json 里的 trial_submit_url，推送飞书卡片）
(function () {
  "use strict";

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ───────── 动效：滚动到位置时显示、首屏产品图随滚动放大、数字滚动 ─────────
  var root = document.documentElement;
  root.setAttribute("data-ready", "1");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(el) {
    var target = el.getAttribute("data-count-to");
    if (!target || still) return;
    var end = parseFloat(target), t0 = null, dur = 1200;
    var node = el.firstChild;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      k = 1 - Math.pow(1 - k, 3);
      node.nodeValue = Math.round(end * k) + "%";
      if (k < 1) requestAnimationFrame(step);
    }
    node.nodeValue = "0%";
    requestAnimationFrame(step);
  }

  var watched = document.querySelectorAll("[data-reveal], [data-stagger]");
  if ("IntersectionObserver" in window && !still) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count-to]").forEach(countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    watched.forEach(function (el) { io.observe(el); });
  } else {
    watched.forEach(function (el) { el.classList.add("in"); });
  }

  var shot = document.querySelector(".stage .shot");
  if (shot && !still) {
    var ticking = false;
    var zoom = function () {
      ticking = false;
      var r = shot.getBoundingClientRect(), vh = window.innerHeight || 800;
      var p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
      shot.style.setProperty("--zoom", (0.9 + 0.1 * p).toFixed(4));
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(zoom); } }, { passive: true });
    window.addEventListener("resize", zoom);
    zoom();
  }

  // 下载页：按访问者的系统预先选好 Windows 或 Mac
  var macRadio = document.getElementById("os-mac");
  if (macRadio && /Mac/i.test(navigator.platform || navigator.userAgent) && !/iPhone|iPad/i.test(navigator.userAgent)) {
    macRadio.checked = true;
  }

  var form = document.querySelector("[data-trial-form]");
  if (!form) return;

  var WECHAT = "Changtouyaoguai";
  var phone = form.querySelector('input[name="contact"]');
  var result = document.querySelector("[data-trial-result]");

  function esc(v) {
    return String(v || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function normalizePhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    return d.indexOf("86") === 0 && d.length === 13 ? d.slice(2) : d;
  }

  function checkPhone() {
    if (!phone) return { ok: true, value: "" };
    var raw = phone.value.trim();
    var v = normalizePhone(raw);
    if (!raw) { phone.setCustomValidity("请输入手机号"); return { ok: false, value: "" }; }
    if (!/^1[3-9]\d{9}$/.test(v)) { phone.setCustomValidity("请输入正确的 11 位中国大陆手机号"); return { ok: false, value: v }; }
    phone.setCustomValidity("");
    return { ok: true, value: v };
  }

  if (phone) {
    phone.addEventListener("blur", checkPhone);
    phone.addEventListener("input", function () { if (phone.validity.customError) checkPhone(); });
  }

  function submitUrl() {
    var fixed = (form.getAttribute("data-webhook") || "").trim();
    if (fixed) return Promise.resolve(fixed);
    return fetch("version.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { return String((d && d.trial_submit_url) || "").trim(); })
      .catch(function () { return ""; });
  }

  function field(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = checkPhone();
    if (!p.ok) { phone.reportValidity(); phone.focus(); return; }

    var name = field("name"), company = field("company"), teamType = field("teamType"), goal = field("goal");
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "正在提交…"; }
    if (result) result.innerHTML = "";

    var payload = {
      msg_type: "interactive",
      card: {
        header: { title: { tag: "plain_text", content: "SnapTab 新试用申请" }, template: "blue" },
        elements: [
          { tag: "div", text: { tag: "lark_md", content:
            "**姓名：** " + (name || "-") + "\n**公司/团队：** " + (company || "-") + "\n**联系方式：** " + (p.value || "-") +
            "\n**团队类型：** " + (teamType || "-") + "\n**最想解决的问题：**\n" + (goal || "-") } },
          { tag: "hr" },
          { tag: "note", elements: [{ tag: "plain_text", content: "来自 SnapTab 官网试用表单" }] }
        ]
      }
    };

    submitUrl().then(function (url) {
      if (!url) return { sent: false, error: "申请通道暂未开通，请添加微信 " + WECHAT + "。" };
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) {
          if (r.ok) return { sent: true };
          return r.text().then(function (t) {
            var detail = "";
            try { var j = JSON.parse(t); detail = String(j.detail || j.error || ""); } catch (_) { detail = t; }
            return { sent: false, error: detail.trim() || "提交没有成功（HTTP " + r.status + "）" };
          });
        })
        .catch(function (err) {
          try {
            if (navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: "application/json" }))) return { sent: true };
          } catch (_) { /* 忽略 */ }
          return { sent: false, error: (err && err.message) || "网络连接失败。" };
        });
    }).then(function (res) {
      if (result) {
        if (res.sent) {
          result.innerHTML =
            '<div class="card"><h3>' + (name ? esc(name) + "，" : "") + "申请已提交</h3>" +
            "<p>扫码添加微信，获取 14 天试用激活码。</p>" +
            '<img src="assets/wechat-qr.jpg" alt="微信二维码，微信号 ' + WECHAT + '" width="180" height="180">' +
            "<p>微信号：" + WECHAT + "</p>" +
            '<div class="actions"><a class="btn" href="download.html">下载 SnapTab</a></div></div>';
          form.reset();
        } else {
          result.innerHTML =
            '<div class="card err"><h3>提交失败</h3><p>' + esc(res.error) + "</p>" +
            "<p>已填内容保留，可重新提交，或添加微信 " + WECHAT + "。</p></div>";
        }
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      if (btn) { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
