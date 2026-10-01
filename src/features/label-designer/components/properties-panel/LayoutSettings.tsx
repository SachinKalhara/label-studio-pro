import { Tag, Square, Ruler, Scissors } from "lucide-react";
import { useLabelStore } from "../../../../stores/labelStore";
import { useSettingsStore } from "../../../../stores/settingsStore";
import { createId, enforceBounds } from "../../utils/elementBounds";

export default function LayoutSettings() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  const setLabelSize = useLabelStore((state) => state.setLabelSize);
  const setPadding = useLabelStore((state) => state.setPadding);
  const setLabelBackgroundColor = useLabelStore((state: any) => state.setLabelBackgroundColor);
  const setSections = useLabelStore((state) => state.setSections);
  const updateSection = useLabelStore((state) => state.updateSection);
  const setSectionBorderWidth = useLabelStore((state) => state.setSectionBorderWidth);
  const setShowBorder = useLabelStore((state) => state.setShowBorder);
  const setBorderSettings = useLabelStore((state) => state.setBorderSettings);
  const setOrientation = useLabelStore((state) => state.setOrientation);
  const setSmartFill = useLabelStore((state) => state.setSmartFill);
  const setGrid = useLabelStore((state) => state.setGrid);
  const setMargins = useLabelStore((state) => state.setMargins);
  const updateElement = useLabelStore((state) => state.updateElement);

  const { unit, decimalPlaces } = useSettingsStore();

  if (!currentTemplate) return null;

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

  return (
    <>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><Tag size={16} /> Label Settings</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Width ({unit})
          <input type="number" min={0.5} step={0.1} 
            value={formatVal(currentTemplate.labelSize.width)} 
            onChange={(e) => setLabelSize({ width: e.target.value === "" ? 0 : toMm(Number(e.target.value)), height: currentTemplate.labelSize.height })} 
            onBlur={(e) => setLabelSize({ width: Math.max(5, toMm(Number(e.target.value))), height: currentTemplate.labelSize.height })} 
            style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
        </label>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Height ({unit})
          <input type="number" min={0.5} step={0.1} 
            value={formatVal(currentTemplate.labelSize.height)} 
            onChange={(e) => setLabelSize({ width: currentTemplate.labelSize.width, height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} 
            onBlur={(e) => setLabelSize({ width: currentTemplate.labelSize.width, height: Math.max(5, toMm(Number(e.target.value))) })} 
            style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Background
          <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
            <input type="color" value={currentTemplate.backgroundColor || "#ffffff"} onChange={(e) => setLabelBackgroundColor && setLabelBackgroundColor(e.target.value)} style={{ flex: 1, height: "32px", padding: "0", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
            <button type="button" onClick={() => setLabelBackgroundColor && setLabelBackgroundColor("#ffffff")} title="Reset to White" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px", background: currentTemplate.backgroundColor === "#ffffff" || !currentTemplate.backgroundColor ? "var(--bg-main)" : "var(--btn-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "4px", cursor: "pointer", transition: "var(--theme-transition)" }}><Square size={14} /></button>
          </div>
        </label>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Safe Pad ({unit})
          <input type="number" min={0} step={0.1} value={formatVal(currentTemplate.padding)} onChange={(e) => setPadding(e.target.value === "" ? 0 : toMm(Number(e.target.value)))} onBlur={(e) => { const newPad = Math.max(0, toMm(Number(e.target.value))); setPadding(newPad); currentTemplate.elements.forEach(el => { const bounds = enforceBounds(el as any, el.constrainToPadding !== false, newPad, currentTemplate.labelSize.width, currentTemplate.labelSize.height); if (bounds.x !== el.x || bounds.y !== el.y || bounds.width !== el.width || bounds.height !== el.height) { updateElement(el.id, bounds); } }); }} style={{ display: "block", width: "100%", marginTop: "5px", padding: "7px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} />
        </label>
      </div>

      <div style={{ padding: "12px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
        <label style={{ display: "flex", alignItems: "center", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", gap: "6px" }}>
          <Scissors size={14} /> Divide Label (Sections)
        </label>
        <select 
          value={currentTemplate.sections?.length || 0} 
          onChange={(e) => {
            const count = parseInt(e.target.value);
            if (count <= 1) {
              setSections([]);
            } else {
              const h = currentTemplate.labelSize.height / count;
              const newSections = Array.from({ length: count }).map((_, i) => ({
                id: createId("sec"),
                color: i % 2 === 0 ? "#ffffff" : "#fef08a",
                height: h,
                showTopBorder: i > 0,
                showBottomBorder: false,
                borderColor: "#000000"
              }));
              setSections(newSections);
            }
          }}
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", transition: "var(--theme-transition)" }}
        >
          <option value={0}>1 Section (Solid Background)</option>
          <option value={2}>2 Sections (Top & Bottom)</option>
          <option value={3}>3 Sections (Top, Middle, Bottom)</option>
          <option value={4}>4 Sections</option>
        </select>

        {currentTemplate.sections && currentTemplate.sections.length > 0 && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-panel)", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>Divider Border Size (px)</span>
              <input type="number" min={1} max={5} value={currentTemplate.sectionBorderWidth ?? 1} onChange={(e) => setSectionBorderWidth(Math.max(1, Number(e.target.value)))} style={{ width: "55px", padding: "4px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--input-bg)", color: "var(--text-primary)", textAlign: "center", fontSize: "12px", outline: "none" }} />
            </div>
            {currentTemplate.sections.map((sec, i) => (
              <div key={sec.id} style={{ display: "flex", gap: "6px", alignItems: "center", background: "var(--bg-panel)", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <div style={{ flex: 1.2 }}>
                  <label style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Sec {i + 1} Color</label>
                  <input type="color" value={sec.color} onChange={(e) => updateSection(sec.id, { color: e.target.value })} style={{ width: "100%", height: "24px", padding: 0, border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>Height ({unit})</label>
                  <input type="number" step={0.1} value={formatVal(sec.height)} onChange={(e) => updateSection(sec.id, { height: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => updateSection(sec.id, { height: Math.max(1, toMm(Number(e.target.value))) })} style={{ width: "100%", padding: "4px", border: "1px solid var(--border-color)", borderRadius: "4px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", fontSize: "12px" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "12px" }}>
                  <label style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input type="checkbox" checked={sec.showTopBorder ?? (i > 0)} onChange={(e) => updateSection(sec.id, { showTopBorder: e.target.checked })} style={{ width: "12px", height: "12px" }} />
                    Border
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "10px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "20px", transition: "var(--theme-transition)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={currentTemplate.showBorder} onChange={(e) => setShowBorder(e.target.checked)} style={{ width: "16px", height: "16px" }} />
          <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>Print Label Borders</strong>
        </label>
        {currentTemplate.showBorder && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Size (px)
              <input type="number" min={1} max={10} value={currentTemplate.borderWidth} onChange={(e) => setBorderSettings(Math.max(1, Number(e.target.value)), currentTemplate.borderStyle)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", transition: "var(--theme-transition)" }} />
            </label>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Type
              <select value={currentTemplate.borderStyle} onChange={(e) => setBorderSettings(currentTemplate.borderWidth, e.target.value as any)} style={{ display: "block", width: "100%", marginTop: "4px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", transition: "var(--theme-transition)" }}>
                <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <hr style={{ margin: "20px 0", border: 0, borderTop: "1px solid var(--border-color)" }} />

      <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><Ruler size={16} /> Layout Settings</h3>

      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "15px" }}>Filling Direction
        <select value={currentTemplate.orientation} onChange={(e) => setOrientation(e.target.value as any)} style={{ display: "block", width: "100%", marginTop: "5px", padding: "8px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }}>
          <option value="landscape">Landscape (Horizontal First)</option>
          <option value="portrait">Portrait (Vertical First)</option>
        </select>
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", cursor: "pointer", marginBottom: "15px", transition: "var(--theme-transition)" }}>
        <input type="checkbox" checked={currentTemplate.smartFill} onChange={(e) => setSmartFill(e.target.checked)} style={{ width: "16px", height: "16px" }} />
        <strong style={{ color: "#f59e0b", fontSize: "13px" }}>Smart Fill Free Space</strong>
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingBottom: "10px" }}>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>H. Gap ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.grid.horizontalGap)} onChange={(e) => setGrid({ ...currentTemplate.grid, horizontalGap: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setGrid({ ...currentTemplate.grid, horizontalGap: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>V. Gap ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.grid.verticalGap)} onChange={(e) => setGrid({ ...currentTemplate.grid, verticalGap: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setGrid({ ...currentTemplate.grid, verticalGap: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Top Marg. ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.margins.top)} onChange={(e) => setMargins({ ...currentTemplate.margins, top: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setMargins({ ...currentTemplate.margins, top: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Left Marg. ({unit})<input type="number" min={0} step={0.1} value={formatVal(currentTemplate.margins.left)} onChange={(e) => setMargins({ ...currentTemplate.margins, left: e.target.value === "" ? 0 : toMm(Number(e.target.value)) })} onBlur={(e) => setMargins({ ...currentTemplate.margins, left: Math.max(0, toMm(Number(e.target.value))) })} style={{ display: "block", width: "100%", marginTop: "5px", padding: "6px", boxSizing: "border-box", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", borderRadius: "4px", fontWeight: 400, transition: "var(--theme-transition)" }} /></label>
      </div>
    </>
  );
}