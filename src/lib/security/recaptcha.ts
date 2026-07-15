/**
 * Verifies a Google reCAPTCHA v3 token. When RECAPTCHA_SECRET_KEY is unset
 * (the default for local/dev), this is a no-op that always passes — set the
 * env var in production to enforce real verification.
 */
export async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success) && (data.score === undefined || data.score >= 0.5);
}
