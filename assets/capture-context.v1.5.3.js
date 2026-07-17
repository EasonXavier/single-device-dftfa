(() => {
  'use strict';

  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const isLocalHost = LOCAL_HOSTS.has(window.location.hostname);
  const httpsUrl = `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;

  // Camera and screen-capture APIs are restricted to secure contexts. GitHub Pages
  // can serve a newly configured custom domain over HTTP until Enforce HTTPS is
  // enabled, so normalize public traffic to HTTPS before the scanner initializes.
  if (window.location.protocol === 'http:' && !isLocalHost) {
    window.location.replace(httpsUrl);
    return;
  }

  function isTopLevelDocument() {
    try {
      return window.top === window.self;
    } catch {
      return false;
    }
  }

  function isDisplayCaptureAllowed() {
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (!policy?.allowsFeature) return true;

    try {
      return policy.allowsFeature('display-capture');
    } catch {
      return true;
    }
  }

  function getContextIssue(mode) {
    if (!window.isSecureContext) {
      return mode === 'camera'
        ? '摄像头被浏览器阻止：当前页面不是安全上下文。请确认地址栏以 https:// 开头，并在 GitHub Pages 中启用 Enforce HTTPS。'
        : '屏幕共享被浏览器阻止：当前页面不是安全上下文。请确认地址栏以 https:// 开头，并在 GitHub Pages 中启用 Enforce HTTPS。';
    }

    if (mode === 'screen' && !isTopLevelDocument()) {
      return '屏幕共享被浏览器阻止：当前工具运行在 iframe 或内嵌浏览器中。请在桌面浏览器的新标签页中直接打开此页面。';
    }

    if (mode === 'screen' && !isDisplayCaptureAllowed()) {
      return '屏幕共享被页面权限策略阻止：display-capture 未被允许。请移除代理或 CDN 响应头中的 display-capture=() 限制。';
    }

    return '';
  }

  function applyCapturePreflight() {
    const mode = document.body?.dataset.mode;
    if (mode !== 'screen' && mode !== 'camera') return;

    const startBtn = document.getElementById('startBtn');
    const statusText = document.getElementById('statusText');
    const issue = getContextIssue(mode);

    document.documentElement.dataset.secureContext = String(window.isSecureContext);
    document.documentElement.dataset.topLevelContext = String(isTopLevelDocument());
    document.documentElement.dataset.displayCaptureAllowed = String(isDisplayCaptureAllowed());

    if (!issue || !startBtn || !statusText) return;

    statusText.textContent = issue;
    statusText.dataset.type = 'error';
    startBtn.title = issue;

    // Capture phase ensures the scanner's normal click handler does not replace
    // the actionable diagnostic with a generic unsupported-browser message.
    startBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      statusText.textContent = issue;
      statusText.dataset.type = 'error';
    }, true);

    console.error('[singledeviceDFTFA] Capture preflight failed', {
      issue,
      href: window.location.href,
      origin: window.location.origin,
      protocol: window.location.protocol,
      secureContext: window.isSecureContext,
      topLevelContext: isTopLevelDocument(),
      displayCaptureAllowed: isDisplayCaptureAllowed()
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCapturePreflight, { once: true });
  } else {
    applyCapturePreflight();
  }
})();
