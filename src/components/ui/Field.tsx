export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] p-6 text-center">
      <p className="text-sm font-medium text-white/80">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-mist">{children}</div> : null}
    </div>
  );
}
