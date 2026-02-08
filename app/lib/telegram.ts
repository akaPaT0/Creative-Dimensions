const TELEGRAM_API_BASE = "https://api.telegram.org";
const TELEGRAM_TEXT_LIMIT = 3900;

function splitText(text: string, maxLen = TELEGRAM_TEXT_LIMIT) {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const slice = text.slice(cursor, cursor + maxLen);
    if (cursor + maxLen >= text.length) {
      parts.push(slice);
      break;
    }
    const breakAt = slice.lastIndexOf("\n");
    if (breakAt > 50) {
      parts.push(slice.slice(0, breakAt));
      cursor += breakAt + 1;
    } else {
      parts.push(slice);
      cursor += maxLen;
    }
  }
  return parts.filter(Boolean);
}

async function telegramCall(path: string, init: RequestInit) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");

  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}${path}`, init);
  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      `Telegram HTTP ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    (data as { ok?: boolean }).ok !== true
  ) {
    throw new Error(`Telegram API rejected request: ${JSON.stringify(data)}`);
  }
}

export async function telegramNotify(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID is missing.");

  for (const chunk of splitText(text)) {
    await telegramCall("/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true,
      }),
    });
  }
}

type TelegramDocumentParams = {
  filename: string;
  bytes: Uint8Array;
  caption?: string;
};

export async function telegramSendDocument(params: TelegramDocumentParams) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID is missing.");

  const pdfBuffer = params.bytes.buffer.slice(
    params.bytes.byteOffset,
    params.bytes.byteOffset + params.bytes.byteLength
  ) as ArrayBuffer;

  const form = new FormData();
  form.append("chat_id", chatId);
  if (params.caption) form.append("caption", params.caption.slice(0, 1024));
  form.append(
    "document",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    params.filename
  );

  await telegramCall("/sendDocument", {
    method: "POST",
    body: form,
  });
}
