import type { ExcelRow, ExcelColumn } from "../shared/types/excel";
import type { LabelElement } from "../shared/types/label";
import { useSettingsStore } from "../stores/settingsStore"; // Settings Store එක සම්බන්ධ කිරීම

export function getRowValue(
  row: ExcelRow,
  columns: ExcelColumn[],
  fieldName?: string
): string {
  if (!fieldName) {
    return "";
  }

  const columnIndex = columns.findIndex(
    (column) => column.name === fieldName
  );

  if (columnIndex === -1) {
    return "";
  }

  const rawValue = row.values[columnIndex] ?? "";
  return formatValue(rawValue);
}

// සංඛ්‍යාවක් නම් Settings වල ඇති දශමස්ථාන ගණනට හැරවීම
function formatValue(val: any): string {
  if (val === undefined || val === null || val === "") return "";
  
  const { decimalPlaces } = useSettingsStore.getState();

  // අගය සංඛ්‍යාවක් (Numberic) දැයි පරීක්ෂා කිරීම
  if (!isNaN(Number(val)) && String(val).trim() !== "") {
    return Number(val).toFixed(decimalPlaces);
  }
  
  return String(val);
}

export function renderField(
  row: ExcelRow,
  columns: ExcelColumn[],
  fieldName?: string
): string {
  return getRowValue(row, columns, fieldName);
}

export function renderTextElement(
  element: LabelElement,
  row: ExcelRow,
  columns: ExcelColumn[]
): string {
  if (element.field) {
    return renderField(
      row,
      columns,
      element.field
    );
  }

  // Text එකක් ඇතුළේ {{ColumnName}} වැනි Variables තිබේ නම් ඒවා දශමස්ථාන සමඟ ආදේශ කිරීම
  if (element.text) {
    return replaceTemplateVariables(element.text, row, columns);
  }

  return "";
}

export function replaceTemplateVariables(
  text: string,
  row: ExcelRow,
  columns: ExcelColumn[]
): string {
  return text.replace(
    /\{\{([^}]+)\}\}/g,
    (_match, fieldName: string) => {
      return getRowValue(
        row,
        columns,
        fieldName.trim()
      );
    }
  );
}