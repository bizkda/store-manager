use rusqlite::Connection;
use uuid::Uuid;

pub fn get_or_create_device_id(conn: &Connection) -> String {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS device_identity (id TEXT PRIMARY KEY)",
        [],
    ).ok();

    let existing: Option<String> = conn
        .query_row("SELECT id FROM device_identity LIMIT 1", [], |r| r.get(0))
        .ok();

    if let Some(id) = existing {
        return id;
    }

    let new_id = Uuid::new_v4().to_string();
    conn.execute("INSERT INTO device_identity (id) VALUES (?1)", [&new_id]).ok();
    new_id
}