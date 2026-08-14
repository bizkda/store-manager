import { useState } from "react";
import { addProduct, Product } from "../../api/products";
import { scan, Format, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";

interface AddProductCardProps {
  onProductAdded: () => void;
}

export function AddProductCard({ onProductAdded }: AddProductCardProps) {
  const [nom, setNom] = useState("");
  const [codeBarre, setCodeBarre] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [quantite, setQuantite] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addProduct({
      nom,
      code_barre: codeBarre || null,
      prix_vente: parseFloat(prixVente) || 0,
      prix_achat: parseFloat(prixAchat) || 0,
      quantite: parseFloat(quantite) || 0,
      seuil_reappro: 5,
    });
    setNom("");
    setCodeBarre("");
    setPrixVente("");
    setPrixAchat("");
    setQuantite("");
    onProductAdded();
  }

async function handleScan() {
  try {
    const permission = await requestPermissions();
    if (permission !== "granted") {
      console.error("Permission caméra refusée");
      return;
    }

    const result = await scan({
      windowed: false,
      formats: [Format.EAN13, Format.EAN8, Format.QRCode],
    });
    setCodeBarre(result.content);
  } catch (e: any) {
    console.error("Scan échoué:", e?.message);
  }
}

  return (
  <div className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="mb-4 text-lg font-semibold text-gray-800">Ajouter un produit</h2>
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        placeholder="Nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        required
        className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <input
        placeholder="Code-barre"
        value={codeBarre}
        onChange={(e) => setCodeBarre(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleScan}
        className="rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white active:scale-95 transition"
      >
        📷 Scanner
      </button>
      <input
        placeholder="Prix vente"
        type="number"
        value={prixVente}
        onChange={(e) => setPrixVente(e.target.value)}
        required
        className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <input
        placeholder="Prix achat"
        type="number"
        value={prixAchat}
        onChange={(e) => setPrixAchat(e.target.value)}
        required
        className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <input
        placeholder="Quantité"
        type="number"
        value={quantite}
        onChange={(e) => setQuantite(e.target.value)}
        required
        className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white active:scale-95 transition"
      >
        Ajouter
      </button>
    </form>
  </div>
);
}