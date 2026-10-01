import React from "react";
import { useSettingsStore } from "../../../stores/settingsStore"; 
import { X, Ban, RotateCcw, ArrowUp, ArrowDown } from "lucide-react"; 

const FONTS = ["Arial", "Times New Roman", "Courier New", "Verdana", "Tahoma", "Inter"];

export default React.memo(function RightEditPanel({ selectedEdit, editPanelState, handleUpdateOverride, handleResetOverride, setSelectedEdit, handleLayerChange, template }: any) {
  
  const { unit, decimalPlaces } = useSettingsStore();

  if (!selectedEdit || !editPanelState) {
    return null; 
  }

  const isConstrained = editPanelState.constrainToPadding !== false;
  const padding = isConstrained && template ? template.padding : 0;
  const maxX = template ? template.labelSize.width - padding : 999;
  const maxY = template ? template.labelSize.height - padding : 999;

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

  return (
    <div className="no-print" onClick={(e) => e.stopPropagation()} style={{ width: "300px", borderLeft: "1px solid var(--border-color)", background: "var(--bg-panel)", color: "var(--text-primary)", display: "flex", flexDirection: "column", zIndex: 50, flexShrink: 0, transition: "var(--theme-transition)" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-main)", transition: "var(--theme-transition)" }}>
        <div><h3 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "var(--text-primary)" }}>Edit Instance</h3><p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>Applies only to this label.</p></div>
        <button onClick={() => setSelectedEdit(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }} title="Close">
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1, overflowY: "auto", padding: "18px" }} className="hide-scrollbar">
        
        {/* Line එකක් සහ Image එකක් නොවේ නම් පමණක් Textarea පෙන්වයි */}
        {selectedEdit.element.type !== "image" && selectedEdit.element.type !== "line" && (
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Text / Value
            <textarea value={editPanelState.text} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { text: e.target.value })} style={{ width: "100%", marginTop: "5px", padding: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", outline: "none", transition: "var(--theme-transition)" }} />
          </label>
        )}

        {/* 🔴 Line Element එකක් Select වූ විට පෙන්විය යුතු Color Settings */}
        {selectedEdit.element.type === "line" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Line Color
              <input type="color" value={editPanelState.backgroundColor ?? "#000000"} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { backgroundColor: e.target.value })} style={{ width: "100%", height: "32px", marginTop: "4px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
            </label>
          </div>
        )}

        {selectedEdit.element.type === "text" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Font
                <select value={editPanelState.fontFamily} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { fontFamily: e.target.value })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }}>
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Size (pt)
                <input 
                  type="number" 
                  value={editPanelState.fontSize === 0 ? "" : editPanelState.fontSize} 
                  onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { fontSize: e.target.value === "" ? 0 : Number(e.target.value) })} 
                  onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { fontSize: Math.max(6, Math.min(100, Number(e.target.value))) })} 
                  style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
                />
              </label>
            </div>
            
            {/* 🔴 B I U S බොත්තම් (Strikethrough සමඟ) */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { fontWeight: editPanelState.fontWeight === "bold" ? "normal" : "bold" })} style={{ flex: 1, padding: "8px", border: editPanelState.fontWeight === "bold" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.fontWeight === "bold" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.fontWeight === "bold" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", transition: "var(--theme-transition)" }}>B</button>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { fontStyle: editPanelState.fontStyle === "italic" ? "normal" : "italic" })} style={{ flex: 1, padding: "8px", border: editPanelState.fontStyle === "italic" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.fontStyle === "italic" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.fontStyle === "italic" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontStyle: "italic", fontFamily: "serif", transition: "var(--theme-transition)" }}>I</button>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { textDecoration: editPanelState.textDecoration === "underline" ? "none" : "underline" })} style={{ flex: 1, padding: "8px", border: editPanelState.textDecoration === "underline" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.textDecoration === "underline" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.textDecoration === "underline" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", textDecoration: "underline", transition: "var(--theme-transition)" }}>U</button>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { textDecoration: editPanelState.textDecoration === "line-through" ? "none" : "line-through" })} style={{ flex: 1, padding: "8px", border: editPanelState.textDecoration === "line-through" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.textDecoration === "line-through" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.textDecoration === "line-through" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", textDecoration: "line-through", fontWeight: 600, transition: "var(--theme-transition)" }}>S</button>
            </div>
            
            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
              {(["left", "center", "right"] as const).map((align) => (
                <button key={align} onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { textAlign: align })} style={{ flex: 1, padding: "6px", border: editPanelState.textAlign === align ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.textAlign === align ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.textAlign === align ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", textTransform: "capitalize", fontSize: "12px", fontWeight: editPanelState.textAlign === align ? 600 : 400, transition: "var(--theme-transition)" }}>{align}</button>
              ))}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Color
                <input type="color" value={editPanelState.color} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { color: e.target.value })} style={{ width: "100%", height: "32px", marginTop: "4px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
              </label>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>BG Color
                <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                  <input type="color" value={editPanelState.backgroundColor === "transparent" ? "#ffffff" : editPanelState.backgroundColor} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { backgroundColor: e.target.value })} style={{ flex: 1, height: "32px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
                  <button type="button" onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { backgroundColor: "transparent" })} title="Transparent" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", background: editPanelState.backgroundColor === "transparent" || !editPanelState.backgroundColor ? "var(--bg-main)" : "var(--btn-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", transition: "var(--theme-transition)" }}>
                    <Ban size={14} />
                  </button>
                </div>
              </label>
            </div>

            {editPanelState.textDecoration === "underline" && (
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginTop: "12px" }}>Underline Style
                <select value={editPanelState.textDecorationStyle} onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { textDecorationStyle: e.target.value })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", outline: "none", transition: "var(--theme-transition)" }}>
                  <option value="solid">Solid</option><option value="double">Double</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option><option value="wavy">Wavy</option>
                </select>
              </label>
            )}
            
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginTop: "12px" }}>List Format</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { listStyle: "none" })} style={{ flex: 1, padding: "6px", border: editPanelState.listStyle === "none" || !editPanelState.listStyle ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.listStyle === "none" || !editPanelState.listStyle ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.listStyle === "none" || !editPanelState.listStyle ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "var(--theme-transition)" }}>None</button>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { listStyle: "bullet" })} style={{ flex: 1, padding: "6px", border: editPanelState.listStyle === "bullet" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.listStyle === "bullet" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.listStyle === "bullet" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "var(--theme-transition)" }}>• Bullet</button>
              <button onClick={() => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { listStyle: "number" })} style={{ flex: 1, padding: "6px", border: editPanelState.listStyle === "number" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: editPanelState.listStyle === "number" ? "var(--bg-active)" : "var(--btn-bg)", color: editPanelState.listStyle === "number" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "var(--theme-transition)" }}>1. Num</button>
            </div>
          </>
        )}

        <hr style={{ margin: "5px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />
        
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Transform (Position & Size)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Width ({unit})
            <input 
              type="number" step={0.1} 
              value={formatVal(editPanelState.width)} 
              onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { width: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
              onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { width: Math.max(1, Math.min(maxX - editPanelState.x, toMm(Number(e.target.value)))) })} 
              style={{ width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "6px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Height ({unit})
            <input 
              type="number" step={0.1} 
              value={formatVal(editPanelState.height)} 
              onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
              onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { height: Math.max(1, Math.min(maxY - editPanelState.y, toMm(Number(e.target.value)))) })} 
              style={{ width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "6px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>X ({unit})
            <input 
              type="number" step={0.1} 
              value={formatVal(editPanelState.x)} 
              onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { x: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
              onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { x: Math.max(padding, Math.min(maxX - editPanelState.width, toMm(Number(e.target.value)))) })} 
              style={{ width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "6px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
            />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Y ({unit})
            <input 
              type="number" step={0.1} 
              value={formatVal(editPanelState.y)} 
              onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { y: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
              onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { y: Math.max(padding, Math.min(maxY - editPanelState.height, toMm(Number(e.target.value)))) })} 
              style={{ width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "6px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
            />
          </label>
        </div>
        
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginTop: "8px", display: "block" }}>Rotation (°)
          <input 
            type="number" 
            value={editPanelState.rotation === 0 ? "" : editPanelState.rotation} 
            onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { rotation: e.target.value === "" ? 0 : Number(e.target.value) })} 
            onBlur={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { rotation: Number(e.target.value) || 0 })} 
            style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", boxSizing: "border-box", outline: "none", transition: "var(--theme-transition)" }} 
          />
        </label>

        <div style={{ marginTop: "12px", padding: "10px", background: "var(--bg-main)", borderRadius: "6px", border: "1px solid var(--border-color)", transition: "var(--theme-transition)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={isConstrained} 
              onChange={(e) => handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { constrainToPadding: e.target.checked })} 
              style={{ width: "16px", height: "16px", cursor: "pointer" }} 
            />
            Keep inside padding margin
          </label>
        </div>

        <button onClick={() => handleResetOverride(selectedEdit.instance, selectedEdit.element)} disabled={!editPanelState.isEdited} style={{ width: "100%", marginTop: "15px", padding: "10px", border: "none", background: editPanelState.isEdited ? "#f97316" : "var(--bg-main)", color: editPanelState.isEdited ? "#fff" : "var(--text-secondary)", borderRadius: "6px", cursor: editPanelState.isEdited ? "pointer" : "not-allowed", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
          <RotateCcw size={16} /> Reset Format
        </button>
        
        <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
          <button onClick={() => handleLayerChange('up')} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "var(--theme-transition)" }}>
            <ArrowUp size={14} /> Bring Front
          </button>
          <button onClick={() => handleLayerChange('down')} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "var(--theme-transition)" }}>
            <ArrowDown size={14} /> Send Back
          </button>
        </div>
      </div>
    </div>
  );
});