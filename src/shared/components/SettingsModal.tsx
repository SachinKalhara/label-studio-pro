import { useSettingsStore } from "../../stores/settingsStore"; 
import { useLabelStore } from "../../stores/labelStore"; // 🔴 අලුතින්: දැනට තියෙන ලේබල් එක අප්ඩේට් කිරීමට
import { Settings, X, ArrowLeft, ArrowRight, RefreshCcw } from "lucide-react"; 

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettingsStore();
  const setLabelSize = useLabelStore((state) => state.setLabelSize); // 🔴 අලුතින්: Active Label එකේ Size එක වෙනස් කරන ෆන්ක්ෂන් එක

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0, 0, 0, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "var(--bg-panel)", width: "480px", borderRadius: "16px", padding: "30px", boxShadow: "var(--shadow-modal)", color: "var(--text-primary)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={22} /> Global Settings
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "6px" }} title="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>App Theme</label>
          <select value={settings.theme} onChange={(e) => settings.setTheme(e.target.value as any)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", outline: "none", background: "var(--input-bg)", color: "var(--text-primary)" }}>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Measurement Unit</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => settings.setUnit("mm")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${settings.unit === "mm" ? "var(--border-active)" : "var(--border-color)"}`, background: settings.unit === "mm" ? "var(--bg-active)" : "var(--btn-bg)", color: settings.unit === "mm" ? "var(--text-accent)" : "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Millimeters (mm)</button>
            <button onClick={() => settings.setUnit("cm")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${settings.unit === "cm" ? "var(--border-active)" : "var(--border-color)"}`, background: settings.unit === "cm" ? "var(--bg-active)" : "var(--btn-bg)", color: settings.unit === "cm" ? "var(--text-accent)" : "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>Centimeters (cm)</button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Edit Panel Position</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => settings.setPanelPosition("left")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${settings.panelPosition === "left" ? "var(--border-active)" : "var(--border-color)"}`, background: settings.panelPosition === "left" ? "var(--bg-active)" : "var(--btn-bg)", color: settings.panelPosition === "left" ? "var(--text-accent)" : "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
              <ArrowLeft size={16} /> Left Side
            </button>
            <button onClick={() => settings.setPanelPosition("right")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${settings.panelPosition === "right" ? "var(--border-active)" : "var(--border-color)"}`, background: settings.panelPosition === "right" ? "var(--bg-active)" : "var(--btn-bg)", color: settings.panelPosition === "right" ? "var(--text-accent)" : "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
              Right Side <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Default Decimal Places</label>
          <input type="number" min={0} max={6} value={settings.decimalPlaces} onChange={(e) => settings.setDecimalPlaces(Number(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-primary)" }} />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Default Label Size ({settings.unit})</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            
            {/* 🔴 පළල (Width) වෙනස් කරන විට Active Label එකත් එකවර අප්ඩේට් වේ */}
            <input 
              type="number" 
              value={settings.unit === 'cm' ? settings.defaultLabelWidth / 10 : settings.defaultLabelWidth} 
              onChange={(e) => {
                const val = Number(e.target.value);
                const mmVal = settings.unit === 'cm' ? val * 10 : val;
                settings.setDefaultLabelSize(mmVal, settings.defaultLabelHeight);
                setLabelSize({ width: mmVal, height: settings.defaultLabelHeight }) // Active ලේබල් එකේ පළල වෙනස් කරයි
              }} 
              placeholder="Width" 
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-primary)" }} 
            />
            
            <span style={{ color: "var(--text-secondary)", fontWeight: "bold" }}>X</span>
            
            {/* 🔴 උස (Height) වෙනස් කරන විට Active Label එකත් එකවර අප්ඩේට් වේ */}
            <input 
              type="number" 
              value={settings.unit === 'cm' ? settings.defaultLabelHeight / 10 : settings.defaultLabelHeight} 
              onChange={(e) => {
                const val = Number(e.target.value);
                const mmVal = settings.unit === 'cm' ? val * 10 : val;
                settings.setDefaultLabelSize(settings.defaultLabelWidth, mmVal);
                setLabelSize({ height: mmVal }); // Active ලේබල් එකේ උස වෙනස් කරයි
              }} 
              placeholder="Height" 
              style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-primary)" }} 
            />

          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button 
            onClick={() => {
               settings.setDefaultLabelSize(80, 30);
               setLabelSize({ width: 80, height: 30 }); // 🔴 Reset කරන විට Active ලේබල් එකත් 80x30 බවට පත් වේ
               settings.setTheme("system");
               settings.setUnit("cm"); 
               settings.setPanelPosition("right");
               settings.setDecimalPlaces(2);
            }} 
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "0.2s" }}
          >
            <RefreshCcw size={16} /> Reset to Defaults
          </button>
          
          <button onClick={onClose} style={{ padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", boxShadow: "var(--shadow-sm)" }}>
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
}