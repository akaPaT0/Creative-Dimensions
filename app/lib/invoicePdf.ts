type InvoicePdfItem = {
  name: string;
  quantity: number;
  unitPriceUSD: number;
  lineTotalUSD: number;
};

type InvoicePdfData = {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  addressLines: string[];
  promoCode?: string;
  subtotalUSD: number;
  discountUSD: number;
  shippingUSD: number;
  totalUSD: number;
  items: InvoicePdfItem[];
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function safeText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function buildPdfFromLines(lines: string[]) {
  const contentParts: string[] = [];
  let y = 780;
  for (const line of lines) {
    const txt = safeText(line.slice(0, 140));
    contentParts.push(`BT /F1 10 Tf 50 ${y} Td (${txt}) Tj ET`);
    y -= 14;
    if (y < 60) break;
  }
  const content = contentParts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export function generateInvoicePdf(data: InvoicePdfData) {
  const lines: string[] = [];
  lines.push("CREATIVE DIMENSIONS - INVOICE");
  lines.push("");
  lines.push(`Invoice: ${data.invoiceNumber}`);
  lines.push(`Order: ${data.orderNumber}`);
  lines.push(`Issued: ${fmtDate(data.issuedAt)}`);
  lines.push(`Order status: ${data.orderStatus}`);
  lines.push(`Payment: ${data.paymentStatus}`);
  lines.push("");
  lines.push("BILL TO");
  lines.push(data.customerName || "Customer");
  if (data.customerEmail) lines.push(data.customerEmail);
  if (data.customerPhone) lines.push(`Phone: ${data.customerPhone}`);
  lines.push("");
  lines.push("SHIP TO");
  for (const line of data.addressLines.filter(Boolean)) lines.push(line);
  lines.push("");
  lines.push("ITEMS");
  for (const item of data.items) {
    lines.push(
      `${item.name} x${item.quantity} @ ${money(item.unitPriceUSD)} = ${money(item.lineTotalUSD)}`
    );
  }
  lines.push("");
  lines.push(`Subtotal: ${money(data.subtotalUSD)}`);
  lines.push(`Discount: -${money(data.discountUSD)}`);
  lines.push(`Shipping: ${money(data.shippingUSD)}`);
  lines.push(`Total: ${money(data.totalUSD)}`);
  if (data.promoCode) lines.push(`Promo code: ${data.promoCode}`);

  return buildPdfFromLines(lines);
}

