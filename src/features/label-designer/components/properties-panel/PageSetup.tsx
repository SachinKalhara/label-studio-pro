import { useMemo } from "react";
import { FileText } from "lucide-react";
import { useLabelStore } from "../../../../stores/labelStore";
import { useSettingsStore } from "../../../../stores/settingsStore";

const PAGE_SIZES = [
  { label: "A4", width: 210, height: 297 },
  { label: "A5", width: 148, height: 210 },
  { label: "Letter", width: 215.9, height: 279.4 },
  { label: "Custom", width: 0, height: 0 } 
];

export default function PageSetup() {
  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;

  const updatePageSize = useLabelStore((state) => state.updatePageSize);
  const { unit, decimalPlaces } = useSettingsStore();

  if (!currentTemplate) return null;

  const currentW = currentTemplate.page.width;
  const currentH = currentTemplate.page.height;

  const currentPreset = useMemo(() => {
    const isLandscape = currentW > currentH;
    const checkW = isLandscape ? currentH : currentW;
    const checkH = isLandscape ? currentW : currentH;
    const match = PAGE_SIZES.find(p => Math.abs(p.width - checkW) < 1 && Math.abs(p.height - checkH) < 1);
    return match ? match.label : "Custom";
  }, [currentW, currentH]);

  const isPageLandscape = currentW > currentH;

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "Custom") return;
    const size = PAGE_SIZES.find(p => p.label === selected);
    if (size) {
      if (isPageLandscape) updatePageSize(size.height, size.width);
      else updatePageSize(size.width, size.height);
    }
  };

  const togglePageOrientation = () => updatePageSize(currentH, currentW);

  const displayVal = (val: number) => unit === "cm" ? val / 10 : val;
  const toMm = (val: number) => unit === "cm" ? val * 10 : val;
  const formatVal = (val: number) => val === 0 ? "" : Number(displayVal(val).toFixed(decimalPlaces));

  return (
    <div style={{ paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}><FileText size={16} /> Page Setup</h3>
      <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginBottom: "10px" }}>
        Paper Size
        <select value={currentPreset} onChange={handlePresetChange} style={{ width: "100%", padding: "8px", marginTop: "5px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", outline: "none", cursor: "pointer", transition: "var(--theme-transition)" }}>
          {PAGE_SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>
      </label>
      <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
        <button onClick={() => { if (isPageLandscape) togglePageOrientation(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: !isPageLandscape ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: !isPageLandscape ? "var(--bg-active)" : "var(--btn-bg)", color: !isPageLandscape ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "0.2s" }}><FileText size={14} /> Portrait</button>
        <button onClick={() => { if (!isPageLandscape) togglePageOrientation(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flex: 1, padding: "8px", border: isPageLandscape ? "1px solid var(--border-active)" : "1px solid var(--border-color)", background: isPageLandscape ? "var(--bg-active)" : "var(--btn-bg)", color: isPageLandscape ? "var(--text-accent)" : "var(--text-primary)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "0.2s" }}><FileText size={14} style={{ transform: "rotate(-90deg)" }} /> Landscape</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Width ({unit})<input type="number" step={0.1} value={formatVal(currentW)} onChange={(e) => updatePageSize(e.target.value === "" ? 0 : toMm(Number(e.target.value)), currentH)} onBlur={(e) => updatePageSize(Math.max(10, toMm(Number(e.target.value))), currentH)} style={{ width: "100%", padding: "7px", marginTop: "4px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box", outline: "none" }} /></label>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Height ({unit})<input type="number" step={0.1} value={formatVal(currentH)} onChange={(e) => updatePageSize(currentW, e.target.value === "" ? 0 : toMm(Number(e.target.value)))} onBlur={(e) => updatePageSize(currentW, Math.max(10, toMm(Number(e.target.value))))} style={{ width: "100%", padding: "7px", marginTop: "4px", border: "1px solid var(--border-color)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-primary)", boxSizing: "border-box", outline: "none" }} /></label>
      </div>
    </div>
  );
}