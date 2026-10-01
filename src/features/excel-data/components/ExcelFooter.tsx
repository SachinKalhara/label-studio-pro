import { Search, X, FileSpreadsheet, ArrowRight, Trash2 } from "lucide-react";
import { useExcelStore } from "../../../stores/excelStore";

interface ExcelFooterProps {
  showOnlySelected: boolean;
  setShowOnlySelected: (val: boolean) => void;
  showSelectedColumnsOnly: boolean;
  setShowSelectedColumnsOnly: (val: boolean) => void;
  showSelectedRowsOnly: boolean;
  setShowSelectedRowsOnly: (val: boolean) => void;
  handleExportExcel: () => void;
  selectedRowIds: string[];
  selectedColumnIds: string[];
  onContinue?: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function ExcelFooter({
  showOnlySelected, setShowOnlySelected,
  showSelectedColumnsOnly, setShowSelectedColumnsOnly,
  showSelectedRowsOnly, setShowSelectedRowsOnly,
  handleExportExcel, selectedRowIds, selectedColumnIds, onContinue,
  searchQuery, setSearchQuery 
}: ExcelFooterProps) {

  // 🔴 වෙනස: මෙහි Store එකේ සැබෑ Functions වන deleteSelectedRows සහ deleteSelectedColumns ලබාගෙන ඇත.
  const deleteSelectedRows = useExcelStore((state: any) => state.deleteSelectedRows);
  const deleteSelectedColumns = useExcelStore((state: any) => state.deleteSelectedColumns);

  const handleDeleteSelectedRows = () => {
    if (selectedRowIds.length === 0) return;
    // Tauri වලදී window.confirm ගැටලු ඇති කරන නිසා එය ඉවත් කර කෙලින්ම මකා දමනු ලැබේ.
    // Store එකේ Undo (Ctrl+Z) පහසුකම ඇති නිසා පරිශීලකයාට බියක් නොමැත.
    if (deleteSelectedRows) {
      deleteSelectedRows();
    }
  };

  const handleDeleteSelectedColumns = () => {
    if (selectedColumnIds.length === 0) return;
    if (deleteSelectedColumns) {
      deleteSelectedColumns();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px 24px", background: "var(--bg-panel)", borderTop: "1px solid var(--border-color)", zIndex: 10 }}>
      
      {/* LEVEL 1: Checkboxes, Search Bar, Action Buttons එකම පේළියේ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        
        {/* 1. Left: Checkboxes */}
        <div style={{ flex: 1, display: "flex", gap: "15px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} style={{ cursor: "pointer", width: "14px", height: "14px" }} />
            Show Selected Only
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" checked={showSelectedRowsOnly} onChange={(e) => setShowSelectedRowsOnly(e.target.checked)} disabled={showOnlySelected} style={{ cursor: "pointer", width: "14px", height: "14px" }} />
            Selected Rows Only
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" checked={showSelectedColumnsOnly} onChange={(e) => setShowSelectedColumnsOnly(e.target.checked)} disabled={showOnlySelected} style={{ cursor: "pointer", width: "14px", height: "14px" }} />
            Selected Columns Only
          </label>
        </div>

        {/* 2. Center: Search Bar */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "350px", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
            <input 
              type="text" 
              placeholder="Search data..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 32px 8px 36px", border: "1px solid var(--border-color)", borderRadius: "20px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", fontSize: "13px", transition: "var(--theme-transition)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                style={{ position: "absolute", right: "8px", background: "var(--bg-hover)", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "50%" }}
                title="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* 3. Right: Action Buttons */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginRight: "5px" }}>
            {selectedRowIds.length} Rows, {selectedColumnIds.length} Cols
          </span>
          <button onClick={handleExportExcel} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--btn-bg)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "var(--theme-transition)" }}>
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          {onContinue && (
            <button onClick={onContinue} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#ffffff", cursor: "pointer", fontWeight: 600, fontSize: "13px", boxShadow: "0 2px 5px rgba(37, 99, 235, 0.3)" }}>
              Continue to Design <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* LEVEL 2: Delete Buttons (Selection එකක් ඇත්නම් පමණක් පෙන්වයි) */}
      {(selectedRowIds.length > 0 || selectedColumnIds.length > 0) && (
        <div style={{ display: "flex", gap: "12px", marginTop: "14px", width: "100%" }}>
          {selectedRowIds.length > 0 && (
            <button 
              onClick={handleDeleteSelectedRows} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
            >
              <Trash2 size={14} /> Delete Selected Row{selectedRowIds.length > 1 ? 's' : ''}
            </button>
          )}
          
          {selectedColumnIds.length > 0 && (
            <button 
              onClick={handleDeleteSelectedColumns} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: 600, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
            >
              <Trash2 size={14} /> Delete Selected Column{selectedColumnIds.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

    </div>
  );
}