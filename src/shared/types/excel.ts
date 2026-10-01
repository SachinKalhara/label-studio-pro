export interface ExcelColumn {
  id: string;
  name: string;
}

export interface ExcelRow {
  id: string;
  values: string[];
}

export interface ExcelSheet {
  id: string;
  name: string;
  columns: ExcelColumn[];
  rows: ExcelRow[];
}

export interface ExcelWorkbook {
  fileName: string;
  filePath: string;
  sheets: ExcelSheet[];
}

export interface SelectedData {
  selectedRowIds: string[];
  selectedColumnIds: string[];
}