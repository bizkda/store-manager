use crate::db::DbState;
use crate::sale::model::{NewSale, SaleReceipt};
use crate::sale::repository::SqliteSaleRepository;
use crate::sale::service::SaleService;
use tauri::State;


#[tauri::command]
pub fn checkout(state: State<DbState>, sale: NewSale) -> Result<SaleReceipt, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    let service = SaleService::new(SqliteSaleRepository);
    let receipt = service.checkout(&mut conn, sale, &state.device_id)?;
    drop(conn); // libère le verrou avant de lancer la synchro en arrière-plan

    let conn_clone = state.conn.clone();
    tauri::async_runtime::spawn(async move {
        crate::sync::client::sync_all_known_peers(conn_clone).await;
    });

    Ok(receipt)
}