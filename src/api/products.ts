import { invoke } from "@tauri-apps/api/core";

export interface Product {
  id: string;
  nom: string;
  code_barre: string | null;
  prix_vente: number;
  prix_achat: number;
  quantite: number;
  seuil_reappro: number;
}

export interface NewProduct {
  nom: string;
  code_barre: string | null;
  prix_vente: number;
  prix_achat: number;
  quantite: number;
  seuil_reappro: number;
}

export function searchProducts(
  nom?: string,
  prixMin?: number,
  prixMax?: number
): Promise<Product[]> {
  return invoke("search_products", {
    nom: nom || null,
    prixMin: prixMin ?? null,
    prixMax: prixMax ?? null,
  });
}
export function restockProduct(
  produitId: string,
  prixVente: number,
  prixAchat: number,
  quantiteAjoutee: number
): Promise<void> {
  return invoke("restock_product", { produitId, prixVente, prixAchat, quantiteAjoutee });
}
export interface ProductUpdate {
  nom: string;
  code_barre: string | null;
  prix_vente: number;
  prix_achat: number;
  seuil_reappro: number;
}

export function updateProduct(id: string, product: ProductUpdate): Promise<void> {
  return invoke("update_product", { id, product });
}

export function getProducts(): Promise<Product[]> {
  return invoke("get_products");
}

export function getProductByBarcode(codeBarre: string): Promise<Product | null> {
  return invoke("get_product_by_barcode", { codeBarre });
}

export function addProduct(product: NewProduct): Promise<string> {
  return invoke("add_product", { product });
}

export function deleteProduct(id: string): Promise<void> {
  return invoke("delete_product", { id });
}
export function adjustProductQuantity(produitId: string, delta: number): Promise<void> {
  return invoke("adjust_product_quantity", { produitId, delta });
}