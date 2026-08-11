import { invoke } from "@tauri-apps/api/core";

export interface LigneVenteInput {
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
}

export interface NewSale {
  mode_paiement: string;
  items: LigneVenteInput[];
}

export interface SaleReceipt {
  id: string;
  date_vente: string;
  total: number;
}

export function checkout(sale: NewSale): Promise<SaleReceipt> {
  return invoke("checkout", { sale });
}