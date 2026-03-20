function initTheme() {
  const saved = localStorage.getItem("snaptab-theme");
  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  localStorage.setItem("snaptab-theme", html.classList.contains("dark") ? "dark" : "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  const icons = document.querySelectorAll(".theme-toggle-icon");
  const isDark = document.documentElement.classList.contains("dark");
  icons.forEach(icon => {
    icon.textContent = isDark ? "light_mode" : "dark_mode";
  });
}

initTheme();

document.addEventListener("DOMContentLoaded", () => {
  updateThemeIcon();

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  const trialForm = document.querySelector("[data-trial-form]");
  if (trialForm) {
    trialForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const webhook = trialForm.getAttribute("data-webhook") || "";
      const name = trialForm.querySelector('input[name="name"]')?.value?.trim() || "";
      const company = trialForm.querySelector('input[name="company"]')?.value?.trim() || "";
      const contact = trialForm.querySelector('input[name="contact"]')?.value?.trim() || "";
      const teamType = trialForm.querySelector('select[name="teamType"]')?.value?.trim() || "";
      const goal = trialForm.querySelector('textarea[name="goal"]')?.value?.trim() || "";
      const result = document.querySelector("[data-trial-result]");
      const submitBtn = trialForm.querySelector('button[type="submit"]');
      const btnText = submitBtn ? submitBtn.textContent : "";

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "提交中..."; }

      const payload = {
        msg_type: "interactive",
        card: {
          header: { title: { tag: "plain_text", content: "SnapTab 新试用申请" }, template: "blue" },
          elements: [{
            tag: "div",
            text: {
              tag: "lark_md",
              content: "**姓名：** " + (name || "-") +
                "\n**公司/团队：** " + (company || "-") +
                "\n**联系方式：** " + (contact || "-") +
                "\n**团队类型：** " + (teamType || "-") +
                "\n**最想解决的问题：**\n" + (goal || "-")
            }
          }]
        }
      };

      let sent = false;
      if (webhook) {
        try {
          const resp = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (resp.ok) sent = true;
        } catch (_) {
          try {
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            sent = navigator.sendBeacon(webhook, blob);
          } catch (_2) { /* fallback below */ }
        }
      }

      if (result) {
        const successHtml = '<div style="background:#0db9f220;border:1px solid #0db9f2;border-radius:16px;padding:24px;text-align:center;">'
          + '<div style="color:#c8eaf6;font-size:16px;font-weight:bold;margin-bottom:12px">'
          + (name || "您") + '，感谢申请！</div>'
          + '<p style="color:#94a3b8;font-size:13px;margin-bottom:16px">请扫码添加微信好友，我们会尽快为您发放激活码</p>'
          + '<img src="assets/wechat-qr.jpg" alt="微信二维码" style="width:180px;height:180px;border-radius:12px;margin:0 auto 16px auto;display:block"/>'
          + '<p style="color:#64748b;font-size:12px;margin-bottom:20px">微信号：Changtouyaoguai</p>'
          + '<div style="border-top:1px solid #223f49;padding-top:16px;margin-top:8px">'
          + '<p style="color:#c8eaf6;font-size:14px;font-weight:bold;margin-bottom:12px">立即下载 SnapTab</p>'
          + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
          + '<a href="https://github.com/SnapTabdata/snaptab-site/releases/download/v1.0/SnapTab_v1.0_webui.zip" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;background:#0db9f2;color:#101e22;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Windows 版下载</a>'
          + '</div></div></div>';
        result.innerHTML = successHtml;
      }

      trialForm.reset();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnText; }
    });
  }
});
