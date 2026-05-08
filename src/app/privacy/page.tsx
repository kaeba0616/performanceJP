export const metadata = {
  title: "개인정보 처리방침 | THE PULSE",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-on-surface">
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-primary">
        개인정보 처리방침
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        최종 업데이트: 2026년 5월 7일
      </p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-base font-semibold mb-2">1. 수집하는 개인정보 항목</h2>
          <p className="mb-2">서비스는 다음의 개인정보를 수집합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>회원 가입 시(소셜 로그인)</strong>: 이메일 주소, 프로필
              이름, 프로필 이미지 URL (카카오/구글 계정 연동을 통해 제공받음)
            </li>
            <li>
              <strong>이메일 구독 시</strong>: 이메일 주소
            </li>
            <li>
              <strong>공연 제보 시</strong>: 제보자 이메일, 이름(선택), IP 주소
              (스팸 방지 목적)
            </li>
            <li>
              <strong>회원 활동 시</strong>: 작성한 핸들, 자기소개, 공연 출석
              기록
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">2. 개인정보 수집·이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 로그인 유지</li>
            <li>공연 정보 알림 발송 (이메일 구독자 한정)</li>
            <li>사용자 제보 검토 및 처리 결과 회신</li>
            <li>서비스 부정 이용 방지 (IP 기반 rate limit)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">3. 보관 기간</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 정보: 회원 탈퇴 시까지</li>
            <li>이메일 구독 정보: 구독 해지 시까지</li>
            <li>제보자 IP: 90일 후 자동 삭제 (예정)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">4. 제3자 제공</h2>
          <p>
            서비스는 회원의 개인정보를 외부에 제공하지 않습니다. 단, 법령에 의한
            요청이 있을 경우 관련 법규에 따라 처리됩니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">5. 처리 위탁</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Supabase Inc.</strong> — 데이터베이스 및 인증 인프라
            </li>
            <li>
              <strong>Resend</strong> — 이메일 발송
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">6. 회원의 권리</h2>
          <p>
            회원은 언제든지 본인의 개인정보를 열람·수정·삭제할 수 있으며, 회원
            탈퇴를 통해 모든 정보의 삭제를 요청할 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">7. 개인정보 보호 책임자</h2>
          <p>
            문의:{" "}
            <a
              href="mailto:contact@jpop.ernebi.org"
              className="underline hover:text-primary"
            >
              contact@jpop.ernebi.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
