import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { productApi } from '../services/endpoints';
import { useCart } from '../context/CartContext';
import { formatINR, getStockLabel } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, mode } = useCart();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [cases, setCases] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await productApi.get(id);
        const p = res.data.data.product;
        setProduct(p);
        document.title = `${p.name} | Sri Balaji Cool Drinks & General Store`;
        const first = p.variants?.find((v) => v.isActive);
        setVariantId(first?._id || '');
      } catch (err) {
        toast.error(err.message || 'Product not found');
      }
    })();
  }, [id]);

  if (!product) return <div className="container-app py-10"><div className="skeleton h-80" /></div>;

  const variants = (product.variants || []).filter((v) => v.isActive);
  const variant = variants.find((v) => v._id === variantId) || variants[0];
  const stock = getStockLabel(variant);
  const wholesaleMode = mode === 'WHOLESALE';

  const packSize = variant?.wholesalePackSize || null;
  const casePrice =
    variant?.wholesaleCasePrice != null
      ? variant.wholesaleCasePrice
      : packSize && variant?.wholesalePrice != null
        ? Number((variant.wholesalePrice * packSize).toFixed(2))
        : packSize && variant?.retailPrice != null
          ? Number((variant.retailPrice * packSize * 0.9).toFixed(2))
          : null;

  const pieceWholesalePrice =
    variant?.wholesalePrice != null
      ? variant.wholesalePrice
      : casePrice != null && packSize
        ? Number((casePrice / packSize).toFixed(2))
        : variant?.retailPrice != null
          ? Number((variant.retailPrice * 0.95).toFixed(2))
          : null;

  const isCase = wholesaleMode && Boolean(packSize) && casePrice != null;

  const add = (buyNow = false) => {
    if (!variant) return;
    if (isCase) {
      addItem({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantName: variant.name,
        image: product.images?.[0] || '',
        mrp: variant.mrp,
        unitPrice: Number((casePrice / packSize).toFixed(2)),
        casesOrdered: cases,
        quantity: cases,
        stockQuantity: variant.stockQuantity,
        sellingUnit: 'CASE',
        packSize,
        packUnit: variant.wholesalePackUnit || 'pieces',
        mode: 'WHOLESALE',
      });
    } else {
      const unitPrice =
        (wholesaleMode ? pieceWholesalePrice : variant.retailPrice) ?? variant.retailPrice;
      if (unitPrice == null) {
        toast.error('Price not available');
        return;
      }
      addItem({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantName: variant.name,
        image: product.images?.[0] || '',
        mrp: variant.mrp,
        unitPrice,
        quantity: qty,
        stockQuantity: variant.stockQuantity,
        sellingUnit: 'PIECE',
        mode: wholesaleMode ? 'WHOLESALE' : 'RETAIL',
      });
    }
    if (buyNow) navigate('/cart');
  };

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card-soft overflow-hidden aspect-square bg-gradient-to-br from-brand-50 to-white">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center font-display text-6xl font-800 text-brand-700/30">
              {product.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">{product.brand}</p>
          <h1 className="font-display text-4xl font-800 text-brand-900">{product.name}</h1>
          <p className="mt-3 text-muted">{product.description || 'Fresh stock from Sri Balaji Cool Drinks & General Store.'}</p>
          <span className={`badge mt-3 ${stock.tone}`}>{stock.label}</span>

          <div className="mt-5 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => setVariantId(v._id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  String(variantId) === String(v._id) ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-100'
                }`}
              >
                {v.name}{v.retailPrice != null ? ` · ${formatINR(v.retailPrice)}` : ''}
              </button>
            ))}
          </div>

          {variant && (
            <div className="mt-5 card-soft p-4 space-y-1">
              {variant.mrp != null && <p className="text-sm text-muted">MRP: {formatINR(variant.mrp)}</p>}
              <p className="font-display text-3xl font-800 text-brand-800">
                Retail: {formatINR(variant.retailPrice)}
              </p>
              {wholesaleMode && (
                <>
                  <p className="font-semibold text-brand-700">
                    Wholesale / piece: {formatINR(pieceWholesalePrice || variant.retailPrice)}
                  </p>
                  {packSize ? (
                    <p className="text-sm text-muted">
                      Case: {packSize} {variant.wholesalePackUnit || 'pieces'}
                      {casePrice != null ? ` · ${formatINR(casePrice)} (${formatINR(Number((casePrice / packSize).toFixed(2)))}/pc)` : ''}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button type="button" className="rounded-lg border p-2" onClick={() => (isCase ? setCases((c) => Math.max(1, c - 1)) : setQty((q) => Math.max(1, q - 1)))}>
              <Minus size={16} />
            </button>
            <span className="font-700 min-w-8 text-center">{isCase ? cases : qty}</span>
            <button type="button" className="rounded-lg border p-2" onClick={() => (isCase ? setCases((c) => c + 1) : setQty((q) => q + 1))}>
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => add(false)}>
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => add(true)}>
              <Zap size={16} /> Buy Now
            </button>
            <Link to="/products" className="btn btn-secondary">Back to shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
