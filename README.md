# singledeviceDFTFA

一个纯前端二维码识别项目：

- 默认入口：选择移动端或 PC 端。
- 移动端：调用摄像头扫描二维码。
- PC 端：调用屏幕共享 API，识别共享画面中的二维码。
- 识别后：显示二维码内容，并提供按钮复制。

## 文件结构

```text
singledeviceDFTFA/
├── index.html
├── mobile.html
├── pc.html
├── assets/
│   ├── styles.css
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
