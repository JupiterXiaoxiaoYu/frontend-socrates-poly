import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

const ReferralRules = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 主导航栏 */}
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 返回按钮和标题 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Rebate Reward Rules</h1>
        </div>
        <Card className="p-6 border border-border">
          {/* Overview */}
          <div className="mb-10">
            <p className="text-2xl font-bold text-foreground leading-relaxed whitespace-pre-wrap">
              Overview: Account levels range from S5 up to S0 (six levels in total), with S0 being the highest.
              Each level offers two-tier referral rewards, and the rebate rate varies by level. Rebates are
              calculated based on your own level. Example: If an S0 account invites A, the S0 account can
              earn up to 56% of A's trading fees on every trade. If A then invites B, the S0 account can
              additionally earn 14% of B's trading fees. Therefore, for an S0 account the Tier-1 cap is 56%,
              the Tier-2 cap is 14%, and the combined cap is 70%. If only A exists (no B), then only Tier-1
              rebates apply.
            </p>
          </div>

          {/* I. Terms & Roles */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">I. Terms &amp; Roles</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-foreground">
              <li>Trade Amount: Notional value of a single matched trade (denominated in USDT).</li>
              <li>Fee: Charged at 2%.</li>
              <li>Platform: The service provider that collects the fee.</li>
              <li>Public Pool: Ecosystem treasury; funded by "Pool Baseline + Market Surplus."</li>
              <li>Market: Allocation available for agent/broker rebate distribution.</li>
              <li>L1 (Direct): The account's direct referrer.</li>
              <li>L2 (Upline): The referrer of your L1.</li>
              <li>Level: S5 (entry) → S0 (highest); determines the account's total rebate cap.</li>
            </ul>
          </div>

          {/* II. Fee Rate & Macro Split (Fixed) */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">II. Fee Rate &amp; Macro Split (Fixed)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-foreground mb-4">
              <li>Trading Fee: 2% (After the handling fee is allocated to the Maker, it will be included in the commission distribution mechanism for this round.)</li>
              <li>Allocation: Platform 20% | Market 70% | Public Pool Baseline 10%</li>
              <li>Example (10,000 USDT volume):</li>
            </ol>
            <ul className="list-disc pl-12 space-y-2 text-sm text-foreground mb-4">
              <li>Fee = 200</li>
              <li>Platform: 40 (20%)</li>
              <li>Public Pool Baseline: 20 (10%)</li>
              <li>Market (max distributable): 140 (70%)</li>
            </ul>
            <p className="text-sm text-muted-foreground pl-6">
              * Note: Fixed inflow to the Public Pool = Baseline 10% + any undistributed remainder from the Market allocation.
            </p>
          </div>

          {/* III. Fee Rebate Caps by Level */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              III. Fee Rebate Caps by Level
            </h2>
            <p className="text-sm text-foreground mb-4">(Example uses 10,000 USDT volume → 200 USDT fees)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">Level</th>
                    <th className="text-left p-3 font-bold text-foreground">Total Rebate Cap</th>
                    <th className="text-left p-3 font-bold text-foreground">L1 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">L1 Amount</th>
                    <th className="text-left p-3 font-bold text-foreground">L2 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">L2 Amount</th>
                    <th className="text-left p-3 font-bold text-foreground">Market Distributed</th>
                    <th className="text-left p-3 font-bold text-foreground">Public Pool Final Inflow</th>
                    <th className="text-left p-3 font-bold text-foreground">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">112</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">28</td>
                    <td className="p-3">140</td>
                    <td className="p-3">20</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">96</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">24</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">80</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">20</td>
                    <td className="p-3">100</td>
                    <td className="p-3">60</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">64</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">16</td>
                    <td className="p-3">80</td>
                    <td className="p-3">80</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">48</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">12</td>
                    <td className="p-3">60</td>
                    <td className="p-3">100</td>
                    <td className="p-3">40</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">32</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">8</td>
                    <td className="p-3">40</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* IV. SOC Token Rebate Caps by Level */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              IV. SOC Token Rebate Caps by Level
            </h2>
            <p className="text-sm text-foreground mb-4">
              (Example: 10,000 USDT volume → 1,000 SOC minted; user keeps 800 SOC as base reward; 200 SOC to allocate)
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">Level</th>
                    <th className="text-left p-3 font-bold text-foreground">Total Rebate Cap</th>
                    <th className="text-left p-3 font-bold text-foreground">User Base Reward (SOC)</th>
                    <th className="text-left p-3 font-bold text-foreground">L1 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">L1 Amount (SOC)</th>
                    <th className="text-left p-3 font-bold text-foreground">L2 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">L2 Amount (SOC)</th>
                    <th className="text-left p-3 font-bold text-foreground">Market Distributed (SOC)</th>
                    <th className="text-left p-3 font-bold text-foreground">Public Pool Final Inflow (SOC)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">112</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">28</td>
                    <td className="p-3">140</td>
                    <td className="p-3">50% / 80</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">96</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">24</td>
                    <td className="p-3">120</td>
                    <td className="p-3">40% / 80</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">80</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">20</td>
                    <td className="p-3">100</td>
                    <td className="p-3">50% / 100</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">64</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">16</td>
                    <td className="p-3">80</td>
                    <td className="p-3">60% / 120</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">48</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">12</td>
                    <td className="p-3">60</td>
                    <td className="p-3">70% / 140</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">800</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">32</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">8</td>
                    <td className="p-3">40</td>
                    <td className="p-3">80% / 160</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* V. Upgrade Thresholds & Downgrade Rules */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              V. Upgrade Thresholds &amp; Downgrade Rules
            </h2>
            <p className="text-sm text-foreground mb-4">
              Trading volume and tier will be reset and recalculated each calendar month.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-bold text-foreground">Level</th>
                    <th className="text-left p-3 font-bold text-foreground">Total Rebate Cap</th>
                    <th className="text-left p-3 font-bold text-foreground">L1 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">L2 Cap %</th>
                    <th className="text-left p-3 font-bold text-foreground">Upgrade Criterion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S0</td>
                    <td className="p-3">70%</td>
                    <td className="p-3">56%</td>
                    <td className="p-3">14%</td>
                    <td className="p-3">Cumulative ≥ 1,000,000</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S1</td>
                    <td className="p-3">60%</td>
                    <td className="p-3">48%</td>
                    <td className="p-3">12%</td>
                    <td className="p-3">Cumulative ≥ 500,000</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S2</td>
                    <td className="p-3">50%</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">10%</td>
                    <td className="p-3">Cumulative ≥ 200,000</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S3</td>
                    <td className="p-3">40%</td>
                    <td className="p-3">32%</td>
                    <td className="p-3">8%</td>
                    <td className="p-3">Cumulative ≥ 50,000</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S4</td>
                    <td className="p-3">30%</td>
                    <td className="p-3">24%</td>
                    <td className="p-3">6%</td>
                    <td className="p-3">Cumulative ≥ 10,000</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">S5</td>
                    <td className="p-3">20%</td>
                    <td className="p-3">16%</td>
                    <td className="p-3">4%</td>
                    <td className="p-3">Register + complete first valid trade</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ReferralRules;

