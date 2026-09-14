import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi } from '../services/endpoints';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Categories | Sri Balaji Cool Drinks & General Store';
    (async () => {
      try {
        const res = await categoryApi.list();
        setCategories(res.data.data.categories || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container-app py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-800 text-brand-800">Shop by Category</h1>
      <p className="text-muted mt-1">Cool drinks, water, juices, dairy, disposables and more</p>
      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c._id} to={`/categories/${c.slug}`} className="card-soft p-5 hover:-translate-y-0.5 transition">
              <h2 className="font-display text-xl font-700 text-brand-900">{c.name}</h2>
              <p className="mt-1 text-sm text-muted line-clamp-2">{c.description || 'Browse products'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
