import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { FolderOpen, Save, PenLine, MousePointerClick, Minus } from "lucide-react"; 
import { useLabelStore } from "../../../../stores/labelStore";
import { useSettingsStore } from "../../../../stores/settingsStore"; 
import { createId } from "../../utils/elementBounds";

// 🔴 මෙතනින් ElementEditor එක Import කරගන්නවා
import ElementEditor from "./ElementEditor";

export default function ToolsPanel() {
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
  
  const addStaticTextElement = useLabelStore((state) => state.addStaticTextElement);
  const addElement = useLabelStore((state) => state.addElement);
  
  const setTemplate = useLabelStore((state) => state.setTemplate);
  const setTemplateB = useLabelStore((state) => state.setTemplateB);

  const { panelPosition } = useSettingsStore();
  const [customText, setCustomText] = useState("");

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

  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRight: panelPosition === "left" ? "1px solid var(--border-color)" : "none", borderLeft: panelPosition === "right" ? "1px solid var(--border-color)" : "none", color: "var(--text-primary)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", height: "820px", transition: "var(--theme-transition)" }}>
      
      {/* 🔴 Project Actions (Load, Save, Undo, Redo) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button type="button" onClick={handleLoadTemplate} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "9px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}><FolderOpen size={16} /> Load</button>
        <button type="button" onClick={handleSaveTemplate} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "9px", border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}><Save size={16} /> Save</button>
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "15px" }}>
        <button type="button" disabled={currentFutureElements.length === 0} onClick={redo} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: currentFutureElements.length > 0 ? "var(--btn-bg)" : "var(--bg-main)", borderRadius: "6px", cursor: currentFutureElements.length > 0 ? "pointer" : "not-allowed", fontWeight: 600, color: currentFutureElements.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>Redo</button>
        <button type="button" disabled={currentPastElements.length === 0} onClick={undo} style={{ flex: 1, padding: "8px", border: "1px solid var(--border-color)", background: currentPastElements.length > 0 ? "var(--btn-bg)" : "var(--bg-main)", borderRadius: "6px", cursor: currentPastElements.length > 0 ? "pointer" : "not-allowed", fontWeight: 600, color: currentPastElements.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>Undo</button>
      </div>

      <hr style={{ margin: "5px 0 15px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

      {/* 🔴 Add Elements Section */}
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

      {/* 🔴 Element Editor (Properties) Section */}
      {!currentSelectedId ? (
        <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "var(--border-active)" }}><MousePointerClick size={48} strokeWidth={1.5} /></span>
          Click on any element in the label to edit its properties.
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }} className="hide-scrollbar">
          {/* මෙහිදී අපි අර වෙන් කරගත් ElementEditor කුඩා component එක කැඳවනු ලබයි */}
          <ElementEditor /> 
        </div>
      )}
    </div>
  );
}