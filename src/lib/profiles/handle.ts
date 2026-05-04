export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export type HandleError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "reserved";

const RESERVED = new Set([
  "admin", "root", "me", "u", "user", "users", "api", "auth",
  "login", "logout", "signup", "signin", "onboarding",
  "settings", "help", "about", "support", "official",
  "thepulse", "pulse", "anonymous", "null", "undefined",
]);

export function validateHandle(raw: string): HandleError | null {
  const h = raw.trim().toLowerCase();
  if (!h) return "empty";
  if (h.length < 3) return "too_short";
  if (h.length > 20) return "too_long";
  if (!HANDLE_PATTERN.test(h)) return "invalid_chars";
  if (RESERVED.has(h)) return "reserved";
  return null;
}

export function handleErrorMessage(err: HandleError): string {
  switch (err) {
    case "empty": return "사용자명을 입력해주세요";
    case "too_short": return "최소 3자 이상이어야 해요";
    case "too_long": return "최대 20자까지 가능해요";
    case "invalid_chars": return "영문 소문자, 숫자, _만 사용할 수 있어요";
    case "reserved": return "사용할 수 없는 이름이에요";
  }
}

export function suggestHandle(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const base = local.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (base.length >= 3 && base.length <= 20) return base;
  if (base.length < 3) return base + Math.random().toString(36).slice(2, 6);
  return base.slice(0, 20);
}
