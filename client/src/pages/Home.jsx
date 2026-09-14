import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Sparkles, Tag, Truck } from 'lucide-react';
import { categoryApi, productApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

const SECTION_KEYS = [
  { key: 'cool-drinks', match: /cool\s*drinks/i, title: 'Cool Drinks' },
  { key: 'water', match: /^water$/i, title: 'Water' },
  { key: 'juices', match: /juice/i, title: 'Juices' },
  { key: 'energy-drinks', match: /energy/i, title: 'Energy Drinks' },
  { key: 'disposables', match: /disposable/i, title: 'Disposables' },
];

function ProductRowSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-soft overflow-hidden">
          <div className="skeleton aspect-[4/3]" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, subtitle, to, children, loading }) {
  return (
    <section className="container-app py-10 animate-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-700 text-ink md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
        </div>
        {to ? (
          <Link to={to} className="btn btn-secondary text-sm">
            View all <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      {loading ? <ProductRowSkeleton /> : children}
    </section>
  );
}

export default function Home() {
  const { settings } = useAuth();
  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recent, setRecent] = useState([]);
  const [lowPrice, setLowPrice] = useState([]);
  const [byCategory, setByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const catRes = await categoryApi.list();
        const cats = catRes.data.data.categories || [];
        if (!alive) return;
        setCategories(cats);

        const [featRes, popRes, newRes, lowRes] = await Promise.all([
          productApi.list({ featured: 'true', limit: 8, sort: 'popular' }),
          productApi.list({ sort: 'popular', limit: 8 }),
          productApi.list({ sort: 'newest', limit: 8 }),
          productApi.list({ sort: 'price_asc', maxPrice: 30, limit: 8, availability: 'in_stock' }),
        ]);

        if (!alive) return;
        setFeatured(featRes.data.data.items || []);
        setPopular(popRes.data.data.items || []);
        setRecent(newRes.data.data.items || []);
        setLowPrice(lowRes.data.data.items || []);

        const sectionCats = SECTION_KEYS.map((s) => ({
          ...s,
          category: cats.find((c) => s.match.test(c.name) || s.match.test(c.slug)),
        })).filter((s) => s.category);

        const sectionResults = await Promise.all(
          sectionCats.map((s) =>
            productApi.list({ category: s.category._id, limit: 8, sort: 'popular' })
          )
        );

        if (!alive) return;
        const map = {};
        sectionCats.forEach((s, i) => {
          map[s.key] = {
            title: s.title,
            slug: s.category.slug,
            id: s.category._id,
            items: sectionResults[i].data.data.items || [],
          };
        });
        setByCategory(map);
      } catch {
        if (alive) {
          setCategories([]);
          setFeatured([]);
          setPopular([]);
          setRecent([]);
          setLowPrice([]);
          setByCategory({});
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const highlight = useMemo(
    () => (featured.length ? featured : popular).slice(0, 8),
    [featured, popular]
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-brand-100/60">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(105deg, rgba(15,118,110,0.92) 0%, rgba(17,94,89,0.78) 48%, rgba(15,23,42,0.45) 100%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.35), transparent 40%)',
          }}
        />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        <div className="container-app relative grid min-h-[72vh] items-center py-16 md:py-20">
          <div className="max-w-2xl text-white animate-fade-up">
            <p className="font-display text-4xl font-800 leading-tight md:text-6xl md:leading-[1.05]">
              {shopName}
            </p>
            <h1 className="mt-5 font-display text-2xl font-700 text-brand-50 md:text-3xl">
              Fresh cool drinks, water & essentials — delivered from your neighbourhood store
            </h1>
            <p className="mt-4 max-w-xl text-base text-brand-50/85 md:text-lg">
              Retail packs for home and wholesale cases for shops — same trusted shelf, fair ₹ prices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn btn-primary bg-accent-500 shadow-none hover:brightness-105">
                Shop now <ArrowRight size={18} />
              </Link>
              <Link to="/wholesale" className="btn btn-secondary border-white/30 bg-white/10 text-white">
                Wholesale deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section title="Shop by Category" subtitle="Browse what you need, fast" to="/categories" loading={loading && !categories.length}>
        {categories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/categories/${c.slug}`}
                className="group rounded-2xl border border-brand-100/80 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Droplets size={22} />
                </div>
                <p className="font-display font-700 text-ink">{c.name}</p>
                {c.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Categories coming soon" description="Check back shortly." />
        )}
      </Section>

      <Section
        title="Popular & Featured"
        subtitle="What neighbours are picking up"
        to="/products?sort=popular"
        loading={loading}
      >
        {highlight.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlight.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No featured products yet" actionLabel="Browse shop" to="/products" />
        )}
      </Section>

      {SECTION_KEYS.map((s) => {
        const block = byCategory[s.key];
        if (!block && loading) {
          return (
            <Section key={s.key} title={s.title} loading>
              <ProductRowSkeleton />
            </Section>
          );
        }
        if (!block?.items?.length) return null;
        return (
          <Section
            key={s.key}
            title={block.title}
            to={`/categories/${block.slug}`}
            loading={false}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {block.items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </Section>
        );
      })}

      <section className="container-app py-6">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-6 py-10 text-white md:px-10 animate-fade-up">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
          <div className="relative max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent-400">
              <Truck size={16} /> Wholesale Deals
            </p>
            <h2 className="mt-2 font-display text-3xl font-700">Case rates for kirana & canteen buyers</h2>
            <p className="mt-3 text-brand-100/85">
              Approved wholesale accounts get case pricing on cool drinks, water and more. Switch to
              Wholesale mode in the header after approval.
            </p>
            <Link to="/wholesale" className="btn mt-6 bg-white text-brand-800">
              Learn about wholesale <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Section title="Recently Added" subtitle="Fresh on the shelf" to="/products?sort=newest" loading={loading}>
        {recent.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing new yet" />
        )}
      </Section>

      <Section
        title="Low-price picks"
        subtitle="Everyday value under ₹30"
        to="/products?sort=price_asc&maxPrice=30"
        loading={loading}
      >
        {lowPrice.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lowPrice.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No low-price items right now"
            description="Try browsing the full catalogue."
            actionLabel="Shop all"
            to="/products"
          />
        )}
      </Section>

      <section className="container-app pb-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Neighbourhood trusted', text: 'Same store shelf you know — now order online.' },
            { icon: Tag, title: 'Clear ₹ pricing', text: 'MRP and retail shown honestly. Wholesale cases when eligible.' },
            { icon: Truck, title: 'Local delivery', text: settings?.deliveryAvailable === false ? 'Pickup from store' : 'Delivery across listed areas when available.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-brand-100/70 bg-white/70 p-5">
              <Icon className="text-brand-700" size={22} />
              <h3 className="mt-3 font-display text-lg font-700">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
