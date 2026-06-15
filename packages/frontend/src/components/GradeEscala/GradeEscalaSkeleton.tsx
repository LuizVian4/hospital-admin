export function GradeEscalaSkeleton() {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100" />
      <div className="h-8 bg-slate-50" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex border-t">
          <div className="h-9 w-48 bg-slate-100 shrink-0" />
          <div className="h-9 flex-1 bg-white" />
        </div>
      ))}
    </div>
  );
}
