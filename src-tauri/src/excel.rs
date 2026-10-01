use calamine::{open_workbook_auto, Data, Reader};
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize, Clone)]
pub struct ExcelColumn {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ExcelRow {
    pub id: String,
    pub values: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ExcelSheet {
    pub name: String,
    pub columns: Vec<ExcelColumn>,
    pub rows: Vec<ExcelRow>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ExcelWorkbook {
    pub file_name: String,
    pub file_path: String,
    pub sheets: Vec<ExcelSheet>,
}

fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::Empty => String::new(),
        Data::String(value) => value.clone(),
        Data::Float(value) => value.to_string(),
        Data::Int(value) => value.to_string(),
        Data::Bool(value) => value.to_string(),
        Data::DateTime(value) => value.to_string(),
        Data::DateTimeIso(value) => value.clone(),
        Data::DurationIso(value) => value.clone(),
        Data::Error(value) => format!("{value:?}"),
    }
}

pub fn read_excel_file(file_path: &str) -> Result<ExcelWorkbook, String> {
    let path = Path::new(file_path);

    if !path.exists() {
        return Err(format!("Excel file does not exist: {file_path}"));
    }

    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("Unknown.xlsx")
        .to_string();

    let mut workbook =
        open_workbook_auto(path).map_err(|error| format!("Could not open Excel file: {error}"))?;

    let sheet_names = workbook.sheet_names().to_owned();

    let mut sheets = Vec::new();

    for sheet_name in sheet_names {
        let range = workbook
            .worksheet_range(&sheet_name)
            .map_err(|error| format!("Could not read worksheet '{}': {}", sheet_name, error))?;

        let mut rows_iter = range.rows();

        let header_row = match rows_iter.next() {
            Some(row) => row,
            None => {
                sheets.push(ExcelSheet {
                    name: sheet_name,
                    columns: Vec::new(),
                    rows: Vec::new(),
                });

                continue;
            }
        };

        let columns: Vec<ExcelColumn> = header_row
            .iter()
            .enumerate()
            .map(|(index, cell)| {
                let name = cell_to_string(cell);

                ExcelColumn {
                    id: format!("column-{index}"),
                    name: if name.trim().is_empty() {
                        format!("Column {}", index + 1)
                    } else {
                        name
                    },
                }
            })
            .collect();

        let rows: Vec<ExcelRow> = rows_iter
            .enumerate()
            .map(|(row_index, row)| {
                let mut values = Vec::with_capacity(columns.len());

                for column_index in 0..columns.len() {
                    let value = row
                        .get(column_index)
                        .map(cell_to_string)
                        .unwrap_or_default();

                    values.push(value);
                }

                ExcelRow {
                    id: format!("row-{}", row_index + 2),
                    values,
                }
            })
            .collect();

        sheets.push(ExcelSheet {
            name: sheet_name,
            columns,
            rows,
        });
    }

    Ok(ExcelWorkbook {
        file_name,
        file_path: file_path.to_string(),
        sheets,
    })
}
