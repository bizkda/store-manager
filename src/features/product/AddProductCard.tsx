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

  const inputStyle = {
    background: "var(--gesso-surface)",
    border: "1px solid var(--gesso-neutral-300)",
    borderRadius: "var(--gesso-radius-md)",
    fontFamily: "var(--gesso-font-body)",
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Moitié haute — transparente, la caméra native est visible derrière */}
      <div className="relative h-1/5 min-h-0 overflow-hidden bg-transparent">
        {scanning && (
          <p
            style={{ fontFamily: "var(--gesso-font-body)" }}
            className="absolute top-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-lg "
          >
            Visez le code-barre du produit
          </p>
        )}
        {!scanning && !codeBarre && (
          <button
            type="button"
            onClick={startScan}
            style={{ background: "var(--gesso-primary)", borderRadius: "var(--gesso-radius-md)" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm font-medium text-white "
          >
            🔄 Réessayer le scan
          </button>
        )}
      </div>

      {/* Moitié basse — fiche produit, style carte du design system */}
      <div
        style={{
          background: "var(--gesso-canvas)",
          borderTopLeftRadius: "var(--gesso-radius-lg)",
          borderTopRightRadius: "var(--gesso-radius-lg)",
          boxShadow: "var(--gesso-shadow-lg)",
        }}
        className="flex h-4/5 min-h-0 flex-col overflow-y-auto p-6 "
      >
        <h2
          style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }}
          className="mb-4 text-xl"
        >
          Ajouter un produit
        </h2>

        {codeBarre && (
          <p
            style={{ background: "rgba(20,147,67,0.1)", color: "var(--gesso-success)", fontFamily: "var(--gesso-font-body)" }}
            className="mb-4 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Code scanné: {codeBarre}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={inputStyle}
            className="px-4 py-4 text-base outline-none"
          />
          <input
            placeholder="Code-barre"
            value={codeBarre}
            onChange={(e) => setCodeBarre(e.target.value)}
            style={inputStyle}
            className="px-4 py-4 text-base outline-none"
          />
          <input
            placeholder="Prix vente"
            type="number"
            value={prixVente}
            onChange={(e) => setPrixVente(e.target.value)}
            required
            style={inputStyle}
            className="px-4 py-4 text-base outline-none"
          />
          <input
            placeholder="Prix achat"
            type="number"
            value={prixAchat}
            onChange={(e) => setPrixAchat(e.target.value)}
            required
            style={inputStyle}
            className="px-4 py-4 text-base outline-none"
          />
          <input
            placeholder="Quantité"
            type="number"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            required
            style={inputStyle}
            className="px-4 py-4 text-base outline-none"
          />
          <button
            type="submit"
            style={{
              background: "var(--gesso-primary)",
              borderRadius: "var(--gesso-radius-md)",
              fontFamily: "var(--gesso-font-body)",
            }}
            className="mt-2 py-4 text-base font-bold text-white active:scale-95 transition"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}