import { useMemo, useState, useRef, useEffect } from "react";
import { useExcelStore } from "../../../stores/excelStore";
import { useSettingsStore } from "../../../stores/settingsStore"; 
import ExcelToolbar from "./ExcelToolbar";
import ExcelFooter from "./ExcelFooter";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";

interface ExcelTableProps {
  onContinue?: () => void;
}

export default function ExcelTable({ onContinue }: ExcelTableProps) {
  const activeSheet = useExcelStore((state) => state.activeSheet);
  const selectedRowIds = useExcelStore((state) => state.selectedData.selectedRowIds);
  const selectedColumnIds = useExcelStore((state) => state.selectedData.selectedColumnIds);

  const toggleRow = useExcelStore((state) => state.toggleRow);
  const toggleColumn = useExcelStore((state) => state.toggleColumn);
  const selectAllRows = useExcelStore((state) => state.selectAllRows);
  const deselectAllRows = useExcelStore((state) => state.deselectAllRows);
  const selectAllColumns = useExcelStore((state) => state.selectAllColumns);
  const deselectAllColumns = useExcelStore((state) => state.deselectAllColumns);
  const sortData = useExcelStore((state) => state.sortData);
  
  const updateCellValue = useExcelStore((state: any) => state.updateCellValue);
  const updateColumnName = useExcelStore((state: any) => state.updateColumnName);

  const decimalPlaces = useSettingsStore((state) => state.decimalPlaces);
  
  const [searchQuery, setSearchQuery] = useState("");

  const [sortColumnIndex, setSortColumnIndex] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showSelectedColumnsOnly, setShowSelectedColumnsOnly] = useState(false);
  const [showSelectedRowsOnly, setShowSelectedRowsOnly] = useState(false);

  const [activeCell, setActiveCell] = useState<{ rIdx: number; cIdx: number; isEditing: boolean } | null>(null);
  const [editValue, setEditValue] = useState("");

  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState("");

  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCell && !activeCell.isEditing) {
      tableContainerRef.current?.focus();
    }
  }, [activeCell]);

  const allRowsSelected = useMemo(() => activeSheet?.rows.every((row) => selectedRowIds.includes(row.id)) ?? false, [activeSheet, selectedRowIds]);
  const allColumnsSelected = useMemo(() => activeSheet?.columns.every((column) => selectedColumnIds.includes(column.id)) ?? false, [activeSheet, selectedColumnIds]);

  const displayColumns = useMemo(() => {
    if (!activeSheet) return [];
    if (!showOnlySelected && !showSelectedColumnsOnly) return activeSheet.columns;
    return activeSheet.columns.filter(col => selectedColumnIds.includes(col.id));
  }, [activeSheet, showOnlySelected, showSelectedColumnsOnly, selectedColumnIds]);

  const displayRows = useMemo(() => {
    if (!activeSheet) return [];
    
    let rows = activeSheet.rows;

    if (showOnlySelected || showSelectedRowsOnly) {
      rows = rows.filter(row => selectedRowIds.includes(row.id));
    }

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      rows = rows.filter(row => {
        return activeSheet.columns.some((_, colIdx) => {
          const val = row.values[colIdx];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(lowerQuery);
        });
      });
    }

    return rows;
  }, [activeSheet, showOnlySelected, showSelectedRowsOnly, selectedRowIds, searchQuery]);

  // 🔴 අලුත් කොටස: Rows සහ Columns දෙකම මතක තබා ගෙන අදාළ දිශාවට Scroll කිරීම
  const prevRowCountRef = useRef(displayRows.length);
  const prevColCountRef = useRef(displayColumns.length);
  const prevSheetIdRef = useRef(activeSheet?.id);

  useEffect(() => {
    if (
      tableContainerRef.current && 
      prevSheetIdRef.current === activeSheet?.id // ෆයිල් එක මාරු කරද්දී Scroll වීම වැළැක්වීම
    ) {
      const isRowAdded = displayRows.length > prevRowCountRef.current;
      const isColAdded = displayColumns.length > prevColCountRef.current;

      if (isRowAdded || isColAdded) {
        setTimeout(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTo({
              // Row එකක් ඇඩ් වුණොත් යටටම යනවා, නැත්නම් තිබුණු තැනම තියෙනවා
              top: isRowAdded ? tableContainerRef.current.scrollHeight : tableContainerRef.current.scrollTop,
              // Column එකක් ඇඩ් වුණොත් දකුණටම යනවා, නැත්නම් තිබුණු තැනම තියෙනවා
              left: isColAdded ? tableContainerRef.current.scrollWidth : tableContainerRef.current.scrollLeft,
              behavior: "smooth"
            });
          }
        }, 50);
      }
    }
    
    // මීළඟ වතාව සඳහා අගයන් යාවත්කාලීන කිරීම
    prevRowCountRef.current = displayRows.length;
    prevColCountRef.current = displayColumns.length;
    prevSheetIdRef.current = activeSheet?.id;
  }, [displayRows.length, displayColumns.length, activeSheet?.id]);

  const handleExportExcel = async () => { 
    if (!activeSheet) return;
    
    try {
      const exportData = displayRows.map(row => {
        const rowObj: Record<string, any> = {};
        displayColumns.forEach(col => {
          const origColIdx = activeSheet.columns.findIndex(c => c.id === col.id);
          rowObj[col.name] = row.values[origColIdx] ?? "";
        });
        return rowObj;
      });

      const selectedPath = await save({
        filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
        defaultPath: "Exported_Data" 
      });

      if (!selectedPath) return;

      const filePath = selectedPath.endsWith(".xlsx") ? selectedPath : `${selectedPath}.xlsx`;

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      await writeFile(filePath, new Uint8Array(excelBuffer));
      
      alert("✅ Excel file exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      alert("❌ Failed to export Excel file.");
    }
  };

  if (!activeSheet) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No Excel sheet loaded.</div>;

  const handleSelectAllRows = () => { if (allRowsSelected) deselectAllRows(); else selectAllRows(); };
  const handleSelectAllColumns = () => { if (allColumnsSelected) deselectAllColumns(); else selectAllColumns(); };
  const handleSortChange = (colIndex: string, order: "asc" | "desc") => {
    if (colIndex === "") { setSortColumnIndex(""); sortData(null, true); return; }
    const idx = Number(colIndex); setSortColumnIndex(idx); setSortOrder(order); sortData(idx, order === "asc");
  };

  const commitEdit = (rowId: string, colIndex: number, value: string) => {
    updateCellValue(rowId, colIndex, value);
  };

  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell || activeCell.isEditing) return;

    let { rIdx, cIdx } = activeCell;
    let handled = false;

    if (e.key === "ArrowUp") { rIdx = Math.max(0, rIdx - 1); handled = true; }
    else if (e.key === "ArrowDown") { rIdx = Math.min(displayRows.length - 1, rIdx + 1); handled = true; }
    else if (e.key === "ArrowLeft") { cIdx = Math.max(0, cIdx - 1); handled = true; }
    else if (e.key === "ArrowRight") { cIdx = Math.min(displayColumns.length - 1, cIdx + 1); handled = true; }
    else if (e.key === "Enter") {
      e.preventDefault();
      const row = displayRows[rIdx];
      if(!row) return;
      const col = displayColumns[cIdx];
      const origColIdx = activeSheet.columns.findIndex(c => c.id === col.id);
      setEditValue(String(row.values[origColIdx] || ""));
      setActiveCell({ rIdx, cIdx, isEditing: true });
      return;
    } else if (e.key === "Escape") {
      setActiveCell(null);
      return;
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const row = displayRows[rIdx];
      if(!row) return;
      const origColIdx = activeSheet.columns.findIndex(c => c.id === displayColumns[cIdx].id);
      updateCellValue(row.id, origColIdx, "");
      return;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditValue(e.key);
      setActiveCell({ rIdx, cIdx, isEditing: true });
      return;
    }

    if (handled) {
      e.preventDefault();
      setActiveCell({ rIdx, cIdx, isEditing: false });
    }
  };

  const handleDoubleClickHeader = (colId: string, currentName: string) => { setEditingHeaderId(colId); setHeaderEditValue(currentName); };
  const handleSaveHeader = (colId: string) => { if (!editingHeaderId) return; if (headerEditValue.trim() !== "") updateColumnName(colId, headerEditValue); setEditingHeaderId(null); };

  const isHideRowCheckbox = showOnlySelected || showSelectedRowsOnly;
  const isHideColCheckbox = showOnlySelected || showSelectedColumnsOnly;

  return (
    <div style={{ width: "100%", border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden", background: "var(--bg-panel)", boxShadow: "var(--shadow-sm)", transition: "var(--theme-transition)", display: "flex", flexDirection: "column" }}>
      
      <ExcelToolbar 
        isHideRowCheckbox={isHideRowCheckbox} isHideColCheckbox={isHideColCheckbox}
        allRowsSelected={allRowsSelected} allColumnsSelected={allColumnsSelected}
        handleSelectAllRows={handleSelectAllRows} handleSelectAllColumns={handleSelectAllColumns}
        activeSheet={activeSheet} sortColumnIndex={sortColumnIndex} sortOrder={sortOrder} handleSortChange={handleSortChange}
      />

      <div 
        ref={tableContainerRef}
        tabIndex={0} 
        onKeyDown={handleTableKeyDown}
        style={{ width: "100%", overflowX: "auto", overflowY: "auto", height: "550px", outline: "none" }} 
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-main)" }}>
              {!isHideRowCheckbox && (
                <th onClick={handleSelectAllRows} style={{ width: "55px", minWidth: "55px", maxWidth: "55px", padding: "12px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, left: 0, background: "var(--bg-main)", zIndex: 3, cursor: "pointer" }}>
                  <input type="checkbox" checked={allRowsSelected} readOnly style={{ pointerEvents: "none" }} />
                </th>
              )}

              <th style={{ width: "45px", minWidth: "45px", maxWidth: "45px", padding: "12px", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, left: isHideRowCheckbox ? 0 : "55px", background: "var(--bg-main)", zIndex: 3, textAlign: "center", color: "var(--text-secondary)", fontWeight: 700, fontSize: "12px", borderRight: "1px solid var(--border-color)" }}>
                #
              </th>

              {displayColumns.map((column) => {
                const selected = selectedColumnIds.includes(column.id);
                const isEditingHeader = editingHeaderId === column.id;
                return (
                  <th key={column.id} onClick={() => !isHideColCheckbox && toggleColumn(column.id)} style={{ width: "200px", minWidth: "200px", maxWidth: "350px", padding: "12px", textAlign: "left", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: (selected && !isHideColCheckbox) ? "var(--col-sel-bg)" : "var(--bg-main)", zIndex: 1, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {!isHideColCheckbox && <input type="checkbox" checked={selected} readOnly style={{ pointerEvents: "none" }} />}
                      {isEditingHeader ? (
                        <input 
                          type="text" autoFocus value={headerEditValue} onChange={(e) => setHeaderEditValue(e.target.value)}
                          onBlur={() => handleSaveHeader(column.id)} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} 
                          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleSaveHeader(column.id); if (e.key === "Escape") setEditingHeaderId(null); }}
                          style={{ width: "100%", padding: "4px", border: "2px solid #2563eb", borderRadius: "4px", outline: "none", fontSize: "14px", fontWeight: 600, color: "#000", boxSizing: "border-box" }}
                        />
                      ) : (
                        <span onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClickHeader(column.id, column.name); }} style={{ fontWeight: 600, whiteSpace: "nowrap", fontSize: "14px", color: (selected && !isHideColCheckbox) ? "var(--col-sel-text)" : "var(--text-primary)" }}>{column.name}</span>
                      )}
                    </div>
                  </th>
                );
              })}
              <th style={{ width: "100%", background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 0 }}></th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={displayColumns.length + (isHideRowCheckbox ? 0 : 1) + 2} style={{ textAlign: "center", padding: "80px", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "15px", fontWeight: 500 }}>{searchQuery ? "No matches found" : "No data to preview"}</div>
                  {searchQuery && <div style={{ fontSize: "13px", marginTop: "5px", opacity: 0.7 }}>Try adjusting your search keywords</div>}
                </td>
              </tr>
            ) : (
              displayRows.map((row, rowIndex) => {
                const selected = selectedRowIds.includes(row.id);
                return (
                  <tr key={row.id} style={{ background: (selected && !isHideRowCheckbox) ? "var(--row-sel-bg)" : rowIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-main)", borderLeft: (selected && !isHideRowCheckbox) ? "4px solid var(--row-sel-border)" : "4px solid transparent" }}>
                    
                    {!isHideRowCheckbox && (
                      <td onClick={() => toggleRow(row.id)} style={{ cursor: "pointer", width: "55px", minWidth: "55px", maxWidth: "55px", padding: "10px", textAlign: "center", borderBottom: "1px solid var(--border-color)", position: "sticky", left: 0, background: (selected && !isHideRowCheckbox) ? "var(--row-sel-bg)" : rowIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-main)", zIndex: 1 }}>
                        <input type="checkbox" checked={selected} readOnly style={{ pointerEvents: "none" }} />
                      </td>
                    )}

                    <td style={{ width: "45px", minWidth: "45px", maxWidth: "45px", padding: "10px", textAlign: "center", borderBottom: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", position: "sticky", left: isHideRowCheckbox ? 0 : "55px", background: (selected && !isHideRowCheckbox) ? "var(--row-sel-bg)" : rowIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-main)", zIndex: 1, fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      {activeSheet.rows.findIndex(r => r.id === row.id) + 1}
                    </td>
                    
                    {displayColumns.map((column, cIdx) => {
                      const originalColIndex = activeSheet.columns.findIndex(c => c.id === column.id);
                      let value = row.values[originalColIndex] ?? "";
                      
                      if (value !== "" && value !== null) {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && !Number.isInteger(numValue)) {
                          value = numValue.toFixed(decimalPlaces);
                        }
                      }

                      const columnSelected = selectedColumnIds.includes(column.id);
                      const isActive = activeCell?.rIdx === rowIndex && activeCell?.cIdx === cIdx;
                      const isEditing = isActive && activeCell?.isEditing;

                      const highlightText = (text: string) => {
                        if (!searchQuery) return text;
                        const regex = new RegExp(`(${searchQuery})`, "gi");
                        const parts = String(text).split(regex);
                        return parts.map((part, i) => 
                          regex.test(part) ? <mark key={i} style={{ background: "#fef08a", color: "#000", padding: "0 2px", borderRadius: "2px" }}>{part}</mark> : part
                        );
                      };

                      return (
                        <td 
                          key={`${row.id}-${column.id}`} 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(row.id);
                            setActiveCell(null);
                          }}
                          onDoubleClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveCell({ rIdx: rowIndex, cIdx, isEditing: true });
                            setEditValue(String(value)); 
                          }}
                          title={!isEditing ? String(value) : ""} 
                          style={{ 
                            width: "200px", minWidth: "200px", maxWidth: "350px", padding: isEditing ? "4px" : "10px 12px", borderBottom: "1px solid var(--border-color)", 
                            background: (columnSelected && !selected && !isHideColCheckbox) ? "var(--cell-sel-bg)" : "transparent", 
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px", 
                            color: (selected && !isHideRowCheckbox) ? "var(--cell-sel-text)" : "var(--text-primary)", cursor: "cell",
                            boxShadow: isActive && !isEditing ? "inset 0 0 0 2px #2563eb" : "none" 
                          }}
                        >
                          {isEditing ? (
                            <input 
                              type="text" autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => { 
                                e.stopPropagation(); 
                                if (e.key === "Enter") { 
                                  e.preventDefault(); 
                                  commitEdit(row.id, originalColIndex, editValue); 
                                  setActiveCell({ rIdx: rowIndex, cIdx, isEditing: false });
                                } else if (e.key === "Escape") { 
                                  setActiveCell({ rIdx: rowIndex, cIdx, isEditing: false }); 
                                } 
                              }}
                              onBlur={() => {
                                if (activeCell?.rIdx === rowIndex && activeCell?.cIdx === cIdx && activeCell.isEditing) {
                                  commitEdit(row.id, originalColIndex, editValue);
                                  setActiveCell(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                              style={{ width: "100%", padding: "6px", border: "2px solid #2563eb", borderRadius: "4px", outline: "none", fontSize: "13px", color: "#000", boxSizing: "border-box" }}
                            />
                          ) : ( 
                            highlightText(String(value)) 
                          )}
                        </td>
                      );
                    })}
                    <td style={{ width: "100%", borderBottom: "1px solid var(--border-color)", background: rowIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-main)" }}></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ExcelFooter 
        showOnlySelected={showOnlySelected} setShowOnlySelected={setShowOnlySelected}
        showSelectedColumnsOnly={showSelectedColumnsOnly} setShowSelectedColumnsOnly={setShowSelectedColumnsOnly}
        showSelectedRowsOnly={showSelectedRowsOnly} setShowSelectedRowsOnly={setShowSelectedRowsOnly}
        handleExportExcel={handleExportExcel} selectedRowIds={selectedRowIds} selectedColumnIds={selectedColumnIds} onContinue={onContinue}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      />
    </div>
  );
}