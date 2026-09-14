import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { categoryApi, productApi } from '../services/endpoints';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const availability = searchParams.get('availability') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await productApi.list({
          search: search || undefined,
          category: category || undefined,
          brand: brand || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          availability: availability || undefined,
          sort,
          page,
          limit: 12,
        });
        if (!alive) return;
        setItems(res.data.data.items || []);
        setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        if (alive) {
          setItems([]);
          toast.error(err.response?.data?.message || 'Failed to load products');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [search, category, brand, minPrice, maxPrice, availability, sort, page]);

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-700 text-ink">Shop</h1>
          <p className="mt-1 text-muted">
            {pagination.total ? `${pagination.total} products` : 'Browse cool drinks & essentials'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary md:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside
          className={`card-soft h-fit space-y-4 p-4 ${
            showFilters ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-700">Filters</h2>
            <button type="button" className="text-xs font-semibold text-brand-700" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <label className="block text-sm font-semibold">
            Search
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-8"
                value={search}
                placeholder="Name, brand..."
                onChange={(e) => setParam('search', e.target.value)}
              />
            </div>
          </label>

          <label className="block text-sm font-semibold">
            Category
            <select
              className="input mt-1"
              value={category}
              onChange={(e) => setParam('category', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Brand
            <input
              className="input mt-1"
              value={brand}
              placeholder="e.g. Sprite"
              onChange={(e) => setParam('brand', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              Min ₹
              <input
                type="number"
                min="0"
                className="input mt-1"
                value={minPrice}
                onChange={(e) => setParam('minPrice', e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              Max ₹
              <input
                type="number"
                min="0"
                className="input mt-1"
                value={maxPrice}
                onChange={(e) => setParam('maxPrice', e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Availability
            <select
              className="input mt-1"
              value={availability}
              onChange={(e) => setParam('availability', e.target.value)}
            >
              <option value="">Any</option>
              <option value="in_stock">In stock</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Sort
            <select
              className="input mt-1"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </aside>

        <div>
          {(search || category || brand || minPrice || maxPrice || availability) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {search ? (
                <button type="button" className="badge bg-brand-50 text-brand-800" onClick={() => setParam('search', '')}>
                  “{search}” <X size={12} className="ml-1" />
                </button>
              ) : null}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-soft overflow-hidden">
                  <div className="skeleton aspect-[4/3]" />
                  <div className="space-y-2 p-4">
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {pagination.pages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page >= pagination.pages}
                    onClick={() => setParam('page', String(page + 1))}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No products found"
              description="Try changing filters or search terms."
              actionLabel="Clear filters"
              to="/products"
            />
          )}
        </div>
      </div>
    </div>
  );
}
