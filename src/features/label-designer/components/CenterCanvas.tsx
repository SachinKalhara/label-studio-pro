import { useMemo, useState, useRef, useEffect, type MouseEvent } from "react";
import { useExcelStore } from "../../../stores/excelStore";
import { useLabelStore } from "../../../stores/labelStore";
import type { LabelElement } from "../../../shared/types/label";
import { renderTextElement } from "../../../utils/labelRenderer";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"; 
import { createId } from "../utils/elementBounds";

const PREVIEW_SCALE = 3.78; 


export default function CenterCanvas() {
  const activeSheet = useExcelStore((state) => state.activeSheet);
  const selectedRowIds = useExcelStore((state) => state.selectedData.selectedRowIds);

  const sets = useLabelStore((state) => state.sets);
  const activeSetId = useLabelStore((state) => state.activeSetId);
  const activeSet = sets ? (sets.find((s) => s.id === activeSetId) || sets[0]) : null;

  // const isDualMode = activeSet?.isDualMode || false;
  const activeLabel = useLabelStore((state) => state.activeLabel);
  const currentTemplate = activeLabel === "A" && activeSet ? activeSet.template : activeSet?.templateB;
  const currentSelectedId = useLabelStore((state) => state.selectedElementId);

  const addElement = useLabelStore((state) => state.addElement);
  const updateElement = useLabelStore((state) => state.updateElement);
  const removeElement = useLabelStore((state) => state.removeElement);
  const selectElement = useLabelStore((state) => state.selectElement);
  const undo = useLabelStore((state) => state.undo);
  const redo = useLabelStore((state) => state.redo);
  const copiedElement = useLabelStore((state) => state.copiedElement);
  const setCopiedElement = useLabelStore((state) => state.setCopiedElement);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number; y: number } | null>(null);
  
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [elementStartSize, setElementStartSize] = useState<{ width: number; height: number; x: number; y: number } | null>(null);

  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotateCenter, setRotateCenter] = useState<{ x: number; y: number } | null>(null);
  
  const [activeSnapLines, setActiveSnapLines] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });

  const [zoom, setZoom] = useState<number>(0.7);
  const [isPanning, setIsPanning] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLabelRef = useRef<HTMLDivElement>(null); 
  
  const panRef = useRef({ active: false, startX: 0, startY: 0, scrollL: 0, scrollT: 0 });

  if (!currentTemplate) return null;

  const selectedElement = useMemo(() => currentTemplate.elements.find((el) => el.id === currentSelectedId) ?? null, [currentTemplate.elements, currentSelectedId]);

  const previewRow = useMemo(() => {
    if (!activeSheet) return null;
    return activeSheet.rows.find((row) => selectedRowIds.includes(row.id)) ?? activeSheet.rows[0] ?? null;
  }, [activeSheet, selectedRowIds]);

  const L_W = currentTemplate.labelSize.width;
  const L_H = currentTemplate.labelSize.height;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeLabelRef.current && scrollRef.current) {
        const activeRect = activeLabelRef.current.getBoundingClientRect();
        const scrollRect = scrollRef.current.getBoundingClientRect();
        
        const targetX = scrollRef.current.scrollLeft + (activeRect.left - scrollRect.left) - (scrollRect.width / 2) + (activeRect.width / 2);
        const targetY = scrollRef.current.scrollTop + (activeRect.top - scrollRect.top) - (scrollRect.height / 2) + (activeRect.height / 2);

        scrollRef.current.scrollTo({ left: targetX, top: targetY, behavior: 'auto' });
      }
    }, 10); 
    return () => clearTimeout(timer);
  }, [zoom]);

  const snapLinesData = useMemo(() => {
    const P = currentTemplate.padding || 0;
    const xLines = [P, L_W / 2, L_W - P, 0, L_W];
    const yLines = [P, L_H - P, 0, L_H];

    let currentY = 0;
    if (currentTemplate.sections && currentTemplate.sections.length > 0) {
      currentTemplate.sections.forEach(sec => {
        currentY += sec.height;
        yLines.push(currentY);
      });
    }
    return { x: xLines, y: yLines };
  }, [L_W, L_H, currentTemplate.padding, currentTemplate.sections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT" || document.activeElement?.hasAttribute("contenteditable")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { if (selectedElement) setCopiedElement(selectedElement); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (copiedElement) {
          const newEl = { ...copiedElement, id: createId(copiedElement.type), x: Math.min(L_W - copiedElement.width, copiedElement.x + 5), y: Math.min(L_H - copiedElement.height, copiedElement.y + 5) };
          addElement(newEl);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (currentSelectedId) removeElement(currentSelectedId); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!selectedElement) return;
        const step = e.shiftKey ? 5 : 0.5;
        let newX = selectedElement.x; let newY = selectedElement.y;
        if (e.key === 'ArrowUp') newY -= step; if (e.key === 'ArrowDown') newY += step;
        if (e.key === 'ArrowLeft') newX -= step; if (e.key === 'ArrowRight') newX += step;
        
        const constrain = selectedElement.constrainToPadding !== false;
        const P = constrain ? currentTemplate.padding : 0; 
        
        const rad = Math.abs(selectedElement.rotation || 0) % 360;
        const isVertical = rad === 90 || rad === 270;
        const visualWidth = isVertical ? selectedElement.height : selectedElement.width;
        const visualHeight = isVertical ? selectedElement.width : selectedElement.height;
        
        let minX = P; let minY = P;
        if (rad === 90) { minX = P + visualWidth; }
        if (rad === 270) { minY = P + visualHeight; }
        if (rad === 180) { minX = P + visualWidth; minY = P + visualHeight; }

        let maxXBound = Math.max(minX, L_W - P - (rad === 90 || rad === 180 ? 0 : visualWidth));
        let maxYBound = Math.max(minY, L_H - P - (rad === 270 || rad === 180 ? 0 : visualHeight));

        newX = Math.max(minX, Math.min(maxXBound, newX));
        newY = Math.max(minY, Math.min(maxYBound, newY));

        updateElement(selectedElement.id, { x: newX, y: newY });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, currentSelectedId, copiedElement, L_W, L_H, currentTemplate.padding, undo, redo, setCopiedElement, addElement, removeElement, updateElement]);

  const layoutPositions = useMemo(() => {
    const { width: P_W, height: P_H } = currentTemplate.page;
    const { top, right, bottom, left } = currentTemplate.margins;
    const { horizontalGap: G_X, verticalGap: G_Y } = currentTemplate.grid;
    const U_W = Math.max(0, P_W - left - right);
    const U_H = Math.max(0, P_H - top - bottom);
    let positions: { x: number; y: number; isRotated: boolean }[] = [];
    if (L_W === 0 || L_H === 0) return positions;

    let C_pri = 0, R_pri = 0;
    if (L_W <= U_W && L_H <= U_H) { C_pri = Math.floor((U_W + G_X) / (L_W + G_X)); R_pri = Math.floor((U_H + G_Y) / (L_H + G_Y)); }
    for (let r = 0; r < R_pri; r++) { for (let c = 0; c < C_pri; c++) positions.push({ x: left + c * (L_W + G_X), y: top + r * (L_H + G_Y), isRotated: false }); }

    if (!currentTemplate.smartFill) return positions;

    const usedW_pri = C_pri > 0 ? C_pri * L_W + (C_pri - 1) * G_X : 0;
    const usedH_pri = R_pri > 0 ? R_pri * L_H + (R_pri - 1) * G_Y : 0;
    const R_W = L_H, R_H = L_W; 
    const botY = R_pri > 0 ? top + usedH_pri + G_Y : top;
    const botH = Math.max(0, P_H - bottom - botY);
    const rightX = C_pri > 0 ? left + usedW_pri + G_X : left;
    const rightW = Math.max(0, P_W - right - rightX);

    let optA: { x: number; y: number; isRotated: boolean }[] = [];
    if (R_W <= U_W && R_H <= botH) {
      let C_bot = Math.floor((U_W + G_X) / (R_W + G_X)); let R_bot = Math.floor((botH + G_Y) / (R_H + G_Y));
      for (let r = 0; r < R_bot; r++) for (let c = 0; c < C_bot; c++) optA.push({ x: left + c * (R_W + G_X), y: botY + r * (R_H + G_Y), isRotated: true });
    }
    if (R_W <= rightW && R_H <= usedH_pri) {
      let C_right = Math.floor((rightW + G_X) / (R_W + G_X)); let R_right = Math.floor((usedH_pri + G_Y) / (R_H + G_Y));
      for (let r = 0; r < R_right; r++) for (let c = 0; c < C_right; c++) optA.push({ x: rightX + c * (R_W + G_X), y: top + r * (R_H + G_Y), isRotated: true });
    }

    let optB: { x: number; y: number; isRotated: boolean }[] = [];
    if (R_W <= rightW && R_H <= U_H) {
      let C_right = Math.floor((rightW + G_X) / (R_W + G_X)); let R_right = Math.floor((U_H + G_Y) / (R_H + G_Y));
      for (let r = 0; r < R_right; r++) for (let c = 0; c < C_right; c++) optB.push({ x: rightX + c * (R_W + G_X), y: top + r * (R_H + G_Y), isRotated: true });
    }
    if (R_W <= usedW_pri && R_H <= botH) {
      let C_bot = Math.floor((usedW_pri + G_X) / (R_W + G_X)); let R_bot = Math.floor((botH + G_Y) / (R_H + G_Y));
      for (let r = 0; r < R_bot; r++) for (let c = 0; c < C_bot; c++) optB.push({ x: left + c * (R_W + G_X), y: botY + r * (R_H + G_Y), isRotated: true });
    }

    return optA.length >= optB.length ? positions.concat(optA) : positions.concat(optB);
  }, [currentTemplate.page, currentTemplate.margins, currentTemplate.labelSize, currentTemplate.grid, currentTemplate.smartFill, L_W, L_H]);

  const handleZoomReset = () => { setZoom(0.7); }; 

  const handlePanStart = (e: MouseEvent<HTMLDivElement>) => { if (scrollRef.current) { panRef.current = { active: true, startX: e.clientX, startY: e.clientY, scrollL: scrollRef.current.scrollLeft, scrollT: scrollRef.current.scrollTop }; setIsPanning(true); selectElement(null); } };
  const handleMouseDown = (event: MouseEvent, element: LabelElement) => { event.stopPropagation(); selectElement(element.id); setDraggingId(element.id); setDragStart({ x: event.clientX, y: event.clientY }); setElementStart({ x: element.x, y: element.y }); };
  
  const handleResizeMouseDown = (event: MouseEvent, element: LabelElement, handle: string) => { 
    event.stopPropagation(); selectElement(element.id); setResizingId(element.id); setResizeHandle(handle);
    setDragStart({ x: event.clientX, y: event.clientY }); setElementStartSize({ width: element.width, height: element.height, x: element.x, y: element.y }); 
  };

  const handleRotateMouseDown = (event: MouseEvent, element: LabelElement) => { event.stopPropagation(); selectElement(element.id); setRotatingId(element.id); const rect = (event.target as HTMLElement).parentElement!.getBoundingClientRect(); setRotateCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }); };

  const handleGlobalMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (panRef.current.active && scrollRef.current) {
      scrollRef.current.scrollLeft = panRef.current.scrollL - (event.clientX - panRef.current.startX);
      scrollRef.current.scrollTop = panRef.current.scrollT - (event.clientY - panRef.current.startY); return;
    }
    if (!dragStart && !rotatingId) return;

    if (rotatingId && rotateCenter) {
      const angleRad = Math.atan2(event.clientY - rotateCenter.y, event.clientX - rotateCenter.x);
      let angleDeg = (angleRad * 180) / Math.PI;
      angleDeg = (angleDeg + 90) % 360; 
      if (angleDeg < 0) angleDeg += 360;
      updateElement(rotatingId, { rotation: Math.round(angleDeg) }); return;
    }

    const dxRaw = (event.clientX - dragStart!.x) / (PREVIEW_SCALE * zoom);
    const dyRaw = (event.clientY - dragStart!.y) / (PREVIEW_SCALE * zoom);

    if (resizingId && elementStartSize && resizeHandle) {
      const el = currentTemplate.elements.find((e) => e.id === resizingId);
      if (!el) return;

      const constrain = el.constrainToPadding !== false;
      const P = constrain ? currentTemplate.padding : 0; 

      const minXBound = P;
      const minYBound = P;
      const maxXBound = L_W - P;
      const maxYBound = L_H - P;

      let newX = elementStartSize.x;
      let newY = elementStartSize.y;
      let newW = elementStartSize.width;
      let newH = elementStartSize.height;

      const minSize = 2; 

      if (resizeHandle.includes('e')) {
        newW = Math.max(minSize, elementStartSize.width + dxRaw);
        if (newX + newW > maxXBound) newW = Math.max(minSize, maxXBound - newX);
      }
      if (resizeHandle.includes('s')) {
        newH = Math.max(minSize, elementStartSize.height + dyRaw);
        if (newY + newH > maxYBound) newH = Math.max(minSize, maxYBound - newY);
      }
      if (resizeHandle.includes('w')) {
        const maxAllowedDx = elementStartSize.x - minXBound;
        const actualDx = Math.max(-maxAllowedDx, Math.min(elementStartSize.width - minSize, dxRaw));
        newX = elementStartSize.x + actualDx;
        newW = elementStartSize.width - actualDx;
      }
      if (resizeHandle.includes('n')) {
        const maxAllowedDy = elementStartSize.y - minYBound;
        const actualDy = Math.max(-maxAllowedDy, Math.min(elementStartSize.height - minSize, dyRaw));
        newY = elementStartSize.y + actualDy;
        newH = elementStartSize.height - actualDy;
      }

      updateElement(resizingId, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (draggingId && elementStart) {
      const draggingElement = currentTemplate.elements.find((element) => element.id === draggingId);
      if (!draggingElement) return;
      
      let newX = elementStart.x + dxRaw; 
      let newY = elementStart.y + dyRaw;
      const w = draggingElement.width;
      const h = draggingElement.height;

      const snapThreshold = 1.5; 
      let snappedXLines: number[] = [];
      let snappedYLines: number[] = [];

      for (const lx of snapLinesData.x) {
        if (Math.abs(newX - lx) < snapThreshold) { newX = lx; snappedXLines.push(lx); break; }
        if (Math.abs((newX + w / 2) - lx) < snapThreshold) { newX = lx - w / 2; snappedXLines.push(lx); break; }
        if (Math.abs((newX + w) - lx) < snapThreshold) { newX = lx - w; snappedXLines.push(lx); break; }
      }
      for (const ly of snapLinesData.y) {
        if (Math.abs(newY - ly) < snapThreshold) { newY = ly; snappedYLines.push(ly); break; }
        if (Math.abs((newY + h / 2) - ly) < snapThreshold) { newY = ly - h / 2; snappedYLines.push(ly); break; }
        if (Math.abs((newY + h) - ly) < snapThreshold) { newY = ly - h; snappedYLines.push(ly); break; }
      }

      const constrain = draggingElement.constrainToPadding !== false;
      const P = constrain ? currentTemplate.padding : 0; 
      
      const rad = Math.abs(draggingElement.rotation || 0) % 360;
      const isVertical = rad === 90 || rad === 270;
      
      const visualWidth = isVertical ? draggingElement.height : draggingElement.width;
      const visualHeight = isVertical ? draggingElement.width : draggingElement.height;

      let minX = P; let minY = P;
      if (rad === 90) minX = P + visualWidth;
      if (rad === 270) minY = P + visualHeight;
      if (rad === 180) { minX = P + visualWidth; minY = P + visualHeight; }

      let maxXBound = Math.max(minX, L_W - P - (rad === 90 || rad === 180 ? 0 : visualWidth));
      let maxYBound = Math.max(minY, L_H - P - (rad === 270 || rad === 180 ? 0 : visualHeight));

      newX = Math.max(minX, Math.min(maxXBound, newX));
      newY = Math.max(minY, Math.min(maxYBound, newY));

      setActiveSnapLines({ x: snappedXLines, y: snappedYLines });
      updateElement(draggingId, { x: newX, y: newY });
    }
  };

  const handleGlobalMouseUp = () => { 
    if (panRef.current.active) { panRef.current.active = false; setIsPanning(false); }
    setDraggingId(null); setResizingId(null); setResizeHandle(null); setRotatingId(null); 
    setActiveSnapLines({ x: [], y: [] });
    setDragStart(null); setElementStart(null); setElementStartSize(null); setRotateCenter(null);
  };

  const activeBorderCSS = currentTemplate.showBorder 
    ? `${currentTemplate.borderWidth * PREVIEW_SCALE}px ${currentTemplate.borderStyle} #000` 
    : `2px dashed ${activeLabel === "A" ? "#2563eb" : "#10b981"}`;
    
  const standardBorderCSS = currentTemplate.showBorder 
    ? `${currentTemplate.borderWidth * PREVIEW_SCALE}px ${currentTemplate.borderStyle} #000` 
    : "1px dashed var(--border-color)";

  return (
    <div style={{ background: "var(--bg-canvas)", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column", height: "820px", position: "relative", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)", border: "1px solid var(--border-color)" }}>
      
      <div style={{ background: "var(--bg-panel)", padding: "12px 15px", borderBottom: "1px solid var(--border-color)", zIndex: 100, display: "flex", justifyContent: "center", gap: "12px", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", fontWeight: 600, transition: "0.2s" }}><ZoomOut size={16} /> Zoom Out</button>
        <strong style={{ minWidth: "60px", textAlign: "center", fontSize: "15px", color: "var(--text-primary)" }}>{Math.round(zoom * 100)}%</strong>
        <button type="button" onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--btn-bg)", color: "var(--text-primary)", fontWeight: 600, transition: "0.2s" }}><ZoomIn size={16} /> Zoom In</button>
        <div style={{ width: "1px", height: "20px", background: "var(--border-color)", margin: "0 5px" }} />
        <button type="button" onClick={handleZoomReset} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "6px 14px", borderRadius: "6px", border: "none", background: "var(--bg-hover)", color: "var(--text-primary)", fontWeight: 600, transition: "0.2s" }}><RotateCcw size={16} /> Reset</button>
      </div>

      <div ref={scrollRef} onMouseDown={handlePanStart} onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp} onMouseLeave={handleGlobalMouseUp} style={{ flex: 1, overflow: "auto", position: "relative", cursor: isPanning ? "grabbing" : (zoom > 1 ? "grab" : "default") }}>
        
        <div style={{ display: "flex", minWidth: "100%", minHeight: "100%", width: "max-content", height: "max-content", padding: "100px", boxSizing: "border-box" }}>
          
          <div style={{ width: currentTemplate.page.width * PREVIEW_SCALE * zoom, height: currentTemplate.page.height * PREVIEW_SCALE * zoom, position: "relative", flexShrink: 0, margin: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", background: "#ffffff" }}>
            <div style={{ width: currentTemplate.page.width * PREVIEW_SCALE, height: currentTemplate.page.height * PREVIEW_SCALE, transform: `scale(${zoom})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>
              
              {layoutPositions.map((pos, index) => {
                const boxW = pos.isRotated ? L_H : L_W;
                const boxH = pos.isRotated ? L_W : L_H;
                const isEditing = index === 0;
                const activeBoxShadow = isEditing ? `0 0 0 2px ${activeLabel === "A" ? "#2563eb" : "#10b981"}, 0 4px 16px rgba(0,0,0,0.12)` : "none";

                return (
                  <div 
                    key={`label-${index}`} 
                    ref={isEditing ? activeLabelRef : null} 
                    style={{ position: "absolute", left: pos.x * PREVIEW_SCALE, top: pos.y * PREVIEW_SCALE, width: boxW * PREVIEW_SCALE, height: boxH * PREVIEW_SCALE, boxSizing: "border-box", pointerEvents: isEditing ? "auto" : "none", zIndex: isEditing ? 10 : 1 }}
                  >
                    
                    <div style={{ 
                      position: "absolute", width: L_W * PREVIEW_SCALE, height: L_H * PREVIEW_SCALE, 
                      transform: pos.isRotated ? "rotate(90deg)" : "none", transformOrigin: "top left", 
                      left: pos.isRotated ? L_H * PREVIEW_SCALE : 0, top: 0, 
                      boxShadow: activeBoxShadow, boxSizing: "border-box",
                      background: isEditing ? (currentTemplate.backgroundColor || "#ffffff") : "#ffffff",
                      overflow: "hidden", display: "flex", flexDirection: "column"
                    }}>
                      
                      {isEditing && currentTemplate.sections && currentTemplate.sections.length > 0 && (
                        currentTemplate.sections.map((sec, sIndex) => (
                          <div key={sec.id} style={{ width: "100%", height: sec.height * PREVIEW_SCALE, backgroundColor: sec.color, flexShrink: 0, borderTop: (sec.showTopBorder ?? (sIndex > 0)) ? `${currentTemplate.sectionBorderWidth ?? 1}px solid ${sec.borderColor || "#000000"}` : "none", boxSizing: "border-box" }} />
                        ))
                      )}

                      <div style={{ position: "absolute", inset: 0, border: isEditing ? activeBorderCSS : standardBorderCSS, pointerEvents: "none", boxSizing: "border-box", zIndex: 20 }} />

                      {isEditing && activeSnapLines.x.map((xVal, xi) => (
                        <div key={`snap-x-${xi}`} style={{ position: "absolute", left: xVal * PREVIEW_SCALE, top: 0, bottom: 0, width: "1px", background: "#ec4899", zIndex: 30, pointerEvents: "none" }} />
                      ))}
                      {isEditing && activeSnapLines.y.map((yVal, yi) => (
                        <div key={`snap-y-${yi}`} style={{ position: "absolute", top: yVal * PREVIEW_SCALE, left: 0, right: 0, height: "1px", background: "#ec4899", zIndex: 30, pointerEvents: "none" }} />
                      ))}

                      {isEditing && currentTemplate.elements.map((element) => {
                        const selected = element.id === currentSelectedId;
                        const eLeft = element.x * PREVIEW_SCALE;
                        const eTop = element.y * PREVIEW_SCALE;
                        const fieldValue = previewRow && activeSheet ? String(previewRow.values[activeSheet.columns.findIndex((col) => col.name === element.field)] || element.field || "123456") : element.field || "123456";

                        return (
                          <div
                            key={element.id}
                            onMouseDown={(event) => handleMouseDown(event, element)}
                            style={{
                              position: "absolute", left: eLeft, top: eTop, width: element.width * PREVIEW_SCALE, height: element.height * PREVIEW_SCALE,
                              border: selected ? "2px solid #2563eb" : "1px solid transparent", 
                              backgroundColor: (element.type === "text" || element.type === "line") && element.backgroundColor && element.backgroundColor !== "transparent" ? element.backgroundColor : "transparent",
                              boxSizing: "border-box", cursor: draggingId === element.id ? "grabbing" : "grab", display: "flex", alignItems: "center",
                              justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
                              overflow: "visible", transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined, transformOrigin: "top left", zIndex: 10
                            }}
                          >
                            {selected && <div style={{ position: 'absolute', inset: 0, backgroundColor: "rgba(37,99,235,0.08)", pointerEvents: "none" }} />}

                            <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start", position: "relative", zIndex: 1 }}>
                              {element.type === "barcode" ? (
                                // 🔴 Barcode Alignment Fixed Here
                                <div style={{ 
                                  transform: `scale(${Math.min(1, (element.width * PREVIEW_SCALE) / 150)})`, 
                                  transformOrigin: element.textAlign === "center" ? "center center" : element.textAlign === "right" ? "right center" : "left center",
                                  display: "flex",
                                  justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
                                  width: "100%"
                                }}>
                                  <Barcode value={fieldValue} width={1.5} height={element.height * PREVIEW_SCALE * 0.6} fontSize={12} margin={0} displayValue={true} background="transparent" />
                                </div>
                              ) : element.type === "qrcode" ? (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "2px" }}>
                                  <QRCodeSVG value={fieldValue} width="100%" height="100%" style={{ display: "block" }} />
                                </div>
                              ) : element.type === "image" ? (
                                <img src={element.src} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} draggable={false} />
                              ) : element.type === "line" ? (
                                <div style={{ width: "100%", height: "100%" }} />
                              ) : (
                                <div style={{ width: "100%", padding: "2px", boxSizing: "border-box", fontSize: `${element.fontSize ?? 12}pt`, fontFamily: element.fontFamily ?? "Arial", fontWeight: element.fontWeight ?? "normal", fontStyle: element.fontStyle ?? "normal", textDecoration: element.textDecoration ?? "none", textDecorationStyle: (element.textDecorationStyle as any) ?? "solid", color: element.color ?? "#000000", textAlign: element.textAlign ?? "left", wordBreak: "break-word" }}>
                                  {renderTextElement(element, previewRow!, activeSheet!.columns)}
                                </div>
                              )}
                            </div>
                            
                            {selected && (
                              <>
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'nw')} style={{ position: "absolute", top: -5, left: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "nwse-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'n')}  style={{ position: "absolute", top: -5, left: "50%", marginLeft: -4, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "ns-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'ne')} style={{ position: "absolute", top: -5, right: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "nesw-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'e')}  style={{ position: "absolute", top: "50%", marginTop: -4, right: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "ew-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'se')} style={{ position: "absolute", bottom: -5, right: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "nwse-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 's')}  style={{ position: "absolute", bottom: -5, left: "50%", marginLeft: -4, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "ns-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'sw')} style={{ position: "absolute", bottom: -5, left: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "nesw-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleResizeMouseDown(e, element, 'w')}  style={{ position: "absolute", top: "50%", marginTop: -4, left: -5, width: "8px", height: "8px", background: "#2563eb", border: "1px solid #fff", cursor: "ew-resize", zIndex: 20 }} />
                                <div onMouseDown={(e) => handleRotateMouseDown(e, element)} title="Drag to rotate" style={{ position: "absolute", top: -20, left: "50%", marginLeft: -6, width: "12px", height: "12px", background: "#10b981", border: "2px solid #ffffff", cursor: "crosshair", borderRadius: "50%", zIndex: 20 }} />
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
        </div>
      </div>
    </div>
  );
}