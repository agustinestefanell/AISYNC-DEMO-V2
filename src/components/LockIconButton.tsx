export function LockIconButton({
  locked,
  onClick,
}: {
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`ui-button ui-lock-icon-button ${
        locked ? 'ui-lock-icon-button-locked' : 'ui-lock-icon-button-unlocked'
      }`}
      onClick={onClick}
      title={locked ? 'Unlock document' : 'Lock document'}
      aria-label={locked ? 'Unlock document' : 'Lock document'}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {locked ? (
          <>
            <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
            <path d="M5.5 7V5.6a2.5 2.5 0 0 1 5 0V7" />
          </>
        ) : (
          <>
            <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
            <path d="M10.5 7V5.6a2.5 2.5 0 0 0-4.5-1.55" />
          </>
        )}
      </svg>
    </button>
  );
}
