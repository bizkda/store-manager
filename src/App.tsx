import { useState, useEffect } from "react";
import { getProducts, Product , syncWithPeer} from "./api/products";
import { AddProductCard } from "./features/product/AddProductCard";
import { SaleCard } from "./features/sale/SaleCard";
import "./App.css";
import { useLanguage } from "./i18n/LanguageContext";
import { useTheme } from "./theme/useTheme";


type View = "menu" | "add-product" | "sale";

interface CartItem {
  product: Product;
  quantite: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<View>("menu");
  const [previousView, setPreviousView] = useState<View>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [peerIp, setPeerIp] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  async function handleSync() {
    try {
      const result = await syncWithPeer(peerIp);
      setSyncMessage(result);
    } catch (e) {
      setSyncMessage(`Erreur sync: ${e}`);
    }
  }

  function refreshProducts() {
    getProducts().then(setProducts).catch(console.error);
  }
  useEffect(refreshProducts, []);

  useEffect(() => {
    function handlePopState() {
      setView("menu");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateTo(newView: View) {
    window.history.pushState({ view: newView }, "");
    setView(newView);
  }

  function goToAddProduct(from: View) {
    setPreviousView(from);
    navigateTo("add-product");
  }

  function handleProductAdded() {
    refreshProducts();
    navigateTo(previousView);
  }

  if (view === "add-product") {
    return (
      <main>
        <button
          onClick={() => setView("menu")}
          style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-primary)" }}
          className="mb-4 mt-6 flex items-center gap-1 text-base font-bold"
        >
          ← {t("back")}
        </button>
        <AddProductCard onProductAdded={handleProductAdded} />
      </main>
    );
  }

  if (view === "sale") {
    return (
      <main>
        <button
          onClick={() => setView("menu")}
          style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-primary)" }}
          className="mb-4 mt-6 flex items-center gap-1 text-base font-bold"
        >
          ← {t("back")}
        </button>
        <SaleCard
          products={products}
          cart={cart}
          setCart={setCart}
          onSaleComplete={() => {
            refreshProducts();
            setCart([]); // vide le panier seulement après un checkout réussi
          }}
          onNavigateToAddProduct={() => goToAddProduct("sale")}
        />
      </main>
    );
  }

  return (
    <main style={{ background: "var(--gesso-canvas)" }} className="min-h-screen px-6 pt-10 pb-6">

      <div className="mb-8">
       <div className="flex items-center justify-between w-full">
          <p
            style={{
              fontFamily: "var(--gesso-font-body)",
              color: "var(--gesso-fg-muted)",
            }}
            className="text-sm"
          >
            {t("bonjour")}
          </p>
          <div>
            <button
              onClick={toggleLang}
              style={{
                background: "var(--gesso-surface)",
                color: "var(--gesso-primary)",
                borderRadius: "var(--gesso-radius-md)",
                fontFamily: "var(--gesso-font-body)",
              }}
              className="px-3 py-1.5 text-xs font-bold transition active:scale-95"
            >
              {lang === "fr" ? "AR" : "FR"}
            </button>
            <button onClick={toggleTheme}
              style={{
                background: "var(--gesso-surface)",
                color: "var(--gesso-primary)",
                borderRadius: "var(--gesso-radius-md)",
                fontFamily: "var(--gesso-font-body)",
              }}
              className="px-3 py-1.5 text-xs font-bold transition active:scale-95"
                >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
                
        <h1 style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }} className="text-3xl">
          {t("storeManager")}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => goToAddProduct("menu")}
          style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
          className="flex flex-col items-start gap-3 p-5 text-left shadow-sm active:scale-95 transition"
        >
          <span className="text-3xl">📦</span>
          <div>
            <div style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }} className="text-white text-lg leading-tight">
              {t("addProduct")}
            </div>
            <div className="text-white/80 text-xs mt-1">{t("addProductSubtitle")}</div>
          </div>
        </button>
        <button
          onClick={() => navigateTo("sale")}
          style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
          className="flex flex-col items-start gap-3 p-5 text-left shadow-sm active:scale-95 transition"
        >
          <span className="text-3xl">🛒</span>
          <div>
            <div style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }} className="text-white text-lg leading-tight">
              {t("makeSale")}
            </div>
            <div className="text-white/80 text-xs mt-1">{t("makeSaleSubtitle")}</div>
          </div>
        </button>
      </div>

      <p style={{ fontFamily: "var(--gesso-font-body)" }} className="mt-8 mb-3 text-xs font-bold uppercase tracking-wide">
        {t("today")}
      </p>
      <div style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }} className="p-4">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm">{t("stockedProducts")}</span>
          <span style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }} className="text-lg">
            {products.length}
          </span>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-slate-800">
      Synchronisation
    </h3>
    <p className="mt-1 text-sm text-slate-500">
      Connectez-vous à un autre appareil pour synchroniser les données.
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row">
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        🌐
      </span>

      <input
        type="text"
        placeholder="Adresse IP de l'autre appareil"
        value={peerIp}
        onChange={(e) => setPeerIp(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
      />
    </div>

    <button
      onClick={handleSync}
      disabled={!peerIp.trim()}
      className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      Synchroniser
    </button>
  </div>

  {syncMessage && (
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <span>✓</span>
      <p>{syncMessage}</p>
    </div>
  )}
</div>
    </main>
  );
}

export default App;
