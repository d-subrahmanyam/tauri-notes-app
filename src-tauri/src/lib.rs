use tauri::Manager;

mod note;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!(
        "Hello, {}! You've been greeted from Rust! at {}",
        name,
        chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let note_store =
                note::initialize_note_store(app.handle()).map_err(std::io::Error::other)?;
            app.manage(note_store);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            note::create_note,
            note::list_notes,
            note::get_note,
            note::update_note,
            note::delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
