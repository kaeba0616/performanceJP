export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

const KST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getKstParts(date: Date) {
  const out: Record<string, string> = {};
  for (const p of KST_PARTS.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  // hour="24" 처리 (en-CA + hour12:false에서 자정이 24로 나올 수 있음)
  if (out.hour === "24") out.hour = "00";
  return out as { year: string; month: string; day: string; hour: string; minute: string };
}

/**
 * timestamptz를 KST(Asia/Seoul) 기준으로 "YYYY.MM.DD HH:mm" 포맷.
 * 서버/브라우저 TZ에 영향받지 않도록 항상 KST로 고정 변환.
 */
export function formatDateTime(dateStr: string): string {
  const p = getKstParts(new Date(dateStr));
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/**
 * "YYYY-MM-DDTHH:mm" (datetime-local 입력, TZ 없음)을 KST로 해석해
 * "YYYY-MM-DDTHH:mm:00+09:00" ISO 문자열로 변환.
 * Postgres timestamptz가 KST 의도대로 저장되도록 명시적 오프셋을 붙인다.
 */
export function kstNaiveToISO(naive: string): string {
  // 이미 TZ 정보가 붙어 있으면 그대로 둠
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(naive)) return naive;
  // 초가 없으면 :00 채움
  const withSec = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(naive) ? `${naive}:00` : naive;
  return `${withSec}+09:00`;
}

/**
 * ISO 문자열을 datetime-local 입력용 KST naive("YYYY-MM-DDTHH:mm")로 변환.
 */
export function isoToKstNaive(iso: string): string {
  const p = getKstParts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function getMonthName(month: number): string {
  const names = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];
  return names[month];
}

export function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

export function getDDay(dateStr: string): string {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "D-DAY";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * "YYYY-MM-DDTHH:mm" (TZ 없음, KST 로컬로 해석) →
 * "2026년 5월 16일(토) 오후 6시" 형식.
 */
export function formatShowTime(datetime: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(datetime);
  if (!m) return datetime;
  const [, y, mo, d, hh, mm] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour24 = Number(hh);
  const minute = Number(mm);

  const dow = WEEKDAY_KO[new Date(year, month - 1, day).getDay()];
  const isAm = hour24 < 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const ampm = isAm ? "오전" : "오후";
  const minPart = minute > 0 ? ` ${minute}분` : "";
  return `${year}년 ${month}월 ${day}일(${dow}) ${ampm} ${hour12}시${minPart}`;
}

export function getTimeUntil(dateStr: string): string {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "오픈됨";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}일 ${hours}시간 전`;
  if (hours > 0) return `${hours}시간 ${minutes}분 전`;
  return `${minutes}분 전`;
}
