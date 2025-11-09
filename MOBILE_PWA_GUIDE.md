### Socrates 前端移动端 PWA 适配与打包指南

本指南说明如何在 iOS 与 Android 上以 PWA 形态安装与运行本前端（Vite + React）。已完成以下集成：

- VitePWA 插件集成与 manifest 注入（`vite.config.ts`）
- Service Worker 注册（`src/main.tsx`）
- iOS/Android PWA 必要的 `<meta>` 与图标占位（`index.html`）
- Workbox 运行时缓存（静态资源、Google Fonts、CDN、API）
- 构建与资源生成功能脚本（`package.json`）


### 1. 生成 PWA 图标与资源

- 推荐使用已安装的 `@vite-pwa/assets-generator`：

```bash
npm run pwa:assets
```

- 默认以 `public/placeholder.svg` 作为源，输出到 `public/`：
  - `pwa-192x192.png`、`pwa-512x512.png`、`pwa-512x512-maskable.png`
  - `apple-touch-icon.png`、`favicon.ico`（如未存在则生成）

如需自定义品牌图标，将源文件替换为透明背景的 `SVG/PNG`（建议 1024×1024），并修改脚本：

```bash
pwa-assets-generator -i public/<your-logo>.svg -o public
```


### 2. 本地开发与构建

- 开发（带 SW 模拟支持）
```bash
npm run dev
```

- 生产构建（会注入 manifest 与生成 Service Worker）
```bash
npm run build:pwa
```

- 本地预览生产构建
```bash
npm run preview:pwa
```

构建产物在 `dist/`，部署到任意静态托管（例如 Vercel）。项目已包含 `vercel.json`。


### 3. iOS 安装与适配说明

- iOS 受支持的浏览器中，Safari 支持“添加到主屏幕”：
  1. 使用 Safari 打开部署地址
  2. 点击分享按钮 → 选择“添加到主屏幕”
  3. 打开的 App 将以独立窗口运行（`display: standalone`）

- 已在 `index.html` 添加：
  - `apple-mobile-web-app-capable=yes`
  - `apple-mobile-web-app-status-bar-style=black-translucent`
  - `apple-touch-icon=/apple-touch-icon.png`
  - `viewport-fit=cover`（配合安全区域）

- 如需兼容 iPhone 刘海屏安全区域，可在全局样式中使用：
```css
:root {
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
  --safe-left: env(safe-area-inset-left);
  --safe-right: env(safe-area-inset-right);
}

body {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
}
```
（Tailwind 项目亦可通过自定义类封装或容器内局部使用。）


### 4. Android 安装与适配说明

- Chrome/Edge/Brave 等会在满足 PWA 条件时提示安装（或菜单中“安装 App”）。
- 安装后会以独立窗口运行，图标与名称来自 Web App Manifest。


### 5. 缓存策略（Workbox）

已在 `vite.config.ts` 配置：
- `static-assets`：应用内部静态资源（`/assets/`）采用 `StaleWhileRevalidate`
- `google-fonts`：Google Fonts 采用 `CacheFirst`
- `cdn-assets`：常见 CDN 采用 `CacheFirst`
- `api-cache`：`/api` 及包含 `socrates`/`oracle` 的主机名采用 `NetworkFirst`

可根据后端域名或路径再做细化。更新策略：构建时 `registerType: 'autoUpdate'`，客户端刷新或切换页面会自动拉取新 SW。


### 6. 常见问题

- 首次访问离线：需要至少一次成功在线访问以填充缓存。
- iOS 图标不显示/失真：请确保 `apple-touch-icon.png` 为 PNG 且≥180×180。
- 主题色与状态栏：调整 `index.html` 中 `<meta name="theme-color">` 与 `apple-mobile-web-app-status-bar-style`。
- 无安装提示（Android）：检查是否通过 HTTPS 部署、包含有效 manifest、图标尺寸是否齐全。


### 7. 清单（Manifest）与元信息位置

- Manifest 由 `vite-plugin-pwa` 生成并注入（见 `vite.config.ts` 的 `VitePWA({ manifest })`）。
- 头部元信息与 iOS 兼容性标签在 `index.html`。


### 8. 回归测试清单

- 首屏加载正常、切换路由无白屏
- 断网后访问历史页面（含静态资源）可正常回退显示
- 字体/图标资源可离线读（Google Fonts/CDN）
- API 网络恢复后数据自动刷新（NetworkFirst 回源）
- iOS/Android 安装并以独立窗口运行
- App 图标、名称、启动画面（由系统生成）符合品牌


### 9. 变更摘要

- `vite.config.ts`：引入 `vite-plugin-pwa`，配置 `manifest` 与 `workbox.runtimeCaching`
- `src/main.tsx`：注册 SW（`virtual:pwa-register`）
- `index.html`：增加 PWA 必要 `<meta>` 与 `apple-touch-icon`
- `package.json`：新增脚本 `build:pwa`、`preview:pwa`、`pwa:assets`


