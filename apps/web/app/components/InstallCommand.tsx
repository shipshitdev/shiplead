'use client';

import { useState } from 'react';

const COMMANDS = {
  desktop: `git clone https://github.com/shipshitdev/shiplead\ncd shiplead\nbun install\nbun run dev:desktop`,
  api: `bun run dev:api`,
} as const;

type InstallMode = keyof typeof COMMANDS;

export function InstallCommand({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<InstallMode>('desktop');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(COMMANDS[mode]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-lg' : 'max-w-2xl px-6 pb-16'}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex gap-5">
          {(['desktop', 'api'] as InstallMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`text-xs font-medium tracking-wide transition-colors ${
                mode === item ? 'text-primary' : 'text-muted hover:text-secondary'
              }`}
            >
              {item === 'desktop' ? 'Desktop App' : 'Local API'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-muted transition-colors hover:text-primary"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="rounded-lg bg-white/[0.04] px-5 py-4 text-left">
        {COMMANDS[mode].split('\n').map((line) => (
          <div key={line} className="flex gap-2 font-mono text-[13px] leading-6">
            <span className="select-none text-muted">$</span>
            <span className="text-secondary">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
