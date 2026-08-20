import { useState, useEffect } from "react";
import { addProduct, getProductByBarcode , restockProduct ,Product} from "../../api/products";
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
  const [message, setMessage] = useState("");
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [restockPrixVente, setRestockPrixVente] = useState("");
  const [restockPrixAchat, setRestockPrixAchat] = useState("");
  const [restockQte, setRestockQte] = useState("");

  

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
      formats: [Format.EAN13, Format.EAN8],
    });
    setCodeBarre(result.content);

    const existing = await getProductByBarcode(result.content);
    setExistingProduct(existing);

    if (existing) {
      setMessage(`Ce produit existe déjà : ${existing.nom}`);
      setRestockPrixVente(existing.prix_vente.toString());
      setRestockPrixAchat(existing.prix_achat.toString());
    } else {
      setMessage("");
    }
  } catch (e: any) {
    console.error("Scan échoué:", e?.message);
  } finally {
    setScanning(false);
  }
}

async function handleRestock(e: React.FormEvent) {
  e.preventDefault();
  if (!existingProduct) return;
  await restockProduct(
    existingProduct.id,
    parseFloat(restockPrixVente) || existingProduct.prix_vente,
    parseFloat(restockPrixAchat) || existingProduct.prix_achat,
    parseFloat(restockQte) || 0
  );
  setExistingProduct(null);
  setCodeBarre("");
  setMessage("");
  setRestockQte("");
  onProductAdded();
}

 useEffect(() => {
    let active = true;

    async function scanLoop() {
      while (active) {
        await startScan();
        await new Promise((resolve) => setTimeout(resolve, 9000));
      }
    }

    scanLoop();

    return () => {
      active = false;
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
        {!scanning && !codeBarre && message &&  (
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

        {codeBarre && !message && (
          <p
            style={{ background: "rgba(20,147,67,0.1)", color: "var(--gesso-success)", fontFamily: "var(--gesso-font-body)" }}
            className="mb-4 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Code scanné: {codeBarre}
          </p>
        )}

          {message && (
            <p
              style={{
                background: "rgba(91,63,228,0.1)",
                color: "var(--gesso-primary)",
                fontFamily: "var(--gesso-font-body)",
              }}
              className="mb-4 rounded-lg px-3 py-2 text-sm font-medium"
            >
              {message}
            </p>
          )}
        {existingProduct ? (
  <form onSubmit={handleRestock} className="flex flex-col gap-3">
    <div style={{ background: "var(--gesso-surface)", borderRadius: "var(--gesso-radius-md)" }} className="p-4">
      <p style={{ fontFamily: "var(--gesso-font-display)", fontWeight: 900, color: "var(--gesso-fg)" }} className="text-lg">
        {existingProduct.nom}
      </p>
      <p style={{ color: "var(--gesso-fg-muted)" }} className="text-sm">
        Stock actuel : {existingProduct.quantite}
      </p>
    </div>

    <input
      placeholder="Prix vente"
      type="number"
      value={restockPrixVente}
      onChange={(e) => setRestockPrixVente(e.target.value)}
      style={inputStyle}
      className="px-4 py-4 text-base outline-none"
    />
    <input
      placeholder="Prix achat"
      type="number"
      value={restockPrixAchat}
      onChange={(e) => setRestockPrixAchat(e.target.value)}
      style={inputStyle}
      className="px-4 py-4 text-base outline-none"
    />
    <input
      placeholder="Quantité à ajouter"
      type="number"
      value={restockQte}
      onChange={(e) => setRestockQte(e.target.value)}
      required
      style={inputStyle}
      className="px-4 py-4 text-base outline-none"
    />

    <button
      type="submit"
      style={{ background: "var(--gesso-secondary)", borderRadius: "var(--gesso-radius-md)" }}
      className="mt-2 py-4 text-base font-bold text-white active:scale-95 transition"
    >
      Mettre à jour
    </button>
  </form>
) : (
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
)}

       
      </div>
    </div>
  );
}