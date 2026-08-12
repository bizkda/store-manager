import { useState } from "react";
import { addProduct, Product } from "../../api/products";

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

  return (
    <div className="card">
      <h2>Ajouter un produit</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input placeholder="Code-barre" value={codeBarre} onChange={(e) => setCodeBarre(e.target.value)} />
        <input placeholder="Prix vente" type="number" value={prixVente} onChange={(e) => setPrixVente(e.target.value)} required />
        <input placeholder="Prix achat" type="number" value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} required />
        <input placeholder="Quantité" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}