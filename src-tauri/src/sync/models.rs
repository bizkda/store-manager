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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductDto {
    pub id: String,
    pub nom: String,
    pub code_barre: Option<String>,
    pub prix_vente: f64,
    pub prix_achat: f64,
    pub quantite: Option<f64>,
    pub seuil_reappro: f64,
    pub updated_at: String,
}