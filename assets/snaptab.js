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
      if (!url) return { sent: false, error: "试用申请通道暂时没有开通，请直接加微信 " + WECHAT + "。" };
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
          return { sent: false, error: (err && err.message) || "网络连接失败，请稍后再试。" };
        });
    }).then(function (res) {
      if (result) {
        if (res.sent) {
          result.innerHTML =
            '<div class="card"><h3>' + esc(name || "你好") + "，申请已收到</h3>" +
            "<p>扫码加微信，我们会尽快发给你 14 天试用激活码。</p>" +
            '<img src="assets/wechat-qr.jpg" alt="微信二维码，微信号 ' + WECHAT + '" width="180" height="180">' +
            "<p>微信号：" + WECHAT + "</p>" +
            '<div class="actions"><a class="btn" href="download.html">下载 SnapTab</a></div></div>';
          form.reset();
        } else {
          result.innerHTML =
            '<div class="card err"><h3>申请没有提交成功</h3><p>' + esc(res.error) + "</p>" +
            "<p>你填的内容还在，可以直接再提交一次，或者加微信 " + WECHAT + " 联系我们。</p></div>";
        }
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      if (btn) { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
