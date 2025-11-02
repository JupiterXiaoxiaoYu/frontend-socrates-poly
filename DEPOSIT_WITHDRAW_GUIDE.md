# Deposit & Withdraw 功能集成指南

## 概述

已成功集成 Deposit（充值）和 Withdraw（提现）功能到 Wallet 页面，用户可以通过弹窗进行 USDC 的充值和提现操作。

## 新增组件

### 1. DepositDialog 组件
**位置**: `src/components/DepositDialog.tsx`

**功能**:
- 显示当前 USDC 余额
- 输入充值金额（支持小数点后2位）
- 快捷金额按钮：10, 50, 100, 500 USDC
- 实时验证输入（最小充值金额：1 USDC）
- 显示充值规则和提示信息

**Props**:
```typescript
interface DepositDialogProps {
  open: boolean;              // 控制弹窗显示
  onOpenChange: (open: boolean) => void;  // 弹窗状态变化回调
  onConfirm: (amount: number) => Promise<void>;  // 确认充值回调
  balance?: number;           // 当前余额
  isLoading?: boolean;        // 加载状态
}
```

### 2. WithdrawDialog 组件
**位置**: `src/components/WithdrawDialog.tsx`

**功能**:
- 显示可用 USDC 余额
- 输入提现金额（支持小数点后2位）
- 快捷金额按钮：10, 50, 100, 500 USDC + 全部提现
- 实时验证输入（最小提现金额：1 USDC，不能超过余额）
- 显示提现规则和提示信息

**Props**:
```typescript
interface WithdrawDialogProps {
  open: boolean;              // 控制弹窗显示
  onOpenChange: (open: boolean) => void;  // 弹窗状态变化回调
  onConfirm: (amount: number) => Promise<void>;  // 确认提现回调
  balance?: number;           // 当前余额
  isLoading?: boolean;        // 加载状态
}
```

## MarketContext 更新

### 新增方法

#### deposit
```typescript
deposit: (amount: bigint) => Promise<void>
```
- **参数**: `amount` - 充值金额（精度格式：实际金额 × 100）
- **功能**: 调用 `playerClient.depositTo()` 进行充值
- **成功后**: 显示成功提示，刷新用户数据和市场数据
- **失败时**: 显示错误提示

#### withdraw
```typescript
withdraw: (amount: bigint) => Promise<void>
```
- **参数**: `amount` - 提现金额（精度格式：实际金额 × 100）
- **功能**: 调用 `playerClient.withdraw()` 进行提现
- **成功后**: 显示成功提示，刷新用户数据和市场数据
- **失败时**: 显示错误提示

## Wallet 页面集成

### 更新内容

1. **导入新组件**:
```typescript
import { DepositDialog } from "../components/DepositDialog";
import { WithdrawDialog } from "../components/WithdrawDialog";
```

2. **新增状态**:
```typescript
const [showDepositDialog, setShowDepositDialog] = useState(false);
const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
```

3. **从 Context 获取方法**:
```typescript
const { positions, playerId, apiClient, deposit, withdraw } = useMarket();
```

4. **处理函数**:
```typescript
// 处理充值
const handleDeposit = async (amount: number) => {
  setIsProcessing(true);
  try {
    // 转换为精度格式 (amount * 100)
    const amountWithPrecision = BigInt(Math.round(amount * 100));
    await deposit(amountWithPrecision);
  } finally {
    setIsProcessing(false);
  }
};

// 处理提现
const handleWithdraw = async (amount: number) => {
  setIsProcessing(true);
  try {
    // 转换为精度格式 (amount * 100)
    const amountWithPrecision = BigInt(Math.round(amount * 100));
    await withdraw(amountWithPrecision);
  } finally {
    setIsProcessing(false);
  }
};
```

5. **按钮集成**:
```typescript
<Button 
  onClick={() => setShowDepositDialog(true)}
  disabled={!playerId}
>
  <Download className="w-5 h-5" />
  <span className="text-xs">Deposit</span>
</Button>

<Button 
  onClick={() => setShowWithdrawDialog(true)}
  disabled={!playerId || usdcBalance === 0}
>
  <Upload className="w-5 h-5" />
  <span className="text-xs">Withdraw</span>
</Button>
```

6. **弹窗组件**:
```typescript
<DepositDialog
  open={showDepositDialog}
  onOpenChange={setShowDepositDialog}
  onConfirm={handleDeposit}
  balance={usdcBalance}
  isLoading={isProcessing}
/>

<WithdrawDialog
  open={showWithdrawDialog}
  onOpenChange={setShowWithdrawDialog}
  onConfirm={handleWithdraw}
  balance={usdcBalance}
  isLoading={isProcessing}
/>
```

## 使用流程

### 充值流程
1. 用户点击 "Deposit" 按钮
2. 打开充值弹窗，显示当前余额
3. 用户输入金额或点击快捷金额按钮
4. 系统验证金额（≥ 1 USDC）
5. 用户点击 "确认充值"
6. 调用 `deposit()` 方法，显示加载状态
7. 交易成功后显示成功提示，自动刷新余额
8. 关闭弹窗

### 提现流程
1. 用户点击 "Withdraw" 按钮
2. 打开提现弹窗，显示可用余额
3. 用户输入金额或点击快捷金额按钮（包括"全部"）
4. 系统验证金额（≥ 1 USDC 且 ≤ 余额）
5. 用户点击 "确认提现"
6. 调用 `withdraw()` 方法，显示加载状态
7. 交易成功后显示成功提示，自动刷新余额
8. 关闭弹窗

## 金额精度处理

系统使用 **2位小数精度**：
- **前端显示**: 实际金额（如 100.50 USDC）
- **后端存储**: 精度格式（如 10050，即 100.50 × 100）

**转换规则**:
```typescript
// 前端 → 后端
const amountWithPrecision = BigInt(Math.round(amount * 100));

// 后端 → 前端
const displayAmount = Number(amount) / 100;
```

## 验证规则

### 充值验证
- ✅ 金额必须为有效数字
- ✅ 金额必须 > 0
- ✅ 金额必须 ≥ 1 USDC
- ✅ 必须连接钱包（playerId 存在）

### 提现验证
- ✅ 金额必须为有效数字
- ✅ 金额必须 > 0
- ✅ 金额必须 ≥ 1 USDC
- ✅ 金额必须 ≤ 可用余额
- ✅ 必须连接钱包（playerId 存在）
- ✅ 余额必须 > 0

## 错误处理

所有错误都会通过 Toast 通知显示给用户：

**充值错误**:
- "Please connect wallet first" - 未连接钱包
- "请输入有效金额" - 输入无效
- "金额必须大于 0" - 金额为负数或零
- "最小充值金额为 1 USDC" - 金额小于最小值
- 其他 API 错误会显示具体错误信息

**提现错误**:
- "API not ready" - API 未初始化
- "请输入有效金额" - 输入无效
- "金额必须大于 0" - 金额为负数或零
- "最小提现金额为 1 USDC" - 金额小于最小值
- "提现金额超过可用余额" - 余额不足
- 其他 API 错误会显示具体错误信息

## UI/UX 特性

### 视觉反馈
- ✨ 输入框实时验证
- ✨ 错误信息即时显示
- ✨ 按钮禁用状态（未连接钱包、余额不足等）
- ✨ 加载状态指示器（"处理中..."）
- ✨ 成功/失败 Toast 通知

### 交互优化
- 🎯 快捷金额按钮，快速输入常用金额
- 🎯 "全部提现"按钮，一键提现所有余额
- 🎯 自动关闭弹窗（成功后）
- 🎯 ESC 键关闭弹窗
- 🎯 点击遮罩层关闭弹窗

### 信息展示
- 📊 当前余额实时显示
- 📊 充值/提现规则说明
- 📊 输入格式提示（USDC 单位）
- 📊 最小金额限制提示

## 测试建议

### 功能测试
1. ✅ 测试充值流程（正常金额）
2. ✅ 测试提现流程（正常金额）
3. ✅ 测试快捷金额按钮
4. ✅ 测试"全部提现"功能
5. ✅ 测试输入验证（无效输入、负数、超限等）
6. ✅ 测试未连接钱包状态
7. ✅ 测试余额不足状态
8. ✅ 测试加载状态
9. ✅ 测试错误处理
10. ✅ 测试成功后数据刷新

### UI 测试
1. ✅ 弹窗打开/关闭动画
2. ✅ 响应式布局（移动端）
3. ✅ 暗色/亮色主题适配
4. ✅ 按钮禁用状态样式
5. ✅ Toast 通知显示

## 后续优化建议

1. **交易历史记录**: 在 Wallet 页面显示充值/提现历史
2. **交易确认**: 添加二次确认弹窗（特别是大额提现）
3. **手续费显示**: 如果有手续费，在弹窗中显示
4. **交易状态追踪**: 显示交易进度和状态
5. **批量操作**: 支持批量充值/提现
6. **限额管理**: 添加每日/每月限额提示
7. **安全验证**: 添加额外的安全验证（如 2FA）

## 相关文件

- `src/components/DepositDialog.tsx` - 充值弹窗组件
- `src/components/WithdrawDialog.tsx` - 提现弹窗组件
- `src/contexts/MarketContext.tsx` - 市场上下文（包含 deposit/withdraw 方法）
- `src/pages/Wallet.tsx` - 钱包页面（集成充值/提现功能）
- `src/services/api.ts` - API 服务（depositTo/withdraw 方法）

## 技术栈

- **React**: 组件开发
- **TypeScript**: 类型安全
- **Shadcn/UI**: UI 组件库
- **Tailwind CSS**: 样式
- **zkWasm SDK**: 区块链交互

