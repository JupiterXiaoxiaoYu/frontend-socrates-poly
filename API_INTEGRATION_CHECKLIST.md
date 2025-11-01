# API 集成检查清单

## 已完成的集成 ✅

1. ✅ 创建了类型定义 (`src/types/api.ts`)
2. ✅ 创建了 zkWASM API 客户端 (`src/services/api.ts`)
3. ✅ 创建了 MarketContext 实现数据轮询 (`src/contexts/MarketContext.tsx`)
4. ✅ 创建了计算工具函数 (`src/lib/calculations.ts`)
5. ✅ 更新了 Index 页面使用真实 API 数据
6. ✅ 市场倒序排列（最新在前）

---

## 如何测试

### 1. 启动后端服务

```bash
cd backend/socrates-prediction-mkt/ts
npm run start
```

后端应该监听在 `http://localhost:3000`

### 2. 启动前端

```bash
cd frontend
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:5173`

### 4. 检查控制台日志

打开浏览器开发者工具 (F12)，应该看到：

```
Loading initial data...
Loaded markets: X
Loaded global state, counter: XXX
```

### 5. 检查市场显示

- 如果后端有市场数据，应该显示市场列表
- 如果没有数据，应该显示 "No markets found"
- 每 5 秒会自动刷新数据

---

## 如果看不到数据，检查以下几点：

### 1. 后端是否运行？

```bash
curl http://localhost:3000/data/markets
```

应该返回：
```json
{
  "success": true,
  "data": [...]
}
```

### 2. CORS 是否配置？

如果前端和后端在不同端口，确保后端允许 CORS。

### 3. 检查浏览器控制台

看是否有以下错误：
- Network error (网络请求失败)
- CORS error (跨域错误)
- Failed to fetch (无法连接到后端)

### 4. 检查环境变量

创建 `frontend/.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 5. 检查 MarketContext 是否正确挂载

在 `src/pages/Index.tsx` 添加调试日志：

```typescript
const Index = () => {
  const { markets, isLoading } = useMarket();
  
  console.log('Index page - markets:', markets);
  console.log('Index page - isLoading:', isLoading);
  
  // ... rest of component
}
```

---

## 当前数据流

```
页面加载
  ↓
MarketProvider 初始化
  ↓
useEffect 触发（立即）
  ↓
loadInitialData()
  ↓
refreshData()
  ↓
apiClient.getMarkets()
  ↓
fetch('http://localhost:3000/data/markets')
  ↓
setMarkets(data)
  ↓
Index 页面重新渲染
  ↓
显示市场列表（倒序排列）
  ↓
每 5 秒重复 refreshData()
```

---

## 如果需要创建测试市场

如果后端没有市场数据，需要用 Admin 账户创建市场：

```typescript
// 使用后端的 test.ts 脚本
cd backend/socrates-prediction-mkt/ts
node dist/test.js
```

或者手动创建：

```typescript
import { createAdminClient } from './backend/socrates-prediction-mkt/ts/src/api';

const admin = createAdminClient(adminKey, 'http://localhost:3000');

// 推进时间
await admin.tick();

// 创建市场
await admin.createMarket({
  assetId: 1n,              // BTC
  startTick: 100n,
  endTick: 136n,            // 3 分钟窗口
  oracleStartTime: BigInt(Math.floor(Date.now() / 1000)),
  oracleStartPrice: 4350000n, // $43,500.00
});
```

---

## 下一步

如果能看到市场列表了，接下来可以：

1. 测试连接钱包
2. 测试玩家注册
3. 测试下单功能
4. 集成市场详情页
5. 集成持仓页面

---

## 常见问题

### Q: 页面一直显示 "Loading markets..."
**A**: 检查后端是否运行，检查控制台是否有错误

### Q: 显示 "No markets found"
**A**: 后端没有市场数据，需要用 Admin 创建市场

### Q: 控制台显示 CORS 错误
**A**: 后端需要配置 CORS 允许前端域名

### Q: 市场数据不更新
**A**: 检查是否每 5 秒都在调用 API（看 Network 标签）

