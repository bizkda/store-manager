use crate::sale::model::{NewSale, SaleReceipt};
use crate::sale::repository::SaleRepository;
use rusqlite::Connection;
use chrono::Utc;
use uuid::Uuid;

pub struct SaleService<R: SaleRepository> {
    repo: R,
}

impl<R: SaleRepository> SaleService<R> {
    pub fn new(repo: R) -> Self {
        SaleService { repo }
    }

    pub fn checkout(
        &self,
        conn: &mut Connection,
        sale: NewSale,
        origine_id: &str,
    ) -> Result<SaleReceipt, String> {
        if sale.items.is_empty() {
            return Err("le panier est vide".to_string());
        }

        for item in &sale.items {
            let stock_dispo = self.repo.get_stock(conn, &item.produit_id)?;

            if stock_dispo < item.quantite {
                return Err(format!(
                    "stock insuffisant pour le produit {} (disponible: {}, demandé: {})",
                    item.produit_id,
                    stock_dispo,
                    item.quantite
                ));
            }
        }

        let total: f64 = sale
            .items
            .iter()
            .map(|i| i.quantite * i.prix_unitaire)
            .sum();

        let sale_id = Uuid::new_v4().to_string();
        let date_vente = Utc::now().to_rfc3339();

        self.repo.create_sale_with_items(
            conn,
            &sale_id,
            &date_vente,
            total,
            &sale.items,
            origine_id,
        )?;

        Ok(SaleReceipt {
            id: sale_id,
            date_vente,
            total,
        })
    }
}