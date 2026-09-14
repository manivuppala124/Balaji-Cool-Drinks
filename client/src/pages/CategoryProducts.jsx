import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categoryApi, productApi } from '../services/endpoints';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function CategoryProducts() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const catRes = await categoryApi.get(slug);
        const cat = catRes.data.data.category;
        setCategory(cat);
        document.title = `${cat.name} | Sri Balaji Cool Drinks & General Store`;
        const prodRes = await productApi.list({ category: cat._id, limit: 48 });
        setItems(prodRes.data.data.items || []);
      } catch {
        setCategory(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return (
    <div className="container-app py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-800 text-brand-800">{category?.name || 'Category'}</h1>
      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-64" />)}
        </div>
      ) : items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      ) : (
        <div className="mt-6"><EmptyState title="No products found" actionLabel="All products" to="/products" /></div>
      )}
    </div>
  );
}
