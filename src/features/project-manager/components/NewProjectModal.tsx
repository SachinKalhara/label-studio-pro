import { FilePlus, ArrowRight, X } from "lucide-react"; // 🔴 Lucide Icons එකතු කිරීම

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempProjectName: string;
  tempSavePath: string | null;
  tempExcelPath: string | null;
  isLoading: boolean;
  onNameChange: (newName: string) => void;
  onSelectSaveLocation: () => void;
  onSelectExcel: () => void;
  onCreateProject: () => void;
  onCreateBlankProject: () => void;
  projectType?: string;
  setProjectType?: (type: string) => void;
  blankRowCount?: number;
  setBlankRowCount?: (count: number) => void;
}

export default function NewProjectModal({ 
  isOpen, onClose, tempProjectName, tempSavePath, tempExcelPath, isLoading, 
  onNameChange, onSelectSaveLocation, onSelectExcel, onCreateProject, onCreateBlankProject 
}: NewProjectModalProps) {
  if (!isOpen) return null;

  return (
    /* 🔴 1. Backdrop එක මත Click කළ විට Modal එක Close වේ */
    <div 
      onClick={onClose}
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0, 0, 0, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
    >
      {/* 🔴 2. Modal එක ඇතුළත Click කළ විට Backdrop එකට Click වීම වැළැක්වීමට e.stopPropagation() යොදා ඇත */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-panel)", width: "480px", borderRadius: "16px", padding: "30px", boxShadow: "var(--shadow-modal)", color: "var(--text-primary)", position: "relative" }}
      >
        
        {/* 🔴 3. Top-Right Close Button (✕) වෙනුවට lucide X අයිකනය */}
        <button 
          onClick={onClose} 
          style={{ 
            position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", 
            color: "var(--text-secondary)", cursor: "pointer", 
            padding: "4px 8px", borderRadius: "6px", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center" 
          }}
          title="Close"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <h2 style={{ margin: "0 0 5px 0", fontSize: "22px" }}>Create New Project</h2>
        <p style={{ margin: "0 0 25px 0", color: "var(--text-secondary)", fontSize: "14px" }}>Configure your workspace to begin designing.</p>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Project Name</label>
          <input 
            type="text" 
            value={tempProjectName} 
            onChange={(e) => onNameChange(e.target.value)} 
            placeholder="e.g. 2026 New Year Labels"
            style={{ width: "100%", padding: "12px", border: "1px solid var(--border-color)", borderRadius: "8px", boxSizing: "border-box", fontSize: "14px", outline: "none", background: "var(--input-bg)", color: "var(--text-primary)" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Project File Location (.lproj)</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, padding: "10px 12px", border: "1px dashed var(--border-focus)", borderRadius: "8px", background: "var(--bg-main)", color: tempSavePath ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center" }} title={tempSavePath || ""}>
              {tempSavePath ? tempSavePath : "Select a location to save"}
            </div>
            <button onClick={onSelectSaveLocation} style={{ padding: "10px 16px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "13px", flexShrink: 0 }}>Browse...</button>
          </div>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Data Source (Excel File)</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, padding: "10px 12px", border: "1px dashed var(--border-focus)", borderRadius: "8px", background: "var(--bg-main)", color: tempExcelPath ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center" }}>
              {tempExcelPath ? tempExcelPath.split(/[\\/]/).pop() : "No file selected"}
            </div>
            <button onClick={onSelectExcel} style={{ padding: "10px 16px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "13px", flexShrink: 0 }}>Select Data...</button>
          </div>
        </div>

        {/* Actions Panel */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Left Side: Blank Project Button */}
          <button 
            onClick={onCreateBlankProject} 
            disabled={isLoading || !tempSavePath} 
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 12px", background: "transparent", color: (isLoading || !tempSavePath) ? "var(--text-secondary)" : "var(--text-accent)", border: "1px dashed var(--border-active)", borderRadius: "8px", cursor: (isLoading || !tempSavePath) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "13px", transition: "0.2s" }}
          >
            <FilePlus size={16} /> Continue without Excel
          </button>
          
          {/* Right Side: Regular Action */}
          <div>
            <button 
              onClick={onCreateProject} 
              disabled={isLoading || !tempExcelPath || !tempSavePath} 
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 24px", background: (isLoading || !tempExcelPath || !tempSavePath) ? "var(--bg-hover)" : "#2563eb", color: (isLoading || !tempExcelPath || !tempSavePath) ? "var(--text-secondary)" : "#fff", border: "none", borderRadius: "8px", cursor: (isLoading || !tempExcelPath || !tempSavePath) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", boxShadow: "var(--shadow-sm)" }}
            >
              {isLoading ? "Loading..." : <>Start Project <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}