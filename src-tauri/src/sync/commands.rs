use crate::db::DbState;
use tauri::State;

#[tauri::command]
pub async fn sync_with_peer(state: State<'_, DbState>, peer_ip: String) -> Result<String, String> {
    super::client::sync_with_peer(state.conn.clone(), peer_ip).await
}