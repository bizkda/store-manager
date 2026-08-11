import { useState, useEffect } from "react";
import { getProducts, Product } from "./api/products";
import { checkout, NewSale } from "./api/sales";
import { addProduct } from "./api/products";

interface CartItem {
  product: Product;
  quantite: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProducts().then(setProducts).catch((e) => setMessage(String(e)));
  }, []);

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
      setMessage(`Vente enregistrée: ${receipt.total} (${receipt.id})`);
      setCart([]);
      getProducts().then(setProducts); // rafraîchir le stock affiché
    } catch (e) {
      setMessage(`Erreur: ${e}`);
    }
  }
  async function handleAddTestProduct() {
  await addProduct({
    nom: "Coca Cola 33cl",
    code_barre: "5449000000996",
    prix_vente: 1.5,
    prix_achat: 0.9,
    quantite: 50,
    seuil_reappro: 5,
  });
  getProducts().then(setProducts);
}

  return (
    <main style={{ padding: 20 }}>
      <h1>Point de vente</h1>

      {message && <p>{message}</p>}

      <h2>Produits ({products.length})</h2>
      {products.length === 0 && <p>Aucun produit — ajoute-en un directement en SQLite pour tester.</p>}
      <button onClick={handleAddTestProduct}>+ Ajouter produit test</button>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.nom} — {p.prix_vente} — stock: {p.quantite}
            <button onClick={() => addToCart(p)} style={{ marginLeft: 10 }}>
              Ajouter au panier
            </button>
          </li>
        ))}
      </ul>

      <h2>Panier ({cart.length})</h2>
      <ul>
        {cart.map((i) => (
          <li key={i.product.id}>
            {i.product.nom} x{i.quantite} = {(i.quantite * i.product.prix_vente).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total: {total.toFixed(2)}</p>
      {cart.length > 0 && <button onClick={handleCheckout}>Checkout</button>}
    </main>
  );
}

export default App;