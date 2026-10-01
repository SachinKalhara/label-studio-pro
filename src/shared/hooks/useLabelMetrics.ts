import { useMemo } from "react";
import { useLabelStore } from "../../stores/labelStore";

export function useLabelMetrics() {
  const template = useLabelStore((state) => state.template);

  return useMemo(() => {
    const L_W = template.labelSize.width; 
    const L_H = template.labelSize.height;
    const { width: P_W, height: P_H } = template.page;
    const { top, right, bottom, left } = template.margins;
    const { horizontalGap: G_X, verticalGap: G_Y } = template.grid;

    const U_W = Math.max(0, P_W - left - right); 
    const U_H = Math.max(0, P_H - top - bottom);
    if (L_W === 0 || L_H === 0) return 0;

    let C_pri = 0, R_pri = 0;
    if (L_W <= U_W && L_H <= U_H) { 
      C_pri = Math.floor((U_W + G_X) / (L_W + G_X)); 
      R_pri = Math.floor((U_H + G_Y) / (L_H + G_Y)); 
    }
    let total = C_pri * R_pri;

    if (template.smartFill) {
      const usedW_pri = C_pri > 0 ? C_pri * L_W + (C_pri - 1) * G_X : 0;
      const usedH_pri = R_pri > 0 ? R_pri * L_H + (R_pri - 1) * G_Y : 0;
      const R_W = L_H, R_H = L_W; 
      const botY = R_pri > 0 ? top + usedH_pri + G_Y : top; 
      const botH = Math.max(0, P_H - bottom - botY);
      const rightX = C_pri > 0 ? left + usedW_pri + G_X : left; 
      const rightW = Math.max(0, P_W - right - rightX);

      let optA_count = 0;
      if (R_W <= U_W && R_H <= botH) optA_count += Math.floor((U_W + G_X) / (R_W + G_X)) * Math.floor((botH + G_Y) / (R_H + G_Y));
      if (R_W <= rightW && R_H <= usedH_pri) optA_count += Math.floor((rightW + G_X) / (R_W + G_X)) * Math.floor((usedH_pri + G_Y) / (R_H + G_Y));

      let optB_count = 0;
      if (R_W <= rightW && R_H <= U_H) optB_count += Math.floor((rightW + G_X) / (R_W + G_X)) * Math.floor((U_H + G_Y) / (R_H + G_Y));
      if (R_W <= usedW_pri && R_H <= botH) optB_count += Math.floor((usedW_pri + G_X) / (R_W + G_X)) * Math.floor((botH + G_Y) / (R_H + G_Y));
      
      total += Math.max(optA_count, optB_count);
    }
    return total;
  }, [template]);
}