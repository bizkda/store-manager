use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: String,
    pub nom: String,
    pub code_barre: Option<String>,
    pub prix_vente: f64,
    pub prix_achat: f64,
    pub quantite: f64,
    pub seuil_reappro: f64,
}

// Ce que le frontend envoie pour créer un produit — pas d'id (généré côté Rust)
#[derive(Debug, Deserialize)]
pub struct NewProduct {
    pub nom: String,
    pub code_barre: Option<String>,
    pub prix_vente: f64,
    pub prix_achat: f64,
    pub quantite: f64,
    pub seuil_reappro: f64,
}