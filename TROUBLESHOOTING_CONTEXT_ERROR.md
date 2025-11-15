# Context 错误排查指南

## 错误信息
```
Uncaught Error: useMarket must be used within a MarketProvider
```

## 可能的原因和解决方案

### 1. 热重载问题（最常见）⭐

**症状**: 修改代码后出现此错误

**解决方案**:
```bash
# 完全重启开发服务器
1. 停止当前服务器 (Ctrl+C)
2. 清除缓存
   rm -rf node_modules/.vite
3. 重新启动
   npm run dev
```

或者直接在浏览器中**硬刷新**:
- Windows/Linux: `Ctrl + Shift + R` 或 `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 2. Provider 顺序问题

检查 `src/App.tsx` 中的 Provider 嵌套顺序是否正确：

```typescript
<WalletProvider>
  <PredictionMarketProvider>
    <QueryClientProvider>
      <BrowserRouter>
        <SoundProvider>
          <MarketProvider>  {/* ✅ MarketProvider 必须在这里 */}
            <TooltipProvider>
              <Routes>
                <Route path="/market/:id" element={<MarketDetail />} />
              </Routes>
            </TooltipProvider>
          </MarketProvider>
        </SoundProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </PredictionMarketProvider>
</WalletProvider>
```

### 3. 循环依赖问题

检查是否有循环导入：

```typescript
// ❌ 错误：MarketContext 内部使用 useMarket
export const MarketProvider = () => {
  const market = useMarket(); // ❌ 不能在 Provider 内部使用自己的 hook
  // ...
}

// ✅ 正确：只在子组件中使用
export const SomeComponent = () => {
  const market = useMarket(); // ✅ 在 Provider 外部使用
  // ...
}
```

### 4. 导出/导入问题

确保正确导出和导入：

**`src/contexts/MarketContext.tsx`**:
```typescript
export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ...
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
};
```

**`src/contexts/index.ts`**:
```typescript
export { MarketProvider, useMarket } from "./MarketContext";
```

**使用时**:
```typescript
import { useMarket } from "@/contexts/MarketContext";
// 或
import { useMarket } from "@/contexts";
```

### 5. TypeScript 类型问题

如果使用 TypeScript，确保类型定义正确：

```typescript
const MarketContext = createContext<MarketContextType | undefined>(undefined);
// ✅ 注意这里是 undefined，不是 null
```

### 6. React 严格模式问题

如果在 `main.tsx` 中使用了 `<StrictMode>`，可能会导致组件渲染两次：

```typescript
// 临时测试：移除 StrictMode
createRoot(document.getElementById("root")!).render(
  // <StrictMode>  // 注释掉这行
    <App />
  // </StrictMode>
);
```

**注意**: 这只是用于测试，不建议在生产环境移除 StrictMode

## 快速修复步骤

### 步骤 1: 清除缓存并重启

```bash
# 停止服务器
Ctrl + C

# 清除 Vite 缓存
rm -rf node_modules/.vite

# 重启
npm run dev
```

### 步骤 2: 硬刷新浏览器

- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 步骤 3: 检查控制台

打开浏览器开发者工具，查看是否有其他错误信息

### 步骤 4: 检查 Provider 结构

确认 `App.tsx` 中的 Provider 嵌套正确

## 验证修复

修复后，检查以下内容：

1. ✅ 页面正常加载，没有错误
2. ✅ 可以正常使用 `useMarket()` hook
3. ✅ 市场数据正常显示
4. ✅ 订单簿数据正常加载

## 仍然有问题？

如果以上方法都不行，尝试：

### 完全重新安装依赖

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重启
npm run dev
```

### 检查 React 版本

确保 React 版本兼容：

```bash
npm list react react-dom
```

应该都是 `^18.x.x` 版本

### 检查是否有多个 React 实例

```bash
npm ls react
```

如果看到多个版本，需要解决依赖冲突

## 相关文件

- `src/App.tsx` - Provider 结构
- `src/contexts/MarketContext.tsx` - Context 定义
- `src/contexts/index.ts` - Context 导出
- `src/pages/MarketDetail.tsx` - 使用 Context 的组件

## 最后更新

- **日期**: 2025-11-15
- **版本**: v1.0

