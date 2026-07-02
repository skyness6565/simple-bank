export function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function formatAccountNumber(n: string): string {
  return `•••• ${n.slice(-4)}`;
}

export function formatFullAccountNumber(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatCardNumber(n: string): string {
  return n.replace(/(.{4})/g, "$1 ").trim();
}

export function maskCardNumber(n: string): string {
  return `•••• •••• •••• ${n.slice(-4)}`;
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
