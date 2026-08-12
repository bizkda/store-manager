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
    <div className="card">
      <h2>Commencer une vente</h2>
      {message && <p>{message}</p>}

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.nom} — {p.prix_vente} — stock: {p.quantite}
            <button onClick={() => addToCart(p)}>Ajouter</button>
          </li>
        ))}
      </ul>

      <h3>Panier</h3>
      <ul>
        {cart.map((i) => (
          <li key={i.product.id}>
            {i.product.nom} x{i.quantite} = {(i.quantite * i.product.prix_vente).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total: {total.toFixed(2)}</p>
      {cart.length > 0 && <button onClick={handleCheckout}>Checkout</button>}
    </div>
  );
}