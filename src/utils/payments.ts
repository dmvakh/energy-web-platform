export function formatMoney(amount: number, currency: string = "ILS"): string {
  return new Intl.NumberFormat("en-EN", {
    style: "currency",
    currency,
  }).format(amount);
}
