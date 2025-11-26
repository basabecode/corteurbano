import Image from 'next/image';

type ServiceCardProps = {
  name: string;
  duration: number;
  price: number;
  imageUrl?: string;
};

export function ServiceCard({ name, duration, price, imageUrl }: ServiceCardProps) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-black/40 transition hover:border-amber-500">
      {imageUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-xl">
          <Image src={imageUrl} alt={name} fill className="object-cover transition duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="h-40 rounded-xl bg-slate-800/60" />
      )}

      <div className="flex flex-col gap-2 text-slate-100">
        <header className="flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-wide">{name}</h3>
          <span className="text-lg font-semibold text-amber-400">${price.toFixed(2)}</span>
        </header>
        <p className="text-sm text-slate-400">{duration} min · Estilo signature BarberKing</p>
      </div>

      <button className="mt-auto rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400">
        Reservar servicio
      </button>
    </article>
  );
}







