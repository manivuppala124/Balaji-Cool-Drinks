import { Check, Circle, XCircle } from 'lucide-react';
import { ORDER_STEPS, statusTone } from '../utils/format';

const LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderTracker({ status, statusHistory = [] }) {
  const cancelled = status === 'CANCELLED';
  const currentIdx = cancelled ? -1 : ORDER_STEPS.indexOf(status);

  const stampFor = (step) => {
    const entry = [...statusHistory].reverse().find((h) => h.status === step);
    if (!entry?.at) return null;
    return new Date(entry.at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cancelled) {
    const cancelEntry = [...statusHistory].reverse().find((h) => h.status === 'CANCELLED');
    return (
      <div className="card-soft p-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-100 text-red-700">
            <XCircle size={22} />
          </div>
          <div>
            <p className={`badge ${statusTone('CANCELLED')}`}>Cancelled</p>
            <p className="mt-1 text-sm text-muted">
              {cancelEntry?.at
                ? new Date(cancelEntry.at).toLocaleString('en-IN')
                : 'This order was cancelled'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-soft p-5 animate-fade-up">
      <h3 className="font-display text-lg font-700 text-ink">Order progress</h3>
      <ol className="mt-5 space-y-0">
        {ORDER_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const stamp = stampFor(step);
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                    done
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-brand-100 bg-white text-muted'
                  } ${active ? 'ring-4 ring-brand-100' : ''}`}
                >
                  {done ? <Check size={14} /> : <Circle size={12} />}
                </span>
                {idx < ORDER_STEPS.length - 1 ? (
                  <span
                    className={`my-1 w-0.5 flex-1 min-h-8 ${
                      idx < currentIdx ? 'bg-brand-600' : 'bg-brand-100'
                    }`}
                  />
                ) : null}
              </div>
              <div className="pb-6">
                <p className={`font-semibold ${done ? 'text-ink' : 'text-muted'}`}>
                  {LABELS[step] || step}
                </p>
                {stamp ? <p className="text-xs text-muted mt-0.5">{stamp}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
