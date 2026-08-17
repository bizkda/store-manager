import { useState, useEffect } from "react";
import { getProducts, Product } from "./api/products";
import { AddProductCard } from "./features/product/AddProductCard";
import { SaleCard } from "./features/sale/SaleCard";
import "./App.css";

type View = "menu" | "add-product" | "sale" ;

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<View>("menu");

  function refreshProducts() {
    getProducts().then(setProducts).catch(console.error);
  }

  useEffect(refreshProducts, []);
  // the views thta the app has
  if (view === "add-product") {
    return (
      <main>
        <button
          onClick={() => setView("menu")}
          style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-primary)" }}
          className="mb-4 mt-6 flex items-center gap-1 text-base font-bold"
        >
          ← Retour
        </button>
        <AddProductCard onProductAdded={refreshProducts}/>
    
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
          ← Retour
        </button>
        <SaleCard products={products} onSaleComplete={refreshProducts} />
      </main>
    );
  }


 return (
  <main
    style={{ background: "var(--gesso-canvas)" }}
    className="min-h-screen px-6 pt-10 pb-6"
  >
    <div className="mb-8">
      <p style={{ fontFamily: "var(--gesso-font-body)" }} className="text-sm ">
        Bonjour!!!!!!!!!!!!!!!!!!!
      </p>
      <h1
        style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }}
        className="text-3xl "
      >
        Store Manager
      </h1>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => setView("add-product")}
        style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
        className="flex flex-col items-start gap-3 p-5 text-left shadow-sm active:scale-95 transition"
      >
        <span className="text-3xl">📦</span>
        <div>
          <div
            style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }}
            className="text-white text-lg leading-tight"
          >
            Ajouter un produit
          </div>
          <div className="text-white/80 text-xs mt-1">Nouveau dans le stock</div>
        </div>
      </button>

      <button
        onClick={() => setView("sale")}
        style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
        className="flex flex-col items-start gap-3 p-5 text-left shadow-sm active:scale-95 transition"
      >
        <span className="text-3xl">🛒</span>
        <div>
          <div
            style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }}
            className="text-white text-lg leading-tight"
          >
            Faire une vente
          </div>
          <div className="text-white/80 text-xs mt-1">Encaisser un client</div>
        </div>
      </button>
    </div>

    <p
      style={{ fontFamily: "var(--gesso-font-body)" }}
      className="mt-8 mb-3 text-xs font-bold uppercase tracking-wide "
    >
      Aujourd'hui
    </p>

    <div
      style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
      className="p-4"
    >
      <div className="flex items-center justify-between py-2">
        <span className="text-sm ">Produits en stock</span>
        <span style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900 }} className="text-lg">
          {products.length}
        </span>
      </div>
    </div>
  </main>
);
}

export default App;