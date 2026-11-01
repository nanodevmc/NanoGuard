mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            select_jar_file,
            select_output_dir,
            select_directory,
            list_jars_in_directory,
            open_path,
            get_system_stats,
            audit_jar,
            protect_jar
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
