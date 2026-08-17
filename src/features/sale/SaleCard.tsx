import { useState, useEffect } from "react";
import { getProductByBarcode, Product } from "../../api/products";
import { checkout, NewSale } from "../../api/sales";
import { scan, cancel ,Format, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";

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
  const [scanning, setScanning] = useState(false);

  async function startScan() {
    setScanning(true);
    try {
      const permission = await requestPermissions();
      if (permission !== "granted") {
        setMessage("Permission caméra refusée");
        setScanning(false);
        return;
      }
      const result = await scan({
        windowed: true,
        formats: [Format.EAN13, Format.EAN8, Format.QRCode],
      });

      const product = await getProductByBarcode(result.content);
      if (product) {
        addToCart(product);
        setMessage(`${product.nom} ajouté au panier`);
      } else {
        setMessage("Aucun produit trouvé pour ce code-barre");
      }
    } catch (e: any) {
      console.error("Scan échoué:", e?.message);
    }finally{
      setScanning(false);
    }
  }

  useEffect(() => {
  let active = true;

  async function scanLoop() {
    while (active) {
      await startScan();
      // petite pause pour éviter une boucle trop rapide et laisser le temps de lire le message
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  scanLoop();

  return () => {
    active = false;
    cancel();
  };
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
      setMessage(`Vente enregistrée: ${receipt.total}`);
      setCart([]);
      onSaleComplete();
    } catch (e) {
      setMessage(`Erreur: ${e}`);
    }
  }

  return (
    <div className="flex h-screen flex-col">
    <div className="relative h-1/5 min-h-0 overflow-hidden bg-transparent">
        {scanning && (
          <p className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-lg">
            Visez le code-barre du produit
          </p>
        )}
        {!scanning && (
          <button
            type="button"
            onClick={startScan}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            🔄 Réessayer le scan
          </button>
        )}
      </div>

    {/* ================= LOWER HALF ================= */}
    <div className="flex h-4/5 min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-5 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Commencer une vente
          </h2>

          {message && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {/* Products */}
        <h3 className="mb-2 text-base font-semibold text-gray-800">
          Produits
        </h3>

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
                type="button"
                onClick={() => addToCart(p)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
              >
                Ajouter
              </button>
            </li>
          ))}
        </ul>

        {/* Cart */}
        <h3 className="mb-2 mt-5 text-base font-semibold text-gray-800">
          Panier
        </h3>

        {cart.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aucun produit dans le panier
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cart.map((i) => (
              <li
                key={i.product.id}
                className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600"
              >
                <span>
                  {i.product.nom} × {i.quantite}
                </span>

                <span className="font-medium">
                  {(i.quantite * i.product.prix_vente).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checkout footer */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-medium text-gray-600">
            Total
          </span>

          <span className="text-xl font-bold text-gray-800">
            {total.toFixed(2)}
          </span>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={handleCheckout}
            className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white transition active:scale-95"
          >
            Checkout
          </button>
        )}
      </div>
    </div>
  </div>
);
}