import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  theme: "light" | "dark" | "system";
  panelPosition: "left" | "right";
  unit: "mm" | "cm";
  decimalPlaces: number;
  defaultLabelWidth: number;
  defaultLabelHeight: number;
  
  setTheme: (theme: "light" | "dark" | "system") => void;
  setPanelPosition: (pos: "left" | "right") => void;
  setUnit: (unit: "mm" | "cm") => void;
  setDecimalPlaces: (places: number) => void;
  setDefaultLabelSize: (width: number, height: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // පෙරනිමි සැකසුම් (Default Values)
      theme: "light",
      panelPosition: "right", // Edit panel එක දකුණේ පෙන්වීමට
      unit: "cm",
      decimalPlaces: 2,
      defaultLabelWidth: 80,
      defaultLabelHeight: 30,

      setTheme: (theme) => set({ theme }),
      setPanelPosition: (panelPosition) => set({ panelPosition }),
      setUnit: (unit) => set({ unit }),
      setDecimalPlaces: (decimalPlaces) => set({ decimalPlaces }),
      setDefaultLabelSize: (defaultLabelWidth, defaultLabelHeight) => 
        set({ defaultLabelWidth, defaultLabelHeight }),
    }),
    {
      name: "label-studio-settings", // LocalStorage එකේ සේව් වන නම
    }
  )
);