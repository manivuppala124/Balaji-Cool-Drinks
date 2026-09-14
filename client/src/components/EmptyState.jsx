import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  to,
}) {
  return (
    <div className="card-soft p-10 text-center animate-fade-up">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <PackageOpen size={28} />
      </div>
      <h3 className="font-display text-xl font-700">{title}</h3>
      {description ? <p className="mt-2 text-muted">{description}</p> : null}
      {actionLabel && to ? (
        <Link to={to} className="btn btn-primary mt-5">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
