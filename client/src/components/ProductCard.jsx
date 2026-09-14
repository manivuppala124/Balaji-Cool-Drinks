import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { formatINR, getStockLabel } from '../utils/format';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem, mode } = useCart();
  const variants = (product.variants || []).filter((v) => v.isActive);
  const [variantId, setVariantId] = useState(variants[0]?._id || '');
  const [qty, setQty] = useState(1);
  const [cases, setCases] = useState(1);

  useEffect(() => {
    setVariantId(variants[0]?._id || '');
  }, [product._id]);

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

  const canAdd =
    Boolean(variant) &&
    variant.stockQuantity > 0 &&
    (wholesaleMode
      ? casePrice != null || pieceWholesalePrice != null || variant?.retailPrice != null
      : variant?.retailPrice != null);

  const onAdd = () => {
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
      return;
    }
    const unitPrice =
      (wholesaleMode ? pieceWholesalePrice : variant?.retailPrice) ?? variant?.retailPrice;
    if (unitPrice == null) return;
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
  };

  return (
    <article className="card-soft overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/products/${product.slug || product._id}`} className="block">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-50 to-white">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center text-brand-700/40 font-display text-3xl font-bold">
              {product.name?.slice(0, 1)}
            </div>
          )}
          <span className={`badge absolute left-3 top-3 ${stock.tone}`}>{stock.label}</span>
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted">{product.brand || 'Store Brand'}</p>
        <Link to={`/products/${product.slug || product._id}`}>
          <h3 className="font-display text-lg font-700 text-ink">{product.name}</h3>
        </Link>

        {variants.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => setVariantId(v._id)}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  variantId === v._id
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-brand-100 bg-white text-brand-800'
                }`}
              >
                {v.name}
                {v.retailPrice != null ? ` · ${formatINR(v.retailPrice)}` : ''}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{variant?.name}</p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {variant?.mrp != null && variant?.retailPrice != null && variant.mrp > variant.retailPrice ? (
              <p className="text-xs text-muted line-through">{formatINR(variant.mrp)}</p>
            ) : null}
            <p className="font-display text-xl font-700 text-brand-800">
              {wholesaleMode
                ? isCase
                  ? `${formatINR(casePrice)} / case`
                  : pieceWholesalePrice != null
                    ? `${formatINR(pieceWholesalePrice)} / piece`
                    : formatINR(variant?.retailPrice)
                : formatINR(variant?.retailPrice)}
            </p>
            {wholesaleMode && packSize ? (
              <p className="text-xs text-muted">
                1 Case = {packSize} {variant.wholesalePackUnit || 'pieces'}
                {isCase ? ` · ${formatINR(Number((casePrice / packSize).toFixed(2)))}/pc` : ''}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-brand-100 p-1"
              onClick={() =>
                isCase
                  ? setCases((c) => Math.max(1, c - 1))
                  : setQty((q) => Math.max(1, q - 1))
              }
            >
              <Minus size={14} />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold">
              {isCase ? cases : qty}
            </span>
            <button
              type="button"
              className="rounded-lg border border-brand-100 p-1"
              onClick={() =>
                isCase ? setCases((c) => c + 1) : setQty((q) => q + 1)
              }
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={!canAdd}
          onClick={onAdd}
          className="btn btn-primary mt-4 w-full"
        >
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </article>
  );
}
