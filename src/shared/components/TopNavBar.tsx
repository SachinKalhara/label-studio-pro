import { useState, useEffect } from "react";
import { useExcelStore } from "../../stores/excelStore";
import { useLabelMetrics } from "../hooks/useLabelMetrics"; 
import { ArrowLeft, FileText, Save } from "lucide-react"; 

type AppPage = "data" | "designer" | "preview";

interface TopNavBarProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  onGoHome: () => void;
  onSaveProject: () => void;
}

export default function TopNavBar({ currentPage, setCurrentPage, onGoHome, onSaveProject }: TopNavBarProps) {
  const projectName = useExcelStore((state) => state.projectName);
  const setProjectName = useExcelStore((state) => state.setProjectName);
  
  const labelsPerPageCount = useLabelMetrics();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editableProjectName, setEditableProjectName] = useState(projectName || "Untitled Project");

  useEffect(() => {
    setEditableProjectName(projectName || "Untitled Project");
  }, [projectName]);

  return (
    <div style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border-color)", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)", zIndex: 100 }}>
      
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "15px" }}>
        <button onClick={onGoHome} title="Go to Home Screen" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-main)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Home
        </button>
        <div style={{ width: "1px", height: "24px", background: "var(--border-color)" }}></div>
        <div>
          {isEditingName ? (
            <input
              type="text"
              autoFocus
              value={editableProjectName}
              onChange={(e) => setEditableProjectName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                setProjectName(editableProjectName.trim() === "" ? "Untitled Project" : editableProjectName.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingName(false);
                  setProjectName(editableProjectName.trim() === "" ? "Untitled Project" : editableProjectName.trim());
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                  setEditableProjectName(projectName || "Untitled Project");
                }
              }}
              style={{ fontSize: "16px", fontWeight: "bold", padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "6px", outline: "none", background: "var(--input-bg)", color: "var(--text-primary)" }}
            />
          ) : (
            <h1 
              onDoubleClick={() => setIsEditingName(true)}
              title="Double click to rename project"
              style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: "bold", margin: 0, color: "var(--text-primary)", letterSpacing: "-0.5px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
            >
              <FileText size={18} style={{ color: "var(--text-accent)" }} /> {projectName || "Untitled Project"}
            </h1>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px", background: "var(--bg-main)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <button onClick={() => setCurrentPage("data")} style={{ padding: "8px 20px", border: "none", borderRadius: "6px", background: currentPage === "data" ? "var(--bg-panel)" : "transparent", color: currentPage === "data" ? "var(--text-accent)" : "var(--text-secondary)", fontWeight: currentPage === "data" ? 600 : 500, cursor: "pointer", fontSize: "14px", boxShadow: currentPage === "data" ? "var(--shadow-sm)" : "none", whiteSpace: "nowrap" }}>1. Select Data</button>
          <button onClick={() => setCurrentPage("designer")} style={{ padding: "8px 20px", border: "none", borderRadius: "6px", background: currentPage === "designer" ? "var(--bg-panel)" : "transparent", color: currentPage === "designer" ? "var(--text-accent)" : "var(--text-secondary)", fontWeight: currentPage === "designer" ? 600 : 500, cursor: "pointer", fontSize: "14px", boxShadow: currentPage === "designer" ? "var(--shadow-sm)" : "none", whiteSpace: "nowrap" }}>2. Design Labels</button>
          <button onClick={() => setCurrentPage("preview")} style={{ padding: "8px 20px", border: "none", borderRadius: "6px", background: currentPage === "preview" ? "var(--bg-panel)" : "transparent", color: currentPage === "preview" ? "var(--text-accent)" : "var(--text-secondary)", fontWeight: currentPage === "preview" ? 600 : 500, cursor: "pointer", fontSize: "14px", boxShadow: currentPage === "preview" ? "var(--shadow-sm)" : "none", whiteSpace: "nowrap" }}>3. Print Preview</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "15px", alignItems: "center" }}>
        {currentPage !== "data" && (
          <div style={{ padding: "6px 16px", background: "var(--bg-active)", borderRadius: "6px", border: "1px solid var(--border-active)", color: "var(--text-accent)", display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "10px" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", opacity: 0.8 }}>Labels Per Page</div>
            <strong style={{ fontSize: "16px" }}>{labelsPerPageCount} Labels</strong>
          </div>
        )}
        <button id="save-btn" onClick={onSaveProject} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", border: "none", borderRadius: "8px", background: "#10b981", color: "#ffffff", fontWeight: 600, cursor: "pointer", fontSize: "13px", boxShadow: "0 2px 5px rgba(16, 185, 129, 0.3)", transition: "all 0.2s", whiteSpace: "nowrap" }}>
          <Save size={16} /> Save Project
        </button>
      </div>
    </div>
  );
}