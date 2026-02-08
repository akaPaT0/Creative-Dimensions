export function openInvoiceWindow(url: string) {
  if (typeof window === "undefined") return;
  const width = 980;
  const height = 860;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  window.open(
    url,
    "cd-invoice-window",
    `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`
  );
}

