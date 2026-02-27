import Link from 'next/link';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

/**
 * Breadcrumb de navegación para sub-páginas del dashboard.
 * Uso:
 *   <Breadcrumb items={[
 *     { label: 'Panel Admin', href: '/dashboard/admin' },
 *     { label: 'Gestión de Barberos' }
 *   ]} />
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index === 0 && (
                <LayoutDashboard className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
              )}
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-700 flex-shrink-0" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-amber-400 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-[11px] uppercase tracking-[0.2em] text-slate-300"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
