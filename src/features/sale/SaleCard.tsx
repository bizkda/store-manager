import { useState } from "react";
import { Product } from "../../api/products";
import { checkout, NewSale } from "../../api/sales";

interface CartItem {
  product: Product;
  quantite: number;
}

interface SaleCardProps {
  products: Product[];
  onSaleComplete: () => void;
}

export function SaleCard({ products, onSaleComplete }: SaleCardProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantite: i.quantite + 1 } : i
        );
      }
      return [...prev, { product, quantite: 1 }];
    });
  }

  const total = cart.reduce((sum, i) => sum + i.quantite * i.product.prix_vente, 0);

  async function handleCheckout() {
    const sale: NewSale = {
      mode_paiement: "cash",
      items: cart.map((i) => ({
        produit_id: i.product.id,
        quantite: i.quantite,
        prix_unitaire: i.product.prix_vente,
      })),
    };
    try {
      const receipt = await checkout(sale);
      setMessage(`Vente enregistrée: ${receipt.total}`);
      setCart([]);
      onSaleComplete();
    } catch (e) {
      setMessage(`Erreur: ${e}`);
    }
  }

  return (
  <div className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="mb-2 text-lg font-semibold text-gray-800">Commencer une vente</h2>
    {message && (
      <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</p>
    )}

    <ul className="flex flex-col gap-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
        >
          <span className="text-sm text-gray-700">
            {p.nom} — {p.prix_vente} — stock: {p.quantite}
          </span>
          <button
            onClick={() => addToCart(p)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white active:scale-95 transition"
          >
            Ajouter
          </button>
        </li>
      ))}
    </ul>

    <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">Panier</h3>
    <ul className="flex flex-col gap-1">
      {cart.map((i) => (
        <li key={i.product.id} className="flex justify-between text-sm text-gray-600">
          <span>{i.product.nom} x{i.quantite}</span>
          <span>{(i.quantite * i.product.prix_vente).toFixed(2)}</span>
        </li>
      ))}
    </ul>

    <p className="mt-3 text-right text-lg font-bold text-gray-800">
      Total: {total.toFixed(2)}
    </p>

    {cart.length > 0 && (
      <button
        onClick={handleCheckout}
        className="mt-4 w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white active:scale-95 transition"
      >
        Checkout
      </button>
    )}
  </div>
);
}