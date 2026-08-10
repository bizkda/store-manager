use crate::db::DbState;
use crate::models::{NewProduct, Product};
use crate::repositories::{ProductRepository, SqliteProductRepository};
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