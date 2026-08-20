import { useState, useEffect } from "react";
import { getProductByBarcode, Product } from "../../api/products";
import { checkout, NewSale } from "../../api/sales";
import { scan, cancel, Format, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";
import { useProductSearch } from "./useProductSearch";
import { useLanguage } from "../../i18n/LanguageContext";

interface CartItem {
  product: Product;
  quantite: number;
}

interface SaleCardProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onSaleComplete: () => void;
  onNavigateToAddProduct: () => void;
}


export function SaleCard({ cart, setCart, onSaleComplete, onNavigateToAddProduct }: SaleCardProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results, searched } = useProductSearch();
  const [scannedNotFound, setScannedNotFound] = useState(false);

  async function startScan() {
    setScanning(true);
    try {
      const permission = await requestPermissions();
      if (permission !== "granted") {
        setMessage(t("cameraPermissionDenied"));
        setScanning(false);
        return;
      }
      const result = await scan({
        windowed: true,
        formats: [Format.EAN13, Format.EAN8],
      });

      const product = await getProductByBarcode(result.content);
      if (product) {
        addToCart(product);
        setMessage(`${product.nom} ${t("addedToCart")}`);
        setScannedNotFound(false);
      } else {
        setMessage("");
        setScannedNotFound(true);
      }
    } catch (e: any) {
      console.error("Scan échoué:", e?.message);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function scanLoop() {
      while (active) {
        await startScan();
        await new Promise((resolve) => setTimeout(resolve, 200));
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

  function updateQuantity(productId: string, newQuantite: number) {
    setCart((prev) => {
      if (newQuantite <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantite: newQuantite } : i
      );
    });
  }

  const total = cart.reduce((sum, i) => sum + i.quantite * i.product.prix_vente, 0);

  async function handleCheckout() {
    const sale: NewSale = {
      items: cart.map((i) => ({
        produit_id: i.product.id,
        quantite: i.quantite,
        prix_unitaire: i.product.prix_vente,
      })),
    };
    try {
      const receipt = await checkout(sale);
      setMessage(`${t("saleRecorded")}: ${receipt.total} DA`);
      setCart([]);
      onSaleComplete();
    } catch (e) {
      setMessage(`${t("error")}: ${e}`);
    }
  }

  const searchInputStyle = {
    background: "var(--gesso-surface)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
    color: "var(--gesso-fg)",
  };

  return (
    <div className="flex h-screen flex-col" >
      {/* Zone caméra */}
      <div className="relative h-1/5 min-h-0 overflow-hidden">
        {scanning && (
          <p
            style={{ fontFamily: "var(--gesso-font-body)" }}
            className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-lg"
          >
            {t("scanPrompt")}
          </p>
        )}
        {!scanning && (
          <button
            type="button"
            onClick={startScan}
            style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm font-medium text-white"
          >
            🔄 {t("retryScan")}
          </button>
        )}
      </div>



      {/* Fiche vente */}
      <div
        style={{
          background: "var(--gesso-canvas)",
          borderTopLeftRadius: "var(--gesso-radius-lg)",
          borderTopRightRadius: "var(--gesso-radius-lg)",
          boxShadow: "var(--gesso-shadow-lg)",
        }}
        className="flex h-4/5 min-h-0 flex-col"
      >
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--gesso-divider)" }} className="shrink-0 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2
              style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
              className="text-xl"
            >
              {t("makeSale")}
            </h2>
          </div>

          {message && (
            <p
              style={{
                background: "rgba(91,63,228,0.1)",
                color: "var(--gesso-primary)",
                fontFamily: "var(--gesso-font-body)",
              }}
              className="mt-2 rounded-lg px-3 py-2 text-sm font-medium"
            >
              {message}
            </p>
          )}

          {scannedNotFound && (
            <p
              style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }}
              className="mt-2 text-sm"
            >
              {t("unknownProduct")} —{" "}
              <button
                type="button"
                onClick={onNavigateToAddProduct}
                style={{ color: "var(--gesso-primary)", fontFamily: "var(--gesso-font-body)" }}
                className="font-bold underline"
              >
                {t("addIt")}
              </button>
            </p>
          )}
        </div>
        {/* Barre de recherche */}

        <div
          style={{ background: "var(--gesso-canvas)" }}
          className="flex flex-col gap-2 px-6 py-3"
        >
          {/* Nom */}
          <h3
            style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
            className="mb-2 text-xs uppercase tracking-wide"
          >
            {t("search")}
          </h3>

          <div className="">
            <input
              placeholder={t("searchPlaceholder")}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={searchInputStyle}
              className="w-full px-3 py-2 text-sm outline-none"
            />
          </div>

          {/* Prix */}
          <div className="flex gap-2 w-full">
            <input
              placeholder={t("priceMin")}
              type="number"
              value={prixMin}
              onChange={(e) => setPrixMin(e.target.value)}
              style={searchInputStyle}
              className="flex-1 min-w-0 px-3 py-2 text-sm outline-none"
            />

            <input
              placeholder={t("priceMax")}
              type="number"
              value={prixMax}
              onChange={(e) => setPrixMax(e.target.value)}
              style={searchInputStyle}
              className="flex-1 min-w-0 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">

            <>
              <h3
                style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
                className="mb-2 text-xs uppercase tracking-wide"
              >
                {t("products")}
              </h3>
              {searched && results.length === 0 && (
                <p style={{ color: "var(--gesso-fg-muted)" }} className="text-sm">
                  {t("productNotFound")} —{" "}
                  <button
                    type="button"
                    onClick={onNavigateToAddProduct}
                    style={{ color: "var(--gesso-primary)", fontFamily: "var(--gesso-font-body)" }}
                    className="font-bold underline"
                  >
                    {t("addIt")}
                  </button>
                </p>
              )}
            {results.length > 0 && (
              <ul className="flex flex-col gap-2">
                {results.map((p) => (
                  <li
                    key={p.id}
                    style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg)" }} className="text-sm">
                      {p.nom} — {p.prix_vente} DA — stock: {p.quantite}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
                      className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                    >
                      {t("add")}
                    </button>
                  </li>
                ))}
              </ul>
              )}


          </>

          <h3
  style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
  className="mb-2 mt-6 text-xs uppercase tracking-wide"
>
  {t("cart")}
</h3>

{cart.length === 0 ? (
  <p style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }} className="text-sm">
    {t("emptyCart")}
  </p>
) : (
  <ul className="flex flex-col gap-2">
    {cart.map((i) => (
      <li
        key={i.product.id}
        style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
        className="flex flex-col gap-2 px-4 py-3 text-sm"
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg)" }}>
            {i.product.nom}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuantity(i.product.id, i.quantite - 1)}
              style={{ background: "var(--gesso-surface-elevated)", color: "var(--gesso-fg)" }}
              className="h-7 w-7 rounded-full text-base font-bold"
            >
              −
            </button>

            <input
              type="number"
              value={i.quantite}
              onChange={(e) => updateQuantity(i.product.id, parseFloat(e.target.value) || 0)}
              style={{
                background: "var(--gesso-surface-elevated)",
                borderRadius: "var(--gesso-radius-md)",
                fontFamily: "var(--gesso-font-body)",
                color: "var(--gesso-fg)",
              }}
              className="w-12 px-1 py-1 text-center text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => updateQuantity(i.product.id, i.quantite + 1)}
              style={{ background: "var(--gesso-secondary)" }}
              className="h-7 w-7 rounded-full text-base font-bold text-white"
            >
              +
            </button>
          </div>
        </div>

        <span
          style={{
            fontFamily: "var(--gesso-font-body)",
            color: "var(--gesso-fg)",
            fontWeight: 700,
            textAlign: "right",
          }}
        >
          {(i.quantite * i.product.prix_vente).toFixed(2)}
        </span>
      </li>
    ))}
  </ul>
)}
        </div>

        {/* Footer checkout */}
        <div
          style={{ borderTop: "1px solid var(--gesso-divider)", background: "var(--gesso-canvas)" }}
          className="shrink-0 p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }} className="text-base">
              {t("total")}
            </span>
            <span
              style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
              className="text-2xl"
            >
              {total.toFixed(2)}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleCheckout}
              style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
              className="w-full py-4 text-base font-bold text-white transition active:scale-95"
            >
              {t("checkout")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
