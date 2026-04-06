const RELEASE_CONFIG_URL = "version.json";
const LOCAL_DOWNLOAD_PAGE = "download.html";

let releaseConfigPromise = null;

const MATERIAL_SYMBOL_FALLBACKS = {
  analytics: "▥",
  apartment: "▦",
  arrow_forward: "→",
  bolt: "⚡",
  card_giftcard: "🎁",
  chat: "✉",
  cloud_download: "↓",
  dark_mode: "☾",
  database: "◫",
  description: "▤",
  expand_more: "⌄",
  finance_mode: "¥",
  folder_zip: "🗀",
  group: "👥",
  history: "⏱",
  hourglass_empty: "⌛",
  info: "i",
  install_desktop: "⤓",
  light_mode: "☀",
  mail: "@",
  monetization_on: "¥",
  psychology: "◎",
  remove: "−",
  restart_alt: "↻",
  rocket_launch: "↗",
  security: "🛡",
  shield: "🛡",
  support_agent: "☎",
  system_update: "↻",
  table_chart: "▤",
  tactic: "◈",
  verified: "✓",
  verified_user: "✓",
  vpn_key: "🔑",
  workspace_premium: "★",
};

function applyMaterialSymbolFallbacks() {
  const icons = document.querySelectorAll(".material-symbols-outlined");
  icons.forEach((icon) => {
    const ligature = String(icon.textContent || "").trim();
    if (!ligature) {
      return;
    }
    const fallback = MATERIAL_SYMBOL_FALLBACKS[ligature] || "•";
    icon.setAttribute("data-fallback", fallback);
    icon.setAttribute("aria-hidden", "true");
  });
}

async function markIconFontReady() {
  if (!document.fonts || typeof document.fonts.load !== "function") {
    return;
  }
  try {
    const loaded = await Promise.race([
      document.fonts.load('16px "Material Symbols Outlined"'),
      new Promise((resolve) => setTimeout(() => resolve([]), 1800)),
    ]);
    if (Array.isArray(loaded) && loaded.length > 0) {
      document.documentElement.classList.add("icon-font-ready");
    }
  } catch (_error) {
    // Keep fallbacks visible when the icon font is unavailable.
  }
}

function initTheme() {
  const saved = localStorage.getItem("snaptab-theme") || localStorage.getItem("theme");
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
  const value = html.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("snaptab-theme", value);
  localStorage.setItem("theme", value);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icons = document.querySelectorAll(".theme-toggle-icon");
  const isDark = document.documentElement.classList.contains("dark");
  icons.forEach((icon) => {
    icon.textContent = isDark ? "light_mode" : "dark_mode";
    icon.setAttribute("data-fallback", isDark ? "☀" : "☾");
  });
}

function resetNodeListeners(node) {
  if (!node || !node.parentNode) {
    return node;
  }
  const clone = node.cloneNode(true);
  node.parentNode.replaceChild(clone, node);
  return clone;
}

function normalizeThemeToggleButton(button) {
  if (!button) {
    return button;
  }
  button.classList.add("theme-toggle");
  const icons = button.querySelectorAll(".material-symbols-outlined");
  if (icons.length > 1) {
    icons.forEach((icon, index) => {
      if (index === 0) {
        icon.classList.add("theme-toggle-icon");
      } else {
        icon.remove();
      }
    });
  } else if (icons.length === 1) {
    icons[0].classList.add("theme-toggle-icon");
  } else {
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined text-xl theme-toggle-icon";
    icon.textContent = "dark_mode";
    button.appendChild(icon);
  }
  return button;
}

function normalizeCnMobile(rawValue) {
  const digits = String(rawValue || "").replace(/\D/g, "");
  if (digits.startsWith("86") && digits.length === 13) {
    return digits.slice(2);
  }
  return digits;
}

function validateCnMobileInput(input) {
  if (!input) {
    return { valid: true, normalized: "" };
  }

  const raw = input.value.trim();
  const normalized = normalizeCnMobile(raw);

  if (!raw) {
    input.setCustomValidity("请输入手机号");
    return { valid: false, normalized: "" };
  }

  if (!/^1[3-9]\d{9}$/.test(normalized)) {
    input.setCustomValidity("请输入正确的 11 位中国大陆手机号");
    return { valid: false, normalized };
  }

  input.setCustomValidity("");
  return { valid: true, normalized };
}

function enhancePhoneField(input) {
  if (!input) {
    return;
  }

  input.setAttribute("inputmode", "numeric");
  input.setAttribute("autocomplete", "tel-national");
  input.setAttribute("maxlength", "20");
  input.setAttribute("placeholder", "请输入中国大陆手机号");

  const wrapper = input.parentElement;
  if (wrapper && !wrapper.querySelector("[data-phone-hint]")) {
    const hint = document.createElement("p");
    hint.setAttribute("data-phone-hint", "true");
    hint.className = "mt-1.5 text-xs text-gray-400";
    hint.textContent = "支持 11 位中国大陆手机号，也可粘贴带 +86 的号码";
    wrapper.appendChild(hint);
  }

  input.addEventListener("input", () => {
    if (input.validity.customError) {
      validateCnMobileInput(input);
    }
  });

  input.addEventListener("blur", () => {
    validateCnMobileInput(input);
  });
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDownloadDisplayLabel(entry) {
  if (!entry) {
    return "";
  }
  return entry.size ? `${entry.title}（${entry.size}）` : entry.title;
}

function normalizeDownloadEntry(entry, fallbackUrl, defaults) {
  const title = trimString(entry?.title) || defaults.title;
  const size = trimString(entry?.size) || defaults.size;
  const primaryUrl = trimString(entry?.primary_url);
  const primaryLabel = trimString(entry?.primary_label) || "主线路";
  const rawBackupUrl = trimString(entry?.backup_url) || trimString(fallbackUrl);
  const backupUrl = primaryUrl && rawBackupUrl === primaryUrl ? "" : rawBackupUrl;
  const backupLabel = trimString(entry?.backup_label) || "备用线路";
  const activeUrl = primaryUrl || backupUrl;
  const activeLabel = primaryUrl ? primaryLabel : backupLabel;
  const mirrorUrl = primaryUrl ? backupUrl : "";
  const mirrorLabel = primaryUrl ? backupLabel : "";

  return {
    title,
    size,
    primaryUrl,
    primaryLabel,
    backupUrl,
    backupLabel,
    activeUrl,
    activeLabel,
    mirrorUrl,
    mirrorLabel,
  };
}

function normalizeReleaseConfig(data) {
  const installerFallback = trimString(data?.download_url_installer);
  const portableFallback = trimString(data?.download_url_onedir);

  return {
    version: trimString(data?.version),
    releaseDate: trimString(data?.release_date),
    downloadPageUrl: trimString(data?.download_url) || LOCAL_DOWNLOAD_PAGE,
    installer: normalizeDownloadEntry(data?.downloads?.installer, installerFallback, {
      title: "安装版下载",
      size: "202 MB",
    }),
    portable: normalizeDownloadEntry(data?.downloads?.portable, portableFallback, {
      title: "便携版下载",
      size: "282 MB",
    }),
  };
}

function getReleaseConfig() {
  if (!releaseConfigPromise) {
    releaseConfigPromise = fetch(RELEASE_CONFIG_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`failed to load ${RELEASE_CONFIG_URL}: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => normalizeReleaseConfig(data))
      .catch(() => null);
  }
  return releaseConfigPromise;
}

function setDownloadAnchorState(anchor, url) {
  if (!anchor) {
    return;
  }

  if (url) {
    anchor.href = url;
    anchor.removeAttribute("aria-disabled");
    anchor.classList.remove("pointer-events-none", "opacity-60");
    return;
  }

  anchor.href = LOCAL_DOWNLOAD_PAGE;
  anchor.setAttribute("aria-disabled", "true");
  anchor.classList.add("pointer-events-none", "opacity-60");
}

function renderDownloadMeta(slot, entry) {
  const container = document.querySelector(`[data-download-meta="${slot}"]`);
  if (!container || !entry) {
    return;
  }

  container.innerHTML = "";

  const title = document.createElement("div");
  title.className = "font-medium text-gray-700 dark:text-gray-200";
  title.textContent = entry.title;
  container.appendChild(title);

  const source = document.createElement("div");
  source.className = "mt-1";
  source.textContent = entry.primaryUrl
    ? `优先线路：${entry.primaryLabel}`
    : entry.activeUrl
      ? `当前线路：${entry.activeLabel}`
      : "下载通道准备中";
  container.appendChild(source);

  const help = document.createElement("div");
  help.className = "mt-1";

  if (entry.mirrorUrl) {
    const prefix = document.createElement("span");
    prefix.textContent = "下载较慢？试试 ";
    help.appendChild(prefix);

    const link = document.createElement("a");
    link.href = entry.mirrorUrl;
    link.className = "font-medium text-primary hover:underline";
    link.textContent = entry.mirrorLabel;
    help.appendChild(link);
  } else if (entry.activeUrl) {
    help.textContent = "如下载较慢，可稍后重试当前线路。";
  } else {
    help.textContent = "请稍后刷新页面，或联系管理员获取下载地址。";
  }

  container.appendChild(help);
}

function bindDownloadSlot(slot, entry) {
  if (!entry) {
    return;
  }

  const anchor = document.querySelector(`[data-download-link="${slot}"]`);
  const label = document.querySelector(`[data-download-link-label="${slot}"]`);

  setDownloadAnchorState(anchor, entry.activeUrl);
  if (label) {
    label.textContent = buildDownloadDisplayLabel(entry);
  }

  renderDownloadMeta(slot, entry);
}

async function applyReleaseConfigToPage() {
  const needsReleaseConfig = document.querySelector(
    "[data-release-version-badge], [data-download-link], [data-download-meta]",
  );
  if (!needsReleaseConfig) {
    return null;
  }

  const config = await getReleaseConfig();
  if (!config) {
    return null;
  }

  const versionBadge = config.version ? `最新版本 v${config.version} 现已发布` : "最新版本现已发布";
  document.querySelectorAll("[data-release-version-badge]").forEach((node) => {
    node.textContent = versionBadge;
  });

  bindDownloadSlot("installer", config.installer);
  bindDownloadSlot("portable", config.portable);

  return config;
}

function buildTrialDownloadLinksHtml(config) {
  const downloadPageUrl = trimString(config?.downloadPageUrl) || LOCAL_DOWNLOAD_PAGE;
  const portable = config?.portable;
  const mainUrl = trimString(portable?.activeUrl) || downloadPageUrl;
  const mainLabel = trimString(portable?.title) || "Windows 版下载";
  const mirrorUrl = trimString(portable?.mirrorUrl);
  const mirrorLabel = trimString(portable?.mirrorLabel) || "备用镜像";

  let html =
    '<a href="' +
    escapeHtml(mainUrl) +
    '" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;background:#0db9f2;color:#101e22;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">' +
    escapeHtml(mainLabel) +
    "</a>";

  if (mirrorUrl && mirrorUrl !== mainUrl) {
    html +=
      '<a href="' +
      escapeHtml(mirrorUrl) +
      '" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:transparent;color:#0db9f2;border:1px solid #0db9f2;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">' +
      escapeHtml(mirrorLabel) +
      "</a>";
  }

  return html;
}

initTheme();

document.addEventListener("DOMContentLoaded", async () => {
  let themeToggle = resetNodeListeners(document.getElementById("theme-toggle"));
  themeToggle = normalizeThemeToggleButton(themeToggle);
  let navToggle =
    document.querySelector("[data-nav-toggle]") || document.getElementById("mobile-menu-btn");
  navToggle = resetNodeListeners(navToggle);

  if (themeToggle && navToggle && themeToggle.parentElement && navToggle.parentElement !== themeToggle.parentElement) {
    const actions = themeToggle.parentElement;
    actions.classList.add("ml-auto");
    actions.appendChild(navToggle);
  }

  applyMaterialSymbolFallbacks();
  markIconFontReady();
  updateThemeIcon();
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
  const releaseConfig = await applyReleaseConfigToPage();

  const nav = document.querySelector("[data-nav]") || document.getElementById("mobile-menu");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      nav.classList.toggle("hidden");
    });
  }

  const trialForm = document.querySelector("[data-trial-form]");
  if (!trialForm) {
    return;
  }

  const contactInput = trialForm.querySelector('input[name="contact"]');
  enhancePhoneField(contactInput);

  trialForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phoneCheck = validateCnMobileInput(contactInput);
    if (!phoneCheck.valid) {
      contactInput?.reportValidity();
      contactInput?.focus();
      return;
    }

    const webhook =
      trialForm.getAttribute("data-webhook") || "https://snaptab-trial-submit.liujing1359.workers.dev";
    const name = trialForm.querySelector('input[name="name"]')?.value?.trim() || "";
    const company = trialForm.querySelector('input[name="company"]')?.value?.trim() || "";
    const contact = phoneCheck.normalized;
    const teamType = trialForm.querySelector('select[name="teamType"]')?.value?.trim() || "";
    const goal = trialForm.querySelector('textarea[name="goal"]')?.value?.trim() || "";
    const result = document.querySelector("[data-trial-result]");
    const submitBtn = trialForm.querySelector('button[type="submit"]');
    const btnText = submitBtn ? submitBtn.textContent : "";

    if (result) {
      result.innerHTML = "";
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "提交中...";
    }

    const payload = {
      msg_type: "interactive",
      card: {
        header: {
          title: { tag: "plain_text", content: "SnapTab 新试用申请" },
          template: "blue",
        },
        elements: [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content:
                "**姓名：** " +
                (name || "-") +
                "\n**公司/团队：** " +
                (company || "-") +
                "\n**联系方式：** " +
                (contact || "-") +
                "\n**团队类型：** " +
                (teamType || "-") +
                "\n**最想解决的问题：**\n" +
                (goal || "-"),
            },
          },
          { tag: "hr" },
          {
            tag: "note",
            elements: [{ tag: "plain_text", content: "来自 SnapTab 官网试用表单" }],
          },
        ],
      },
    };

    let sent = false;
    let errorMessage = "";
    if (!webhook) {
      errorMessage = "官网暂未配置试用申请通道，请直接添加微信 Changtouyaoguai 联系我们。";
    } else {
      try {
        const resp = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          sent = true;
        } else {
          let detail = "";
          try {
            const data = await resp.json();
            detail = String(data?.detail || data?.error || "").trim();
          } catch (_) {
            try {
              detail = (await resp.text()).trim();
            } catch (_2) {
              detail = "";
            }
          }
          errorMessage = detail || `提交失败（HTTP ${resp.status}）`;
        }
      } catch (error) {
        errorMessage = error?.message?.trim() || "网络异常，请稍后重试。";
        try {
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          sent = navigator.sendBeacon(webhook, blob);
          if (sent) {
            errorMessage = "";
          }
        } catch (_2) {
          sent = false;
        }
      }
    }

    if (result) {
      if (sent) {
        const currentReleaseConfig = releaseConfig || (await getReleaseConfig());
        const downloadActionsHtml = buildTrialDownloadLinksHtml(currentReleaseConfig);
        const successHtml =
          '<div style="background:#0db9f220;border:1px solid #0db9f2;border-radius:16px;padding:24px;text-align:center;">' +
          '<div style="color:#c8eaf6;font-size:16px;font-weight:bold;margin-bottom:12px">' +
          escapeHtml(name || "您") +
          "，感谢申请！</div>" +
          '<p style="color:#94a3b8;font-size:13px;margin-bottom:16px">请扫码添加微信好友，我们会尽快为您发放 14 天试用激活码</p>' +
          '<img src="assets/wechat-qr.jpg" alt="微信二维码" style="width:180px;height:180px;border-radius:12px;margin:0 auto 16px auto;display:block"/>' +
          '<p style="color:#64748b;font-size:12px;margin-bottom:20px">微信号：Changtouyaoguai</p>' +
          '<div style="border-top:1px solid #223f49;padding-top:16px;margin-top:8px">' +
          '<p style="color:#c8eaf6;font-size:14px;font-weight:bold;margin-bottom:12px">立即下载 SnapTab</p>' +
          '<p style="color:#94a3b8;font-size:12px;margin-bottom:14px">下载包默认未激活，收到试用激活码后请在软件内完成激活。</p>' +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          downloadActionsHtml +
          "</div></div></div>";
        result.innerHTML = successHtml;
      } else {
        const failHtml =
          '<div style="background:#fff7ed;border:1px solid #ffb86b;border-radius:16px;padding:20px;text-align:left;color:#7c2d12;">' +
          '<div style="font-size:15px;font-weight:bold;margin-bottom:10px">试用申请暂未提交成功</div>' +
          '<p style="font-size:13px;line-height:1.7;margin:0 0 10px 0;">' +
          escapeHtml(errorMessage || "请稍后重试，或直接添加微信 Changtouyaoguai 联系我们。") +
          "</p>" +
          '<p style="font-size:12px;line-height:1.7;margin:0;color:#9a3412;">为避免信息丢失，当前表单内容已保留，您可以直接再次提交。</p>' +
          "</div>";
        result.innerHTML = failHtml;
      }
    }

    if (sent) {
      if (contactInput) {
        contactInput.value = "";
      }
      trialForm.reset();
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = btnText;
    }
  });
});
