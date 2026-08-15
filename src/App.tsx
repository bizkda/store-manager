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
  return <AddProductCard onProductAdded={refreshProducts} />;
}

  if (view === "sale") {
    return (
      <main className="min-h-screen bg-gray-50 p-5">
        <button
          onClick={() => setView("menu")}
          className="mb-4 text-blue-600 font-medium"
        >
          ← Retour
        </button>
        <SaleCard products={products} onSaleComplete={refreshProducts} />
      </main>
    );
  }


  return (
    <main style={{ padding: 60}}>
    <h1 className="text-2xl font-bold text-blue-600 text-center">Store Manager</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 60  , paddingBlockStart: 60}}>
       <button
          onClick={() => setView("sale")}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-5 text-lg font-semibold text-white shadow-md active:scale-95 transition"
        >
          🧾 Commencer une vente
        </button>
        <button
          onClick={() => setView("add-product")}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-5 text-lg font-semibold text-white shadow-md active:scale-95 transition"
        >
          ➕ Ajouter un produit
        </button>
      </div>
    </main>
  );
}

export default App;