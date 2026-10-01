mod excel;

use excel::ExcelWorkbook;

#[tauri::command]
fn read_excel(file_path: String) -> Result<ExcelWorkbook, String> {
    excel::read_excel_file(&file_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_excel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
