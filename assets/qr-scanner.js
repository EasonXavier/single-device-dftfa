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
  const scannerFrame = document.getElementById('scannerFrame');
  const cameraState = document.getElementById('cameraState');
  const previewIndex = document.getElementById('previewIndex');
  const resultIndex = document.getElementById('resultIndex');
  const resultTime = document.getElementById('resultTime');
  const updateNotice = document.getElementById('updateNotice');
  const scanUpdateFlash = document.getElementById('scanUpdateFlash');

  let activeStream = null;
  let scanTimer = null;
  let detector = null;
  let scanning = false;
  let lastDecodedValue = '';
  let decodedIndex = 0;
  let flashTimer = null;

  function setStatus(message, type = '') {
    statusText.textContent = message;
    statusText.dataset.type = type;
  }

  function idleStateLabel() {
    return mode === 'camera' ? '摄像头未启动' : '屏幕未共享';
  }

  function scanningStateLabel() {
    return mode === 'camera' ? '正在扫描' : '正在识别';
  }

  function setControls(isScanning) {
    startBtn.disabled = isScanning;
    stopBtn.disabled = !isScanning;
    scannerFrame?.classList.toggle('is-scanning', isScanning);
    if (cameraState) cameraState.textContent = isScanning ? scanningStateLabel() : idleStateLabel();
  }

  function isProbablyUrl(value) {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function formatIndex(index) {
    return String(index).padStart(3, '0');
  }

  function formatClock(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  }

  function announceUpdate(indexLabel, updatedAt) {
    const timestamp = formatClock(updatedAt);

    if (previewIndex) previewIndex.textContent = `Index ${indexLabel}`;
    if (resultIndex) resultIndex.textContent = `Index ${indexLabel}`;
    if (resultTime) {
      resultTime.textContent = `${timestamp} 更新`;
      resultTime.dateTime = updatedAt.toISOString();
    }
    if (updateNotice) {
      updateNotice.textContent = `二维码已更新至 Index ${indexLabel}`;
      updateNotice.dataset.state = 'updated';
    }
    if (cameraState) cameraState.textContent = '检测到新二维码';

    scannerFrame?.classList.remove('has-update');
    scanUpdateFlash?.classList.remove('is-visible');
    void scannerFrame?.offsetWidth;
    scannerFrame?.classList.add('has-update');
    scanUpdateFlash?.classList.add('is-visible');

    if (flashTimer) window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      scannerFrame?.classList.remove('has-update');
      scanUpdateFlash?.classList.remove('is-visible');
      if (cameraState && scanning) cameraState.textContent = scanningStateLabel();
    }, 1400);

    if (navigator.vibrate) navigator.vibrate(70);
  }

  function setResult(value) {
    const normalized = value.trim();
    if (!normalized || normalized === lastDecodedValue) return;

    lastDecodedValue = normalized;
    decodedIndex += 1;

    const indexLabel = formatIndex(decodedIndex);
    const updatedAt = new Date();

    resultText.value = `Index ${indexLabel}｜${normalized}`;
    copyBtn.disabled = false;
    announceUpdate(indexLabel, updatedAt);

    if (isProbablyUrl(normalized)) {
      setStatus(`二维码内容已更新，当前有效标记为 Index ${indexLabel}。`, 'success');
    } else {
      setStatus(`已识别新的二维码内容，当前标记为 Index ${indexLabel}；内容不是网页链接。`, 'warning');
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
      copyBtn.disabled = !resultText.value.trim();

      if (updateNotice) {
        updateNotice.textContent = decodedIndex
          ? `继续监测二维码更新，当前为 Index ${formatIndex(decodedIndex)}`
          : '正在等待新的二维码';
        updateNotice.dataset.state = 'waiting';
      }

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

    if (decodedIndex) {
      setStatus(`已停止识别，最新结果 Index ${formatIndex(decodedIndex)} 已保留。`);
    } else {
      setStatus('已停止识别。');
    }
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
      setStatus('已复制带 Index 的结果。', 'success');
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
