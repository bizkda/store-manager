use crate::db::DbState;
use crate::sale::model::{NewSale, SaleReceipt};
use crate::sale::repository::SqliteSaleRepository;
use crate::sale::service::SaleService;
use tauri::State;

#[tauri::command]
pub fn checkout(state: State<DbState>, sale: NewSale) -> Result<SaleReceipt, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let service = SaleService::new(SqliteSaleRepository);
    service.checkout(&mut conn, sale)
}