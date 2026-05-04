export interface StampTitle {
  title: string;
  emoji: string;
}

export function getStampTitle(count: number): StampTitle {
  if (count <= 0) return { title: "준비 중", emoji: "🎫" };
  if (count === 1) return { title: "입문자", emoji: "👋" };
  if (count < 3) return { title: `${count}회 직관`, emoji: "🎵" };
  if (count < 5) return { title: `${count}회 직관러`, emoji: "🎤" };
  if (count < 10) return { title: `${count}회 직관러`, emoji: "🔥" };
  if (count < 20) return { title: `${count}회 진심러`, emoji: "🎌" };
  if (count < 50) return { title: `${count}회 마니아`, emoji: "⚡" };
  return { title: `${count}회 전설`, emoji: "👑" };
}
