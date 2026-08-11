use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS vente (
    id              TEXT PRIMARY KEY,
    date_vente      TEXT NOT NULL,
    total           REAL NOT NULL DEFAULT 0
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

CREATE INDEX IF NOT EXISTS idx_ligne_vente_vente ON ligne_vente(vente_id);
CREATE INDEX IF NOT EXISTS idx_produit_code_barre ON produit(code_barre);
";

pub fn init_db(app: &tauri::App) -> DbState {
    let data_dir = app
        .path()
        .app_data_dir()
        .expect("could not resolve app data dir");
    std::fs::create_dir_all(&data_dir).expect("failed to create app data dir");

    let db_path = data_dir.join("store.db");
    let conn = Connection::open(db_path).expect("failed to open sqlite db");
    conn.execute_batch(SCHEMA).expect("failed to run schema");

    DbState(Mutex::new(conn))
}