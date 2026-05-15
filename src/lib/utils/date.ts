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

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const d = formatDate(dateStr);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${d} ${hours}:${minutes}`;
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
