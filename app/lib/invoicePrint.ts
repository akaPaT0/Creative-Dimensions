type PrintableInvoice = {
  orderNumber: string;
  invoiceNumber: string;
  issuedAt: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  customerEmail?: string;
  addressLines: string[];
  items: Array<{
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
  }>;
  subtotalUSD: number;
  discountUSD: number;
  shippingUSD: number;
  totalUSD: number;
};

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function dateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function printInvoice(invoice: PrintableInvoice) {
  if (typeof window === "undefined") return;

  const itemsRows = invoice.items
    .map(
      (item) => `
        <tr>
          <td>${esc(item.name)}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${money(item.unitPriceUSD)}</td>
          <td style="text-align:right">${money(item.lineTotalUSD)}</td>
        </tr>
      `
    )
    .join("");

  const addressHtml = invoice.addressLines
    .filter(Boolean)
    .map((line) => `<div>${esc(line)}</div>`)
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${esc(invoice.invoiceNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .muted { color: #555; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; font-size: 13px; }
          th { text-align: left; background: #f7f7f7; }
          .totals { margin-top: 12px; width: 320px; margin-left: auto; }
          .totals div { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
          .totals .final { font-size: 16px; font-weight: 700; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Creative Dimensions Invoice</h1>
        <div class="muted">Invoice ${esc(invoice.invoiceNumber)} | Order ${esc(invoice.orderNumber)}</div>
        <div class="grid">
          <div class="card">
            <div><strong>Customer</strong></div>
            <div>${esc(invoice.customerName || "Customer")}</div>
            <div class="muted">${esc(invoice.customerEmail || "")}</div>
            <div style="margin-top:8px"><strong>Shipping Address</strong></div>
            ${addressHtml || "<div class='muted'>N/A</div>"}
          </div>
          <div class="card">
            <div><strong>Issued</strong>: ${esc(dateTime(invoice.issuedAt))}</div>
            <div><strong>Order status</strong>: ${esc(invoice.orderStatus)}</div>
            <div><strong>Payment status</strong>: ${esc(invoice.paymentStatus)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Unit</th>
              <th style="text-align:right">Line total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || "<tr><td colspan='4'>No items</td></tr>"}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${money(invoice.subtotalUSD)}</span></div>
          <div><span>Discount</span><span>-${money(invoice.discountUSD)}</span></div>
          <div><span>Shipping</span><span>${money(invoice.shippingUSD)}</span></div>
          <div class="final"><span>Total</span><span>${money(invoice.totalUSD)}</span></div>
        </div>
      </body>
    </html>
  `;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

