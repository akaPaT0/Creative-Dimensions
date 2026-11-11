// Official Cloudflare dummy testing secret key (always passes)
const DUMMY_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

export async function verifyTurnstileToken(
  token: string,
  ip: string,
  expectedAction = "password_reset"
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY || DUMMY_TEST_SECRET_KEY;

  if (!token || token.length > 2048) {
    return { success: false, error: "Bot verification required. Please complete the security check." };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();

    const isProduction = process.env.NODE_ENV === "production";
    const allowedHosts = ["www.creativedimensionslb.com", "creativedimensionslb.com"];
    if (!res.ok || !data.success || (isProduction && (
      data.action !== expectedAction || !allowedHosts.includes(data.hostname)
    ))) {
      return { success: false, error: "Security check failed. Please refresh and try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("Cloudflare Turnstile verification error:", err);
    // In the event of a Cloudflare network outage, fail gracefully if configured
    return { success: false, error: "Unable to verify security challenge. Please try again." };
  }
}
