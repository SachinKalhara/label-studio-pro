import type { LabelElement } from "../../../shared/types/label";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function enforceBounds(
  el: Partial<LabelElement> & { x: number; y: number; width: number; height: number; rotation?: number }, 
  enforcePadding: boolean, 
  currentPad: number,
  labelWidth: number,
  labelHeight: number
) {
  const P = enforcePadding ? currentPad : 0;
  let newX = el.x; let newY = el.y; let newW = el.width; let newH = el.height;
  const maxW = labelWidth - 2 * P; 
  const maxH = labelHeight - 2 * P;
  const rad = Math.abs(el.rotation || 0) % 360;
  const isVertical = rad === 90 || rad === 270;
  
  if (isVertical) {
    if (newH > maxW) newH = Math.max(5, maxW);
    if (newW > maxH) newW = Math.max(5, maxH);
  } else {
    if (newW > maxW) newW = Math.max(5, maxW);
    if (newH > maxH) newH = Math.max(5, maxH);
  }
  
  const visualWidth = isVertical ? newH : newW;
  const visualHeight = isVertical ? newW : newH;
  
  let minX = P; let minY = P;
  if (rad === 90) minX = P + visualWidth;
  if (rad === 270) minY = P + visualHeight;
  if (rad === 180) { minX = P + visualWidth; minY = P + visualHeight; }
  
  let maxXBound = labelWidth - P - (rad === 90 || rad === 180 ? 0 : visualWidth);
  let maxYBound = labelHeight - P - (rad === 270 || rad === 180 ? 0 : visualHeight);
  maxXBound = Math.max(minX, maxXBound);
  maxYBound = Math.max(minY, maxYBound);
  
  newX = Math.max(minX, Math.min(maxXBound, newX));
  newY = Math.max(minY, Math.min(maxYBound, newY));
  
  return { x: newX, y: newY, width: newW, height: newH };
}