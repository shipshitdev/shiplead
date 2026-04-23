import { GitHubMark } from './GitHubMark';
import { InstallCommand } from './InstallCommand';
import { ProductMockup } from './ProductMockup';

export function Hero() {
  return (
    <section className="px-6 pt-[16vh] pb-24 text-center md:pt-[18vh]">
      <div className="mx-auto max-w-4xl">
        <div className="animate-fade-in-up">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium tracking-[0.18em] text-secondary uppercase">
            ShipLead
            <span className="text-muted">Desktop app + CLI</span>
          </div>
          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-primary md:text-6xl lg:text-7xl">
            Local-first CRM for
            <br />
            <span className="text-[#34d399]">founder-led sales.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-secondary md:text-xl">
            Install the desktop app with Homebrew or run ShipLead instantly with <code>npx</code>.
            Keep contacts, companies, tasks, and pipeline state on your machine while agents handle
            the busywork.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/shipshitdev/shiplead"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#09090b] shadow-[0_0_24px_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-[1.03]"
            >
              <GitHubMark className="h-5 w-5 shrink-0 text-[#09090b]" />
              View on GitHub
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-secondary transition-colors duration-200 hover:border-white/24 hover:bg-white/[0.05] hover:text-primary"
            >
              See the workflow
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div
          className="animate-fade-in-up mt-16"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          <InstallCommand compact />
          <p className="mt-4 text-sm text-muted">
            Use the desktop app for day-to-day pipeline work. Use the CLI for scripts, cron, and
            quick local checks.
          </p>
        </div>

        <div
          className="animate-screenshot-in mt-16"
          style={{ animationDelay: '200ms', animationFillMode: 'both' }}
        >
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
