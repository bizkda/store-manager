use super::models::{ProductDto, MovementDto};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct BackupData {
    pub products: Vec<ProductDto>,
    pub movements: Vec<MovementDto>,
    pub exported_at: String,
}

pub fn export_all(conn: &Connection) -> Result<String, String> {
    let mut stmt = conn.prepare(
        "SELECT id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at FROM produit"
    ).map_err(|e| e.to_string())?;

    let products: Vec<ProductDto> = stmt.query_map([], |r| {
        Ok(ProductDto {
            id: r.get(0)?, nom: r.get(1)?, code_barre: r.get(2)?,
            prix_vente: r.get(3)?, prix_achat: r.get(4)?, quantite: r.get(5)?,
            seuil_reappro: r.get(6)?, updated_at: r.get(7)?,
        })
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let mut stmt2 = conn.prepare(
        "SELECT id, produit_id, delta, origine_id, created_at FROM mouvement_stock"
    ).map_err(|e| e.to_string())?;

    let movements: Vec<MovementDto> = stmt2.query_map([], |r| {
        Ok(MovementDto {
            id: r.get(0)?, produit_id: r.get(1)?, delta: r.get(2)?,
            origine_id: r.get(3)?, created_at: r.get(4)?,
        })
    }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let backup = BackupData {
        products,
        movements,
        exported_at: chrono::Utc::now().to_rfc3339(),
    };

    serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())
}

pub fn import_all(conn: &Connection, json_data: &str) -> Result<(usize, usize), String> {
    let backup: BackupData = serde_json::from_str(json_data).map_err(|e| e.to_string())?;

    let mut products_count = 0;
    for p in &backup.products {
        let existing: Option<String> = conn
            .query_row("SELECT updated_at FROM produit WHERE id = ?1", [&p.id], |r| r.get(0))
            .ok();

        match existing {
            None => {
                conn.execute(
                    "INSERT INTO produit (id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    (&p.id, &p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.quantite, p.seuil_reappro, &p.updated_at),
                ).map_err(|e| e.to_string())?;
                products_count += 1;
            }
            Some(local) if p.updated_at > local => {
                conn.execute(
                    "UPDATE produit SET nom = ?1, code_barre = ?2, prix_vente = ?3, prix_achat = ?4, seuil_reappro = ?5, updated_at = ?6 WHERE id = ?7",
                    (&p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.seuil_reappro, &p.updated_at, &p.id),
                ).map_err(|e| e.to_string())?;
                products_count += 1;
            }
            _ => {}
        }
    }

    let mut movements_count = 0;
    for m in &backup.movements {
        let inserted = conn.execute(
            "INSERT OR IGNORE INTO mouvement_stock (id, produit_id, delta, origine_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            (&m.id, &m.produit_id, m.delta, &m.origine_id, &m.created_at),
        ).map_err(|e| e.to_string())?;

        if inserted > 0 {
            conn.execute(
                "UPDATE produit SET quantite = quantite + ?1 WHERE id = ?2",
                (m.delta, &m.produit_id),
            ).map_err(|e| e.to_string())?;
            movements_count += 1;
        }
    }

    Ok((products_count, movements_count))
}