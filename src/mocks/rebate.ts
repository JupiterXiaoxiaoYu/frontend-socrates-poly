// 基于新设计稿(节点 14413:14927)的展示需求，提供更丰富的列表 mock 数据
// 包含头像、昵称、时间、金额、币种、比例、状态等

export type MockRebateStatus = "pending" | "claimed";
export type MockRebateType = "fee" | "mining";

export interface MockRebateListItem {
  id: string;
  avatar: string;
  userName: string;
  timestamp: string; // ISO or formatted string
  amount: string; // 格式化后的字符串，如 "12.345678"
  currency: "USDT" | "SOC";
  ratio: string; // 如 "36%"
  status: MockRebateStatus;
  tierLevel?: number | null; // 1 or 2
  fromUserId?: number | null;
}

const avatars = [
  "/placeholder.svg",
  "/gift.png",
  "/referral.png",
  "/figma/rebate-mobile.png", // 仅用于开发预览
];

function pickAvatar(i: number): string {
  return avatars[i % avatars.length];
}

function nowOffset(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function getMockMiningList(count = 12): MockRebateListItem[] {
  const items: MockRebateListItem[] = [];
  for (let i = 0; i < count; i++) {
    const tier = i % 2 === 0 ? 1 : 2;
    const ratio = tier === 1 ? "36%" : "10%";
    const amount = (Math.random() * 5 + 0.1).toFixed(6);
    items.push({
      id: `min-${i + 1}`,
      avatar: pickAvatar(i),
      userName: `User_${1000 + i}`,
      timestamp: nowOffset(i * 7 + 3),
      amount,
      currency: "SOC",
      ratio,
      status: i % 4 === 0 ? "claimed" : "pending",
      tierLevel: tier,
      fromUserId: 2000 + i,
    });
  }
  return items;
}

export function getMockFeeList(count = 10): MockRebateListItem[] {
  const items: MockRebateListItem[] = [];
  for (let i = 0; i < count; i++) {
    const tier = i % 2 === 0 ? 1 : 2;
    const ratio = tier === 1 ? "40%" : "9%";
    const amount = (Math.random() * 8 + 0.2).toFixed(6);
    items.push({
      id: `fee-${i + 1}`,
      avatar: pickAvatar(i + 1),
      userName: `User_${2100 + i}`,
      timestamp: nowOffset(i * 11 + 5),
      amount,
      currency: "USDT",
      ratio,
      status: i % 3 === 0 ? "claimed" : "pending",
      tierLevel: tier,
      fromUserId: 3000 + i,
    });
  }
  return items;
}
