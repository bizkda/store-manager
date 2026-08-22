use super::models::{MovementDto, ProductDto};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

pub async fn sync_with_peer(
    conn: Arc<Mutex<Connection>>,
    peer_ip: String,
) -> Result<String, String> {
    let peer_url = format!("http://{}:7878", peer_ip);
    let client = reqwest::Client::new();

    // 1. Dernière synchro connue avec ce pair
    let last_synced: String = {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT last_synced_at FROM sync_state WHERE peer_id = ?1",
            [&peer_ip],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
    };

    // ---------- MOUVEMENTS DE STOCK ----------

    // 2. Récupère ce que le pair a de nouveau
    let received: Vec<MovementDto> = reqwest::get(format!("{}/movements?since={}", peer_url, last_synced))
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let mut applied_count = 0;
    {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        for m in &received {
            let inserted = conn.execute(
                "INSERT OR IGNORE INTO mouvement_stock (id, produit_id, delta, origine_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                (&m.id, &m.produit_id, m.delta, &m.origine_id, &m.created_at),
            ).map_err(|e| e.to_string())?;

            if inserted > 0 {
                conn.execute(
                    "UPDATE produit SET quantite = quantite + ?1 WHERE id = ?2",
                    (m.delta, &m.produit_id),
                ).map_err(|e| e.to_string())?;
                applied_count += 1;
            }
        }
    }

    // 3. Envoie nos propres mouvements récents au pair
    let our_movements: Vec<MovementDto> = {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT id, produit_id, delta, origine_id, created_at FROM mouvement_stock WHERE created_at > ?1"
        ).map_err(|e| e.to_string())?;

        let rows: Vec<MovementDto> = stmt.query_map([&last_synced], |r| {
            Ok(MovementDto {
                id: r.get(0)?,
                produit_id: r.get(1)?,
                delta: r.get(2)?,
                origine_id: r.get(3)?,
                created_at: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        rows
    };

    client.post(format!("{}/movements", peer_url))
        .json(&our_movements)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // ---------- PRODUITS ----------

    // 4. Récupère les produits modifiés côté pair
    let received_products: Vec<ProductDto> = reqwest::get(format!("{}/products?since={}", peer_url, last_synced))
        .await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let mut products_applied = 0;
    {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        for p in &received_products {
            let existing: Option<String> = conn
                .query_row("SELECT updated_at FROM produit WHERE id = ?1", [&p.id], |r| r.get(0))
                .ok();

            match existing {
                None => {
                    conn.execute(
                        "INSERT INTO produit (id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                        (&p.id, &p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.quantite, p.seuil_reappro, &p.updated_at),
                    ).map_err(|e| e.to_string())?;
                    products_applied += 1;
                }
                Some(local) if p.updated_at > local => {
                    conn.execute(
                        "UPDATE produit SET nom = ?1, code_barre = ?2, prix_vente = ?3, prix_achat = ?4, seuil_reappro = ?5, updated_at = ?6 WHERE id = ?7",
                        (&p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.seuil_reappro, &p.updated_at, &p.id),
                    ).map_err(|e| e.to_string())?;
                    products_applied += 1;
                }
                _ => {}
            }
        }
    }

    // 5. Envoie nos propres produits modifiés au pair
    let our_products: Vec<ProductDto> = {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at FROM produit WHERE updated_at > ?1"
        ).map_err(|e| e.to_string())?;

        let rows: Vec<ProductDto> = stmt.query_map([&last_synced], |r| {
            Ok(ProductDto {
                id: r.get(0)?, nom: r.get(1)?, code_barre: r.get(2)?,
                prix_vente: r.get(3)?, prix_achat: r.get(4)?, quantite: r.get(5)?,
                seuil_reappro: r.get(6)?, updated_at: r.get(7)?,
            })
        }).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

        rows
    };

    client.post(format!("{}/products", peer_url))
        .json(&our_products)
        .send().await.map_err(|e| e.to_string())?;

    // ---------- FIN : met à jour la date de dernière synchro ----------

    let now = chrono::Utc::now().to_rfc3339();
    {
        let conn = conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO sync_state (peer_id, last_synced_at) VALUES (?1, ?2)
             ON CONFLICT(peer_id) DO UPDATE SET last_synced_at = ?2",
            (&peer_ip, &now),
        ).map_err(|e| e.to_string())?;
    }

    Ok(format!(
        "{} mouvements et {} produits reçus et appliqués",
        applied_count, products_applied
    ))
}