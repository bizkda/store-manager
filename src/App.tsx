import { useState, useEffect } from "react";
import { getProducts, Product } from "./api/products";
import { AddProductCard } from "./features/product/AddProductCard";
import { SaleCard } from "./features/sale/SaleCard";

function App() {
  const [products, setProducts] = useState<Product[]>([]);

  function refreshProducts() {
    getProducts().then(setProducts).catch(console.error);
  }

  useEffect(refreshProducts, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Store Manager</h1>
      <AddProductCard onProductAdded={refreshProducts} />
      <SaleCard products={products} onSaleComplete={refreshProducts} />
    </main>
  );
}

export default App;