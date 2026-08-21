use axum::{extract::State, routing::get,routing::post, Json, Router};
use rusqlite::Connection;
use std::sync::{Arc, Mutex};

use super::models::MovementDto;

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

