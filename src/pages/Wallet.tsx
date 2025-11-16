import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Download, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMarket } from "../contexts";
import { formatCurrency, fromUSDCPrecision } from "../lib/calculations";
import { useToast } from "../hooks/use-toast";
import { DepositDialog } from "../components/DepositDialog";
import { WithdrawDialog } from "../components/WithdrawDialog";

// Transaction row shape for display is computed inline; no separate interface needed

const Wallet = () => {
  const { t } = useTranslation("wallet");
  const { playerId, apiClient, deposit, withdraw, balance } = useMarket();
  const usdcBalance = balance?.available ?? 0;
  const { toast } = useToast();
  const [hideBalance, setHideBalance] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 6;

  // 加载财务活动
  useEffect(() => {
    if (!playerId || !apiClient) return;

    const loadTransactions = async () => {
      try {
        const data = await apiClient.getFinancialActivity(playerId, 50);
        setTransactions(data);
      } catch (error) {
        // Silently handle error
      }
    };

    loadTransactions();

    // 每 10 秒刷新一次
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, [playerId, apiClient]);

  // 转换交易数据
  const displayTransactions = useMemo(() => {
    return transactions.map((tx) => {
      let type = "";
      let amount = "";
      let status: "Completed" | "Failed" | "Pending" = "Completed";

      if (tx.type === "deposit") {
        type = t("depositUSDCType");
        amount = `+${fromUSDCPrecision(tx.amount).toFixed(4)} USDC`;
      } else if (tx.type === "withdrawal") {
        type = t("withdrawUSDCType");
        amount = `-${fromUSDCPrecision(tx.amount).toFixed(4)} USDC`;
      } else if (tx.type === "claim") {
        type = `${t("claimFromMarket")} #${tx.marketId}`;
        amount = `+${fromUSDCPrecision(tx.totalClaimed).toFixed(4)} USDC`;
      }

      return {
        id: tx.timestamp,
        type,
        amount,
        date: new Date(tx.timestamp).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        status,
      };
    });
  }, [transactions, t]);

  // Pagination logic
  const totalPages = Math.ceil(displayTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = displayTransactions.slice(startIndex, endIndex);

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

  // Handle deposit
  const handleDeposit = async (amount: number) => {
    setIsProcessing(true);
    try {
      // Convert to precision format (amount * 100)
      const amountWithPrecision = BigInt(Math.round(amount * 100));
      await deposit(amountWithPrecision);
      // 余额会在 deposit 内部自动刷新
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async (amount: number) => {
    setIsProcessing(true);
    try {
      // Convert to precision format (amount * 100)
      const amountWithPrecision = BigInt(Math.round(amount * 100));
      await withdraw(amountWithPrecision);
      // 余额会在 withdraw 内部自动刷新
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-foreground">{t("title")}</h1>

        {/* Balance Card */}
        <Card className="p-4 md:p-6 border border-border mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs md:text-sm text-muted-foreground">{t("usdcBalance")}</span>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {hideBalance ? <EyeOff className="w-3 h-3 md:w-4 md:h-4" /> : <Eye className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                {hideBalance ? "****" : formatCurrency(usdcBalance, 2)}
              </div>
            </div>

            <div className="flex gap-2 md:gap-3">
              <Button
                className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 px-3 md:py-3 md:px-4 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setShowDepositDialog(true)}
                disabled={!playerId}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs">{t("deposit")}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-0.5 md:gap-1 h-auto py-2 px-3 md:py-3 md:px-4"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={!playerId || usdcBalance === 0}
              >
                <Upload className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs">{t("withdraw")}</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">{t("recentTransactions")}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("type")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("amount")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("date")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("operate")}</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      {t("noTransactionHistory")}
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((transaction: any) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {transaction.type.includes("Deposit") ? (
                              <Download className="w-4 h-4 text-success" />
                            ) : (
                              <Upload className="w-4 h-4 text-danger" />
                            )}
                          </div>
                          <span className="text-sm text-foreground">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-medium ${
                            transaction.amount.startsWith("+") ? "text-success" : "text-danger"
                          }`}
                        >
                          {transaction.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-foreground">{transaction.date}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant={
                            transaction.status === "Completed"
                              ? "default"
                              : transaction.status === "Failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {transaction.status === "Completed"
                            ? t("completed")
                            : transaction.status === "Failed"
                            ? t("failed")
                            : t("pending")}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t("showing")} {startIndex + 1} {t("to")} {Math.min(endIndex, displayTransactions.length)} {t("of")}{" "}
                  {displayTransactions.length} {t("transactions")}
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

      {/* Deposit Dialog */}
      <DepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        onConfirm={handleDeposit}
        balance={usdcBalance}
        isLoading={isProcessing}
      />

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        onConfirm={handleWithdraw}
        balance={usdcBalance}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default Wallet;
