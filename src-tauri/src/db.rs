use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use tauri::Manager;


pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
    pub device_id: String,
}

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS vente (
    id              TEXT PRIMARY KEY,
    date_vente      TEXT NOT NULL,
    total           REAL NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS produit (
    id              TEXT PRIMARY KEY,
    nom             TEXT NOT NULL,
    code_barre      TEXT UNIQUE,
    prix_vente      REAL NOT NULL DEFAULT 0,
    prix_achat      REAL NOT NULL DEFAULT 0,
    quantite        REAL NOT NULL DEFAULT 0,
    seuil_reappro   REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ligne_vente (
    id              TEXT PRIMARY KEY,
    vente_id        TEXT NOT NULL REFERENCES vente(id),
    produit_id      TEXT NOT NULL REFERENCES produit(id),
    quantite        REAL NOT NULL,
    prix_unitaire   REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS mouvement_stock (
    id            TEXT PRIMARY KEY,
    produit_id    TEXT NOT NULL,
    delta         REAL NOT NULL,
    origine_id    TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_state (
    peer_id        TEXT PRIMARY KEY,
    last_synced_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_identity (
    id TEXT PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_ligne_vente_vente ON ligne_vente(vente_id);
CREATE INDEX IF NOT EXISTS idx_produit_code_barre ON produit(code_barre);
CREATE INDEX IF NOT EXISTS idx_mouvement_produit ON mouvement_stock(produit_id);
";

pub fn init_db(app: &tauri::App) -> DbState {
    let data_dir = app.path().app_data_dir().expect("could not resolve app data dir");
    std::fs::create_dir_all(&data_dir).expect("failed to create app data dir");

    let db_path = data_dir.join("store.db");
    let conn = Connection::open(db_path).expect("failed to open sqlite db");
    conn.execute_batch(SCHEMA).expect("failed to run schema");

    // Migrations pour les bases existantes
    let _ = conn.execute("ALTER TABLE produit ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE vente ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''", []);

    let device_id = crate::identity::get_or_create_device_id(&conn);

    DbState {
    conn: Arc::new(Mutex::new(conn)),
    device_id,
    }
}