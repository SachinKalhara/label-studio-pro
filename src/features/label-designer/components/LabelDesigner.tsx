import { useLabelStore } from "../../../stores/labelStore";
import { useSettingsStore } from "../../../stores/settingsStore"; 

// 🔴 අලුත් නම් වලින් Component Import කිරීම
import ToolsPanel from "./tools-panel/ToolsPanel";
import PropertiesPanel from "./properties-panel/PropertiesPanel";
import CenterCanvas from "./CenterCanvas";
import FloatingTabs from "./FloatingTabs";
import { RefreshCw, AlertTriangle } from "lucide-react"; 

function LabelDesigner() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find(s => s.id === activeSetId) || sets[0]) : null;

  const panelPosition = useSettingsStore((state) => state.panelPosition); 

  // පැරණි දත්ත නිසා App එක Crash වීම වැළැක්වීමේ ආරක්‍ෂාව
  if (!sets || sets.length === 0 || !activeSet || !activeSet.template || !activeSet.templateB) {
    return (
      <div style={{ height: "820px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-panel)", color: "var(--text-primary)", borderRadius: "10px", border: "1px solid var(--border-color)", transition: "var(--theme-transition)", padding: "20px", textAlign: "center" }}>
        <div style={{ color: "#ef4444", marginBottom: "15px" }}>
          <AlertTriangle size={64} strokeWidth={1.5} />
        </div>
        <h2 style={{ margin: "0 0 10px 0" }}>Data Format Updated</h2>
        <p style={{ margin: "0 0 25px 0", color: "var(--text-secondary)" }}>Your old saved data is conflicting with the new Multi-Template system.</p>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }} 
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: "bold", boxShadow: "0 4px 6px rgba(239,68,68,0.3)", transition: "all 0.2s" }}
        >
          <RefreshCw size={18} /> Clear Old Data & Restart App
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "grid", 
      // Text Edit (ToolsPanel) = 280px | Label Settings (PropertiesPanel) = 290px
      gridTemplateColumns: panelPosition === "right" ? "290px minmax(500px, 1fr) 280px" : "280px minmax(500px, 1fr) 290px", 
      gap: "20px", 
      alignItems: "start", 
      position: "relative" 
    }}>
      
      {/* Panel Position එකට අනුව හරියටම පැනල් මාරු වීම */}
      {panelPosition === "right" ? (
        <>
          <PropertiesPanel /> {/* Label Settings එක වමට එයි */}
          <CenterCanvas />
          <ToolsPanel />      {/* Text Edit/Project Actions එක දකුණට යයි */}
        </>
      ) : (
        <>
          <ToolsPanel />      {/* Text Edit/Project Actions එක වමට එයි */}
          <CenterCanvas />
          <PropertiesPanel /> {/* Label Settings එක දකුණට යයි */}
        </>
      )}

      <FloatingTabs />
    </div>
  );
}

export default LabelDesigner;