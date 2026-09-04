import { useState, useEffect } from "react";
import { getProducts, Product } from "./api/products";
import { AddProductCard } from "./features/product/AddProductCard";
import { SaleCard } from "./features/sale/SaleCard";
import { PeerManager } from "./features/settings/PeerManager";
import "./App.css";
import { useLanguage } from "./i18n/LanguageContext";
import { useTheme } from "./theme/useTheme";
import { ProductList } from "./features/product/ProductList";


type View = "menu" | "add-product" | "sale" | "settings";

interface CartItem {
  product: Product;
  quantite: number;
}

// add near the top of the file, outside the component
const PAYMENT_DEADLINE = new Date("2027-09-15T23:23:59");

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<View>("menu");
  const [previousView, setPreviousView] = useState<View>("menu");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [pastDeadline] = useState(() => new Date() > PAYMENT_DEADLINE);



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

  if (pastDeadline) {
    return (
      <main
        style={{ background: "var(--gesso-canvas)" }}
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <h1
          style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
          className="text-2xl"
        >
          accessPaused
        </h1>
        <p style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg-muted)" }} className="max-w-md text-sm">
          accessPausedMessage
        </p>
      </main>
    );
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
 if (view === "settings") {
  return (
    <main className="min-h-screen p-6" style={{ background: "var(--gesso-canvas)" }}>
      <button
        onClick={() => setView("menu")}
        style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-primary)" }}
        className="mb-6 flex items-center gap-1 text-base font-bold"
      >
        ← {t("back")}
      </button>

      <h1
        style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
        className="mb-6 text-2xl"
      >
        {t("synchronization")}
      </h1>

      <PeerManager />
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
        <button
        onClick={() => setView("settings")}
        style={{
          background: "green",
          borderRadius: "var(--gesso-radius-md)",
        }}
        className="mt-4 flex w-full flex-col items-start gap-3 p-5 text-left shadow-sm active:scale-95 transition"
      >
        <span className="text-3xl">⚙️</span>

        <div>
          <div
            style={{
              fontFamily: "var(--gesso-font-display)",
              fontWeight: 900,
            }}
            className="text-white text-lg leading-tight"
          >
            {t("synchronizedDevices")}
          </div>

          <div className="text-white/80 text-xs mt-1">
            {t("synchronizedDevicesSubtitle")}
          </div>
        </div>
      </button>
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
      <ProductList onProductsChanged={refreshProducts} />
    </main>
  );
}

export default App;
