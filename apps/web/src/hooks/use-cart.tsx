"use client";

import * as React from "react";

export interface CartLine {
  id: string; // variant or product handle
  handle: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "add"; line: Omit<CartLine, "quantity">; quantity?: number }
  | { type: "remove"; id: string }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

const STORAGE_KEY = "ampere.cart.v1";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const existing = state.lines.find((l) => l.id === action.line.id);
      const quantity = action.quantity ?? 1;
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.id === action.line.id ? { ...l, quantity: l.quantity + quantity } : l,
          ),
        };
      }
      return { lines: [...state.lines, { ...action.line, quantity }] };
    }
    case "setQuantity":
      return {
        lines: state.lines
          .map((l) => (l.id === action.id ? { ...l, quantity: Math.max(0, action.quantity) } : l))
          .filter((l) => l.quantity > 0),
      };
    case "remove":
      return { lines: state.lines.filter((l) => l.id !== action.id) };
    case "clear":
      return { lines: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

/**
 * Client cart state (Context + reducer, localStorage-persisted). Checkout and
 * server-authoritative Shopify cart sync land in Phase 4 via a Server Action —
 * this is the optimistic client model the UI binds to.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { lines: [] });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as CartState });
    } catch {
      // ignore malformed storage
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode) — cart stays in memory
    }
  }, [state]);

  const value = React.useMemo<CartContextValue>(() => {
    return {
      lines: state.lines,
      count: state.lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: state.lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      add: (line, quantity) => dispatch({ type: "add", line, quantity }),
      remove: (id) => dispatch({ type: "remove", id }),
      setQuantity: (id, quantity) => dispatch({ type: "setQuantity", id, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
