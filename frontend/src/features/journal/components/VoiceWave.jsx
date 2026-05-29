export function VoiceWave({ active }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={`h-4 w-1 rounded-full bg-reef/80 transition ${active ? "animate-pulse" : ""}`}
          style={{ animationDelay: `${bar * 0.1}s` }}
        />
      ))}
    </div>
  );
}
