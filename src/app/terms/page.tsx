export const metadata = {
  title: "이용약관 | THE PULSE",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-on-surface">
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-primary">
        이용약관
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        최종 업데이트: 2026년 5월 7일
      </p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-base font-semibold mb-2">제1조 (목적)</h2>
          <p>
            본 약관은 THE PULSE(이하 &ldquo;서비스&rdquo;)가 제공하는 일본 아티스트
            내한공연 정보 안내 서비스의 이용 조건과 운영에 관한 사항을 규정합니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">제2조 (서비스 내용)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>일본 아티스트 내한공연 일정 및 티켓 정보 제공</li>
            <li>회원의 공연 출석 스탬프 기록 및 공유</li>
            <li>사용자 제보를 통한 공연 정보 등록</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">제3조 (회원의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>타인의 정보를 도용하거나 허위 정보를 등록하지 않습니다.</li>
            <li>서비스를 상업적 목적으로 무단 이용하지 않습니다.</li>
            <li>다른 회원의 권리나 명예를 침해하는 행위를 하지 않습니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">제4조 (책임 제한)</h2>
          <p>
            서비스가 제공하는 공연 정보는 외부 출처(공식 티켓팅 사이트, 사용자
            제보 등)를 기반으로 하며, 정확성과 최신성을 보장하지 않습니다. 실제
            티켓 구매 및 공연 관람은 회원의 책임 하에 이루어집니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">제5조 (약관 변경)</h2>
          <p>
            서비스는 필요한 경우 약관을 변경할 수 있으며, 변경 사항은 본 페이지에
            공지합니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2">문의</h2>
          <p>
            서비스 이용 관련 문의:{" "}
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
