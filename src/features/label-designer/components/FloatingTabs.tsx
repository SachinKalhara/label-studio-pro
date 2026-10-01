import { useState, useRef, useEffect } from "react";
import { useLabelStore } from "../../../stores/labelStore";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react"; // 🔴 Lucide Icons ලබා ගැනීම

export default function FloatingTabs() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const addSet = useLabelStore((state) => state.addSet);
  const removeSet = useLabelStore((state) => state.removeSet);
  const setActiveSet = useLabelStore((state) => state.setActiveSet);
  const renameActiveSet = useLabelStore((state) => state.renameActiveSet);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabName, setEditTabName] = useState<string>("");
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [sets]); 

  // Active Tab එක මැදට Auto-Scroll කිරීම
  useEffect(() => {
    if (activeSetId && tabsScrollRef.current) {
      setTimeout(() => {
        const activeTab = document.getElementById(`tab-${activeSetId}`);
        if (activeTab) {
          activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          setTimeout(checkScroll, 350);
        }
      }, 50);
    }
  }, [activeSetId, sets.length]); 

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      const amount = 200;
      tabsScrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
      setTimeout(checkScroll, 350); 
    }
  };

  const handleTabDoubleClick = (setId: string, currentName: string) => {
    setActiveSet(setId); 
    setEditingTabId(setId);
    setEditTabName(currentName);
  };

  const saveTabRename = () => {
    if (editTabName.trim() !== "") renameActiveSet(editTabName.trim());
    setEditingTabId(null);
  };

  return (
    <>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Light Mode / Default Blur Panel */
          .glass-panel {
             background: rgba(241, 245, 249, 0.95);
             box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
          }
          .glass-tab-active {
             background: #ffffff;
             color: #0f172a;
          }
          .glass-tab-inactive {
             color: #64748b;
          }
          .glass-btn {
             border: 1px dashed #94a3b8;
             color: #475569;
          }

          /* Dark Mode Blur Panel */
          [data-theme="dark"] .glass-panel {
             background: rgba(15, 23, 42, 0.85); /* තද නිල් විනිවිද පෙනෙන */
             box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
          }
          [data-theme="dark"] .glass-tab-active {
             background: #1e293b;
             color: #f8fafc;
          }
          [data-theme="dark"] .glass-tab-inactive {
             color: #94a3b8;
          }
          [data-theme="dark"] .glass-btn {
             border: 1px dashed #475569;
             color: #94a3b8;
          }
          [data-theme="dark"] .glass-divider {
             background: #334155 !important;
          }
        `}
      </style>
      <div 
        className="glass-panel"
        style={{ 
          position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", 
          display: "flex", alignItems: "center", 
          backdropFilter: "blur(10px)", padding: "6px 8px", borderRadius: "12px", 
          zIndex: 1000, 
          maxWidth: "500px",
          transition: "var(--theme-transition)"
        }}
      >
        
        {canScrollLeft && (
          <button onClick={() => scrollTabs("left")} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "0 8px" }}>
            <ChevronLeft size={20} />
          </button>
        )}

        <div 
          ref={tabsScrollRef} 
          onScroll={checkScroll} 
          className="hide-scrollbar" 
          style={{ display: "flex", gap: "4px", overflowX: "auto", scrollBehavior: "smooth", padding: "2px" }}
        >
          {sets.map((s) => (
            editingTabId === s.id ? (
              <input 
                id={`tab-${s.id}`} 
                key={`edit-${s.id}`} type="text" autoFocus value={editTabName} onChange={(e) => setEditTabName(e.target.value)} onBlur={saveTabRename}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTabRename(); if (e.key === 'Escape') setEditingTabId(null); }}
                style={{ 
                  padding: "8px 16px", borderRadius: "8px", border: "none", outline: "none", 
                  fontSize: "14px", fontWeight: 700, width: Math.max(100, editTabName.length * 9) + "px", 
                  boxShadow: "0 0 0 2px var(--text-accent) inset",
                  background: "var(--input-bg)",
                  color: "var(--text-primary)"
                }}
              />
            ) : (
              <button 
                id={`tab-${s.id}`} 
                key={s.id} type="button" onClick={() => setActiveSet(s.id)} onDoubleClick={() => handleTabDoubleClick(s.id, s.name)} title="Double-click to rename"
                className={activeSetId === s.id ? "glass-tab-active" : "glass-tab-inactive"}
                style={{ 
                  display: "flex", alignItems: "center", gap: "8px",
                  background: activeSetId === s.id ? "" : "transparent", // Handle by class
                  border: "none", 
                  borderBottom: activeSetId === s.id ? "3px solid var(--text-accent)" : "3px solid transparent",
                  padding: "10px 16px", borderRadius: "8px 8px 4px 4px", 
                  cursor: "pointer", transition: "all 0.2s ease-in-out",
                  boxShadow: activeSetId === s.id ? "var(--shadow-sm)" : "none",
                  fontWeight: activeSetId === s.id ? 700 : 600, fontSize: "14px", whiteSpace: "nowrap", fontFamily: "inherit"
                }}
              >
                {s.name}
                {sets.length > 1 && activeSetId === s.id && (
                  <span onClick={(e) => { e.stopPropagation(); removeSet(s.id); }} title="Delete Label Set" style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "6px", color: "#fca5a5", cursor: "pointer" }}>
                    <X size={16} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          ))}
        </div>

        {canScrollRight && (
          <button onClick={() => scrollTabs("right")} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "0 8px" }}>
            <ChevronRight size={20} />
          </button>
        )}

        <div className="glass-divider" style={{ width: "1px", height: "24px", background: "#cbd5e1", margin: "0 8px", flexShrink: 0, transition: "var(--theme-transition)" }} />

        <button type="button" onClick={addSet} className="glass-btn" style={{ padding: "8px 12px", background: "transparent", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0, transition: "var(--theme-transition)" }}>
          <Plus size={16} strokeWidth={2.5} /> New
        </button>
      </div>
    </>
  );
}