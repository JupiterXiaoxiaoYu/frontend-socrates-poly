import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Download, Upload, FileText, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { useMarket } from "../contexts";
import { fromUSDCPrecision, formatCurrency } from "../lib/calculations";
import { useToast } from "../hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  usdAmount: number;
  icon: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: string;
  date: string;
  status: "Completed" | "Failed" | "Pending";
}

const mockAssets: Asset[] = [
  {
    id: "1",
    name: "Tether USDT",
    symbol: "USDT",
    amount: 8335.4512,
    usdAmount: 125510.6721,
    icon: "🟢",
  },
  {
    id: "2",
    name: "USD Coin",
    symbol: "USDC",
    amount: 8335.4612,
    usdAmount: 125510.6721,
    icon: "🔵",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: "Deposit USDT",
    amount: "+8,335.4512 USDT",
    date: "2024-07-31 17:36:35",
    status: "Completed",
  },
  {
    id: 2,
    type: "Withdraw USDT",
    amount: "-8,335.4512 USDT",
    date: "2024-07-31 17:36:35",
    status: "Failed",
  },
  {
    id: 3,
    type: "Deposit USDT",
    amount: "+8,335.4512 USDT",
    date: "2024-07-31 17:36:35",
    status: "Pending",
  },
  {
    id: 4,
    type: "Deposit USDT",
    amount: "+8,335.4512 USDT",
    date: "2024-07-31 17:36:35",
    status: "Completed",
  },
  {
    id: 5,
    type: "Deposit USDT",
    amount: "+8,335.4512 USDT",
    date: "2024-07-31 17:36:35",
    status: "Completed",
  },
  {
    id: 6,
    type: "Deposit USDC",
    amount: "+1,000.0000 USDC",
    date: "2024-07-31 16:20:15",
    status: "Completed",
  },
  {
    id: 7,
    type: "Withdraw USDC",
    amount: "-500.0000 USDC",
    date: "2024-07-31 15:45:30",
    status: "Completed",
  },
  {
    id: 8,
    type: "Deposit USDT",
    amount: "+2,500.0000 USDT",
    date: "2024-07-31 14:12:45",
    status: "Completed",
  },
  {
    id: 9,
    type: "Deposit USDC",
    amount: "+750.0000 USDC",
    date: "2024-07-31 13:30:20",
    status: "Pending",
  },
  {
    id: 10,
    type: "Withdraw USDT",
    amount: "-1,200.0000 USDT",
    date: "2024-07-31 12:15:10",
    status: "Failed",
  },
];

const Wallet = () => {
  const { positions, playerId } = useMarket();
  const { toast } = useToast();
  const [hideBalance, setHideBalance] = useState(false);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedPid, setCopiedPid] = useState(false);
  const itemsPerPage = 6;

  // 计算 USDC 余额
  const usdcBalance = useMemo(() => {
    const usdcPosition = positions.find(p => p.tokenIdx === '0');
    return usdcPosition ? fromUSDCPrecision(usdcPosition.balance) : 0;
  }, [positions]);

  // 复制 Player ID
  const handleCopyPid = () => {
    if (!playerId) return;
    const pidString = `[${playerId[0]}, ${playerId[1]}]`;
    navigator.clipboard.writeText(pidString);
    setCopiedPid(true);
    toast({
      title: 'Copied!',
      description: 'Player ID copied to clipboard',
    });
    setTimeout(() => setCopiedPid(false), 2000);
  };

  // Pagination logic
  const totalPages = Math.ceil(mockTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = mockTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Wallet</h1>

        {/* Player ID Card */}
        {playerId && (
          <Card className="p-4 border border-border mb-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Player ID</div>
                <div className="font-mono text-sm text-foreground">
                  [{playerId[0]}, {playerId[1]}]
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPid}
                className="h-8"
              >
                {copiedPid ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Balance Card */}
        <Card className="p-6 border border-border mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">USDC Balance</span>
                <button 
                  onClick={() => setHideBalance(!hideBalance)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {hideBalance ? "****" : formatCurrency(usdcBalance, 4)}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-foreground text-background hover:bg-foreground/90"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs">Deposit</span>
              </Button>
              <Button 
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3 px-4"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Withdraw</span>
              </Button>
              <Button 
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3 px-4"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">History</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* My Assets */}
        <Card className="border border-border mb-6">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">My assets</h2>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideSmallBalances}
                  onChange={(e) => setHideSmallBalances(e.target.checked)}
                  className="rounded"
                />
                Hide small balances
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Token</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Operate</th>
                </tr>
              </thead>
              <tbody>
                {mockAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg">
                          {asset.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.amount.toLocaleString('en-US', { minimumFractionDigits: 4 })} {asset.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-sm font-semibold text-foreground">
                        ${asset.usdAmount.toLocaleString('en-US', { minimumFractionDigits: 4 })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="link" className="text-foreground h-auto p-0 text-sm">
                          Deposit
                        </Button>
                        <Button variant="link" className="text-foreground h-auto p-0 text-sm">
                          Withdraw
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Operate</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {transaction.type.includes('Deposit') ? (
                            <Download className="w-4 h-4 text-success" />
                          ) : (
                            <Upload className="w-4 h-4 text-danger" />
                          )}
                        </div>
                        <span className="text-sm text-foreground">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${
                        transaction.amount.startsWith('+') ? 'text-success' : 'text-danger'
                      }`}>
                        {transaction.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground">
                      {transaction.date}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={
                          transaction.status === "Completed" ? "default" :
                          transaction.status === "Failed" ? "destructive" :
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, mockTransactions.length)} of {mockTransactions.length} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Wallet;
