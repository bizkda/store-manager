use tauri::Manager;
mod db;
mod product;
mod sale;


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_state = db::init_db(app);
            app.manage(db_state);

            #[cfg(mobile)]
            app.handle().plugin(tauri_plugin_barcode_scanner::init())?;

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            product::commands::get_products,
            product::commands::get_product_by_barcode,
            product::commands::add_product,
            sale::commands::checkout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}