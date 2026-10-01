import { useRef, useMemo, type ChangeEvent } from "react";
import { useExcelStore } from "../../../stores/excelStore";
import { useLabelStore } from "../../../stores/labelStore";
import { useSettingsStore } from "../../../stores/settingsStore"; 
import { FileText, LayoutTemplate, AlertTriangle, Barcode, QrCode, Image as ImageIcon, Target, Tag, Square, Ruler, Scissors } from "lucide-react"; 

const PAGE_SIZES = [
  { label: "A4", width: 210, height: 297 },
  { label: "A5", width: 148, height: 210 },
  { label: "Letter", width: 215.9, height: 279.4 },
  { label: "Custom", width: 0, height: 0 } 
];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export default function RightPropertiesPanel() {
  const activeSheet = useExcelStore((state) => state.activeSheet);
  const selectedColumnIds = useExcelStore((state) => state.selectedData.selectedColumnIds);

  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;

  const isDualMode = activeSet?.isDualMode || false;
  const isDataLinked = activeSet?.isDataLinked || false;
  const activeLabel = useLabelStore((state) => state.activeLabel);

  const setIsDualMode = useLabelStore((state) => state.setIsDualMode);
  const setIsDataLinked = useLabelStore((state) => state.setIsDataLinked);
  const setActiveLabel = useLabelStore((state) => state.setActiveLabel);

  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;
  const currentSelectedId = useLabelStore((state) => state.selectedElementId);

  const updatePageSize = useLabelStore((state) => state.updatePageSize);
  const setLabelSize = useLabelStore((state) => state.setLabelSize);
  const setShowBorder = useLabelStore((state) => state.setShowBorder);
  const setBorderSettings = useLabelStore((state) => state.setBorderSettings);
  const setOrientation = useLabelStore((state) => state.setOrientation);
  const setSmartFill = useLabelStore((state) => state.setSmartFill);
  const setPadding = useLabelStore((state) => state.setPadding);
  const setGrid = useLabelStore((state) => state.setGrid);
  const setMargins = useLabelStore((state) => state.setMargins);
  const setLabelBackgroundColor = useLabelStore((state: any) => state.setLabelBackgroundColor);
  const addElement = useLabelStore((state) => state.addElement);
  const updateElement = useLabelStore((state) => state.updateElement);
  
  const setSections = useLabelStore((state) => state.setSections);
  const updateSection = useLabelStore((state) => state.updateSection);
  const setSectionBorderWidth = useLabelStore((state) => state.setSectionBorderWidth);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { unit, decimalPlaces, panelPosition } = useSettingsStore();

  if (!currentTemplate) return null;

  const availableColumns = activeSheet ? activeSheet.columns.filter((col) => selectedColumnIds.includes(col.id)) : [];
  const L_W = currentTemplate.labelSize.width;
  const L_H = currentTemplate.labelSize.height;

  const selectedElement = useMemo(() => {
    return currentTemplate.elements.find((el) => el.id === currentSelectedId) ?? null;
  }, [currentTemplate.elements, currentSelectedId]);

  const currentW = currentTemplate.page.width;
  const currentH = currentTemplate.page.height;

  const currentPreset = useMemo(() => {
    const isLandscape = currentW > currentH;
    const checkW = isLandscape ? currentH : currentW;
    const checkH = isLandscape ? currentW : currentH;
    const match = PAGE_SIZES.find(p => Math.abs(p.width - checkW) < 1 && Math.abs(p.height - checkH) < 1);
    return match ? match.label : "Custom";
  }, [currentW, currentH]);

  const isPageLandscape = currentW > currentH;

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "Custom") return;
    const size = PAGE_SIZES.find(p => p.label === selected);
    if (size) {
      if (isPageLandscape) updatePageSize(size.height, size.width);
      else updatePageSize(size.width, size.height);
    }
  };

  const togglePageOrientation = () => updatePageSize(currentH, currentW);

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

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
      if (!/^[0-9\s-]+$/.test(String(val).trim())) return false;
    }
    return hasData;
  };

  const enforceBounds = (el: any, enforcePadding: boolean, currentPad: number) => {
    const P = enforcePadding ? currentPad : 0;
    let newX = el.x; let newY = el.y; let newW = el.width; let newH = el.height;
    const maxW = L_W - 2 * P; const maxH = L_H - 2 * P;
    const rad = Math.abs(el.rotation || 0) % 360;
    const isVertical = rad === 90 || rad === 270;
    
    if (isVertical) {
      if (newH > maxW) newH = Math.max(5, maxW);
      if (newW > maxH) newW = Math.max(5, maxH);
    } else {
      if (newW > maxW) newW = Math.max(5, maxW);
      if (newH > maxH) newH = Math.max(5, maxH);
    }
    
    const visualWidth = isVertical ? newH : newW;
    const visualHeight = isVertical ? newW : newH;
    
    let minX = P; let minY = P;
    if (rad === 90) minX = P + visualWidth;
    if (rad === 270) minY = P + visualHeight;
    if (rad === 180) { minX = P + visualWidth; minY = P + visualHeight; }
    
    let maxXBound = L_W - P - (rad === 90 || rad === 180 ? 0 : visualWidth);
    let maxYBound = L_H - P - (rad === 270 || rad === 180 ? 0 : visualHeight);
    maxXBound = Math.max(minX, maxXBound);
    maxYBound = Math.max(minY, maxYBound);
    
    newX = Math.max(minX, Math.min(maxXBound, newX));
    newY = Math.max(minY, Math.min(maxYBound, newY));
    
    return { x: newX, y: newY, width: newW, height: newH };
  };

  const addField = (fieldName: string) => { 
    const P = currentTemplate.padding; 
    addElement({ 
      id: createId("text"), type: "text", x: P, y: P, width: Math.max(10, L_W - P * 2), height: Math.max(10, L_H - P * 2), 
      field: fieldName, fontSize: 12, fontFamily: "Arial", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", textAlign: "left", rotation: 0,
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
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRight: panelPosition === "right" ? "1px solid var(--border-color)" : "none", borderLeft: panelPosition === "left" ? "1px solid var(--border-color)" : "none", color: "var(--text-primary)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", height: "820px", transition: "var(--theme-transition)" }}>
      
      <div style={{ background: "var(--bg-main)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "15px" }}>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><LayoutTemplate size={16} /> Dual Template Mode</span>
          <input type="checkbox" checked={isDualMode} onChange={(e) => { setIsDualMode(e.target.checked); if (!e.target.checked) setActiveLabel("A"); }} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
        </label>
        {isDualMode && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--border-focus)" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              <span>🔗 Link Excel Data</span>
              <input type="checkbox" checked={isDataLinked} onChange={(e) => setIsDataLinked(e.target.checked)} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
            </label>
            <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>{isDataLinked ? "Both labels use the same row data." : "Labels use independent data."}</p>
          </div>
        )}
      </div>

      {isDualMode && (
        <div style={{ display: "flex", gap: "5px", marginBottom: "20px" }}>
          <button type="button" onClick={() => setActiveLabel("A")} style={{ flex: 1, padding: "10px", background: activeLabel === "A" ? "var(--bg-active)" : "var(--btn-bg)", color: activeLabel === "A" ? "var(--text-accent)" : "var(--text-primary)", border: activeLabel === "A" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", borderRadius: "6px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>Label A</button>
          <button type="button" onClick={() => setActiveLabel("B")} style={{ flex: 1, padding: "10px", background: activeLabel === "B" ? "var(--bg-active)" : "var(--btn-bg)", color: activeLabel === "B" ? "var(--text-accent)" : "var(--text-primary)", border: activeLabel === "B" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", borderRadius: "6px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>Label B</button>
        </div>
      )}

      <hr style={{ margin: "0 0 20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }} className="hide-scrollbar">
        
        <div style={{ paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><FileText size={16} /> Page Setup</h3>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "10px" }}>
            Paper Size
            <select value={currentPreset} onChange={handlePresetChange} style={{ width: "100%", padding: "8px", marginTop: "5px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", cursor: "pointer", transition: "var(--theme-transition)" }}>
              {PAGE_SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
            <button onClick={() => { if (isPageLandscape) togglePageOrientation(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: !isPageLandscape ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: !isPageLandscape ? "var(--bg-active)" : "var(--btn-bg)", color: !isPageLandscape ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "0.2s" }}><FileText size={14} /> Portrait</button>
            <button onClick={() => { if (!isPageLandscape) togglePageOrientation(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: isPageLandscape ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: isPageLandscape ? "var(--bg-active)" : "var(--btn-bg)", color: isPageLandscape ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "0.2s" }}><FileText size={14} style={{ transform: "rotate(-90deg)" }} /> Landscape</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Width ({unit})<input type="number" step={0.1} value={formatVal(currentW)} onChange={(e) => updatePageSize(e.target.value === "" ? 0 : toMm(Number(e.target.value)), currentH)} onBlur={(e) => updatePageSize(Math.max(10, toMm(Number(e.target.value))), currentH)} style={{ width: "100%", padding: "7px", marginTop: "4px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box", outline: "none" }} /></label>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Height ({unit})<input type="number" step={0.1} value={formatVal(currentH)} onChange={(e) => updatePageSize(currentW, e.target.value === "" ? 0 : toMm(Number(e.target.value)))} onBlur={(e) => updatePageSize(currentW, Math.max(10, toMm(Number(e.target.value))))} style={{ width: "100%", padding: "7px", marginTop: "4px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box", outline: "none" }} /></label>
          </div>
        </div>

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
        
        {selectedElement && (
          <div style={{ padding: "12px", background: "var(--bg-active)", border: "1px solid var(--border-active)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "var(--text-accent)", display: "flex", alignItems: "center", gap: "6px" }}><Target size={14} /> Selected Element</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={selectedElement.constrainToPadding !== false} 
                onChange={(e) => { 
                  const checked = e.target.checked; 
                  const bounds = enforceBounds(selectedElement, checked, currentTemplate.padding); 
                  updateElement(selectedElement.id, { constrainToPadding: checked, ...bounds }); 
                }} 
                style={{ width: "16px", height: "16px", cursor: "pointer" }} 
              />
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Keep strictly inside Padding</strong>
            </label>
            <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Uncheck this to move the text box over the padding bounds.
            </p>
          </div>
        )}

        <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><Tag size={16} /> Label Settings</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
          
          {/* 🔴 Fixed: Width එක සමග Height එකත් යවයි */}
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Width ({unit})
            <input type="number" min={0.5} step={0.1} 
              value={formatVal(currentTemplate.labelSize.width)} 
              onChange={(e) => setLabelSize({ width: e.target.value === "" ? 0 : toMm(Number(e.target.value)), height: currentTemplate.labelSize.height })} 
              onBlur={(e) => setLabelSize({ width: Math.max(5, toMm(Number(e.target.value))), height: currentTemplate.labelSize.height })} 
              style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
          </label>
          
          {/* 🔴 Fixed: Height එක සමග Width එකත් යවයි */}
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Height ({unit})
            <input type="number" min={0.5} step={0.1} 
              value={formatVal(currentTemplate.labelSize.height)} 
              onChange={(e) => setLabelSize({ width: currentTemplate.labelSize.width, height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
              onBlur={(e) => setLabelSize({ width: currentTemplate.labelSize.width, height: Math.max(5, toMm(Number(e.target.value))) })} 
              style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Background
            <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
              <input type="color" value={currentTemplate.backgroundColor || "#ffffff"} onChange={(e) => setLabelBackgroundColor && setLabelBackgroundColor(e.target.value)} style={{ flex: 1, height: "32px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
              <button type="button" onClick={() => setLabelBackgroundColor && setLabelBackgroundColor("#ffffff")} title="Reset to White" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", background: currentTemplate.backgroundColor === "#ffffff" || !currentTemplate.backgroundColor ? "var(--bg-main)" : "var(--btn-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", transition: "var(--theme-transition)" }}><Square size={14} /></button>
            </div>
          </label>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Safe Pad ({unit})
            <input type="number" min={0} step={0.1} value={formatVal(currentTemplate.padding)} onChange={(e) => setPadding(e.target.value === "" ? 0 : toMm(Number(e.target.value)))} onBlur={(e) => { const newPad = Math.max(0, toMm(Number(e.target.value))); setPadding(newPad); currentTemplate.elements.forEach(el => { const bounds = enforceBounds(el, el.constrainToPadding !== false, newPad); if (bounds.x !== el.x || bounds.y !== el.y || bounds.width !== el.width || bounds.height !== el.height) { updateElement(el.id, bounds); } }); }} style={{ display: "block", width: "100%", marginTop: "5px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
          </label>
        </div>

        <div style={{ padding: "12px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", alignItems: "center", gap: "6px" }}>
            <Scissors size={14} /> Divide Label (Sections)
          </label>
          <select 
            value={currentTemplate.sections?.length || 0} 
            onChange={(e) => {
              const count = parseInt(e.target.value);
              if (count <= 1) {
                setSections([]);
              } else {
                const h = currentTemplate.labelSize.height / count;
                const newSections = Array.from({ length: count }).map((_, i) => ({
                  id: createId("sec"),
                  color: i % 2 === 0 ? "#ffffff" : "#fef08a",
                  height: h,
                  showTopBorder: i > 0,
                  showBottomBorder: false,
                  borderColor: "#000000"
                }));
                setSections(newSections);
              }
            }}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", transition: "var(--theme-transition)" }}
          >
            <option value={0}>1 Section (Solid Background)</option>
            <option value={2}>2 Sections (Top & Bottom)</option>
            <option value={3}>3 Sections (Top, Middle, Bottom)</option>
            <option value={4}>4 Sections</option>
          </select>

          {currentTemplate.sections && currentTemplate.sections.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-panel)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Divider Border Size (px)</span>
                <input type="number" min={1} max={5} value={currentTemplate.sectionBorderWidth ?? 1} onChange={(e) => setSectionBorderWidth(Math.max(1, Number(e.target.value)))} style={{ width: "55px", padding: "4px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--input-bg)", color: "var(--text-primary)", textAlign: "center", fontSize: "12px", outline: "none" }} />
              </div>
              {currentTemplate.sections.map((sec, i) => (
                <div key={sec.id} style={{ display: "flex", gap: "6px", alignItems: "center", background: "var(--bg-panel)", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <div style={{ flex: 1.2 }}>
                    <label style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Sec {i + 1} Color</label>
                    <input type="color" value={sec.color} onChange={(e) => updateSection(sec.id, { color: e.target.value })} style={{ width: "100%", height: "24px", padding: 0, border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Height ({unit})</label>
                    <input type="number" step={0.1} value={formatVal(sec.height)} onChange={(e) => updateSection(sec.id, { height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateSection(sec.id, { height: Math.max(1, toMm(Number(e.target.value))) })} style={{ width: "100%", padding: "4px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", fontSize: "12px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "12px" }}>
                    <label style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      <input type="checkbox" checked={sec.showTopBorder ?? (i > 0)} onChange={(e) => updateSection(sec.id, { showTopBorder: e.target.checked })} style={{ width: "12px", height: "12px" }} />
                      Border
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "10px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={currentTemplate.showBorder} onChange={(e) => setShowBorder(e.target.checked)} style={{ width: "16px", height: "16px" }} />
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>Print Label Borders</strong>
          </label>
          {currentTemplate.showBorder && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Size (px)
                <input type="number" min={1} max={10} value={currentTemplate.borderWidth} onChange={(e) => setBorderSettings(Math.max(1, Number(e.target.value)), currentTemplate.borderStyle)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", transition: "var(--theme-transition)" }} />
              </label>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Type
                <select value={currentTemplate.borderStyle} onChange={(e) => setBorderSettings(currentTemplate.borderWidth, e.target.value as any)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", transition: "var(--theme-transition)" }}>
                  <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
                </select>
              </label>
            </div>
          )}
        </div>

        <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

        <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><Ruler size={16} /> Layout Settings</h3>

        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "15px" }}>Filling Direction
          <select value={currentTemplate.orientation} onChange={(e) => setOrientation(e.target.value as any)} style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }}>
            <option value="landscape">Landscape (Horizontal First)</option>
            <option value="portrait">Portrait (Vertical First)</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", cursor: "pointer", marginBottom: "15px", transition: "var(--theme-transition)" }}>
          <input type="checkbox" checked={currentTemplate.smartFill} onChange={(e) => setSmartFill(e.target.checked)} style={{ width: "16px", height: "16px" }} />
          <strong style={{ color: "#f59e0b", fontSize: "13px" }}>Smart Fill Free Space</strong>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingBottom: "10px" }}>
          {/* 🔴 Fixed: Grid සහ Margins යාවත්කාලීන කිරීමේදී Spread Operator (...) භාවිතා කර ඇත */}
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>H. Gap ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.grid.horizontalGap)} onChange={(e) => setGrid({ ...currentTemplate.grid, horizontalGap: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setGrid({ ...currentTemplate.grid, horizontalGap: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>V. Gap ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.grid.verticalGap)} onChange={(e) => setGrid({ ...currentTemplate.grid, verticalGap: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setGrid({ ...currentTemplate.grid, verticalGap: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Top Marg. ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.margins.top)} onChange={(e) => setMargins({ ...currentTemplate.margins, top: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setMargins({ ...currentTemplate.margins, top: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Left Marg. ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.margins.left)} onChange={(e) => setMargins({ ...currentTemplate.margins, left: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setMargins({ ...currentTemplate.margins, left: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
        </div>
      </div>
    </div>
  );
}