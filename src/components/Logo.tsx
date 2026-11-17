export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center bg-brand font-bold text-white"
      style={{ width: size, height: size, borderRadius: size * 0.28, fontSize: size * 0.6, lineHeight: 1 }}
    >
      <span style={{ marginTop: -size * 0.12 }}>ض</span>
    </span>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="text-lg font-semibold text-neutral-900">{name}</span>
    </span>
  );
}
