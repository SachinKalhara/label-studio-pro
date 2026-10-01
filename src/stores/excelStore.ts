import { create } from "zustand";
import type { ExcelWorkbook, ExcelSheet } from "../shared/types/excel";

interface SelectedData {
  selectedRowIds: string[];
  selectedColumnIds: string[];
}

interface ExcelState {
  projectName: string | null;
  savePath: string | null;
  workbook: ExcelWorkbook | null;
  activeSheetId: string | null;
  activeSheet: ExcelSheet | null;
  originalActiveSheetRows: any[]; 
  selectedData: SelectedData;

  // 🔴 අලුත්: Undo/Redo සඳහා ඉතිහාසය ගබඩා කිරීම
  pastExcelStates: string[];
  futureExcelStates: string[];
  undo: () => void;
  redo: () => void;

  setProjectName: (name: string) => void;
  setSavePath: (path: string) => void;
  setWorkbook: (workbook: ExcelWorkbook | null) => void;
  setActiveSheet: (sheetId: string) => void;
  
  updateCellValue: (rowId: string, colIndex: number, newValue: string) => void; 
  updateColumnName: (colId: string, newName: string) => void;
  
  addRow: () => void;
  addColumn: () => void;
  deleteSelectedRows: () => void;
  deleteSelectedColumns: () => void;
  
  toggleRow: (rowId: string) => void;
  toggleColumn: (columnId: string) => void;
  selectAllRows: () => void;
  deselectAllRows: () => void;
  selectAllColumns: () => void;
  deselectAllColumns: () => void;
  sortData: (columnIndex: number | null, ascending: boolean) => void;
  loadProjectData: (data: Partial<ExcelState>) => void;
  clearProject: () => void;
}

// 🔴 Helper Function: දත්ත වෙනස් කිරීමට පෙර තත්ත්වය (Snapshot) ගබඩා කරගැනීම
const captureHistory = (state: ExcelState) => {
  if (!state.activeSheet) return state.pastExcelStates;
  const snapshot = JSON.stringify({
    rows: state.activeSheet.rows,
    originalRows: state.originalActiveSheetRows,
    columns: state.activeSheet.columns
  });
  return [...state.pastExcelStates, snapshot];
};

export const useExcelStore = create<ExcelState>((set) => ({
  projectName: null, savePath: null, workbook: null, activeSheetId: null, activeSheet: null,
  originalActiveSheetRows: [], selectedData: { selectedRowIds: [], selectedColumnIds: [] },
  pastExcelStates: [], futureExcelStates: [],

  setProjectName: (name) => set({ projectName: name }),
  setSavePath: (path) => set({ savePath: path }),

  setWorkbook: (workbook) => {
    const firstSheet = workbook?.sheets[0] || null;
    set({
      workbook, activeSheetId: firstSheet?.id || null, activeSheet: firstSheet,
      originalActiveSheetRows: firstSheet ? [...firstSheet.rows] : [],
      selectedData: { selectedRowIds: [], selectedColumnIds: [] },
      pastExcelStates: [], futureExcelStates: [] // අලුත් ෆයිල් එකක් ලෝඩ් කරද්දී History මකා දැමීම
    });
  },

  setActiveSheet: (sheetId) => set((state) => {
    const sheet = state.workbook?.sheets.find((s) => s.id === sheetId) || null;
    return {
      activeSheetId: sheetId, activeSheet: sheet, originalActiveSheetRows: sheet ? [...sheet.rows] : [],
      selectedData: { selectedRowIds: [], selectedColumnIds: [] }, pastExcelStates: [], futureExcelStates: []
    };
  }),

  // 🔴 UNDO Function
  undo: () => set((state) => {
    if (state.pastExcelStates.length === 0 || !state.activeSheet || !state.workbook) return state;
    const previous = state.pastExcelStates[state.pastExcelStates.length - 1];
    const newPast = state.pastExcelStates.slice(0, -1);
    
    const currentSnapshot = JSON.stringify({ rows: state.activeSheet.rows, originalRows: state.originalActiveSheetRows, columns: state.activeSheet.columns });
    const parsed = JSON.parse(previous);
    const updatedSheets = state.workbook.sheets.map(s => s.id === state.activeSheetId ? { ...s, rows: parsed.originalRows, columns: parsed.columns } : s);

    return {
      pastExcelStates: newPast, futureExcelStates: [currentSnapshot, ...state.futureExcelStates],
      activeSheet: { ...state.activeSheet, rows: parsed.rows, columns: parsed.columns },
      originalActiveSheetRows: parsed.originalRows, workbook: { ...state.workbook, sheets: updatedSheets }
    };
  }),

  // 🔴 REDO Function
  redo: () => set((state) => {
    if (state.futureExcelStates.length === 0 || !state.activeSheet || !state.workbook) return state;
    const next = state.futureExcelStates[0];
    const newFuture = state.futureExcelStates.slice(1);
    
    const currentSnapshot = JSON.stringify({ rows: state.activeSheet.rows, originalRows: state.originalActiveSheetRows, columns: state.activeSheet.columns });
    const parsed = JSON.parse(next);
    const updatedSheets = state.workbook.sheets.map(s => s.id === state.activeSheetId ? { ...s, rows: parsed.originalRows, columns: parsed.columns } : s);

    return {
      pastExcelStates: [...state.pastExcelStates, currentSnapshot], futureExcelStates: newFuture,
      activeSheet: { ...state.activeSheet, rows: parsed.rows, columns: parsed.columns },
      originalActiveSheetRows: parsed.originalRows, workbook: { ...state.workbook, sheets: updatedSheets }
    };
  }),

  // දත්ත වෙනස් වන හැම තැනකදීම History එක Capture වේ
  updateCellValue: (rowId, colIndex, newValue) => set((state) => {
    if (!state.activeSheet || !state.workbook) return state;
    const newPast = captureHistory(state);
    
    const updatedActiveRows = state.activeSheet.rows.map(row => row.id === rowId ? { ...row, values: Object.assign([], row.values, { [colIndex]: newValue }) } : row);
    const updatedOriginalRows = state.originalActiveSheetRows.map(row => row.id === rowId ? { ...row, values: Object.assign([], row.values, { [colIndex]: newValue }) } : row);
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, rows: updatedOriginalRows } : sheet);

    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, rows: updatedActiveRows }, originalActiveSheetRows: updatedOriginalRows, workbook: { ...state.workbook, sheets: updatedSheets } };
  }),

  updateColumnName: (colId, newName) => set((state) => {
    if (!state.activeSheet || !state.workbook) return state;
    const newPast = captureHistory(state);
    
    const updatedCols = state.activeSheet.columns.map(c => c.id === colId ? { ...c, name: newName } : c);
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, columns: updatedCols } : sheet);
    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, columns: updatedCols }, workbook: { ...state.workbook, sheets: updatedSheets } };
  }),

  addRow: () => set((state) => {
    if (!state.activeSheet || !state.workbook) return state;
    const newPast = captureHistory(state);
    const newRow = { id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, values: new Array(state.activeSheet.columns.length).fill("") };
    
    const updatedActiveRows = [...state.activeSheet.rows, newRow];
    const updatedOriginalRows = [...state.originalActiveSheetRows, newRow];
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, rows: updatedOriginalRows } : sheet);
    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, rows: updatedActiveRows }, originalActiveSheetRows: updatedOriginalRows, workbook: { ...state.workbook, sheets: updatedSheets } };
  }),

  addColumn: () => set((state) => {
    if (!state.activeSheet || !state.workbook) return state;
    const newPast = captureHistory(state);
    const newCol = { id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name: `Column ${state.activeSheet.columns.length + 1}` };
    
    const updatedCols = [...state.activeSheet.columns, newCol];
    const updatedActiveRows = state.activeSheet.rows.map(r => ({ ...r, values: [...r.values, ""] }));
    const updatedOriginalRows = state.originalActiveSheetRows.map(r => ({ ...r, values: [...r.values, ""] }));
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, columns: updatedCols, rows: updatedOriginalRows } : sheet);
    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, columns: updatedCols, rows: updatedActiveRows }, originalActiveSheetRows: updatedOriginalRows, workbook: { ...state.workbook, sheets: updatedSheets } };
  }),

  deleteSelectedRows: () => set((state) => {
    if (!state.activeSheet || !state.workbook || state.selectedData.selectedRowIds.length === 0) return state;
    const newPast = captureHistory(state);
    const selected = new Set(state.selectedData.selectedRowIds);
    
    const updatedActiveRows = state.activeSheet.rows.filter(r => !selected.has(r.id));
    const updatedOriginalRows = state.originalActiveSheetRows.filter(r => !selected.has(r.id));
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, rows: updatedOriginalRows } : sheet);
    
    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, rows: updatedActiveRows }, originalActiveSheetRows: updatedOriginalRows, workbook: { ...state.workbook, sheets: updatedSheets }, selectedData: { ...state.selectedData, selectedRowIds: [] } };
  }),

  deleteSelectedColumns: () => set((state) => {
    if (!state.activeSheet || !state.workbook || state.selectedData.selectedColumnIds.length === 0) return state;
    const newPast = captureHistory(state);
    const selected = new Set(state.selectedData.selectedColumnIds);
    
    const indicesToRemove = new Set<number>();
    state.activeSheet.columns.forEach((c, idx) => { if (selected.has(c.id)) indicesToRemove.add(idx); });
    
    const updatedCols = state.activeSheet.columns.filter(c => !selected.has(c.id));
    const updateValues = (values: any[]) => values.filter((_, idx) => !indicesToRemove.has(idx));
    const updatedActiveRows = state.activeSheet.rows.map(r => ({ ...r, values: updateValues(r.values) }));
    const updatedOriginalRows = state.originalActiveSheetRows.map(r => ({ ...r, values: updateValues(r.values) }));
    const updatedSheets = state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, columns: updatedCols, rows: updatedOriginalRows } : sheet);
    
    return { pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, columns: updatedCols, rows: updatedActiveRows }, originalActiveSheetRows: updatedOriginalRows, workbook: { ...state.workbook, sheets: updatedSheets }, selectedData: { ...state.selectedData, selectedColumnIds: [] } };
  }),

  sortData: (columnIndex: number | null, ascending: boolean) => set((state) => {
    if (!state.activeSheet) return state;
    const newPast = captureHistory(state);
    
    let newRows;
    if (columnIndex === null) newRows = [...state.originalActiveSheetRows];
    else {
      newRows = [...state.activeSheet.rows].sort((a, b) => {
        const valA = a.values[columnIndex] ?? ""; const valB = b.values[columnIndex] ?? "";
        const isNumA = !isNaN(Number(valA)) && String(valA).trim() !== "";
        const isNumB = !isNaN(Number(valB)) && String(valB).trim() !== "";
        if (isNumA && isNumB) return ascending ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        return ascending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
   return { ...state, pastExcelStates: newPast, futureExcelStates: [], activeSheet: { ...state.activeSheet, rows: newRows }, workbook: state.workbook ? { ...state.workbook, sheets: state.workbook.sheets.map(sheet => sheet.id === state.activeSheetId ? { ...sheet, rows: newRows } : sheet) } : null };  }),

  // Selection සහ අනිත් දේවල් ඒ විදියටම පවතී
  toggleRow: (rowId) => set((state) => { const isSelected = state.selectedData.selectedRowIds.includes(rowId); return { selectedData: { ...state.selectedData, selectedRowIds: isSelected ? state.selectedData.selectedRowIds.filter((id) => id !== rowId) : [...state.selectedData.selectedRowIds, rowId] } }; }),
  toggleColumn: (columnId) => set((state) => { const isSelected = state.selectedData.selectedColumnIds.includes(columnId); return { selectedData: { ...state.selectedData, selectedColumnIds: isSelected ? state.selectedData.selectedColumnIds.filter((id) => id !== columnId) : [...state.selectedData.selectedColumnIds, columnId] } }; }),
  selectAllRows: () => set((state) => ({ selectedData: { ...state.selectedData, selectedRowIds: state.activeSheet ? state.activeSheet.rows.map((r) => r.id) : [] } })),
  deselectAllRows: () => set((state) => ({ selectedData: { ...state.selectedData, selectedRowIds: [] } })),
  selectAllColumns: () => set((state) => ({ selectedData: { ...state.selectedData, selectedColumnIds: state.activeSheet ? state.activeSheet.columns.map((c) => c.id) : [] } })),
  deselectAllColumns: () => set((state) => ({ selectedData: { ...state.selectedData, selectedColumnIds: [] } })),
  loadProjectData: (data) => set((state) => ({ ...state, ...data })),
  clearProject: () => set({ projectName: null, savePath: null, workbook: null, activeSheetId: null, activeSheet: null, originalActiveSheetRows: [], selectedData: { selectedRowIds: [], selectedColumnIds: [] }, pastExcelStates: [], futureExcelStates: [] }),
}));