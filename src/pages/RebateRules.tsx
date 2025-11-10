import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";

const RebateRules = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 标题栏 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Mining Reward Rules</h1>
        </div>

        {/* 规则内容 */}
        <Card className="p-6 border border-border">
          <div className="space-y-[60px] text-foreground">
            {/* 基本规则 */}
            <div className="space-y-9">
              <div>
                <h2 className="text-base font-medium mb-3">Basic Rules</h2>
              </div>

              {/* 行为分类 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Behavior Classification</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>Maker Volume: Refers to the transaction amount generated when a user acts as a maker, with orders matched through limit orders.</li>
                  <li>Taker Volume: Refers to the transaction amount generated when a user actively takes liquidity from the order book.</li>
                </ul>
              </div>

              {/* 积分发放条件 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Point Distribution Conditions</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>Users must have both valid Maker and Taker volumes within a reward cycle (e.g., daily or weekly) to qualify for point calculation.</li>
                  <li>If only one-sided behavior exists (only Maker or only Taker), no point rewards will be distributed.</li>
                </ul>
              </div>

              {/* 积分奖励计算方式 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Point Reward Calculation Method</h3>
                <ul className="list-disc ml-5 space-y-2 text-sm text-muted-foreground">
                  <li>The system separately tracks all users' Maker and Taker volumes during the cycle.</li>
                  <li>Calculate each user's volume proportion in both behavior categories and multiply by the corresponding Maker or Taker point pool.</li>
                  <li>The final points earned will be the smaller value of the two results.</li>
                </ul>
              </div>

              {/* 积分的用途 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Use of Points</h3>
                <ul className="list-disc ml-5 text-sm text-muted-foreground">
                  <li>Can be exchanged for platform tokens in the future, stay tuned</li>
                </ul>
              </div>
            </div>

            {/* 积分算法公式 & 计算步骤详解 */}
            <div className="space-y-9">
              <div>
                <h2 className="text-base font-medium mb-3">Point Algorithm Formula & Calculation Details</h2>
              </div>

              {/* 数据定义 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Data Definition</h3>
                <ul className="list-disc ml-[18px] space-y-0 text-xs text-muted-foreground leading-4">
                  <li>V<sub>maker</sub>(u): User u's maker volume during the statistical period</li>
                  <li>V<sub>taker</sub>(u): User u's taker volume during the statistical period</li>
                  <li>∑V<sub>maker</sub>(i): Sum of all eligible users' Maker volumes</li>
                  <li>∑V<sub>taker</sub>(i): Sum of all eligible users' Taker volumes</li>
                  <li>A: Total points allocated for Maker volume in this period (Maker reward pool)</li>
                  <li>B: Total points allocated for Taker volume in this period (Taker reward pool)</li>
                </ul>
              </div>

              {/* 按比例计算每位用户的 Maker 积分 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Calculate Each User's Maker Points Proportionally</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R<sub>maker</sub>(u) = (V<sub>maker</sub>(u) / ∑V<sub>maker</sub>(i)) × A
                  </p>
                </div>
                <div className="pl-3 space-y-3">
                  <p className="text-xs text-foreground">Explanation:</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>User's Maker volume proportion × Total reward pool A</li>
                    <li>If you account for 5% of all users' Maker volume, you get 5% of the Maker point pool</li>
                  </ul>
                  <p className="text-xs text-foreground">Notes:</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>Only users who meet the "both Maker and Taker volume" requirement are calculated</li>
                    <li>Otherwise, the user will not participate in the distribution of point pool A</li>
                  </ul>
                </div>
              </div>

              {/* 按比例计算每位用户的 Taker 积分 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Calculate Each User's Taker Points Proportionally</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R<sub>taker</sub>(u) = (V<sub>taker</sub>(u) / ∑V<sub>taker</sub>(i)) × B
                  </p>
                </div>
                <div className="pl-3 space-y-3">
                  <p className="text-xs text-foreground">Explanation:</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>User's Taker volume proportion × Total reward pool B</li>
                    <li>Similarly, only eligible users are considered</li>
                  </ul>
                  <p className="text-xs text-foreground">Notes:</p>
                  <ul className="list-disc ml-[18px] space-y-2 text-xs text-muted-foreground leading-4">
                    <li>Users who only perform Taker behavior without Maker behavior will have 0 points despite having transactions</li>
                    <li>This is to prevent arbitrage by only accumulating Taker volume</li>
                  </ul>
                </div>
              </div>

              {/* 最终积分为两者中的较小值 */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-medium leading-[22px]">Final Points is the Smaller of the Two</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-mono text-foreground">
                    R(u) = min(R<sub>maker</sub>(u), R<sub>taker</sub>(u))
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default RebateRules;

