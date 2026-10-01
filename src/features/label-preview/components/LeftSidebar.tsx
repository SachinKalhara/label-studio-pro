import React, { useMemo, useState } from "react";
import { Folder, Printer, FileText, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react"; 

export default React.memo(function LeftSidebar({ 
  sets, activeFilterSetId, setActiveFilterSetId, setCurrentPage, 
  allInstances, sidebarPagesInfo, skippedIds, toggleSkip, togglePageSkip, 
  activeInstanceId, handleInstanceClick, currentPage, totalPages 
}: any) {

  const [collapsedPages, setCollapsedPages] = useState<Set<number>>(new Set());

  const toggleCollapse = (pageIndex: number) => {
    setCollapsedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageIndex)) newSet.delete(pageIndex);
      else newSet.add(pageIndex);
      return newSet;
    });
  };

  const { totalInCurrentSet, printedCountInCurrentSet, totalSetsCount } = useMemo(() => {
    const currentSetInstances = allInstances.filter((i: any) => i.setId === activeFilterSetId);
    const total = currentSetInstances.length;
    const printed = currentSetInstances.filter((i: any) => !skippedIds.has(i.id)).length;
    return {
      totalInCurrentSet: total,
      printedCountInCurrentSet: printed,
      totalSetsCount: sets.length
    };
  }, [allInstances, activeFilterSetId, skippedIds, sets.length]);

  return (
    <div className="no-print" style={{ width: "300px", position: "sticky", top: "65px", maxHeight: "calc(100vh - 20px)", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-main)", zIndex: 50, transition: "var(--theme-transition)" }}>
      
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-panel)", transition: "var(--theme-transition)", flexShrink: 0 }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "3px" }}>Select Label Set</label>
        <select value={activeFilterSetId} onChange={(e) => { setActiveFilterSetId(e.target.value); setCurrentPage(1); }} style={{ width: "100%", padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--bg-main)", color: "var(--text-primary)", outline: "none", cursor: "pointer", transition: "var(--theme-transition)", fontWeight: 500 }}>
          {sets.map((s: any) => <option key={s.id} value={s.id}>{s.name} {s.isDualMode ? "(Dual)" : ""}</option>)}
        </select>

        <div style={{ marginTop: "6px", background: "var(--bg-active)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border-active)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-secondary)", transition: "var(--theme-transition)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Label Sets">
            <Folder size={12} style={{ color: "var(--text-accent)" }} /> <strong style={{ color: "var(--text-accent)" }}>{totalSetsCount}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Total Pages to Print">
            <FileText size={12} style={{ color: "#f97316" }} /> Pages: <strong style={{ color: "#f97316" }}>{totalPages || 0}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Labels to Print">
            <Printer size={12} style={{ color: "#10b981" }} /> <strong style={{ color: "#10b981" }}>{printedCountInCurrentSet}</strong> / {totalInCurrentSet}
          </div>
        </div>

        <p style={{ margin: "8px 0 0 2px", fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>Uncheck to skip printing (Space shifts up)</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }} className="hide-scrollbar">
        <div style={{ padding: "4px 8px", background: "var(--bg-active)", borderRadius: "4px", marginBottom: "15px", fontSize: "11px", fontWeight: "bold", color: "var(--text-accent)", border: "1px solid var(--border-active)", textAlign: "center" }}>
          SCROLLING NEAR PAGE {currentPage}
        </div>

        {sidebarPagesInfo.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
            No labels available.
          </div>
        ) : (
          sidebarPagesInfo.map((page: any) => {
            const pageInstanceIds = page.items.map((item: any) => item.instance.id);
            const activeCount = page.items.filter((item: any) => !item.isSkipped).length;
            const isAllChecked = activeCount === pageInstanceIds.length && pageInstanceIds.length > 0;
            const isSomeChecked = activeCount > 0 && activeCount < pageInstanceIds.length;
            const isCollapsed = collapsedPages.has(page.globalIndex);
            const isCurrentPage = page.globalIndex === currentPage;

            return (
              <div key={`page-group-${page.globalIndex}`} style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: isCurrentPage ? "var(--text-accent)" : "var(--text-secondary)", padding: "4px 8px", background: isCurrentPage ? "var(--bg-active)" : "var(--bg-panel)", borderRadius: "4px", marginBottom: "6px", border: isCurrentPage ? "1px solid var(--border-active)" : "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => toggleCollapse(page.globalIndex)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "inherit" }} title="Toggle Page">
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <input type="checkbox" checked={isAllChecked} ref={el => { if (el) el.indeterminate = isSomeChecked; }} onChange={() => togglePageSkip(pageInstanceIds, isAllChecked)} style={{ width: "13px", height: "13px", cursor: "pointer", margin: 0 }} title="Skip entire page" />
                    <FileText size={12} /> PAGE {page.globalIndex}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.8 }}>{activeCount}/{pageInstanceIds.length} Active</span>
                </div>

                {!isCollapsed && page.items.map((item: any) => {
                  const inst = item.instance;
                  const isActive = activeInstanceId === inst.id;
                  let bgCol = "var(--bg-main)", borderCol = "transparent", textCol = "var(--text-primary)", opacityLevel = 1;

                  if (isActive) { bgCol = "var(--bg-active)"; borderCol = "var(--border-active)"; textCol = "var(--text-accent)"; } 
                  else if (item.isSkipped) { bgCol = "var(--bg-main)"; borderCol = "transparent"; textCol = "var(--text-secondary)"; opacityLevel = 0.5; } 
                  else if (item.isShifted) { bgCol = "rgba(249, 115, 22, 0.05)"; borderCol = "rgba(249, 115, 22, 0.3)"; textCol = "#f97316"; } 
                  else { bgCol = "var(--bg-panel)"; borderCol = "var(--border-color)"; }

                  return (
                    <div key={inst.id} onClick={() => handleInstanceClick(inst.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 8px", marginLeft: "6px", background: bgCol, border: `1px solid ${borderCol}`, borderRadius: "6px", marginBottom: "4px", cursor: "pointer", opacity: opacityLevel, transition: "all 0.2s" }}>
                      <input type="checkbox" checked={!item.isSkipped} onChange={(e) => { e.stopPropagation(); toggleSkip(inst.id); }} style={{ width: "14px", height: "14px", cursor: "pointer", flexShrink: 0 }} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span style={{ fontSize: "12px", color: textCol, fontWeight: (isActive || item.isShifted) ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inst.displayName}</span>
                        {item.isShifted && <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#f97316", fontSize: "9px", fontWeight: 700, marginTop: "2px" }}><CornerDownRight size={10} /> Shifted from Page {item.originalPage}</div>}
                      </div>
                      {inst.type === 'B' && <span style={{ fontSize: "9px", background: isActive ? "rgba(37,99,235,0.15)" : "var(--bg-hover)", padding: "1px 4px", borderRadius: "4px", color: isActive ? "var(--text-accent)" : "var(--text-secondary)", fontWeight: 600 }}>Label B</span>}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});