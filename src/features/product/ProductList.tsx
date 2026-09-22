import { useState } from "react";
import { useProductSearch } from "../sale/useProductSearch";
import { useProductDelete } from "./DeleteProduct";
import { useProductUpdate } from "./UpdateProduct";
import { useLanguage } from "../../i18n/LanguageContext";
import type { Product } from "../../api/products";

interface ProductListProps {
  onProductsChanged: () => void;
}

interface EditForm {
  nom: string;
  code_barre: string;
  prix_vente: string;
  prix_achat: string;
  seuil_reappro: string;
  quantite: string; // add this
}

function toEditForm(p: Product): EditForm {
  return {
    nom: p.nom,
    code_barre: p.code_barre ?? "",
    prix_vente: String(p.prix_vente),
    prix_achat: String(p.prix_achat),
    seuil_reappro: String(p.seuil_reappro),
    quantite: String(p.quantite), // add this
  };
}

export function ProductList({ onProductsChanged }: ProductListProps) {
  const { t } = useLanguage();
  const { nom, setNom, prixMin, setPrixMin, prixMax, setPrixMax, results, searched, refetch } = useProductSearch();
  const { removeProduct, error: deleteError, isDeleting } = useProductDelete(() => {
    onProductsChanged();
    refetch();
  });
  const { editProduct, error: updateError, isUpdating } = useProductUpdate(() => {
    onProductsChanged();
    refetch();
    setEditingId(null);
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const searchInputStyle = {
    background: "var(--gesso-surface)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
    color: "var(--gesso-fg)",
  };

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditForm(toEditForm(p));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function saveEdit(id: string) {
  if (!editForm) return;
  const original = results.find((r) => r.id === id);
  const prixVente = parseFloat(editForm.prix_vente);
  const prixAchat = parseFloat(editForm.prix_achat);
  const seuilReappro = parseFloat(editForm.seuil_reappro);
  const newQuantite = parseFloat(editForm.quantite);

  if (
    !editForm.nom.trim() ||
    isNaN(prixVente) ||
    isNaN(prixAchat) ||
    isNaN(seuilReappro) ||
    isNaN(newQuantite) ||
    !original
  ) {
    return;
  }

  const delta = newQuantite - original.quantite;

  editProduct(
    id,
    {
      nom: editForm.nom.trim(),
      code_barre: editForm.code_barre.trim() || null,
      prix_vente: prixVente,
      prix_achat: prixAchat,
      seuil_reappro: seuilReappro,
    },
    delta
  );
}
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
        {(deleteError || updateError) && (
          <p
            style={{
              background: "rgba(91,63,228,0.1)",
              color: "var(--gesso-error)",
              fontFamily: "var(--gesso-font-body)",
            }}
            className="mb-4 rounded-lg px-3 py-2 text-sm font-medium"
          >
            {deleteError || updateError}
          </p>
        )}

        {searched && results.length === 0 && (
          <p style={{ color: "var(--gesso-fg-muted)" }} className="text-sm">
            {t("productNotFound")}
          </p>
        )}

        {results.length > 0 && (
          <ul className="flex flex-col gap-2">
            {results.map((p) => {
              const isEditing = editingId === p.id;

              if (isEditing && editForm) {
                return (
                  <li
                    key={p.id}
                    style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <input
                      value={editForm.nom}
                      onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      placeholder={t("productName")}
                      style={searchInputStyle}
                      className="w-full px-3 py-2 text-sm outline-none"
                    />
                    <input
                      value={editForm.code_barre}
                      onChange={(e) => setEditForm({ ...editForm, code_barre: e.target.value })}
                      placeholder={t("barcode")}
                      style={searchInputStyle}
                      className="w-full px-3 py-2 text-sm outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editForm.prix_vente}
                        onChange={(e) => setEditForm({ ...editForm, prix_vente: e.target.value })}
                        placeholder={t("sellPrice")}
                        style={searchInputStyle}
                        className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                      />
                      <input
                        type="number"
                        value={editForm.prix_achat}
                        onChange={(e) => setEditForm({ ...editForm, prix_achat: e.target.value })}
                        placeholder={t("buyPrice")}
                        style={searchInputStyle}
                        className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                      />
          
                      <input
                        type="number"
                        value={editForm.quantite}
                        onChange={(e) => setEditForm({ ...editForm, quantite: e.target.value })}
                        placeholder={t("quantity")}
                        style={searchInputStyle}
                        className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEdit}
                        disabled={isUpdating}
                        style={{ borderRadius: "var(--gesso-radius-md)", color: "var(--gesso-fg-muted)" }}
                        className="px-3 py-1.5 text-sm font-medium transition active:scale-95"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        onClick={() => saveEdit(p.id)}
                        disabled={isUpdating}
                        style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
                        className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                      >
                        {isUpdating ? "..." : t("save")}
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={p.id}
                  style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span style={{ fontFamily: "var(--gesso-font-body)", color: "var(--gesso-fg)" }} className="text-sm">
                    {p.nom} — {p.prix_vente} DA — stock: {p.quantite}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
                      className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => removeProduct(p.id)}
                      disabled={isDeleting}
                      style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
                      className="px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                    >
                      {isDeleting ? "..." : t("delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}