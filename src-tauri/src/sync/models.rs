use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MovementDto {
    pub id: String,
    pub produit_id: String,
    pub delta: f64,
    pub origine_id: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SyncRequest {
    pub since: String, // date ISO — "donne-moi ce qui a changé depuis cette date"
}