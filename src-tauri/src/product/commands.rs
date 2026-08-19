use crate::db::DbState;
use crate::product::model::{NewProduct, Product};
use crate::product::repository::{ProductRepository, SqliteProductRepository};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_products(state: State<DbState>) -> Result<Vec<Product>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    SqliteProductRepository.get_all(&conn)
}

#[tauri::command]
pub fn get_product_by_barcode(state: State<DbState>, code_barre: String) -> Result<Option<Product>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    SqliteProductRepository.get_by_barcode(&conn, &code_barre)
}

#[tauri::command]
pub fn add_product(state: State<DbState>, product: NewProduct) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    SqliteProductRepository.insert(&conn, &product, &id)?;
    Ok(id)
}
#[tauri::command]
pub fn search_products(
    state: State<DbState>,
    nom: Option<String>,
    prix_min: Option<f64>,
    prix_max: Option<f64>,
) -> Result<Vec<Product>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    SqliteProductRepository.search(&conn, nom.as_deref(), prix_min, prix_max)
}

#[tauri::command]
pub fn restock_product(
    state: State<DbState>,
    produit_id: String,
    prix_vente: f64,
    prix_achat: f64,
    quantite_ajoutee: f64,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    SqliteProductRepository.restock(&conn, &produit_id, prix_vente, prix_achat, quantite_ajoutee)
}