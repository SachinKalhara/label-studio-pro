import { Settings, Tag, Sparkles, FolderOpen, FileText, X } from "lucide-react"; 
import { useLabelStore } from "../../../stores/labelStore"; // 🔴 නිවැරදි Path එක

interface WelcomeScreenProps {
  onOpenSettings: () => void;
  onOpenNewProject: () => void;
  onOpenRecent: () => void;
  hasDraft: boolean;
  onLoadDraft: () => void;
  onClearDraft: () => void;
}

export default function WelcomeScreen({ 
  onOpenSettings, 
  onOpenNewProject, 
  onOpenRecent, 
  hasDraft, 
  onLoadDraft, 
  onClearDraft 
}: WelcomeScreenProps) {
  const resetProject = useLabelStore((state) => state.resetProject);

  const handleNewProjectClick = () => {
    resetProject();   // පරණ Canvas දත්ත සම්පූර්ණයෙන්ම මකා දමයි
    onOpenNewProject(); // අලුත් ප්‍රොජෙක්ට් වින්ඩෝ එක විවෘත කරයි
  };

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      
      {/* ⚙️ Global Settings Button */}
      <button 
        onClick={onOpenSettings}
        title="Global Settings"
        style={{
          position: "fixed", bottom: "30px", right: "30px", width: "60px", height: "60px", borderRadius: "50%",
          background: "var(--bg-panel)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-md)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 100, color: "var(--text-primary)"
        }}
      >
        <Settings size={26} />
      </button>

      {/* 🏷️ Header Section */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "var(--text-accent)" }}>
          <Tag size={60} strokeWidth={1.5} />
        </div>
        <h1 style={{ margin: "0 0 10px 0", color: "var(--text-primary)", fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>Label Studio Pro</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "16px", maxWidth: "450px" }}>Professional label printing software. Create new labels from Excel or continue where you left off.</p>
      </div>

      {/* 🔘 Action Buttons */}
      <div style={{ display: "flex", gap: "30px", justifyContent: "center", marginBottom: "30px" }}>
        
        <div onClick={handleNewProjectClick} style={{ width: "320px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px 30px", textAlign: "center", cursor: "pointer", boxShadow: "var(--shadow-sm)", transition: "transform 0.2s, box-shadow 0.2s" }}>
          <div style={{ width: "70px", height: "70px", background: "var(--bg-active)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--text-accent)" }}>
            <Sparkles size={32} />
          </div>
          <h3 style={{ margin: "0 0 10px 0", color: "var(--text-primary)", fontSize: "20px" }}>Create New Project</h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>Set a project name and import an Excel file to start designing.</p>
        </div>

        <div onClick={onOpenRecent} style={{ width: "320px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px 30px", textAlign: "center", cursor: "pointer", boxShadow: "var(--shadow-sm)", transition: "transform 0.2s, box-shadow 0.2s" }}>
          <div style={{ width: "70px", height: "70px", background: "rgba(16,185,129,0.1)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#10b981" }}>
            <FolderOpen size={32} />
          </div>
          <h3 style={{ margin: "0 0 10px 0", color: "var(--text-primary)", fontSize: "20px" }}>Open Existing Project</h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>Load a previously saved <b>.lproj</b> file from your workspace.</p>
        </div>
      </div>

      {/* 📝 Draft Recovery Section */}
      {hasDraft && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "10px 20px", borderRadius: "10px", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "14px", color: "#f59e0b", fontWeight: 500 }}>Unsaved changes found in a previous session:</span>
          <button onClick={onLoadDraft} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            <FileText size={16} /> Continue Last Draft
          </button>
          <button onClick={onClearDraft} title="Discard Draft" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", background: "transparent", color: "var(--text-secondary)", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}