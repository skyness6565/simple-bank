import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/banking-format";
import type { Transaction } from "@/lib/banking.functions";

export function ReceiptDialog({
  transaction,
  open,
  onOpenChange,
  title = "Transaction receipt",
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
}) {
  if (!transaction) return null;
  const rows: Array<[string, string | null]> = [
    ["Reference", transaction.reference ?? "—"],
    ["Date", formatDate(transaction.created_at)],
    ["Type", labelForCategory(transaction.category)],
    ["Description", transaction.description ?? "—"],
    ["Recipient", transaction.recipient_name],
    ["Bank", transaction.recipient_bank],
    ["Account / IBAN", transaction.recipient_account],
    ["SWIFT / BIC", transaction.recipient_swift],
    ["Country", transaction.recipient_country],
    ["Routing #", transaction.recipient_routing],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:shadow-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div id="receipt-print" className="space-y-4">
          <div className="flex flex-col items-center gap-2 rounded-lg bg-emerald-50 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="text-sm text-emerald-700">Transaction successful</p>
            <p className="text-3xl font-semibold text-emerald-900">{formatCurrency(transaction.amount)}</p>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {rows
              .filter(([, v]) => v && v !== "—")
              .map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium">{v}</span>
                </div>
              ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Northline Bank · Thank you for banking with us
          </p>
        </div>
        <DialogFooter className="gap-2 print:hidden">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function labelForCategory(c: string) {
  switch (c) {
    case "internal":
      return "Internal transfer";
    case "local":
      return "Local transfer";
    case "international":
      return "International transfer";
    default:
      return c;
  }
}
