import React from "react";
import { ZoomOut, ZoomIn, Download, Printer, Loader2, EyeOff } from "lucide-react"; 

export default React.memo(function TopToolbar({ viewMode, setViewMode, zoom, setZoom, handleZoomReset, handleExportPDF, isPrinting, showSkipped, totalPages }: any) {
  return (
    <div className="no-print" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-panel)", padding: "12px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, boxShadow: "var(--shadow-sm)", transition: "var(--theme-transition)" }}>
      
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>View:</span>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "13px", outline: "none", cursor: "pointer", background: "var(--input-bg)", color: "var(--text-primary)", transition: "var(--theme-transition)", fontWeight: 500 }}>
          <option value="single">Single Page</option>
          <option value="vertical">Vertical Scroll</option>
          <option value="horizontal">Horizontal Scroll</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "var(--bg-main)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-color)", transition: "var(--theme-transition)" }}>
        <button onClick={() => setZoom((z: number) => Math.max(0.3, z - 0.1))} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", cursor: "pointer", transition: "var(--theme-transition)" }}>
          <ZoomOut size={16} strokeWidth={2.5} />
        </button>
        <strong style={{ minWidth: "55px", textAlign: "center", fontSize: "14px", color: "var(--text-primary)" }}>{Math.round(zoom * 100)}%</strong>
        <button onClick={() => setZoom((z: number) => Math.min(3.0, z + 0.1))} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", cursor: "pointer", transition: "var(--theme-transition)" }}>
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>
        <button onClick={handleZoomReset} style={{ padding: "6px 12px", borderRadius: "5px", border: "none", background: "var(--bg-hover)", color: "var(--text-primary)", cursor: "pointer", fontWeight: 600, marginLeft: "5px", transition: "var(--theme-transition)" }}>Reset</button>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        
        <button 
          onClick={() => handleExportPDF('save')} 
          disabled={isPrinting || showSkipped || totalPages === 0} 
          style={{ padding: "10px 18px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: (showSkipped || totalPages === 0) ? "var(--text-secondary)" : "var(--text-primary)", borderRadius: "6px", cursor: (showSkipped || totalPages === 0) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", transition: "var(--theme-transition)", opacity: (showSkipped || totalPages === 0) ? 0.6 : 1 }}
        >
          <Download size={16} /> Save {totalPages} Page{totalPages !== 1 ? 's' : ''}
        </button>

        <button 
          onClick={() => handleExportPDF('print')} 
          disabled={isPrinting || showSkipped || totalPages === 0} 
          style={{ padding: "10px 22px", border: "none", background: (showSkipped || totalPages === 0) ? "var(--border-focus)" : "#2563eb", color: "#ffffff", borderRadius: "6px", cursor: (isPrinting || showSkipped || totalPages === 0) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", transition: "var(--theme-transition)", opacity: (showSkipped || totalPages === 0) ? 0.6 : 1 }}
        >
          {isPrinting ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
          ) : showSkipped ? (
            <><EyeOff size={16} /> Hidden Labels</>
          ) : (
            <><Printer size={16} /> Print {totalPages} Page{totalPages !== 1 ? 's' : ''}</>
          )}
        </button>

      </div>
    </div>
  );
});