// 단체(org) 핸들 검증. profiles 핸들과 규칙은 같지만(3~20자, a-z0-9_),
// /o/* 라우트와 충돌하는 예약어 집합이 다르다.

export const ORG_HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export type OrgHandleError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "reserved";

// /o/[handle] 하위 라우트 및 일반 예약어와 충돌 방지
const RESERVED = new Set([
  "new",
  "manage",
  "join",
  "edit",
  "settings",
  "api",
  "admin",
  "o",
  "me",
  "u",
  "login",
  "logout",
  "about",
  "help",
  "support",
  "official",
  "null",
  "undefined",
]);

export function validateOrgHandle(raw: string): OrgHandleError | null {
  const h = raw.trim().toLowerCase();
  if (!h) return "empty";
  if (h.length < 3) return "too_short";
  if (h.length > 20) return "too_long";
  if (!ORG_HANDLE_PATTERN.test(h)) return "invalid_chars";
  if (RESERVED.has(h)) return "reserved";
  return null;
}

export function orgHandleErrorMessage(err: OrgHandleError): string {
  switch (err) {
    case "empty":
      return "단체 주소를 입력해주세요";
    case "too_short":
      return "최소 3자 이상이어야 해요";
    case "too_long":
      return "최대 20자까지 가능해요";
    case "invalid_chars":
      return "영문 소문자, 숫자, _만 사용할 수 있어요";
    case "reserved":
      return "사용할 수 없는 주소예요";
  }
}
