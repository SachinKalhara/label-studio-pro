import { useMemo } from "react";
import { Target } from "lucide-react";
import { useLabelStore } from "../../../../stores/labelStore";
import { useSettingsStore } from "../../../../stores/settingsStore";
import { enforceBounds } from "../../utils/elementBounds";

const FONTS = ["Arial", "Times New Roman", "Courier New", "Verdana", "Tahoma", "Inter"];

export default function ElementEditor() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  const currentSelectedId = useLabelStore((state) => state.selectedElementId);
  const updateElement = useLabelStore((state) => state.updateElement);
  const removeElement = useLabelStore((state) => state.removeElement);
  const bringForward = useLabelStore((state) => state.bringForward);
  const sendBackward = useLabelStore((state) => state.sendBackward);

  const { unit, decimalPlaces } = useSettingsStore();

  const selectedElement = useMemo(() => {
    if (!currentTemplate) return null;
    return currentTemplate.elements.find((el) => el.id === currentSelectedId) ?? null;
  }, [currentTemplate, currentSelectedId]);

  if (!currentTemplate || !selectedElement) return null;

  const L_W = currentTemplate.labelSize.width;
  const L_H = currentTemplate.labelSize.height;
  const maxX = currentTemplate.labelSize.width - (selectedElement.constrainToPadding !== false ? currentTemplate.padding : 0);
  const maxY = currentTemplate.labelSize.height - (selectedElement.constrainToPadding !== false ? currentTemplate.padding : 0);

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

  return (
    <>
      <div style={{ padding: "12px", background: "var(--bg-active)", border: "1px solid var(--border-active)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "var(--text-accent)", display: "flex", alignItems: "center", gap: "6px" }}><Target size={14} /> Selected Element</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{selectedElement.type.toUpperCase()}</strong>
          <span style={{ fontSize: "11px", background: "var(--border-color)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-primary)" }}>ID: {selectedElement.id.slice(-4)}</span>
        </div>

        {selectedElement.type !== "image" && selectedElement.type !== "line" && !(selectedElement as any).isStatic && (
          <div style={{ marginBottom: "10px", color: "var(--text-secondary)", fontSize: "13px", wordBreak: "break-word" }}>Field: <span style={{ color: "var(--text-accent)", fontWeight: 500 }}>{selectedElement.field ?? "None"}</span></div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={selectedElement.constrainToPadding !== false} 
            onChange={(e) => { 
              const checked = e.target.checked; 
              const bounds = enforceBounds(selectedElement as any, checked, currentTemplate.padding, L_W, L_H); 
              updateElement(selectedElement.id, { constrainToPadding: checked, ...bounds }); 
            }} 
            style={{ width: "16px", height: "16px", cursor: "pointer" }} 
          />
          <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Keep strictly inside Padding</strong>
        </label>
        <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          Uncheck this to move the box over the padding bounds.
        </p>
      </div>

      {(selectedElement as any).isStatic && selectedElement.type === "text" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Text Content
            <input type="text" value={(selectedElement as any).text || ""} onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", borderRadius: "4px", fontWeight: 400, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }} />
          </label>
        </div>
      )}

      {selectedElement.type === "line" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Line Color
            <input type="color" value={selectedElement.backgroundColor ?? "#000000"} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value, color: e.target.value })} style={{ width: "100%", height: "32px", marginTop: "4px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
          </label>
        </div>
      )}

      {selectedElement.type === "text" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Typography & Colors</label>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Font Family
              <select value={selectedElement.fontFamily ?? "Arial"} onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", borderRadius: "4px", fontWeight: 400, background: "var(--input-bg)", color: "var(--text-primary)" }}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Size (pt)
              <input type="number" min={6} max={100} value={selectedElement.fontSize === 0 ? "" : selectedElement.fontSize ?? 12} onChange={(e) => updateElement(selectedElement.id, { fontSize: e.target.value === "" ? 0 : Number(e.target.value) })} onBlur={(e) => updateElement(selectedElement.id, { fontSize: Math.max(6, Math.min(100, Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", borderRadius: "4px", fontWeight: 400, background: "var(--input-bg)", color: "var(--text-primary)" }} />
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Text Style</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <button type="button" title="Bold" onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })} style={{ flex: 1, padding: "8px", border: selectedElement.fontWeight === "bold" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.fontWeight === "bold" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.fontWeight === "bold" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>B</button>
              <button type="button" title="Italic" onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })} style={{ flex: 1, padding: "8px", border: selectedElement.fontStyle === "italic" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.fontStyle === "italic" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.fontStyle === "italic" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontStyle: "italic", fontFamily: "serif" }}>I</button>
              <button type="button" title="Underline" onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === "underline" ? "none" : "underline" })} style={{ flex: 1, padding: "8px", border: selectedElement.textDecoration === "underline" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.textDecoration === "underline" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.textDecoration === "underline" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", textDecoration: "underline" }}>U</button>
              <button type="button" title="Strikethrough" onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === "line-through" ? "none" : "line-through" })} style={{ flex: 1, padding: "8px", border: selectedElement.textDecoration === "line-through" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.textDecoration === "line-through" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.textDecoration === "line-through" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", textDecoration: "line-through", fontWeight: 600 }}>S</button>
            </div>
          </div>

          {(selectedElement.type === "text" || selectedElement.type === "barcode" || selectedElement.type === "qrcode") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "15px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Alignment</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["left", "center", "right"] as const).map((align) => (
              <button key={align} type="button" title={align} onClick={() => updateElement(selectedElement.id, { textAlign: align })} style={{ flex: 1, padding: "6px", border: selectedElement.textAlign === align ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.textAlign === align ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.textAlign === align ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", textTransform: "capitalize", fontSize: "12px", fontWeight: selectedElement.textAlign === align ? 600 : 400 }}>
                {align === "left" ? "Left" : align === "center" ? "Center" : "Right"}
              </button>
            ))}
          </div>
        </div>
      )}

          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Text Color
              <input type="color" value={selectedElement.color ?? "#000000"} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} style={{ width: "100%", height: "32px", marginTop: "4px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
            </label>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Background
              <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                <input type="color" value={selectedElement.backgroundColor === "transparent" ? "#ffffff" : (selectedElement.backgroundColor ?? "#ffffff")} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })} style={{ flex: 1, height: "32px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
                <button type="button" onClick={() => updateElement(selectedElement.id, { backgroundColor: "transparent" })} title="Transparent" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", background: selectedElement.backgroundColor === "transparent" || !selectedElement.backgroundColor ? "var(--bg-main)" : "var(--btn-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>🚫</button>
              </div>
            </label>
          </div>

          {selectedElement.textDecoration === "underline" && (
            <label style={{ display: "block", marginBottom: "12px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Underline Style
              <select value={selectedElement.textDecorationStyle ?? "solid"} onChange={(e) => updateElement(selectedElement.id, { textDecorationStyle: e.target.value as any })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }}>
                <option value="solid">Solid</option><option value="double">Double</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option><option value="wavy">Wavy</option>
              </select>
            </label>
          )}

          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>List Format</label>
          <div style={{ display: "flex", gap: "6px" }}>
            <button type="button" onClick={() => updateElement(selectedElement.id, { listStyle: "none" })} style={{ flex: 1, padding: "6px", border: selectedElement.listStyle === "none" || !selectedElement.listStyle ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.listStyle === "none" || !selectedElement.listStyle ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.listStyle === "none" || !selectedElement.listStyle ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>None</button>
            <button type="button" onClick={() => updateElement(selectedElement.id, { listStyle: "bullet" })} style={{ flex: 1, padding: "6px", border: selectedElement.listStyle === "bullet" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.listStyle === "bullet" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.listStyle === "bullet" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Bullet</button>
            <button type="button" onClick={() => updateElement(selectedElement.id, { listStyle: "number" })} style={{ flex: 1, padding: "6px", border: selectedElement.listStyle === "number" ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: selectedElement.listStyle === "number" ? "var(--bg-active)" : "var(--btn-bg)", color: selectedElement.listStyle === "number" ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Number</button>
          </div>
        </div>
      )}

      
      {selectedElement.type === "text" && <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />}

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Transform (Position & Size)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Width ({unit})
            <input type="number" step={0.1} value={formatVal(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateElement(selectedElement.id, { width: Math.max(1, Math.min(maxX - selectedElement.x, toMm(Number(e.target.value)))) })} style={{ width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Height ({unit})
            <input type="number" step={0.1} value={formatVal(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateElement(selectedElement.id, { height: Math.max(1, Math.min(maxY - selectedElement.y, toMm(Number(e.target.value)))) })} style={{ width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>X ({unit})
            <input type="number" step={0.1} value={formatVal(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateElement(selectedElement.id, { x: Math.max(currentTemplate.padding, Math.min(L_W - currentTemplate.padding - selectedElement.width, toMm(Number(e.target.value)))) })} style={{ width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Y ({unit})
            <input type="number" step={0.1} value={formatVal(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateElement(selectedElement.id, { y: Math.max(currentTemplate.padding, Math.min(L_H - currentTemplate.padding - selectedElement.height, toMm(Number(e.target.value)))) })} style={{ width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }} />
          </label>
        </div>
        
        <label style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Rotation (°)
          <input type="number" value={selectedElement.rotation === 0 ? "" : selectedElement.rotation} onChange={(e) => updateElement(selectedElement.id, { rotation: e.target.value === "" ? 0 : Number(e.target.value) })} onBlur={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) || 0 })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }} />
        </label>
      </div>

      <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Layers & Actions</label>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={() => bringForward(selectedElement.id)} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Bring Front</button>
          <button type="button" onClick={() => sendBackward(selectedElement.id)} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Send Back</button>
        </div>
      </div>

      <button type="button" onClick={() => removeElement(selectedElement.id)} style={{ width: "100%", marginTop: "10px", padding: "12px", border: "1px solid #ef4444", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "6px", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }}>Delete Element</button>
    </>
  );
}