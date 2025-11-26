type Stat = { label: string; value: string; trend: string };

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <article key={stat.label} className="rounded-2xl border border-slate-900 bg-slate-900/60 p-6 shadow shadow-black/30">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">{stat.label}</p>
          <div className="mt-3 text-3xl font-semibold text-slate-50">{stat.value}</div>
          <p className="text-sm text-slate-400">{stat.trend}</p>
        </article>
      ))}
    </div>
  );
}







