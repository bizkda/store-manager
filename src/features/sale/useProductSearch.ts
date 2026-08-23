import { useState, useEffect, useCallback } from "react";
import { Product, searchProducts } from "../../api/products";

export function useProductSearch() {
  const [nom, setNom] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    const hasQuery = nom.trim() !== "" || prixMin !== "" || prixMax !== "";
    if (!hasQuery) {
      setResults([]);
      setSearched(false);
      return;
    }
    const found = await searchProducts(
      nom || undefined,
      prixMin ? parseFloat(prixMin) : undefined,
      prixMax ? parseFloat(prixMax) : undefined
    );
    setResults(found);
    setSearched(true);
  }, [nom, prixMin, prixMax]);

  useEffect(() => {
    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [runSearch]);

  return { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results, searched, refetch: runSearch };
}