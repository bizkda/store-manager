use rusqlite::Connection;

pub fn get_known_peers(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare("SELECT ip FROM known_peers").map_err(|e| e.to_string())?;
    let rows: Vec<String> = stmt
        .query_map([], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

pub fn add_peer(conn: &Connection, ip: &str, label: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO known_peers (ip, label) VALUES (?1, ?2)",
        (ip, label),
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn remove_peer(conn: &Connection, ip: &str) -> Result<(), String> {
    conn.execute("DELETE FROM known_peers WHERE ip = ?1", [ip]).map_err(|e| e.to_string())?;
    Ok(())
}