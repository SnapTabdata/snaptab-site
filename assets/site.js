document.addEventListener("DOMContentLoaded", () => {
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
        if (sent || webhook) {
          result.innerHTML = '<div class="notice" style="background:#0db9f233;border:1px solid #0db9f2;border-radius:12px;padding:16px;color:#c8eaf6;text-align:center;"><strong>' + (name || "您") + '</strong>，感谢申请！您的信息已成功提交，我们会尽快与您联系。</div>';
        } else {
          result.innerHTML = '<div class="notice" style="background:#0db9f233;border:1px solid #0db9f2;border-radius:12px;padding:16px;color:#c8eaf6;text-align:center;"><strong>' + (name || "您") + '</strong>，感谢申请！请添加微信 <strong>Changtouyaoguai</strong> 并发送您的信息，我们会尽快回复。</div>';
        }
      }

      trialForm.reset();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnText; }
    });
  }
});
