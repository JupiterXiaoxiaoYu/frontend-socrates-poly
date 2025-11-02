import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number) => Promise<void>;
  balance?: number;
  isLoading?: boolean;
}

export function WithdrawDialog({ open, onOpenChange, onConfirm, balance = 0, isLoading = false }: WithdrawDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, "");
    // Only allow one decimal point
    const parts = sanitized.split(".");
    if (parts.length > 2) return;
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return;

    setAmount(sanitized);
    setError("");
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError("");
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
    setError("");
  };

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    if (numAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (numAmount < 1) {
      setError("Minimum withdrawal amount is 1 USDC");
      return;
    }

    if (numAmount > balance) {
      setError("Withdrawal amount exceeds available balance");
      return;
    }

    try {
      await onConfirm(numAmount);
      setAmount("");
      setError("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
          <DialogDescription>Withdraw USDC from your trading account</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Balance Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <div className="text-2xl font-bold">{balance.toFixed(2)} USDC</div>
            </div>
            <Button variant="link" size="sm" onClick={handleMaxAmount} disabled={isLoading} className="text-primary">
              Withdraw All
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg h-12 pr-16"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                USDC
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </div>
            )}
          </div>

          {/* Quick Amount */}
          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {[10, 50, 100, 500].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(value)}
                  disabled={isLoading || value > balance}
                  className="h-9"
                >
                  {value}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMaxAmount}
                disabled={isLoading || balance === 0}
                className="h-9"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <ul className="list-disc list-inside space-y-1">
                <li>Minimum withdrawal amount: 1 USDC</li>
                <li>Funds will be deducted from your account immediately</li>
                <li>Transaction requires signature confirmation</li>
                <li>Please ensure you have no pending orders</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !amount}
            className="min-w-[100px]"
            variant="destructive"
          >
            {isLoading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
