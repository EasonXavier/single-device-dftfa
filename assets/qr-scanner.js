(() => {
  const mode = document.body.dataset.mode;
  const video = document.getElementById('preview');
  const canvas = document.getElementById('scanCanvas');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const copyBtn = document.getElementById('copyBtn');
  const resultText = document.getElementById('resultText');
  const statusText = document.getElementById('statusText');

  if (!mode || !video || !canvas || !startBtn || !stopBtn || !copyBtn || !resultText || !statusText) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let activeStream = null;
  let scanTimer = null;
  let detector = null;
  let scanning = false;
  let lastDecodedValue = '';

  function setStatus(message, type = '') {
    statusText.textContent = message;
    statusText.dataset.type = type;
  }

  function setControls(isScanning) {
    startBtn.disabled = isScanning;
    stopBtn.disabled = !isScanning;
  }

  function isProbablyUrl(value) {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function setResult(value) {
    const normalized = value.trim();
    if (!normalized || normalized === lastDecodedValue) return;
    lastDecodedValue = normalized;
    resultText.value = normalized;
    copyBtn.disabled = false;

    if (isProbablyUrl(normalized)) {
      setStatus('识别成功，已为你准备好可复制的链接。', 'success');
    } else {
      setStatus('已识别二维码内容。它不是网页链接，但你仍可直接复制原文。', 'warning');
    }
  }

  async function initDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const supported = await BarcodeDetector.getSupportedFormats?.();
        if (!supported || supported.includes('qr_code')) {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
        }
      } catch {
        detector = null;
      }
    }
  }

  async function decodeWithNativeDetector() {
    if (!detector) return null;
    try {
      const bitmap = await createImageBitmap(canvas);
      const codes = await detector.detect(bitmap);
      bitmap.close?.();
      if (codes && codes.length > 0) return codes[0].rawValue || null;
    } catch {
      return null;
    }
    return null;
  }

  function decodeWithJsQR(width, height) {
    if (typeof window.jsQR !== 'function') return null;
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = window.jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
    return code?.data || null;
  }

  async function scanOnce() {
    if (!scanning || !video.videoWidth || !video.videoHeight) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const decoded = (await decodeWithNativeDetector()) || decodeWithJsQR(width, height);
    if (decoded) setResult(decoded);
  }

  function startScanLoop() {
    scanning = true;
    const loop = async () => {
      if (!scanning) return;
      await scanOnce();
      scanTimer = window.setTimeout(loop, 220);
    };
    loop();
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前浏览器暂不支持调用摄像头，请换用新版 Safari、Chrome、Edge 或 Firefox。');
    }

    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  }

  async function startScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('当前浏览器暂不支持屏幕共享，请在桌面版 Chrome、Edge 或 Firefox 中使用。');
    }

    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
  }

  async function start() {
    try {
      setControls(true);
      copyBtn.disabled = true;
      resultText.value = '';
      lastDecodedValue = '';
      setStatus(mode === 'camera' ? '正在请求摄像头权限，请稍候……' : '正在请求屏幕共享权限，请稍候……');

      activeStream = mode === 'camera' ? await startCamera() : await startScreenShare();
      video.srcObject = activeStream;
      await video.play();

      activeStream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', stop);
      });

      setStatus(mode === 'camera' ? '正在识别摄像头画面中的二维码……' : '正在识别共享屏幕中的二维码……');
      startScanLoop();
    } catch (error) {
      stop();
      setStatus(error?.message || '启动失败，请检查浏览器授权和 HTTPS 环境后重试。', 'error');
    }
  }

  function stop() {
    scanning = false;
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }

    if (video) video.srcObject = null;
    setControls(false);
    if (!resultText.value) setStatus('已停止识别。');
  }

  async function copyResult() {
    const value = resultText.value.trim();
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const temp = document.createElement('textarea');
        temp.value = value;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      setStatus('已复制成功，快去粘贴吧。', 'success');
    } catch {
      setStatus('复制失败，请手动选中结果后复制。', 'error');
    }
  }

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  copyBtn.addEventListener('click', copyResult);

  window.addEventListener('beforeunload', stop);
  initDetector();
})();
