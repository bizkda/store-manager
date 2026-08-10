use crate::db::DbState;
use crate::models::{NewSale, SaleReceipt};
use crate::repositories::SqliteSaleRepository;
use crate::services::SaleService;
use tauri::State;

#[tauri::command]
pub fn checkout(state: State<DbState>, sale: NewSale) -> Result<SaleReceipt, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let service = SaleService::new(SqliteSaleRepository);
    service.checkout(&mut conn, sale)
}