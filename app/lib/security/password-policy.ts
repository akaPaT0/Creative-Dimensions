export type PasswordValidationResult = {
  valid: boolean;
  score: number; // 0 to 4
  errors: string[];
};

const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "admin123",
  "welcome123",
  "creativedimensions",
]);

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push("At least 8 characters long");
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter (A-Z)");
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter (a-z)");
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least one number (0-9)");
  } else {
    score += 1;
  }

  // Bonus/optional for special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score = Math.min(4, score + 1);
  }

  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim())) {
    errors.push("Password is too common and easily guessed");
    score = 0;
  }

  return {
    valid: errors.length === 0,
    score: Math.min(4, score),
    errors,
  };
}

/**
 * Checks against HaveIBeenPwned's 850M+ breached password database
 * using privacy-preserving k-Anonymity (only sends first 5 chars of SHA-1).
 * Completely free, official Cloudflare/HIBP API.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
      // cache for 1 hour to optimize speed
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) return false;

    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [hashSuffix] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("HaveIBeenPwned API check error:", err);
    return false; // don't block user if external network is down
  }
}
