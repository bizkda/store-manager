use crate::db::DbState;
use tauri::State;

#[tauri::command]
pub async fn sync_with_peer(state: State<'_, DbState>, peer_ip: String) -> Result<String, String> {
    super::client::sync_with_peer(state.conn.clone(), peer_ip).await
}

#[tauri::command]
pub fn get_peers(state: State<DbState>) -> Result<Vec<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    super::peers::get_known_peers(&conn)
}

#[tauri::command]
pub fn add_peer(state: State<DbState>, ip: String, label: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    super::peers::add_peer(&conn, &ip, &label)
}

#[tauri::command]
pub fn remove_peer(state: State<DbState>, ip: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    super::peers::remove_peer(&conn, &ip)
}#[tauri::command]
pub fn get_my_ip() -> Result<String, String> {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_network(my_ip: String) -> Result<Vec<String>, String> {
    Ok(super::discovery::scan_local_network(&my_ip).await)
}