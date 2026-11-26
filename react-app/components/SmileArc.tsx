type Props = {
  className?: string;
};

export default function SmileArc({ className }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 640 380"
      fill="none"
    >
      <path
        d="M24 108C92 282 548 282 616 108"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M90 150C152 266 488 266 550 150"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1"
        strokeDasharray="2 10"
      />
      <circle cx="24" cy="108" r="4.5" fill="currentColor" />
      <circle cx="616" cy="108" r="4.5" fill="var(--red)" />
      <path
        d="M320 196V344"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeDasharray="2 10"
      />
    </svg>
  );
}
