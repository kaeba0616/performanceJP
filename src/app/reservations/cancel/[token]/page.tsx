import { CancelReservation } from "./CancelReservation";

export const metadata = {
  title: "예약 취소 | THE PULSE",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CancelReservationPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-on-surface mb-3">
        예약 취소
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        아래 버튼을 누르면 예약이 취소됩니다.
      </p>
      <CancelReservation token={token} />
    </div>
  );
}
