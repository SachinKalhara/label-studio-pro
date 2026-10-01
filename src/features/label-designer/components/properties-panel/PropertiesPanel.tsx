import { LayoutTemplate } from "lucide-react";
import { useLabelStore } from "../../../../stores/labelStore";
import { useSettingsStore } from "../../../../stores/settingsStore"; 
import PageSetup from "./PageSetup";
import DataFields from "./DataFields";
import LayoutSettings from "./LayoutSettings";

export default function PropertiesPanel() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;

  const isDualMode = activeSet?.isDualMode || false;
  const isDataLinked = activeSet?.isDataLinked || false;
  const activeLabel = useLabelStore((state) => state.activeLabel);

  const setIsDualMode = useLabelStore((state) => state.setIsDualMode);
  const setIsDataLinked = useLabelStore((state) => state.setIsDataLinked);
  const setActiveLabel = useLabelStore((state) => state.setActiveLabel);
  
  const { panelPosition } = useSettingsStore();
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  if (!currentTemplate) return null;

  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRight: panelPosition === "right" ? "1px solid var(--border-color)" : "none", borderLeft: panelPosition === "left" ? "1px solid var(--border-color)" : "none", color: "var(--text-primary)", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", height: "820px", transition: "var(--theme-transition)" }}>
      
      {/* 🔴 Dual Mode Toggle Section */}
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

      {/* 🔴 Scrollable Content Area */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }} className="hide-scrollbar">
        
        {/* Component 1: Page Setup (A4, Custom, Portrait/Landscape) */}
        <PageSetup />

        {/* Component 2: Excel Columns, Barcodes & Images */}
        <DataFields />
        
        {/* Component 3: Label Size, Background, Sections, Margins & Gaps */}
        <LayoutSettings />
        
      </div>
    </div>
  );
}