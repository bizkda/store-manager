import { useProductSearch } from "../sale/useProductSearch";
import { useProductDelete } from "./DeleteProduct";
import { useLanguage } from "../../i18n/LanguageContext";

interface ProductListProps {
  onProductsChanged: () => void;
}

export function ProductList({ onProductsChanged }: ProductListProps) {
  const { t } = useLanguage();
  const { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results, searched, refetch } = useProductSearch();
  const { removeProduct } = useProductDelete(() => {
    onProductsChanged();
    refetch();
  });

  const searchInputStyle = {
    background: "var(--gesso-surface)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
    color: "var(--gesso-fg)",
  };

  return (
    <>
      <div style={{ background: "var(--gesso-canvas)" }} className="flex flex-col gap-2 px-6 py-3">
        <h3
          style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
          className="mb-2 text-xs uppercase tracking-wide"
        >
          {t("search")}
        </h3>

        <input
          placeholder={t("searchPlaceholder")}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={searchInputStyle}
          className="w-full px-3 py-2 text-sm outline-none"
        />

        <div className="flex w-full gap-2">
          <input
            placeholder={t("priceMin")}
            type="number"
            value={prixMin}
            onChange={(e) => setPrixMin(e.target.value)}
            style={searchInputStyle}
            className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          />
          <input
            placeholder={t("priceMax")}
            type="number"
            value={prixMax}
            onChange={(e) => setPrixMax(e.target.value)}
            style={searchInputStyle}
            className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <h3
          style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 700, color: "var(--gesso-fg-muted)" }}
          className="mb-2 text-xs uppercase tracking-wide"
        >
          {t("products")}
        </h3>

        {searched && results.length === 0 && (
          <p style={{ color: "var(--gesso-fg-muted)" }} className="text-sm">
            {t("productNotFound")}
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
                  onClick={() => removeProduct(p.id)}
                  style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
                  className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                >
                  {t("delete") ?? "Supprimer"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}