use axum::{extract::State, routing::get,routing::post, Json, Router};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

use super::models::MovementDto;
use super::models::ProductDto;

type SharedConn = Arc<Mutex<Connection>>;



async fn receive_movements(
    State(conn): State<SharedConn>,
    Json(movements): Json<Vec<MovementDto>>,
) -> Json<usize> {
    let conn = conn.lock().unwrap();
    let mut applied = 0;

    for m in movements {
        let inserted = conn.execute(
            "INSERT OR IGNORE INTO mouvement_stock (id, produit_id, delta, origine_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            (&m.id, &m.produit_id, m.delta, &m.origine_id, &m.created_at),
        ).unwrap();

        // Si la ligne a vraiment été insérée (pas déjà connue), on applique le delta au stock
        if inserted > 0 {
            conn.execute(
                "UPDATE produit SET quantite = quantite + ?1 WHERE id = ?2",
                (m.delta, &m.produit_id),
            ).unwrap();
            applied += 1;
        }
    }

    Json(applied)
}

pub fn start_sync_server(conn: Arc<Mutex<Connection>>) {
    tauri::async_runtime::spawn(async move {
        let app = Router::new()
            .route("/movements", get(get_movements_since).post(receive_movements))
            .route("/products", get(get_products_since).post(receive_products))
            .with_state(conn);

        let listener = tokio::net::TcpListener::bind("0.0.0.0:7878").await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });
}

async fn get_movements_since(
    State(conn): State<SharedConn>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Json<Vec<MovementDto>> {
    let since = params.get("since").cloned().unwrap_or_default();
    let conn = conn.lock().unwrap();

    let mut stmt = conn
        .prepare("SELECT id, produit_id, delta, origine_id, created_at FROM mouvement_stock WHERE created_at > ?1 ORDER BY created_at")
        .unwrap();

    let movements: Vec<MovementDto> = stmt
        .query_map([&since], |r| {
            Ok(MovementDto {
                id: r.get(0)?,
                produit_id: r.get(1)?,
                delta: r.get(2)?,
                origine_id: r.get(3)?,
                created_at: r.get(4)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    Json(movements)
}
async fn get_products_since(
    State(conn): State<SharedConn>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Json<Vec<ProductDto>> {
    let since = params.get("since").cloned().unwrap_or_default();
    let conn = conn.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at FROM produit WHERE updated_at > ?1"
    ).unwrap();

    let rows: Vec<ProductDto> = stmt.query_map([&since], |r| {
        Ok(ProductDto {
            id: r.get(0)?,
            nom: r.get(1)?,
            code_barre: r.get(2)?,
            prix_vente: r.get(3)?,
            prix_achat: r.get(4)?,
            quantite: r.get(5)?,
            seuil_reappro: r.get(6)?,
            updated_at: r.get(7)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect();

    Json(rows)
}

async fn receive_products(
    State(conn): State<SharedConn>,
    Json(products): Json<Vec<ProductDto>>,
) -> Json<usize> {
    let conn = conn.lock().unwrap();
    let mut applied = 0;

    for p in products {
        // Le produit existe-t-il déjà localement ?
        let existing_updated_at: Option<String> = conn
            .query_row("SELECT updated_at FROM produit WHERE id = ?1", [&p.id], |r| r.get(0))
            .ok();

        match existing_updated_at {
            None => {
                // Produit inconnu ici — on l'insère en entier, avec sa quantité de départ
                conn.execute(
                    "INSERT INTO produit (id, nom, code_barre, prix_vente, prix_achat, quantite, seuil_reappro, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    (&p.id, &p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.quantite, p.seuil_reappro, &p.updated_at),
                ).ok();
                applied += 1;
            }
            Some(local_updated_at) if p.updated_at > local_updated_at => {
                // Produit déjà connu, mais la version reçue est plus récente —
                // on met à jour TOUT SAUF quantite, qui reste pilotée par mouvement_stock
                conn.execute(
                    "UPDATE produit SET nom = ?1, code_barre = ?2, prix_vente = ?3, prix_achat = ?4, seuil_reappro = ?5, updated_at = ?6 WHERE id = ?7",
                    (&p.nom, &p.code_barre, p.prix_vente, p.prix_achat, p.seuil_reappro, &p.updated_at, &p.id),
                ).ok();
                applied += 1;
            }
            _ => {
                // Version locale déjà à jour ou plus récente — on ignore
            }
        }
    }

    Json(applied)
}

