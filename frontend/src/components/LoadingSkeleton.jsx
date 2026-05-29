export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-ink/10 bg-white/60 p-5 ${className}`}
    >
      <div className="skeleton-shimmer h-3 w-24 rounded-full" />
      <div className="skeleton-shimmer mt-3 h-5 w-48 rounded-full" />
      <div className="skeleton-shimmer mt-4 h-32 w-full rounded-2xl" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-3 rounded-full"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-ink/10 bg-white/60 p-5 ${className}`}
    >
      <div className="skeleton-shimmer h-3 w-20 rounded-full" />
      <div className="skeleton-shimmer mt-3 h-5 w-36 rounded-full" />
      <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
        {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
          <div
            key={i}
            className="skeleton-shimmer flex-1 rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className = "" }) {
  return (
    <div
      className={`skeleton-shimmer rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
