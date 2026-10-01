import { useRef, type ChangeEvent } from "react";
import { AlertTriangle, Barcode, QrCode, Image as ImageIcon } from "lucide-react";
import { useExcelStore } from "../../../../stores/excelStore";
import { useLabelStore } from "../../../../stores/labelStore";
import { createId } from "../../utils/elementBounds";

export default function DataFields() {
  const activeSheet = useExcelStore((state) => state.activeSheet);
  const selectedColumnIds = useExcelStore((state) => state.selectedData.selectedColumnIds);

  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  const addElement = useLabelStore((state) => state.addElement);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentTemplate) return null;

  const availableColumns = activeSheet ? activeSheet.columns.filter((col) => selectedColumnIds.includes(col.id)) : [];
  const L_W = currentTemplate.labelSize.width;
  const L_H = currentTemplate.labelSize.height;

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const P = currentTemplate.padding;
      addElement({ id: createId("image"), type: "image", x: Math.max(5, P), y: Math.max(5, P), width: 30, height: 30, src: base64, rotation: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isColumnNumeric = (colName: string) => {
    if (!activeSheet || activeSheet.rows.length === 0) return false;
    const colIndex = activeSheet.columns.findIndex((c) => c.name === colName);
    if (colIndex === -1) return false;
    const rowsToCheck = activeSheet.rows.slice(0, 10);
    let hasData = false;
    for (const row of rowsToCheck) {
      const val = row.values[colIndex];
      if (val === undefined || val === null || val === "") continue;
      hasData = true;
      if (!/^[0-9\s.-]+$/.test(String(val).trim())) return false;
    }
    return hasData;
  };

  const addField = (fieldName: string) => { 
    const P = currentTemplate.padding; 
    addElement({ 
      id: createId("text"), type: "text", x: P, y: P, width: Math.max(10, L_W - P * 2), height: Math.max(10, L_H - P * 2), 
      field: fieldName, fontSize: 12, fontFamily: "Arial", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", textAlign: "center", rotation: 0,
      color: "#000000", backgroundColor: "transparent", textDecorationStyle: "solid", listStyle: "none", constrainToPadding: true
    }); 
  };
  
  const addBarcode = (fieldName: string) => { 
    const P = currentTemplate.padding; 
    addElement({ id: createId("barcode"), type: "barcode", x: P, y: Math.max(0, L_H - P - 15), width: Math.max(20, Math.min(50, L_W - P * 2)), height: Math.max(8, Math.min(12, L_H - P * 2)), field: fieldName, rotation: 0, constrainToPadding: true }); 
  };
  
  const addQRCode = (fieldName: string) => { 
    const P = currentTemplate.padding; 
    addElement({ id: createId("qrcode"), type: "qrcode", x: P, y: P, width: Math.max(15, Math.min(25, L_W - P * 2)), height: Math.max(15, Math.min(25, L_H - P * 2)), field: fieldName, rotation: 0, constrainToPadding: true }); 
  };

  return (
    <>
      {!activeSheet ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No Excel data loaded.</p>
      ) : availableColumns.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "6px", fontSize: "13px", border: "1px solid rgba(239, 68, 68, 0.3)", marginBottom: "15px" }}>
          <AlertTriangle size={16} strokeWidth={2.5} /> Go to <strong>"1. Select Data"</strong> and tick the columns.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
          {availableColumns.map((column) => {
            const isNumeric = isColumnNumeric(column.name);
            return (
              <div key={column.id} style={{ display: "flex", gap: "4px" }}>
                <button type="button" onClick={() => addField(column.name)} style={{ flex: 1, textAlign: "left", padding: "8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontSize: "13px", transition: "var(--theme-transition)" }}>{column.name}</button>
                {isNumeric && (
                  <button type="button" onClick={() => addBarcode(column.name)} title="Add Barcode" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", transition: "var(--theme-transition)" }}><Barcode size={16} /></button>
                )}
                <button type="button" onClick={() => addQRCode(column.name)} title="Add QR Code" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "var(--theme-transition)" }}><QrCode size={16} /></button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", border: "1px dashed var(--border-focus)", background: "var(--bg-main)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: 600, transition: "var(--theme-transition)" }}>
          <ImageIcon size={18} /> Add Image / Logo
        </button>
      </div>

      <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />
    </>
  );
}