import { X, FolderOpen, FileText, Trash2, Search } from "lucide-react"; // 🔴 Lucide Icons එකතු කිරීම

interface WorkspaceProject {
  name: string;
  path: string;
}

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceProjects: WorkspaceProject[];
  onLoadProject: (path: string) => void;
  onDeleteProject: (e: React.MouseEvent, path: string, name: string) => void;
  onBrowseComputer: () => void;
}

export default function OpenProjectModal({ isOpen, onClose, workspaceProjects, onLoadProject, onDeleteProject, onBrowseComputer }: OpenProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0, 0, 0, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "var(--bg-panel)", width: "550px", borderRadius: "16px", padding: "30px", boxShadow: "var(--shadow-modal)", display: "flex", flexDirection: "column", maxHeight: "80vh", color: "var(--text-primary)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <h2 style={{ margin: 0, fontSize: "22px" }}>Open Project</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "6px" }} title="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <p style={{ margin: "0 0 20px 0", color: "var(--text-secondary)", fontSize: "14px" }}>Select a project from your workspace or browse your computer.</p>
        
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "10px", background: "var(--bg-main)", padding: "10px", marginBottom: "20px" }}>
          {workspaceProjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "var(--text-accent)" }}>
                <FolderOpen size={40} strokeWidth={1.5} />
              </div>
              No projects found in your Workspace.<br/>
              <small>(Documents/Label Studio Projects)</small>
            </div>
          ) : (
            workspaceProjects.map((proj, idx) => (
              <div 
                key={idx} 
                onClick={() => onLoadProject(proj.path)}
                style={{ padding: "12px 15px", background: "var(--btn-bg)", border: "1px solid var(--border-color)", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
                onMouseOver={(e) => { e.currentTarget.style.border = "1px solid var(--border-active)"; }}
                onMouseOut={(e) => { e.currentTarget.style.border = "1px solid var(--border-color)"; }}
              >
                <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileText size={18} style={{ color: "var(--text-accent)", flexShrink: 0 }} />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>{proj.name}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={proj.path}>{proj.path}</div>
                  </div>
                </div>

                <button 
                  onClick={(e) => onDeleteProject(e, proj.path, proj.name)}
                  title="Delete Project"
                  style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "8px", borderRadius: "6px", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { onClose(); onBrowseComputer(); }} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 16px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            <Search size={16} /> Browse Computer...
          </button>
          <button onClick={onClose} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>Close</button>
        </div>
      </div>
    </div>
  );
}