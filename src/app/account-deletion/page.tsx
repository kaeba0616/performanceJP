export const metadata = {
  title: "계정 및 데이터 삭제 요청 | THE PULSE",
};

export default function AccountDeletionPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-on-surface">
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-primary">
        계정 및 데이터 삭제
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        THE PULSE (내한공연 트래커) · 최종 업데이트: 2026년 8월
      </p>

      <section className="mt-10 space-y-8 text-sm leading-relaxed">
        <div>
          <h2 className="text-base font-semibold mb-2">계정 삭제를 요청하는 방법</h2>
          <p className="mb-3">
            THE PULSE 앱의 계정과 관련 데이터 삭제를 원하시는 경우, 아래 절차에
            따라 요청하실 수 있습니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              가입 시 사용한 이메일 주소로{" "}
              <a
                href="mailto:alstjq1012@gmail.com?subject=%5BTHE%20PULSE%5D%20%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD"
                className="font-semibold text-primary underline underline-offset-2"
              >
                alstjq1012@gmail.com
              </a>{" "}
              으로 이메일을 보내주세요.
            </li>
            <li>
              제목에 <strong>&ldquo;계정 삭제 요청&rdquo;</strong>, 본문에{" "}
              <strong>가입에 사용한 이메일 주소</strong>를 기재해 주세요.
            </li>
            <li>
              본인 확인 후 <strong>영업일 기준 7일 이내</strong>에 계정과 관련
              데이터를 삭제하고 회신드립니다.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">삭제되는 데이터</h2>
          <p className="mb-2">계정 삭제 시 다음 데이터가 영구히 삭제됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>계정 정보: 이메일 주소, 프로필 이름, 프로필 이미지, 핸들, 자기소개</li>
            <li>활동 기록: 공연 출석 스탬프, 예약 내역, 단체 소속 및 역할</li>
            <li>사용자 생성 콘텐츠: 공연 제보, 단원 지원서, 단체 공지 등</li>
            <li>알림 구독: 이메일 구독 정보, 웹 푸시 토큰</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">보관되는 데이터 및 기간</h2>
          <p className="mb-2">
            아래 항목은 법령 준수 및 부정 이용 방지를 위해 제한된 기간 동안
            보관될 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>스팸·부정 이용 방지용 IP 주소: 최대 90일 후 자동 삭제</li>
            <li>
              관련 법령(전자상거래법 등)에 따라 보존 의무가 있는 거래·정산
              기록: 해당 법정 보관 기간 동안 보관 후 삭제
            </li>
          </ul>
          <p className="mt-2 text-on-surface-variant">
            위 보관 대상 데이터는 계정 식별 정보와 분리되어 관리되며, 보관 기간
            경과 후 지체 없이 파기됩니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">일부 데이터만 삭제</h2>
          <p>
            계정을 유지하면서 특정 데이터(예: 특정 예약 내역, 출석 기록)만 삭제를
            원하시는 경우에도 위 이메일로 요청해 주시면 처리해 드립니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">문의</h2>
          <p>
            개인정보 처리에 관한 자세한 내용은{" "}
            <a href="/privacy" className="text-primary underline underline-offset-2">
              개인정보 처리방침
            </a>
            을 참고하시거나 위 이메일로 문의해 주세요.
          </p>
        </div>
      </section>
    </div>
  );
}
