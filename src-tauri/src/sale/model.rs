use serde::{Deserialize, Serialize};



// Une ligne du panier, avant d'être persistée
#[derive(Debug, Deserialize)]
pub struct LigneVenteInput {
    pub produit_id: String,
    pub quantite: f64,
    pub prix_unitaire: f64,
}

// Ce que le frontend envoie au checkout : mode de paiement + les lignes scannées
#[derive(Debug, Deserialize)]
pub struct NewSale {
    pub items: Vec<LigneVenteInput>,
}

// Ce que Rust renvoie après un checkout réussi
#[derive(Debug, Serialize)]
pub struct SaleReceipt {
    pub id: String,
    pub date_vente: String,
    pub total: f64,
}