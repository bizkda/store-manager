use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
mod commands;
mod models;
mod repositories;
mod services;
mod db;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_state = db::init_db(app);
            app.manage(db_state);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::product_commands::get_products,
            commands::product_commands::get_product_by_barcode,
            commands::product_commands::add_product,
            commands::sale_commands::checkout,
])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
