import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const CartContext = createContext(null);
const CART_KEY = 'sb_cart_v1';

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch {
    return {};
  }
};

export function CartProvider({ children }) {
  const initial = loadCart();
  const [items, setItems] = useState(initial.items || []);
  const [mode, setMode] = useState(initial.mode || 'RETAIL');

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify({ items, mode }));
  }, [items, mode]);

  const addItem = (payload) => {
    const {
      productId,
      variantId,
      productName,
      variantName,
      image,
      mrp,
      unitPrice,
      quantity = 1,
      stockQuantity,
      sellingUnit = 'PIECE',
      casesOrdered = 0,
      packSize = null,
      packUnit = '',
    } = payload;

    if (!variantId) {
      toast.error('Select a variant first');
      return;
    }

    const qty =
      sellingUnit === 'CASE'
        ? (casesOrdered || quantity) * (packSize || 1)
        : quantity;

    if (qty > stockQuantity) {
      toast.error('Not enough stock available');
      return;
    }

    const itemMode = payload.mode || mode;

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.variantId === variantId &&
          i.sellingUnit === sellingUnit &&
          i.mode === itemMode
      );
      if (idx >= 0) {
        const next = [...prev];
        const newQty =
          sellingUnit === 'CASE'
            ? (next[idx].casesOrdered + (casesOrdered || quantity)) * (packSize || 1)
            : next[idx].quantity + quantity;
        if (newQty > stockQuantity) {
          toast.error('Not enough stock available');
          return prev;
        }
        next[idx] = {
          ...next[idx],
          quantity: newQty,
          casesOrdered:
            sellingUnit === 'CASE'
              ? next[idx].casesOrdered + (casesOrdered || quantity)
              : 0,
          subtotal: Number((unitPrice * newQty).toFixed(2)),
        };
        return next;
      }

      return [
        ...prev,
        {
          productId,
          variantId,
          productName,
          variantName,
          image,
          mrp,
          unitPrice,
          quantity: qty,
          casesOrdered: sellingUnit === 'CASE' ? casesOrdered || quantity : 0,
          sellingUnit,
          packSize,
          packUnit,
          stockQuantity,
          mode: itemMode,
          subtotal: Number((unitPrice * qty).toFixed(2)),
        },
      ];
    });
    toast.success('Added to cart');
  };

  const updateQuantity = (variantId, sellingUnit, quantity, itemMode) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (
            i.variantId !== variantId ||
            i.sellingUnit !== sellingUnit ||
            (itemMode && i.mode !== itemMode)
          ) {
            return i;
          }
          if (quantity <= 0) return null;
          if (quantity > i.stockQuantity) {
            toast.error('Not enough stock');
            return i;
          }
          return {
            ...i,
            quantity,
            casesOrdered:
              i.sellingUnit === 'CASE' && i.packSize
                ? Math.ceil(quantity / i.packSize)
                : 0,
            subtotal: Number((i.unitPrice * quantity).toFixed(2)),
          };
        })
        .filter(Boolean)
    );
  };

  const removeItem = (variantId, sellingUnit, itemMode) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(
            i.variantId === variantId &&
            i.sellingUnit === sellingUnit &&
            (!itemMode || i.mode === itemMode)
          )
      )
    );
  };

  const clearCart = () => setItems([]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  const value = useMemo(
    () => ({
      items,
      mode,
      setMode: changeMode,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      count: items.reduce((n, i) => n + i.quantity, 0),
    }),
    [items, mode, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
