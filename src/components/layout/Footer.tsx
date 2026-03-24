export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <p>&copy; {new Date().getFullYear()} 내한공연 트래커. 일본 아티스트 내한 공연 정보 서비스.</p>
      </div>
    </footer>
  );
}
