import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const META = {
  terms: { title: 'Terms & Conditions', field: 'terms' },
  privacy: { title: 'Privacy Policy', field: 'privacy' },
  refund: { title: 'Refund & Cancellation', field: 'refundPolicy' },
};

export default function PolicyPage() {
  const { type } = useParams();
  const { settings } = useAuth();
  const meta = META[type] || META.terms;
  const content = settings?.[meta.field] || 'Content will be updated by the store soon.';
  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';

  return (
    <div className="container-app py-8 animate-fade-up">
      <nav className="mb-3 text-sm text-muted">
        <Link to="/" className="hover:text-brand-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{meta.title}</span>
      </nav>
      <h1 className="font-display text-3xl font-700 text-ink">{meta.title}</h1>
      <p className="mt-1 text-sm text-muted">{shopName}</p>

      <article className="card-soft mt-6 max-w-3xl p-6 md:p-8">
        <div className="whitespace-pre-wrap leading-relaxed text-ink/90">{content}</div>
      </article>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link to="/policies/terms" className="text-brand-700">
          Terms
        </Link>
        <Link to="/policies/privacy" className="text-brand-700">
          Privacy
        </Link>
        <Link to="/policies/refund" className="text-brand-700">
          Refund
        </Link>
        <Link to="/contact" className="text-brand-700">
          Contact
        </Link>
      </div>
    </div>
  );
}
