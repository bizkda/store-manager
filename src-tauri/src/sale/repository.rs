use crate::sale::model::{LigneVenteInput, Sale};
use rusqlite::{params, Connection};

pub trait SaleRepository {
    fn create_sale_with_items(
        &self,
        conn: &mut Connection,
        sale_id: &str,
        date_vente: &str,
        total: f64,
        items: &[LigneVenteInput],
    ) -> Result<(), String>;

    fn get_stock(&self, conn: &Connection, produit_id: &str) -> Result<f64, String>;
}

pub struct SqliteSaleRepository;

impl SaleRepository for SqliteSaleRepository {
    fn get_stock(&self, conn: &Connection, produit_id: &str) -> Result<f64, String> {
        conn.query_row(
            "SELECT quantite FROM produit WHERE id = ?1",
            [produit_id],
            |r| r.get(0),
        )
        .map_err(|_| format!("produit {} introuvable", produit_id))
    }

    fn create_sale_with_items(
        &self,
        conn: &mut Connection,
        sale_id: &str,
        date_vente: &str,
        total: f64,
        items: &[LigneVenteInput],
    ) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO vente (id, date_vente, total) VALUES (?1, ?2, ?3)",
            params![sale_id, date_vente, total ],
        )
        .map_err(|e| e.to_string())?;

        for item in items {
            let ligne_id = uuid::Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO ligne_vente (id, vente_id, produit_id, quantite, prix_unitaire) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![ligne_id, sale_id, item.produit_id, item.quantite, item.prix_unitaire],
            )
            .map_err(|e| e.to_string())?;

            tx.execute(
                "UPDATE produit SET quantite = quantite - ?1 WHERE id = ?2",
                params![item.quantite, item.produit_id],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }
}