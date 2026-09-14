import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { settings } = useAuth();
  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';
  const wa = settings?.whatsappNumber;

  return (
    <div className="container-app py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-700 text-ink">Contact</h1>
      <p className="mt-1 text-muted">Reach {shopName}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-soft space-y-5 p-6">
          {settings?.about ? (
            <p className="text-muted leading-relaxed">{settings.about}</p>
          ) : null}

          <div className="flex gap-3">
            <MapPin className="mt-0.5 shrink-0 text-brand-700" size={20} />
            <div>
              <p className="font-semibold">Address</p>
              <p className="text-sm text-muted">{settings?.shopAddress || '—'}</p>
              {settings?.googleMapsUrl ? (
                <a
                  href={settings.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-brand-700"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3">
            <Phone className="mt-0.5 shrink-0 text-brand-700" size={20} />
            <div>
              <p className="font-semibold">Phone</p>
              <p className="text-sm text-muted">
                {settings?.phoneNumber ? (
                  <a href={`tel:${settings.phoneNumber}`}>{settings.phoneNumber}</a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Mail className="mt-0.5 shrink-0 text-brand-700" size={20} />
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-sm text-muted">
                {settings?.email ? (
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Clock className="mt-0.5 shrink-0 text-brand-700" size={20} />
            <div>
              <p className="font-semibold">Hours</p>
              <p className="text-sm text-muted">
                {settings?.openingTime || '08:00'} – {settings?.closingTime || '22:00'}
                {settings?.weeklyHoliday ? ` · Closed: ${settings.weeklyHoliday}` : ''}
              </p>
            </div>
          </div>

          {settings?.deliveryAreas?.length ? (
            <div>
              <p className="font-semibold">Delivery areas</p>
              <p className="mt-1 text-sm text-muted">{settings.deliveryAreas.join(', ')}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            {wa ? (
              <a
                href={`https://wa.me/91${String(wa).replace(/\D/g, '').slice(-10)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            ) : null}
            <Link to="/products" className="btn btn-secondary">
              Shop now
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white min-h-64 grid place-items-center p-8 text-center">
          <div>
            <p className="font-display text-3xl font-800 text-brand-800">{shopName}</p>
            <p className="mt-3 text-muted">
              Neighbourhood retail & wholesale — cool drinks, water, juices & essentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
