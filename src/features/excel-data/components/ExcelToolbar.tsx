import { useExcelStore } from "../../../stores/excelStore";
import { Undo2, Redo2, FileText, Columns, Plus } from "lucide-react"; // 🔴 Lucide Icons ලබා ගැනීම

interface ExcelToolbarProps {
  isHideRowCheckbox: boolean;
  isHideColCheckbox: boolean;
  allRowsSelected: boolean;
  allColumnsSelected: boolean;
  handleSelectAllRows: () => void;
  handleSelectAllColumns: () => void;
  activeSheet: any;
  sortColumnIndex: number | "";
  sortOrder: "asc" | "desc";
  handleSortChange: (colIndex: string, order: "asc" | "desc") => void;
}

export default function ExcelToolbar({
  isHideRowCheckbox, isHideColCheckbox,
  allRowsSelected, allColumnsSelected,
  handleSelectAllRows, handleSelectAllColumns, activeSheet,
  sortColumnIndex, sortOrder, handleSortChange
}: ExcelToolbarProps) {
  
  const addRow = useExcelStore(state => state.addRow);
  const addColumn = useExcelStore(state => state.addColumn);
  
  // 🔴 Undo / Redo ලබාගැනීම
  const undo = useExcelStore(state => state.undo);
  const redo = useExcelStore(state => state.redo);
  const canUndo = useExcelStore(state => state.pastExcelStates.length > 0);
  const canRedo = useExcelStore(state => state.futureExcelStates.length > 0);

  if (!activeSheet) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-main)", flexWrap: "wrap", gap: "10px" }}>
      
      {/* Left side: Undo/Redo & Selection Buttons */}
      <div style={{ display: "flex", gap: "10px", flex: 1, alignItems: "center" }}>
        
        {/* 🔴 Undo / Redo Buttons */}
        <div style={{ display: "flex", gap: "5px", marginRight: "10px" }}>
          <button onClick={undo} disabled={!canUndo} style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-color)", background: canUndo ? "var(--btn-bg)" : "var(--bg-hover)", color: canUndo ? "var(--text-primary)" : "var(--text-secondary)", cursor: canUndo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} title="Undo (Ctrl+Z)">
            <Undo2 size={16} />
          </button>
          <button onClick={redo} disabled={!canRedo} style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-color)", background: canRedo ? "var(--btn-bg)" : "var(--bg-hover)", color: canRedo ? "var(--text-primary)" : "var(--text-secondary)", cursor: canRedo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} title="Redo (Ctrl+Y)">
            <Redo2 size={16} />
          </button>
        </div>
        
        {/* Selection Buttons */}
        {!isHideRowCheckbox && (
          <button onClick={handleSelectAllRows} style={{ padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--btn-bg)", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}>
            {allRowsSelected ? "Clear Rows" : "Select All Rows"}
          </button>
        )}
        {!isHideColCheckbox && (
          <button onClick={handleSelectAllColumns} style={{ padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--btn-bg)", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500, fontSize: "13px", whiteSpace: "nowrap" }}>
            {allColumnsSelected ? "Clear Columns" : "Select All Columns"}
          </button>
        )}
      </div>

      {/* Center: Row/Column Counts & ADD Buttons */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "var(--text-accent)", fontSize: "13px", background: "var(--bg-active)", padding: "6px 16px", borderRadius: "20px", border: "1px solid var(--border-active)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><FileText size={14} /> Rows: <strong>{activeSheet.rows.length}</strong></span>
          <span style={{ color: "var(--border-active)" }}>|</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Columns size={14} /> Columns: <strong>{activeSheet.columns.length}</strong></span>
        </div>
        
        <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", border: "1px solid var(--border-active)", borderRadius: "6px", background: "var(--bg-panel)", cursor: "pointer", color: "var(--text-accent)", fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap" }}>
          <Plus size={14} strokeWidth={3} /> Add Row
        </button>
        <button onClick={addColumn} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", border: "1px solid var(--border-active)", borderRadius: "6px", background: "var(--bg-panel)", cursor: "pointer", color: "var(--text-accent)", fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap" }}>
          <Plus size={14} strokeWidth={3} /> Add Column
        </button>
      </div>

      {/* Right side: Sorting */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Sort by:</span>
        <select value={sortColumnIndex} onChange={(e) => handleSortChange(e.target.value, sortOrder)} disabled={isHideRowCheckbox} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: isHideRowCheckbox ? "var(--bg-hover)" : "var(--input-bg)", fontSize: "13px", color: "var(--text-primary)", outline: "none", cursor: isHideRowCheckbox ? "not-allowed" : "pointer", maxWidth: "150px" }}>
          <option value="">-- Default Order --</option>
          {activeSheet.columns.map((col: any, idx: number) => ( <option key={col.id} value={idx}>{col.name}</option> ))}
        </select>
        <select value={sortOrder} onChange={(e) => handleSortChange(String(sortColumnIndex), e.target.value as "asc" | "desc")} disabled={sortColumnIndex === "" || isHideRowCheckbox} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--input-bg)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }}>
          <option value="asc">A - Z (Asc)</option>
          <option value="desc">Z - A (Desc)</option>
        </select>
      </div>
    </div>
  );
}