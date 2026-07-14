# singledeviceDFTFA

一个面向日常使用的前端二维码识别工具：

- 打开首页后，可按设备选择“手机扫码”或“电脑识别”。
- 手机端：使用摄像头快速扫描二维码。
- 电脑端：共享屏幕后识别画面中的二维码。
- 二维码内容发生变化时，移动端与 PC 端都会递增显示 Index。
- 识别结果正文默认折叠，可按需展开；复制按钮通过蓝、绿、橙三种状态提示是否待复制、已复制有效或二维码已经更新。
- 复制内容采用 `Index 001｜二维码内容` 格式。

当前网页版本：`v1.2.0`（2026-07-14）。

## 文件结构

```text
singledeviceDFTFA/
├── index.html
├── mobile.html
├── pc.html
├── assets/
│   ├── styles.css
│   ├── result-state.css
│   └── qr-scanner.js
└── .nojekyll
```

## 本地测试

推荐使用本地静态服务器测试：

```bash
cd singledeviceDFTFA
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

浏览器一般把 `localhost` 视为安全上下文，因此可用于测试摄像头、屏幕共享和剪贴板功能。正式使用建议部署到 HTTPS 环境。

## GitHub Pages 发布

1. 在 GitHub 新建仓库，仓库名填写：`singledeviceDFTFA`。
2. 上传本项目根目录下的全部文件。
3. 进入仓库 `Settings` → `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`，保存。
6. 等待 Pages 构建完成后，访问：

```text
https://你的GitHub用户名.github.io/singledeviceDFTFA/
```

## 注意事项

- 摄像头、屏幕共享和剪贴板写入依赖浏览器权限。
- PC 端屏幕共享 API 在部分移动浏览器中不可用。
- 二维码识别优先使用浏览器原生 `BarcodeDetector`；不支持时使用 `jsQR` CDN 作为 fallback。
- 识别过程在本地浏览器中完成，不包含任何后端上传逻辑。
