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

export function getProducts(): Promise<Product[]> {
  return invoke("get_products");
}

export function getProductByBarcode(codeBarre: string): Promise<Product | null> {
  return invoke("get_product_by_barcode", { codeBarre });
}

export function addProduct(product: NewProduct): Promise<string> {
  return invoke("add_product", { product });
}