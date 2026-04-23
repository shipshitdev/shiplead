export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <rect width="40" height="40" rx="12" fill="#0b0f0d" />
      <rect x="8" y="8" width="24" height="24" rx="7" stroke="#34d399" strokeWidth="2" />
      <path d="M13 22h7l-3 6 10-10h-7l3-6-10 10Z" fill="#34d399" />
    </svg>
  );
}
