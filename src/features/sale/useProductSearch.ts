import { useState, useEffect } from "react";
import { Product, searchProducts } from "../../api/products";

export function useProductSearch() {
  const [nom, setNom] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const hasQuery = nom.trim() !== "" || prixMin !== "" || prixMax !== "";

    if (!hasQuery) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const found = await searchProducts(
        nom || undefined,
        prixMin ? parseFloat(prixMin) : undefined,
        prixMax ? parseFloat(prixMax) : undefined
      );
      setResults(found);
    }, 300);

    return () => clearTimeout(timeout);
  }, [nom, prixMin, prixMax]);

  return { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results };
}