import { useState, useEffect } from "react";
import { getProducts, Product } from "./api/products";
import { AddProductCard } from "./features/product/AddProductCard";
import { SaleCard } from "./features/sale/SaleCard";
import "./App.css";
import { useLanguage } from "./i18n/LanguageContext";

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
    </main>
  );
}

export default App;
