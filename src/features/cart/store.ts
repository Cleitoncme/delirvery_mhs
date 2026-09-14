"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { cartKey, priceLine, readCart } from "./rules";
import type { CartLine } from "@/types/domain";
interface CartState {
  carts: Record<string, CartLine[]>;
  message: string;
  notes: string;
  add: (tenantId: string, line: CartLine) => boolean;
  setQuantity: (tenantId: string, key: string, quantity: number) => void;
  clear: (tenantId: string) => void;
  setNotes: (notes: string) => void;
}
const safeStorage = {
  getItem: (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      return raw && raw.length <= 100000 ? raw : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Carrinho continua funcional em memória. */
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      message: "",
      notes: "",
      add: (tenantId, line) => {
        try {
          priceLine(tenantId, line);
          const current = get().carts[tenantId] ?? [];
          const key = cartKey(line);
          const old = current.find((item) => cartKey(item) === key);
          const combined = {
            ...line,
            quantity: line.quantity + (old?.quantity ?? 0),
          };
          priceLine(tenantId, combined);
          if (!old && current.length >= 100)
            throw new Error("Limite de itens atingido.");
          set({
            carts: {
              ...get().carts,
              [tenantId]: old
                ? current.map((item) =>
                    cartKey(item) === key ? combined : item,
                  )
                : [...current, line],
            },
            message: "Produto adicionado ao carrinho.",
          });
          return true;
        } catch (error) {
          set({
            message:
              error instanceof Error
                ? error.message
                : "Não foi possível adicionar.",
          });
          return false;
        }
      },
      setQuantity: (tenantId, key, quantity) => {
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
          return;
        const current = get().carts[tenantId] ?? [];
        set({
          carts: {
            ...get().carts,
            [tenantId]:
              quantity === 0
                ? current.filter((item) => cartKey(item) !== key)
                : current.map((item) =>
                    cartKey(item) === key ? { ...item, quantity } : item,
                  ),
          },
          message: quantity === 0 ? "Item removido." : "Quantidade atualizada.",
        });
      },
      clear: (tenantId) =>
        set({
          carts: { ...get().carts, [tenantId]: [] },
          notes: "",
          message: "",
        }),
      setNotes: (notes) => set({ notes: notes.slice(0, 500) }),
    }),
    {
      name: "mhs-cart-v1",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({ carts: state.carts }),
      merge: (persisted, current) => {
        const value = persisted as { carts?: Record<string, unknown> } | null;
        return {
          ...current,
          carts: Object.fromEntries(
            Object.entries(value?.carts ?? {}).map(([tenantId, lines]) => [
              tenantId,
              readCart(tenantId, lines),
            ]),
          ),
        };
      },
    },
  ),
);
