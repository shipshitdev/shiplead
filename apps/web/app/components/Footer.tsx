import { LogoMark } from './LogoMark';

export function Footer() {
  return (
    <footer className="px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-3">
          <LogoMark className="h-6 w-6 shrink-0" />
          <a
            href="https://shipshit.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-secondary"
          >
            © 2026 shipshit.dev · Shiplead
          </a>
        </div>
        <div className="flex items-center gap-6">
          <a href="#workflow" className="transition-colors hover:text-secondary">
            Workflow
          </a>
          <a
            href="https://github.com/shipshitdev/shiplead"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-secondary"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
