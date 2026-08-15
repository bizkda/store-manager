import { useState, useEffect } from "react";
import { addProduct } from "../../api/products";
import { scan, cancel, Format, requestPermissions } from "@tauri-apps/plugin-barcode-scanner";

interface AddProductCardProps {
  onProductAdded: () => void;
}

export function AddProductCard({ onProductAdded }: AddProductCardProps) {
  const [nom, setNom] = useState("");
  const [codeBarre, setCodeBarre] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [quantite, setQuantite] = useState("");
  const [scanning, setScanning] = useState(true);

  async function startScan() {
    setScanning(true);
    try {
      const permission = await requestPermissions();
      if (permission !== "granted") {
        console.error("Permission caméra refusée");
        setScanning(false);
        return;
      }
      const result = await scan({
        windowed: true,
        formats: [Format.EAN13, Format.EAN8, Format.QRCode],
      });
      setCodeBarre(result.content);
      setScanning(false);
    } catch (e: any) {
      console.error("Scan échoué:", e?.message);
      setScanning(false);
    }
  }

  useEffect(() => {
    startScan();
    return () => {
      cancel();
    };
  }, []);

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

  return (
    <div className="flex h-screen flex-col">
      {/* Moitié haute — transparente, la caméra native est visible derrière */}
      <div className="relative h-1/2 w-full bg-transparent">
        {scanning && (
          <p className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-lg">
            Visez le code-barre du produit
          </p>
        )}
        {!scanning && !codeBarre && (
          <button
            type="button"
            onClick={startScan}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            🔄 Réessayer le scan
          </button>
        )}
      </div>

      {/* Moitié basse — opaque, recouvre la caméra, contient le formulaire */}
      <div className="h-1/2 w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Ajouter un produit</h2>
        {codeBarre && (
          <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Code scanné: {codeBarre}
          </p>
        )}
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
    </div>
  );
}