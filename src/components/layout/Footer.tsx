import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-highest mt-24 pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8 px-8 md:px-12 py-14 text-sm uppercase tracking-widest">
        <div className="text-lg font-black text-on-surface tracking-tight">
          THE EDITORIAL PULSE
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link
            href="#"
            className="text-on-surface-variant/80 hover:text-on-surface transition-all text-xs"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant/80 hover:text-on-surface transition-all text-xs"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant/80 hover:text-on-surface transition-all text-xs"
          >
            Contact
          </Link>
        </div>
        <div className="text-[10px] text-on-surface-variant/70 text-center md:text-right normal-case tracking-normal">
          © {new Date().getFullYear()} The Editorial Pulse. <br className="md:hidden" />
          Curating J-Rock & J-Pop culture in Korea.
        </div>
      </div>
    </footer>
  );
}
