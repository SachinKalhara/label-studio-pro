import React, { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useExcelStore } from "../../../stores/excelStore";
import { useLabelStore, LabelSet } from "../../../stores/labelStore";
import { renderTextElement } from "../../../utils/labelRenderer";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react"; 

import TopToolbar from "./TopToolbar";
import LeftSidebar from "./LeftSidebar";
import RightEditPanel from "./RightEditPanel";

export const PREVIEW_SCALE = 3.78; 

export interface ElementEditOverride {
  text?: string; x?: number; y?: number; width?: number; height?: number; rotation?: number;
  fontFamily?: string; fontSize?: number; fontWeight?: string; fontStyle?: string;
  textDecoration?: string; textDecorationStyle?: string; textAlign?: "left" | "center" | "right";
  color?: string; backgroundColor?: string; listStyle?: "none" | "bullet" | "number"; zIndex?: number;
  constrainToPadding?: boolean;
}

export interface LabelInstance {
  id: string; setId: string; row: any; type: 'A' | 'B'; displayName: string;
}

const AutoFitText = ({ elState, targetW, targetH, textStr }: any) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [fittedSize, setFittedSize] = useState(elState.fontSize);

  useLayoutEffect(() => {
    if (!textRef.current) return;
    const el = textRef.current;
    let currentSize = elState.fontSize;
    el.style.fontSize = `${currentSize}pt`; 
    let attempts = 0;
    while ((Math.ceil(el.scrollHeight) > targetH || Math.ceil(el.scrollWidth) > targetW) && currentSize > 4 && attempts < 50) {
      currentSize -= 0.5; el.style.fontSize = `${currentSize}pt`; attempts++;
    }
    setFittedSize(currentSize);
  }, [textStr, elState.fontSize, elState.fontFamily, elState.fontWeight, targetW, targetH]);

  const flexAlign = elState.textAlign === "center" ? "center" : elState.textAlign === "right" ? "flex-end" : "flex-start";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: flexAlign, overflow: "hidden" }}>
      <div 
        ref={textRef}
        style={{ fontSize: `${fittedSize}pt`, fontFamily: elState.fontFamily, fontWeight: elState.fontWeight, fontStyle: elState.fontStyle, textDecoration: elState.textDecoration, textAlign: elState.textAlign, color: elState.color, whiteSpace: "pre-wrap", wordBreak: "break-word", width: "100%", padding: "2px", boxSizing: "border-box" }}
      >
        {textStr.split('\n').map((line: string, i: number) => (
          <div key={i} style={{ minHeight: "1.2em", width: "100%" }}>
            {elState.listStyle === "bullet" ? "•  " : elState.listStyle === "number" ? `${i + 1}.  ` : ""}
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function getSetLayout(set: LabelSet) {
  const { template, templateB } = set;
  const { width: P_W, height: P_H } = template.page;
  const { top, right, bottom, left } = template.margins;
  const U_W = Math.max(0, P_W - left - right);
  const U_H = Math.max(0, P_H - top - bottom);
  let positions: { type: 'A'|'B', x: number; y: number; isRotated: boolean }[] = [];

  if (!set.isDualMode) {
    const L_W = template.labelSize.width; const L_H = template.labelSize.height;
    const G_X = template.grid.horizontalGap; const G_Y = template.grid.verticalGap;
    if (L_W === 0 || L_H === 0) return positions;
    let C_pri = 0, R_pri = 0;
    if (L_W <= U_W && L_H <= U_H) { C_pri = Math.floor((U_W + G_X) / (L_W + G_X)); R_pri = Math.floor((U_H + G_Y) / (L_H + G_Y)); }
    for (let r = 0; r < R_pri; r++) { for (let c = 0; c < C_pri; c++) positions.push({ type: 'A', x: left + c * (L_W + G_X), y: top + r * (L_H + G_Y), isRotated: false }); }

    if (template.smartFill) {
      const usedW_pri = C_pri > 0 ? C_pri * L_W + (C_pri - 1) * G_X : 0;
      const usedH_pri = R_pri > 0 ? R_pri * L_H + (R_pri - 1) * G_Y : 0;
      const R_W = L_H, R_H = L_W; 
      const botY = R_pri > 0 ? top + usedH_pri + G_Y : top; const botH = Math.max(0, P_H - bottom - botY);
      const rightX = C_pri > 0 ? left + usedW_pri + G_X : left; const rightW = Math.max(0, P_W - right - rightX);
      if (R_W <= U_W && R_H <= botH) { let C_bot = Math.floor((U_W + G_X) / (R_W + G_X)); let R_bot = Math.floor((botH + G_Y) / (R_H + G_Y)); for (let r = 0; r < R_bot; r++) for (let c = 0; c < C_bot; c++) positions.push({ type: 'A', x: left + c * (R_W + G_X), y: botY + r * (R_H + G_Y), isRotated: true }); }
      if (R_W <= rightW && R_H <= usedH_pri) { let C_right = Math.floor((rightW + G_X) / (R_W + G_X)); let R_right = Math.floor((usedH_pri + G_Y) / (R_H + G_Y)); for (let r = 0; r < R_right; r++) for (let c = 0; c < C_right; c++) positions.push({ type: 'A', x: rightX + c * (R_W + G_X), y: top + r * (R_H + G_Y), isRotated: true }); }
    }
  } else {
    const L_WA = template.labelSize.width; const L_HA = template.labelSize.height;
    const G_XA = template.grid.horizontalGap; const G_YA = template.grid.verticalGap;
    const L_WB = templateB.labelSize.width; const L_HB = templateB.labelSize.height;
    const G_XB = templateB.grid.horizontalGap; const G_YB = templateB.grid.verticalGap;

    if (L_WA > 0 && L_HA > 0 && L_WB > 0 && L_HB > 0) {
      let colsA = Math.floor((U_W + G_XA) / (L_WA + G_XA)); let colsB = Math.floor((U_W + G_XB) / (L_WB + G_XB));
      const stepA = L_HA + G_YA; const stepB = L_HB + G_YB; const ratioA = L_HA / (L_HA + L_HB);
      let allocated_H_A = U_H * ratioA; let rowsA = Math.max(1, Math.round(allocated_H_A / stepA));
      let used_H_A = rowsA * L_HA + (rowsA - 1) * G_YA;
      if (used_H_A >= U_H) { rowsA = Math.max(1, Math.floor((U_H - stepB) / stepA)); used_H_A = rowsA * L_HA + (rowsA - 1) * G_YA; }

      const remaining_H = U_H - used_H_A - Math.max(G_YA, G_YB);
      let rowsB = Math.max(1, Math.floor((remaining_H + G_YB) / stepB));

      for (let r = 0; r < rowsA; r++) { for (let c = 0; c < colsA; c++) { positions.push({ type: 'A', x: left + c * (L_WA + G_XA), y: top + r * (L_HA + G_YA), isRotated: false }); } }
      const startY_B = top + used_H_A + Math.max(G_YA, G_YB);
      for (let r = 0; r < rowsB; r++) { for (let c = 0; c < colsB; c++) { positions.push({ type: 'B', x: left + c * (L_WB + G_XB), y: startY_B + r * (L_HB + G_YB), isRotated: false }); } }
    }
  }
  return positions;
}

const buildPagesInfo = (instancesToProcess: LabelInstance[], targetSet: LabelSet | undefined, selectedRows: any[]) => {
  let pages: any[] = []; let globalIndex = 1;
  if (!targetSet || instancesToProcess.length === 0) return pages;

  const setInstances = instancesToProcess.filter(i => i.setId === targetSet.id);
  if (setInstances.length === 0) return pages;

  const layout = getSetLayout(targetSet);
  if (targetSet.isDualMode && targetSet.isDataLinked) {
      const slotsA = layout.filter(l => l.type === 'A'); const slotsB = layout.filter(l => l.type === 'B');
      const pairsPerPage = Math.min(slotsA.length, slotsB.length);
      const pairs: {a?: LabelInstance, b?: LabelInstance}[] = [];
      selectedRows.forEach(row => {
          const a = setInstances.find(i => i.row.id === row.id && i.type === 'A');
          const b = setInstances.find(i => i.row.id === row.id && i.type === 'B');
          if (a || b) pairs.push({ a, b });
      });
      for (let i = 0; i < pairs.length; i += pairsPerPage) {
          const pagePairs = pairs.slice(i, i + pairsPerPage); const pageItems: any[] = [];
          pagePairs.forEach((pair, idx) => {
              if (pair.a && slotsA[idx]) pageItems.push({ pos: slotsA[idx], instance: pair.a });
              if (pair.b && slotsB[idx]) pageItems.push({ pos: slotsB[idx], instance: pair.b });
          });
          pages.push({ globalIndex: globalIndex++, set: targetSet, items: pageItems });
      }
  } else {
      const instA = setInstances.filter(i => i.type === 'A'); const instB = setInstances.filter(i => i.type === 'B');
      const slotsA = layout.filter(l => l.type === 'A'); const slotsB = layout.filter(l => l.type === 'B');
      if (slotsA.length > 0) {
          for (let i = 0; i < instA.length; i += slotsA.length) {
              const chunk = instA.slice(i, i + slotsA.length);
              pages.push({ globalIndex: globalIndex++, set: targetSet, items: chunk.map((inst, idx) => ({ pos: slotsA[idx], instance: inst })) });
          }
      }
      if (slotsB.length > 0) {
          for (let i = 0; i < instB.length; i += slotsB.length) {
              const chunk = instB.slice(i, i + slotsB.length);
              pages.push({ globalIndex: globalIndex++, set: targetSet, items: chunk.map((inst, idx) => ({ pos: slotsB[idx], instance: inst })) });
          }
      }
  }
  return pages;
};

export default function LabelPreview() {
  const activeSheet = useExcelStore((state) => state.activeSheet);
  const selectedRowIds = useExcelStore((state) => state.selectedData.selectedRowIds);
  const sets = useLabelStore((state) => state.sets); 
  const activeFilterSetId = useLabelStore((state) => state.activeSetId);
  const setActiveFilterSetId = useLabelStore((state) => state.setActiveSet);
  const refreshKey = useLabelStore((state) => state.refreshKey);

  const [zoom, setZoom] = useState<number>(0.7);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"single" | "vertical" | "horizontal">("vertical");
  
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sets.length > 0 && !sets.find((s) => s.id === activeFilterSetId)) {
      setActiveFilterSetId(sets[0].id);
      setCurrentPage(1); 
    }
  }, [sets, activeFilterSetId, setActiveFilterSetId]);

  const [manualEdits, setManualEdits] = useState<Record<string, ElementEditOverride>>({});
  const [selectedEdit, setSelectedEdit] = useState<{ instance: LabelInstance, element: any } | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  const [tempTransform, setTempTransform] = useState<Partial<ElementEditOverride> | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStartSize, setElementStartSize] = useState<{ width: number; height: number } | null>(null);
  const [rotateCenter, setRotateCenter] = useState<{ x: number; y: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRows = useMemo(() => activeSheet ? activeSheet.rows.filter((row) => selectedRowIds.includes(row.id)) : [], [activeSheet, selectedRowIds]);

  const allInstances: LabelInstance[] = useMemo(() => {
    const list: LabelInstance[] = [];
    if (!sets || !activeSheet) return list;

    sets.forEach(set => {
        const getDisplayName = (row: any, type: 'A' | 'B') => {
            const template = type === 'A' ? set.template : set.templateB;
            const textElement = template.elements.find(e => e.type === 'text');
            if (textElement) {
                const rendered = renderTextElement(textElement, row, activeSheet.columns);
                if (rendered.trim()) return rendered.trim();
            }
            const anyFieldElement = template.elements.find(e => e.field);
            if (anyFieldElement && anyFieldElement.field && row.values[anyFieldElement.field]) {
                return String(row.values[anyFieldElement.field]);
            }
            const primaryCol = activeSheet.columns[0]?.name;
            return row.values[primaryCol] ? String(row.values[primaryCol]) : `Row ${row.id}`;
        };

        selectedRows.forEach(row => {
            const displayNameA = getDisplayName(row, 'A');
            list.push({ id: `${set.id}_${row.id}_A`, setId: set.id, row, type: 'A', displayName: displayNameA });
            if (set.isDualMode && set.isDataLinked) {
                const displayNameB = getDisplayName(row, 'B');
                list.push({ id: `${set.id}_${row.id}_B`, setId: set.id, row, type: 'B', displayName: displayNameB });
            }
        });

        if (set.isDualMode && !set.isDataLinked) {
            selectedRows.forEach(row => {
                const displayNameB = getDisplayName(row, 'B');
                list.push({ id: `${set.id}_${row.id}_B`, setId: set.id, row, type: 'B', displayName: displayNameB });
            });
        }
    });
    return list;
  }, [sets, activeSheet, selectedRows, refreshKey]); 

  const allPagesInfoOriginal = useMemo(() => {
    const targetSet = sets.find(s => s.id === activeFilterSetId);
    return buildPagesInfo(allInstances, targetSet, selectedRows);
  }, [sets, allInstances, selectedRows, activeFilterSetId]);

  const allPagesInfoPrint = useMemo(() => {
    const targetSet = sets.find(s => s.id === activeFilterSetId);
    const activeInstances = allInstances.filter(inst => !skippedIds.has(inst.id));
    return buildPagesInfo(activeInstances, targetSet, selectedRows);
  }, [sets, allInstances, skippedIds, selectedRows, activeFilterSetId]);

  const sidebarPagesInfo = useMemo(() => {
    const originalPageMap = new Map();
    const originalIndexMap = new Map(); 

    allPagesInfoOriginal.forEach(page => {
      page.items.forEach((item: any) => {
        originalPageMap.set(item.instance.id, page.globalIndex);
      });
    });

    allInstances.forEach((inst, idx) => {
      originalIndexMap.set(inst.id, idx);
    });

    const totalOriginalPages = allPagesInfoOriginal.length;
    const result = [];

    for (let p = 1; p <= totalOriginalPages; p++) {
      const itemsForSidebarMap = new Map();

      const originalItemsOnPageP = allPagesInfoOriginal.find(page => page.globalIndex === p)?.items || [];
      originalItemsOnPageP.forEach((item: any) => {
        if (skippedIds.has(item.instance.id)) {
          itemsForSidebarMap.set(item.instance.id, { instance: item.instance, isSkipped: true, isShifted: false });
        }
      });

      const printItemsOnPageP = allPagesInfoPrint.find(page => page.globalIndex === p)?.items || [];
      printItemsOnPageP.forEach((item: any) => {
        const origPage = originalPageMap.get(item.instance.id);
        itemsForSidebarMap.set(item.instance.id, {
          instance: item.instance,
          isSkipped: false,
          isShifted: origPage !== p, 
          originalPage: origPage
        });
      });

      const sortedItems = Array.from(itemsForSidebarMap.values()).sort((a: any, b: any) => {
        return originalIndexMap.get(a.instance.id) - originalIndexMap.get(b.instance.id);
      });

      if (sortedItems.length > 0) {
        result.push({ globalIndex: p, items: sortedItems });
      }
    }
    return result;
  }, [allPagesInfoOriginal, allPagesInfoPrint, skippedIds, allInstances]);

  const totalPages = allPagesInfoPrint.length;

  // 🔴 වම් පසින් ලේබල් එක Click කළ විට Smooth Scroll වීම (නිවැරදි කළ ක්‍රමය)
  const handleInstanceClick = useCallback((instId: string) => {
    setActiveInstanceId(instId);
    setSelectedEdit(null); 
    const pageIndex = allPagesInfoPrint.findIndex(page => page.items.some((item: any) => item.instance.id === instId));
    if (pageIndex !== -1) {
      const targetPage = pageIndex + 1;
      setCurrentPage(targetPage);
      
      setTimeout(() => {
        const pageElement = document.getElementById(`preview-page-${targetPage}`);
        const containerElement = scrollRef.current;
        
        // මුළු පිටුවම Scroll නොවී, Container එක පමණක් Scroll කිරීම
        if (pageElement && containerElement) {
          // Horizontal View එකක් නම් (වමේ ඉඳන් දකුණට)
          if (viewMode === "horizontal") {
            const scrollLeft = pageElement.offsetLeft - containerElement.offsetLeft - 40; // 40 යනු Padding එකයි
            containerElement.scrollTo({ left: scrollLeft, behavior: "smooth" });
          } 
          // Vertical View එකක් නම් (උඩ ඉඳන් පල්ලෙහාට)
          else if (viewMode === "vertical") {
            const scrollTop = pageElement.offsetTop - containerElement.offsetTop - 40; // 40 යනු Padding එකයි
            containerElement.scrollTo({ top: scrollTop, behavior: "smooth" });
          }
        }
      }, 100);
    }
  }, [allPagesInfoPrint, viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (viewMode === "single") {
        if (e.key === "ArrowLeft") setCurrentPage((p) => Math.max(1, p - 1));
        if (e.key === "ArrowRight") setCurrentPage((p) => Math.min(totalPages, p + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, totalPages]);

  useEffect(() => {
    if (viewMode !== "vertical" && viewMode !== "horizontal") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = entry.target.getAttribute("data-page-index");
            if (pageIndex) setCurrentPage(Number(pageIndex));
          }
        });
      },
      { root: scrollRef.current, rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    const pages = document.querySelectorAll(".a4-page-preview");
    pages.forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [allPagesInfoPrint, viewMode]);

  const toggleSkip = useCallback((instanceId: string) => {
    setSkippedIds(prev => { const newSet = new Set(prev); if (newSet.has(instanceId)) newSet.delete(instanceId); else newSet.add(instanceId); return newSet; });
  }, []);

  const togglePageSkip = useCallback((instanceIds: string[], forceSkip: boolean) => {
    setSkippedIds(prev => {
      const newSet = new Set(prev);
      instanceIds.forEach(id => { if (forceSkip) newSet.add(id); else newSet.delete(id); });
      return newSet;
    });
  }, []);

  const handleUpdateOverride = useCallback((instance: LabelInstance, element: any, updates: Partial<ElementEditOverride>) => {
    const key = `${instance.id}_${element.id}`; setManualEdits(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...updates } }));
  }, []);

  const handleResetOverride = useCallback((instance: LabelInstance, element: any) => {
    const key = `${instance.id}_${element.id}`; setManualEdits(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const getElementState = useCallback((instance: LabelInstance, element: any) => {
    const editKey = `${instance.id}_${element.id}`; const overrides = manualEdits[editKey] || {};
    const baseText = element.type === "text" ? renderTextElement(element, instance.row, activeSheet!.columns) : String(instance.row.values[activeSheet!.columns.findIndex((col) => col.name === element.field)] || element.field || "123456");
    return {
      text: overrides.text !== undefined ? overrides.text : baseText, x: overrides.x ?? element.x, y: overrides.y ?? element.y,
      width: overrides.width ?? element.width, height: overrides.height ?? element.height, rotation: overrides.rotation ?? element.rotation ?? 0,
      fontFamily: overrides.fontFamily ?? element.fontFamily ?? "Arial", fontSize: overrides.fontSize ?? element.fontSize ?? 12,
      fontWeight: overrides.fontWeight ?? element.fontWeight ?? "normal", fontStyle: overrides.fontStyle ?? element.fontStyle ?? "normal",
      textDecoration: overrides.textDecoration ?? element.textDecoration ?? "none", textDecorationStyle: overrides.textDecorationStyle ?? element.textDecorationStyle ?? "solid",
      textAlign: overrides.textAlign ?? element.textAlign ?? "left", color: overrides.color ?? element.color ?? "#000000",
      backgroundColor: overrides.backgroundColor ?? element.backgroundColor ?? "transparent", listStyle: overrides.listStyle ?? element.listStyle ?? "none",
      zIndex: overrides.zIndex ?? 10, isEdited: Object.keys(overrides).length > 0,
      constrainToPadding: overrides.constrainToPadding !== undefined ? overrides.constrainToPadding : true 
    };
  }, [manualEdits, activeSheet]);

  const handleLayerChange = useCallback((direction: 'up' | 'down') => {
    if (!selectedEdit) return;
    const currentZ = manualEdits[`${selectedEdit.instance.id}_${selectedEdit.element.id}`]?.zIndex || 10;
    handleUpdateOverride(selectedEdit.instance, selectedEdit.element, { zIndex: direction === 'up' ? currentZ + 1 : Math.max(1, currentZ - 1) });
  }, [selectedEdit, manualEdits, handleUpdateOverride]);

  const handleExportPDF = async (action: 'save' | 'print') => {
    setSelectedEdit(null);
    setActiveInstanceId(null);
    setIsPrinting(true); 

    setTimeout(async () => {
      try {
        const printContainer = document.getElementById("pdf-render-container");
        if (!printContainer) throw new Error("PDF Render Container එක DOM එකෙහි සොයාගැනීමට නොහැකි විය.");
        
        const pages = printContainer.getElementsByClassName("a4-page");
        if (pages.length === 0) throw new Error("මුද්‍රණය සඳහා කිසිදු පිටුවක් (Pages) සොයාගැනීමට නොහැකි විය.");
        
        if (action === 'save') {
          const filePath = await save({ filters: [{ name: "PDF Document", extensions: ["pdf"] }], defaultPath: "Labels_Print_Ready.pdf" });
          if (!filePath) { setIsPrinting(false); return; }
          setIsSaving(true); 

          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          for (let i = 0; i < pages.length; i++) {
            const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
          }
          const pdfOutput = pdf.output("arraybuffer");
          await writeFile(filePath, new Uint8Array(pdfOutput));
          alert("✅ PDF saved successfully to your computer!");
        } else {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
          document.body.appendChild(iframe);
          const iframeDoc = iframe.contentWindow?.document;
          if (!iframeDoc) throw new Error("Iframe එකක් නිර්මාණය කිරීම අසාර්ථක විය.");
          iframeDoc.open();
          iframeDoc.write(`<html><head><style>@media print { @page { margin: 0; size: A4; } body { margin: 0; padding: 0; background: #fff; } } img { width: 210mm; height: 297mm; display: block; page-break-after: always; }</style></head><body>`);
          for (let i = 0; i < pages.length; i++) {
            const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
            iframeDoc.write(`<img src="${canvas.toDataURL("image/png")}" />`);
          }
          iframeDoc.write('</body></html>');
          iframeDoc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus(); iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 2000);
          }, 500);
        }
      } catch (error: any) { console.error("Export Error Detail:", error); alert(`Error: ${error?.message || String(error)}`); } 
      finally { setIsPrinting(false); setIsSaving(false); }
    }, 1000); 
  };

  if (!sets || sets.length === 0 || !activeSheet || selectedRowIds.length === 0) {
    return (
      <div style={{ padding: "60px", textAlign: "center", background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)", transition: "var(--theme-transition)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px", color: "var(--text-secondary)" }}><Inbox size={48} strokeWidth={1.5} /></div>
        <h3 style={{ margin: "0 0 10px", color: "var(--text-primary)" }}>No Data Selected</h3>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Please go back to "1. Select Data" and tick the rows you want to print.</p>
      </div>
    );
  }

  let editPanelState = null; let selectedEditTemplate = null;
  if (selectedEdit) { 
    editPanelState = { ...getElementState(selectedEdit.instance, selectedEdit.element), ...(tempTransform || {}) }; 
    selectedEditTemplate = sets.find(s => s.id === selectedEdit.instance.setId)?.[selectedEdit.instance.type === 'A' ? 'template' : 'templateB'];
  }

  const handleBackgroundClick = () => { setSelectedEdit(null); setActiveInstanceId(null); };

  const handleGlobalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart && !rotatingId) return;
    if (!selectedEdit || !tempTransform) return;
    const { instance } = selectedEdit; const targetSet = sets.find(s => s.id === instance.setId); if (!targetSet) return;
    const elTemplate = instance.type === 'A' ? targetSet.template : targetSet.templateB;
    const dxRaw = (e.clientX - dragStart!.x) / (PREVIEW_SCALE * zoom); const dyRaw = (e.clientY - dragStart!.y) / (PREVIEW_SCALE * zoom);

    const constrain = tempTransform.constrainToPadding !== false;
    const padding = constrain ? elTemplate.padding : 0;
    const minX = padding; const minY = padding; const maxX = elTemplate.labelSize.width - padding; const maxY = elTemplate.labelSize.height - padding;

    if (rotatingId && rotateCenter) {
      let angleDeg = ((Math.atan2(e.clientY - rotateCenter.y, e.clientX - rotateCenter.x) * 180) / Math.PI + 90) % 360;
      if (angleDeg < 0) angleDeg += 360;
      if (Math.abs(angleDeg % 45) < 5 || Math.abs(angleDeg % 45) > 40) angleDeg = Math.round(angleDeg / 45) * 45;
      setTempTransform({ ...tempTransform, rotation: Math.round(angleDeg) }); return;
    }
    if (resizingId && elementStartSize && elementStart) {
      setTempTransform({ ...tempTransform, width: Math.min(maxX - elementStart.x, Math.max(0.5, elementStartSize.width + dxRaw)), height: Math.min(maxY - elementStart.y, Math.max(0.5, elementStartSize.height + dyRaw)) }); return;
    }
    if (draggingId && elementStart) {
      setTempTransform({ ...tempTransform, x: Math.max(minX, Math.min(maxX - (tempTransform.width || 0), elementStart.x + dxRaw)), y: Math.max(minY, Math.min(maxY - (tempTransform.height || 0), elementStart.y + dyRaw)) });
    }
  };

  const handleGlobalMouseUp = () => {
    if (selectedEdit && tempTransform && (draggingId || resizingId || rotatingId)) { handleUpdateOverride(selectedEdit.instance, selectedEdit.element, tempTransform); }
    setDraggingId(null); setResizingId(null); setRotatingId(null); setDragStart(null); setElementStart(null); setElementStartSize(null); setRotateCenter(null); setTempTransform(null);
  };

  const renderA4Page = (pageInfo: any, isPrintMode: boolean = false) => {
    const { globalIndex, set, items } = pageInfo;
    return (
      <div key={`page-${globalIndex}`} id={`preview-page-${globalIndex}`} data-page-index={globalIndex} className={`a4-page ${!isPrintMode ? "a4-page-preview" : ""}`} style={{ width: set.template.page.width * PREVIEW_SCALE * (isPrintMode ? 1 : zoom), height: set.template.page.height * PREVIEW_SCALE * (isPrintMode ? 1 : zoom), background: "#ffffff", position: "relative", boxShadow: isPrintMode ? "none" : "var(--shadow-modal)", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ width: set.template.page.width * PREVIEW_SCALE, height: set.template.page.height * PREVIEW_SCALE, transform: isPrintMode ? "none" : `scale(${zoom})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>
          {!isPrintMode && <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "5px 10px", borderRadius: "5px", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.2)", zIndex: 0 }}>{set.name}</div>}
          
          {items.map((item: any, index: number) => {
            const { pos, instance } = item;
            const elTemplate = instance.type === 'A' ? set.template : set.templateB;
            const boxW = pos.isRotated ? elTemplate.labelSize.height : elTemplate.labelSize.width;
            const boxH = pos.isRotated ? elTemplate.labelSize.width : elTemplate.labelSize.height;
            const screenBg = isPrintMode ? (elTemplate.backgroundColor || "#ffffff") : (elTemplate.backgroundColor || (pos.type === 'A' ? (set.isDualMode ? "rgba(37,99,235,0.05)" : "rgba(0,0,0,0.02)") : "rgba(16,185,129,0.05)"));
            const isInstanceActive = activeInstanceId === instance.id && !isPrintMode;
            const borderCSS = elTemplate.showBorder ? `${elTemplate.borderWidth * PREVIEW_SCALE}px ${elTemplate.borderStyle} #000` : (isPrintMode ? "none" : "1px dashed rgba(0,0,0,0.2)");

            return (
              <div key={`pos-${index}`} style={{ position: "absolute", left: pos.x * PREVIEW_SCALE, top: pos.y * PREVIEW_SCALE, width: boxW * PREVIEW_SCALE, height: boxH * PREVIEW_SCALE, boxSizing: "border-box", boxShadow: isInstanceActive ? "0 0 0 4px rgba(37,99,235,0.15)" : "none", transition: "box-shadow 0.2s" }}>
                <div style={{ position: "absolute", width: elTemplate.labelSize.width * PREVIEW_SCALE, height: elTemplate.labelSize.height * PREVIEW_SCALE, transform: pos.isRotated ? "rotate(90deg)" : "none", transformOrigin: "top left", left: pos.isRotated ? elTemplate.labelSize.height * PREVIEW_SCALE : 0, top: 0, overflow: "hidden", background: screenBg, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
                  {elTemplate.sections && elTemplate.sections.length > 0 && elTemplate.sections.map((sec: any, sIndex: number) => (
                    <div key={sec.id} style={{ width: "100%", height: sec.height * PREVIEW_SCALE, backgroundColor: sec.color, flexShrink: 0, borderTop: (sec.showTopBorder ?? (sIndex > 0)) ? `1px solid ${sec.borderColor || "#000000"}` : "none", boxSizing: "border-box" }} />
                  ))}
                  <div style={{ position: "absolute", inset: 0, border: isInstanceActive ? "2px solid #2563eb" : borderCSS, pointerEvents: "none", zIndex: 20, boxSizing: "border-box" }} />
                  {isInstanceActive && elTemplate.padding > 0 && !isPrintMode && <div style={{ position: "absolute", inset: `${elTemplate.padding * PREVIEW_SCALE}px`, border: "1px dashed rgba(37, 99, 235, 0.4)", pointerEvents: "none", boxSizing: "border-box", zIndex: 5 }} />}
                  
                  {elTemplate.elements.map((element: any) => {
                    let elState = getElementState(instance, element);
                    const isSelected = selectedEdit?.instance.id === instance.id && selectedEdit?.element.id === element.id && !isPrintMode;
                    if (isSelected && tempTransform) elState = { ...elState, ...tempTransform };
                    return (
                      <div 
                        key={element.id} 
                        onMouseDown={(e) => { 
                          if(!isPrintMode) { 
                            e.stopPropagation(); setActiveInstanceId(instance.id); setSelectedEdit({ instance, element }); 
                            setDraggingId(`${instance.id}_${element.id}`); setDragStart({ x: e.clientX, y: e.clientY }); 
                            setElementStart({ x: elState.x, y: elState.y }); setTempTransform({ x: elState.x, y: elState.y, width: elState.width, height: elState.height, rotation: elState.rotation, constrainToPadding: elState.constrainToPadding }); 
                          } 
                        }} 
                        onClick={(e) => { if(!isPrintMode) e.stopPropagation(); }} 
                        style={{ position: "absolute", left: elState.x * PREVIEW_SCALE, top: elState.y * PREVIEW_SCALE, width: elState.width * PREVIEW_SCALE, height: elState.height * PREVIEW_SCALE, backgroundColor: elState.backgroundColor, display: "flex", alignItems: "center", justifyContent: elState.textAlign === "center" ? "center" : elState.textAlign === "right" ? "flex-end" : "flex-start", transform: elState.rotation ? `rotate(${elState.rotation}deg)` : undefined, transformOrigin: "top left", border: isSelected ? "2px solid #2563eb" : (elState.isEdited && !isPrintMode ? "1px dashed #f97316" : "1px solid transparent"), cursor: isPrintMode ? "default" : "grab", boxSizing: "border-box", zIndex: elState.zIndex }}
                      >
                        {element.type === "barcode" ? <div style={{ transform: `scale(${Math.min(1, (elState.width * PREVIEW_SCALE) / 150)})`, transformOrigin: "left center" }}><Barcode value={elState.text} width={1.5} height={elState.height * PREVIEW_SCALE * 0.6} fontSize={12} margin={0} displayValue={true} background="transparent" /></div> : element.type === "qrcode" ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "2px" }}><QRCodeSVG value={elState.text} width="100%" height="100%" style={{ display: "block" }} /></div> : element.type === "image" ? <img src={element.src} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} draggable={false} /> : element.type === "line" ? <div style={{ width: "100%", height: "100%" }} /> : <AutoFitText elState={elState} targetW={elState.width * PREVIEW_SCALE} targetH={elState.height * PREVIEW_SCALE} textStr={String(elState.text)} />}
                        {isSelected && (
                          <>
                            <div onMouseDown={(e) => { e.stopPropagation(); setSelectedEdit({ instance, element }); setResizingId(`${instance.id}_${element.id}`); setDragStart({ x: e.clientX, y: e.clientY }); setElementStartSize({ width: elState.width, height: elState.height }); setTempTransform({ x: elState.x, y: elState.y, width: elState.width, height: elState.height, rotation: elState.rotation, constrainToPadding: elState.constrainToPadding }); }} style={{ position: "absolute", right: -5, bottom: -5, width: "12px", height: "12px", background: "#2563eb", border: "2px solid #ffffff", cursor: "nwse-resize", borderRadius: "50%", zIndex: 20 }} />
                            <div onMouseDown={(e) => { e.stopPropagation(); setSelectedEdit({ instance, element }); setRotatingId(`${instance.id}_${element.id}`); const rect = (e.target as HTMLElement).parentElement!.getBoundingClientRect(); setRotateCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }); setTempTransform({ x: elState.x, y: elState.y, width: elState.width, height: elState.height, rotation: elState.rotation, constrainToPadding: elState.constrainToPadding }); }} style={{ position: "absolute", top: -20, left: "50%", marginLeft: -6, width: "12px", height: "12px", background: "#10b981", border: "2px solid #ffffff", cursor: "crosshair", borderRadius: "50%", zIndex: 20 }} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div key={refreshKey} style={{ position: "relative", display: "flex", flexDirection: "column", height: "820px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-color)", background: "var(--bg-panel)", transition: "var(--theme-transition)" }}>
      
      {isPrinting && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(15, 23, 42, 0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "50px", height: "50px", border: "4px solid #334155", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ color: "#f8fafc", margin: "0 0 10px 0" }}>{isSaving ? "Saving PDF..." : "Preparing High-Quality Print..."}</h2>
          <p style={{ color: "#94a3b8", margin: 0, fontWeight: 500 }}>{isSaving ? "Writing file to your disk." : "Please wait while we render your labels perfectly."}</p>
        </div>
      )}

      <TopToolbar viewMode={viewMode} setViewMode={setViewMode} zoom={zoom} setZoom={setZoom} handleZoomReset={() => setZoom(0.7)} handleExportPDF={handleExportPDF} isPrinting={isPrinting} showSkipped={false} totalPages={totalPages} />
      
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        
        <LeftSidebar sets={sets} activeFilterSetId={activeFilterSetId} setActiveFilterSetId={setActiveFilterSetId} setCurrentPage={setCurrentPage} allInstances={allInstances} sidebarPagesInfo={sidebarPagesInfo} skippedIds={skippedIds} toggleSkip={toggleSkip} togglePageSkip={togglePageSkip} setSelectedEdit={setSelectedEdit} activeInstanceId={activeInstanceId} handleInstanceClick={handleInstanceClick} currentPage={currentPage} totalPages={totalPages} />

        <div className="no-print" onMouseDown={handleBackgroundClick} onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp} onMouseLeave={handleGlobalMouseUp} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--bg-canvas)", transition: "background 0.3s", cursor: "default" }}>
          <div ref={scrollRef} style={{ flex: 1, height: "100%", width: "100%", overflow: "auto", display: "flex", padding: "40px", boxSizing: "border-box", flexDirection: viewMode === "vertical" ? "column" : "row", alignItems: viewMode === "vertical" ? "center" : "flex-start", justifyContent: viewMode === "single" ? "center" : "flex-start", gap: "40px" }}>
            {viewMode === "single" && allPagesInfoPrint.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "30px", margin: "auto" }}>
                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.max(1, p - 1)); }} disabled={currentPage === 1} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "50%", border: "none", background: currentPage === 1 ? "var(--bg-main)" : "var(--bg-panel)", color: currentPage === 1 ? "var(--text-secondary)" : "var(--text-accent)", cursor: currentPage === 1 ? "not-allowed" : "pointer", boxShadow: "var(--shadow-md)" }}><ChevronLeft size={22} /></button>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>{renderA4Page(allPagesInfoPrint[currentPage - 1] || allPagesInfoPrint[0])}<div style={{ background: "var(--bg-panel)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px 20px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>PAGE {Math.min(currentPage, totalPages)} OF {totalPages}</div></div>
                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }} disabled={currentPage >= totalPages} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "50%", border: "none", background: currentPage >= totalPages ? "var(--bg-main)" : "var(--bg-panel)", color: currentPage >= totalPages ? "var(--text-secondary)" : "var(--text-accent)", cursor: currentPage >= totalPages ? "not-allowed" : "pointer", boxShadow: "var(--shadow-md)" }}><ChevronRight size={22} /></button>
              </div>
            ) : allPagesInfoPrint.map((pageInfo, i) => <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>{renderA4Page(pageInfo)}<div style={{ background: "var(--bg-panel)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>PAGE {i + 1} OF {totalPages}</div></div>)}
          </div>
        </div>

        <RightEditPanel selectedEdit={selectedEdit} editPanelState={editPanelState} handleUpdateOverride={handleUpdateOverride} handleResetOverride={handleResetOverride} setSelectedEdit={setSelectedEdit} handleLayerChange={handleLayerChange} template={selectedEditTemplate} />

      </div>

      <div id="pdf-render-container" style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: isPrinting ? 99990 : -1, visibility: isPrinting ? "visible" : "hidden", background: "#fff", overflow: "visible" }}>
        {isPrinting && allPagesInfoPrint.map((pageInfo) => (
          <div key={`pdf-page-${pageInfo.globalIndex}`} style={{ marginBottom: "20px", display: "inline-block" }}>
             {renderA4Page(pageInfo, true)}
          </div>
        ))}
      </div>

    </div>
  );
}