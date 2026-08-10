use rusqlite::OptionalExtension;
use crate::models::{NewProduct, Product};
use rusqlite::Connection;

pub trait ProductRepository {
    fn get_all(&self, conn: &Connection) -> Result<Vec<Product>, String>;
    fn get_by_barcode(&self, conn: &Connection, code_barre: &str) -> Result<Option<Product>, String>;
    fn insert(&self, conn: &Connection, product: &NewProduct, id: &str) -> Result<(), String>;
    fn decrement_stock(&self, conn: &Connection, produit_id: &str, quantite: f64) -> Result<(), String>;
}

pub struct SqliteProductRepository;

impl ProductRepository for SqliteProductRepository {
    fn get_all(&self, conn: &Connection) -> Result<Vec<Product>, String> {
        let mut stmt = conn
            .prepare("SELECT id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro FROM produit ORDER BY nom")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |r| {
                Ok(Product {
                    id: r.get(0)?,
                    nom: r.get(1)?,
                    code_barre: r.get(2)?,
                    prix_vente: r.get(3)?,
                    prix_achat: r.get(4)?,
                    quantite: r.get(5)?,
                    seuil_reappro: r.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
    }

    fn get_by_barcode(&self, conn: &Connection, code_barre: &str) -> Result<Option<Product>, String> {
        conn.query_row(
            "SELECT id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro FROM produit WHERE code_barre = ?1",
            [code_barre],
            |r| {
                Ok(Product {
                    id: r.get(0)?,
                    nom: r.get(1)?,
                    code_barre: r.get(2)?,
                    prix_vente: r.get(3)?,
                    prix_achat: r.get(4)?,
                    quantite: r.get(5)?,
                    seuil_reappro: r.get(6)?,
                })
            },
        )
        .optional() // pas d'erreur si rien trouvé, juste None
        .map_err(|e| e.to_string())
    }

    fn insert(&self, conn: &Connection, product: &NewProduct, id: &str) -> Result<(), String> {
        conn.execute(
            "INSERT INTO produit (id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            (
                id,
                &product.nom,
                &product.code_barre,
                product.prix_vente,
                product.prix_achat,
                product.quantite,
                product.seuil_reappro,
            ),
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn decrement_stock(&self, conn: &Connection, produit_id: &str, quantite: f64) -> Result<(), String> {
        conn.execute(
            "UPDATE produit SET quantite = quantite - ?1 WHERE id = ?2",
            (quantite, produit_id),
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}