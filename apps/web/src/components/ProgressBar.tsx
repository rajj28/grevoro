interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex-1 bg-cream rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="progress-bar-fill h-2 bg-forest rounded-full transition-all duration-300"
        data-progress={clampedValue}
      />
    </div>
  );
}
