import { useMemo, useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { useLabelStore } from "../../../stores/labelStore";
import { useSettingsStore } from "../../../stores/settingsStore"; 
import { FolderOpen, Save, PenLine, MousePointerClick, Minus } from "lucide-react"; 

const FONTS = ["Arial", "Times New Roman", "Courier New", "Verdana", "Tahoma", "Inter"];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export default function LeftSettingsPanel() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  const currentPastElements = activeLabel === "A" && activeSet ? activeSet.pastElements : activeSet?.pastElementsB || [];
  const currentFutureElements = activeLabel === "A" && activeSet ? activeSet.futureElements : activeSet?.futureElementsB || [];

  const loadProjectData = useLabelStore((state) => state.loadProjectData);
  const undo = useLabelStore((state) => state.undo);
  const redo = useLabelStore((state) => state.redo);
  const currentSelectedId = useLabelStore((state) => state.selectedElementId);
  const updateElement = useLabelStore((state) => state.updateElement);
  const removeElement = useLabelStore((state) => state.removeElement);
  const bringForward = useLabelStore((state) => state.bringForward);
  const sendBackward = useLabelStore((state) => state.sendBackward);
  
  const addStaticTextElement = useLabelStore((state) => state.addStaticTextElement);
  const addElement = useLabelStore((state) => state.addElement);
  
  const setTemplate = useLabelStore((state) => state.setTemplate);
  const setTemplateB = useLabelStore((state) => state.setTemplateB);

  const { panelPosition, unit, decimalPlaces } = useSettingsStore();
  const [customText, setCustomText] = useState("");

  const selectedElement = useMemo(() => {
    if (!currentTemplate) return null;
    return currentTemplate.elements.find((el) => el.id === currentSelectedId) ?? null;
  }, [currentTemplate, currentSelectedId]);

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;
    try {
      const filePath = await save({ filters: [{ name: "Label Template", extensions: ["json"] }], defaultPath: "my_layout_template.json" });
      if (!filePath) return;
      
      const templateToSave = {
        type: "LabelStudioTemplate",
        page: currentTemplate.page,
        margins: currentTemplate.margins,
        grid: currentTemplate.grid,
        labelSize: currentTemplate.labelSize,
        orientation: currentTemplate.orientation,
        smartFill: currentTemplate.smartFill,
        showBorder: currentTemplate.showBorder,
        borderWidth: currentTemplate.borderWidth,
        borderStyle: currentTemplate.borderStyle,
        padding: currentTemplate.padding,
        backgroundColor: currentTemplate.backgroundColor
      };
      
      await writeTextFile(filePath, JSON.stringify(templateToSave, null, 2));
      alert("✅ Template Layout saved successfully!");
    } catch (error) { 
      console.error(error); 
      alert(`❌ Error saving template. Check Permissions.\n\nDetails: ${error}`); 
    }
  };

  const handleLoadTemplate = async () => {
    if (!currentTemplate) return;
    try {
      const selected = await open({ filters: [{ name: "JSON Template", extensions: ["json"] }] });
      if (!selected || Array.isArray(selected)) return;
      
      const fileContents = await readTextFile(selected);
      const data = JSON.parse(fileContents);
      
      if (data.type === "LabelStudioTemplate" || data.labelSize || data.page || data.margins) {
        const updatedTemplate = { 
          ...currentTemplate, 
          ...data, 
          elements: currentTemplate.elements, 
          id: currentTemplate.id, 
          name: currentTemplate.name 
        };
        if (activeLabel === "A") setTemplate(updatedTemplate);
        else setTemplateB(updatedTemplate);
        alert("✅ Template Layout loaded successfully!");
      } 
      else if (data.sets || data.template || Array.isArray(data)) {
        loadProjectData(data); 
        alert("✅ Full Project loaded successfully!");
      } 
      else {
        alert("❌ Unrecognized template format. Please load a valid template.");
      }
    } catch (error) { 
      console.error(error); 
      alert(`❌ Error loading template. Permission Denied or File Corrupted.\n\nDetails: ${error}`); 
    }
  };

  const addLine = () => {
    const P = currentTemplate?.padding || 0;
    const L_W = currentTemplate?.labelSize.width || 50;
    addElement({ 
      id: createId("line"), type: "line", x: P, y: P + 10, 
      width: Math.max(10, L_W - P * 2), height: 1.5, 
      rotation: 0, constrainToPadding: true, backgroundColor: "#000000", color: "#000000"
    });
  };

  if (!currentTemplate) return null;

  const L_W = currentTemplate.labelSize.width;
  const L_H = currentTemplate.labelSize.height;
  const maxX = currentTemplate ? currentTemplate.labelSize.width - (selectedElement?.constrainToPadding !== false ? currentTemplate.padding : 0) : 999;
  const maxY = currentTemplate ? currentTemplate.labelSize.height - (selectedElement?.constrainToPadding !== false ? currentTemplate.padding : 0) : 999;

  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRight: panelPosition === "left" ? "1px solid var(--border-color)" : "none", borderLeft: panelPosition === "right" ? "1px solid var(--border-color)" : "none", color: "var(--text-primary)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", height: "820px", transition: "var(--theme-transition)" }}>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button type="button" onClick={handleLoadTemplate} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "9px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}><FolderOpen size={16} /> Load</button>
        <button type="button" onClick={handleSaveTemplate} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "9px", border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}><Save size={16} /> Save</button>
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
        <button type="button" disabled={currentFutureElements.length === 0} onClick={redo} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: currentFutureElements.length > 0 ? "var(--btn-bg)" : "var(--bg-main)", borderRadius: "6px", cursor: currentFutureElements.length > 0 ? "pointer" : "not-allowed", fontWeight: 600, color: currentFutureElements.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>Redo</button>
        <button type="button" disabled={currentPastElements.length === 0} onClick={undo} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: currentPastElements.length > 0 ? "var(--btn-bg)" : "var(--bg-main)", borderRadius: "6px", cursor: currentPastElements.length > 0 ? "pointer" : "not-allowed", fontWeight: 600, color: currentPastElements.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>Undo</button>
      </div>

      <hr style={{ margin: "5px 0 15px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

      <div style={{ padding: "12px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "8px", marginBottom: "15px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}><PenLine size={14} style={{ color: "var(--text-accent)" }} /> Add Static Text</label>
        <div style={{ display: "flex", gap: "6px" }}>
          <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="e.g. Price:" style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", fontSize: "12px" }} onKeyDown={(e) => { if (e.key === 'Enter' && customText.trim()) { addStaticTextElement(customText); setCustomText(""); } }} />
          <button onClick={() => { if (customText.trim()) { addStaticTextElement(customText); setCustomText(""); } }} disabled={!customText.trim()} style={{ padding: "0 12px", background: customText.trim() ? "#2563eb" : "var(--bg-hover)", color: customText.trim() ? "#fff" : "var(--text-secondary)", border: "none", borderRadius: "4px", cursor: customText.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "12px" }}>Add</button>
        </div>
        
        <button onClick={addLine} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", marginTop: "10px", padding: "8px", border: "1px dashed var(--border-focus)", background: "var(--bg-panel)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "12px", transition: "var(--theme-transition)" }}>
          <Minus size={14} strokeWidth={4} /> Add Divider Line
        </button>
      </div>

      {!selectedElement ? (
        <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "var(--border-active)" }}><MousePointerClick size={48} strokeWidth={1.5} /></span>
          Click on any element in the label to edit its properties.
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }} className="hide-scrollbar">
          
          <div style={{ marginBottom: "20px", padding: "12px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{selectedElement.type.toUpperCase()}</strong>
              <span style={{ fontSize: "11px", background: "var(--border-color)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-primary)" }}>ID: {selectedElement.id.slice(-4)}</span>
            </div>
            
            {selectedElement.type !== "image" && selectedElement.type !== "line" && !(selectedElement as any).isStatic && (
              <div style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: "13px", wordBreak: "break-word" }}>Field: <span style={{ color: "var(--text-accent)", fontWeight: 500 }}>{selectedElement.field ?? "None"}</span></div>
            )}

            {(selectedElement as any).isStatic && selectedElement.type === "text" && (
              <div style={{ marginTop: "10px" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Text Content
                  <input type="text" value={(selectedElement as any).text || ""} onChange={(e) => updateElement(selectedElement.id, { text: e.target.value } as any)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", borderRadius: "4px", fontWeight: 400, background: "var(--input-bg)", color: "var(--text-primary)", outline: "none" }} />
                </label>
              </div>
            )}
          </div>

          {selectedElement.type === "line" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Line Color
                <input type="color" value={selectedElement.backgroundColor ?? "#000000"} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value, color: e.target.value })} style={{ width: "100%", height: "32px", marginTop: "4px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
              </label>
            </div>
          )}

          {/* 🔴 Typography & Colors (Text වලට පමණි) */}
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
              
              

              {selectedElement.textDecoration === "underline" && (
                <label style={{ display: "block", marginBottom: "12px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Underline Style
                  <select value={selectedElement.textDecorationStyle ?? "solid"} onChange={(e) => updateElement(selectedElement.id, { textDecorationStyle: e.target.value as any })} style={{ display: "block", width: "100%", marginTop: "4px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400 }}>
                    <option value="solid">Solid</option><option value="double">Double</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option><option value="wavy">Wavy</option>
                  </select>
                </label>
              )}
              
              {/* 🔴 Alignment Block (Text, Barcode සහ QRCode තුනටම පෙනෙන පරිදි සකස් කර ඇත) */}
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
        </div>
      )}
    </div>
  );
}