// KST(UTC+9) 기준 자정을 반환. 공연이 시작된 날부터 스탬프 가능 여부 판단에 사용.
export function startOfTodayKST(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  kst.setHours(0, 0, 0, 0);
  // 다시 UTC로 보정해서 비교 가능하게
  return new Date(kst.getTime() - 9 * 60 * 60_000);
}

export function isStartedKST(startDate: string): boolean {
  // start_date는 'YYYY-MM-DD' 형식. KST 자정 기준으로 비교.
  const [y, m, d] = startDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  // 공연일 KST 자정 = (Y-M-D 00:00 KST) = UTC로 (Y-M-D 00:00 - 9h)
  const performanceMs = Date.UTC(y, m - 1, d) - 9 * 60 * 60_000;
  return performanceMs <= startOfTodayKST().getTime();
}
