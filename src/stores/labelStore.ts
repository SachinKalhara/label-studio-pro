import { create } from "zustand";
import type { LabelElement, LabelTemplate, LabelSection } from "../shared/types/label";
import { useExcelStore } from "./excelStore";
import { useSettingsStore } from "./settingsStore";

const getInitialTemplate = (): LabelTemplate => {
  const settings = useSettingsStore.getState();
  
  return {
    id: `template-A-${Date.now()}`,
    name: "Custom A4 Label",
    page: { name: "A4", width: 210, height: 297, unit: "mm" },
    margins: { top: 4, right: 3, bottom: 3, left: 4 },
    grid: { rows: 1, columns: 1, horizontalGap: 0.5, verticalGap: 0.5 },
    labelSize: { width: settings.defaultLabelWidth, height: settings.defaultLabelHeight },
    showBorder: true,
    borderWidth: 1,
    borderStyle: "solid",
    orientation: "landscape",
    smartFill: true,
    padding: 2,
    backgroundColor: "#ffffff",
    elements: [],
    sections: [],
    sectionBorderWidth: 1,
  };
};

const getInitialTemplateB = (): LabelTemplate => {
  const t = getInitialTemplate();
  return {
    ...t,
    id: `template-B-${Date.now()}`,
    name: "Secondary Label",
  };
};

export interface LabelSet {
  id: string;
  name: string;
  isDualMode: boolean;
  isDataLinked: boolean;
  activeLabel: "A" | "B";
  template: LabelTemplate;
  templateB: LabelTemplate;
  pastElements: LabelElement[][];
  futureElements: LabelElement[][];
  pastElementsB: LabelElement[][];
  futureElementsB: LabelElement[][];
}

const createNewSet = (id: string, name: string): LabelSet => ({
  id,
  name,
  isDualMode: false,
  isDataLinked: true,
  activeLabel: "A",
  template: getInitialTemplate(),
  templateB: getInitialTemplateB(),
  pastElements: [],
  futureElements: [],
  pastElementsB: [],
  futureElementsB: [],
});

interface LabelStore {
  sets: LabelSet[];
  activeSetId: string;
  
  isDualMode: boolean;
  isDataLinked: boolean;
  activeLabel: "A" | "B";
  template: LabelTemplate;
  templateB: LabelTemplate;
  selectedElementId: string | null;
  pastElements: LabelElement[][];
  futureElements: LabelElement[][];
  pastElementsB: LabelElement[][];
  futureElementsB: LabelElement[][];
  overrides: Record<string, Record<string, string>>;
  copiedElement: LabelElement | null;
  
  refreshKey: number;

  loadProjectData: (data: any) => void;
  resetProject: () => void;

  addSet: () => void;
  removeSet: (setId: string) => void;
  setActiveSet: (setId: string) => void;
  renameActiveSet: (name: string) => void;

  setIsDualMode: (val: boolean) => void;
  setIsDataLinked: (val: boolean) => void;
  setActiveLabel: (label: "A" | "B") => void;

  setTemplate: (template: LabelTemplate) => void;
  setTemplateB: (template: LabelTemplate) => void;
  
  setPage: (page: Partial<LabelTemplate["page"]>) => void;
  updatePageSize: (width: number, height: number) => void; 
  setMargins: (margins: Partial<LabelTemplate["margins"]>) => void;
  setOrientation: (orientation: "landscape" | "portrait") => void;

  setLabelSize: (size: Partial<LabelTemplate["labelSize"]>) => void;
  setShowBorder: (show: boolean) => void;
  setBorderSettings: (width: number, style: "solid" | "dashed" | "dotted") => void;
  setSmartFill: (smartFill: boolean) => void;
  setPadding: (padding: number) => void;
  setGrid: (grid: Partial<LabelTemplate["grid"]>) => void;
  
  setLabelBackgroundColor: (color: string) => void;

  setSections: (sections: LabelSection[]) => void;
  updateSection: (sectionId: string, updates: Partial<LabelSection>) => void;
  setSectionBorderWidth: (width: number) => void;

  addElement: (element: LabelElement) => void;
  addStaticTextElement: (text: string) => void;
  updateElement: (elementId: string, updates: Partial<LabelElement>) => void;
  removeElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  clearElements: () => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;
  undo: () => void;
  redo: () => void;
  setCopiedElement: (element: LabelElement) => void;

  setOverride: (rowId: string, elementId: string, value: string) => void;
  clearOverrides: () => void;
}

const enforceBoundaries = (elements: LabelElement[], labelWidth: number, labelHeight: number, padding: number) => {
  const MAX_X = labelWidth - padding;
  const MAX_Y = labelHeight - padding;
  return elements.map((el) => {
    let newX = Math.max(padding, el.x);
    let newY = Math.max(padding, el.y);
    if (newX >= MAX_X) newX = Math.max(padding, MAX_X - 5);
    if (newY >= MAX_Y) newY = Math.max(padding, MAX_Y - 5);
    return { ...el, x: newX, y: newY, width: Math.max(1, Math.min(el.width, MAX_X - newX)), height: Math.max(1, Math.min(el.height, MAX_Y - newY)) };
  });
};

const syncState = (state: LabelStore, partial: Partial<LabelStore>): LabelStore => {
  const updated = { ...state, ...partial } as LabelStore;
  const currentSetIdx = updated.sets.findIndex((s) => s.id === updated.activeSetId);
  if (currentSetIdx !== -1) {
    const newSets = [...updated.sets];
    const tA = JSON.parse(JSON.stringify(updated.template));
    const tB = JSON.parse(JSON.stringify(updated.templateB));
    
    newSets[currentSetIdx] = {
      ...newSets[currentSetIdx],
      isDualMode: updated.isDualMode,
      isDataLinked: updated.isDataLinked,
      activeLabel: updated.activeLabel,
      template: tA,
      templateB: tB,
      pastElements: updated.pastElements,
      futureElements: updated.futureElements,
      pastElementsB: updated.pastElementsB,
      futureElementsB: updated.futureElementsB,
    };
    updated.sets = newSets;
  }
  return updated;
};

const defaultT = getInitialTemplate();
const defaultTB = getInitialTemplateB();

const initialSet = {
  id: "set-1",
  name: "Label Set 1",
  isDualMode: false,
  isDataLinked: true,
  activeLabel: "A" as const,
  template: defaultT,
  templateB: defaultTB,
  pastElements: [],
  futureElements: [],
  pastElementsB: [],
  futureElementsB: [],
};

export const useLabelStore = create<LabelStore>((set) => ({
  sets: [initialSet],
  activeSetId: "set-1",
  isDualMode: false,
  isDataLinked: true,
  activeLabel: "A",

  template: initialSet.template,
  templateB: initialSet.templateB,
  selectedElementId: null,
  pastElements: [],
  futureElements: [],
  pastElementsB: [],
  futureElementsB: [],
  overrides: {},
  copiedElement: null,
  
  refreshKey: 0, 

  resetProject: () => set(() => {
    const newId = `set-${Date.now()}`;
    const newSet = createNewSet(newId, "Label Set 1");
    
    return {
      sets: [newSet],
      activeSetId: newId,
      isDualMode: false,
      isDataLinked: true,
      activeLabel: "A",
      template: JSON.parse(JSON.stringify(newSet.template)),
      templateB: JSON.parse(JSON.stringify(newSet.templateB)),
      pastElements: [],
      futureElements: [],
      pastElementsB: [],
      futureElementsB: [],
      selectedElementId: null,
      overrides: {},
      copiedElement: null,
      refreshKey: Date.now()
    };
  }),

  loadProjectData: (data: any) => set((state) => {
    try {
      let rawSets: any[] = [];
      let newActiveId = "";
      
      const currentDefault = getInitialTemplate();
      const currentDefaultB = getInitialTemplateB();

      if (data && data.sets && Array.isArray(data.sets)) {
        rawSets = data.sets;
        newActiveId = data.activeSetId || rawSets[0]?.id;
      } else if (data && data.template) {
        rawSets = [{
          id: `legacy-set-${Date.now()}`,
          name: data.name || "Loaded Project",
          isDualMode: data.isDualMode || false,
          isDataLinked: data.isDataLinked !== false,
          activeLabel: data.activeLabel || "A",
          template: data.template,
          templateB: data.templateB || data.template,
        }];
        newActiveId = rawSets[0].id;
      } else if (Array.isArray(data)) {
        rawSets = [{
          id: `array-set-${Date.now()}`,
          name: "Array Project",
          isDualMode: false,
          isDataLinked: true,
          activeLabel: "A",
          template: { ...currentDefault, elements: data },
          templateB: { ...currentDefaultB, elements: [] },
        }];
        newActiveId = rawSets[0].id;
      } else {
        return state;
      }

      if (data.selectedRowIds || data.selectedColumnIds) {
        useExcelStore.setState((excelState) => ({
          selectedData: {
            ...excelState.selectedData,
            selectedRowIds: data.selectedRowIds || excelState.selectedData.selectedRowIds,
            selectedColumnIds: data.selectedColumnIds || excelState.selectedData.selectedColumnIds,
          }
        }));
      }

      const safeSets = rawSets.map(s => {
        const tA = s.template || {};
        const tB = s.templateB || {};
        return {
          id: s.id || `set-${Date.now()}-${Math.random()}`,
          name: s.name || "Loaded Set",
          isDualMode: Boolean(s.isDualMode),
          isDataLinked: s.isDataLinked !== false,
          activeLabel: s.activeLabel || "A",
          template: {
            ...currentDefault, ...tA,
            page: { ...currentDefault.page, ...(tA.page || {}) },
            margins: { ...currentDefault.margins, ...(tA.margins || {}) },
            grid: { ...currentDefault.grid, ...(tA.grid || {}) },
            labelSize: { ...currentDefault.labelSize, ...(tA.labelSize || {}) },
            elements: Array.isArray(tA.elements) ? [...tA.elements] : [],
            sections: Array.isArray(tA.sections) ? [...tA.sections] : [],
            sectionBorderWidth: tA.sectionBorderWidth ?? 1,
          },
          templateB: {
            ...currentDefaultB, ...tB,
            page: { ...currentDefaultB.page, ...(tB.page || {}) },
            margins: { ...currentDefaultB.margins, ...(tB.margins || {}) },
            grid: { ...currentDefaultB.grid, ...(tB.grid || {}) },
            labelSize: { ...currentDefaultB.labelSize, ...(tB.labelSize || {}) },
            elements: Array.isArray(tB.elements) ? [...tB.elements] : [],
            sections: Array.isArray(tB.sections) ? [...tB.sections] : [],
            sectionBorderWidth: tB.sectionBorderWidth ?? 1,
          },
          pastElements: [], futureElements: [], pastElementsB: [], futureElementsB: [],
        };
      });

      const activeData = safeSets.find(s => s.id === newActiveId) || safeSets[0];

      return {
        sets: safeSets,
        activeSetId: activeData.id,
        isDualMode: activeData.isDualMode,
        isDataLinked: activeData.isDataLinked,
        activeLabel: activeData.activeLabel,
        template: JSON.parse(JSON.stringify(activeData.template)),
        templateB: JSON.parse(JSON.stringify(activeData.templateB)),
        pastElements: [], futureElements: [], pastElementsB: [], futureElementsB: [],
        selectedElementId: null,
        overrides: {},
        copiedElement: null,
        refreshKey: Date.now()
      };

    } catch (error) {
      console.error("❌ Crash during load:", error);
      return state;
    }
  }),

  addSet: () => set((state) => {
    const newId = `set-${Date.now()}`;
    const newName = `Label Set ${state.sets.length + 1}`;
    const newSet = createNewSet(newId, newName);
    
    return { 
      sets: [...state.sets, newSet], 
      activeSetId: newId, 
      isDualMode: newSet.isDualMode, 
      isDataLinked: newSet.isDataLinked, 
      activeLabel: "A", 
      template: JSON.parse(JSON.stringify(newSet.template)), 
      templateB: JSON.parse(JSON.stringify(newSet.templateB)), 
      pastElements: [], 
      futureElements: [], 
      pastElementsB: [], 
      futureElementsB: [], 
      selectedElementId: null, 
      refreshKey: Date.now() 
    };
  }),

  removeSet: (setId) => set((state) => {
    if (state.sets.length <= 1) return state;
    const newSets = state.sets.filter((s) => s.id !== setId);
    const newActive = state.activeSetId === setId ? newSets[newSets.length - 1] : (state.sets.find((s) => s.id === state.activeSetId) || newSets[0]);
    return { sets: newSets, activeSetId: newActive.id, isDualMode: newActive.isDualMode, isDataLinked: newActive.isDataLinked, activeLabel: newActive.activeLabel || "A", template: newActive.template, templateB: newActive.templateB, pastElements: newActive.pastElements, futureElements: newActive.futureElements, pastElementsB: newActive.pastElementsB, futureElementsB: newActive.futureElementsB, selectedElementId: null };
  }),

  setActiveSet: (setId) => set((state) => {
    const target = state.sets.find((s) => s.id === setId);
    if (!target) return state;
    return { 
      activeSetId: setId, 
      isDualMode: target.isDualMode, 
      isDataLinked: target.isDataLinked, 
      activeLabel: target.activeLabel || "A", 
      template: JSON.parse(JSON.stringify(target.template)), 
      templateB: JSON.parse(JSON.stringify(target.templateB)), 
      pastElements: target.pastElements, 
      futureElements: target.futureElements, 
      pastElementsB: target.pastElementsB, 
      futureElementsB: target.futureElementsB, 
      selectedElementId: null,
      refreshKey: Date.now()
    };
  }),

  renameActiveSet: (name) => set((state) => {
    const newSets = state.sets.map((s) => s.id === state.activeSetId ? { ...s, name } : s);
    return { sets: newSets };
  }),

  setIsDualMode: (val) => set((state) => syncState(state, { isDualMode: val })),
  setIsDataLinked: (val) => set((state) => syncState(state, { isDataLinked: val })),
  setActiveLabel: (label) => set((state) => syncState(state, { activeLabel: label, selectedElementId: null })),

  setTemplate: (template) => set((state) => {
    const preservedElements = state.template.elements || [];
    return syncState(state, { template: { ...template, elements: preservedElements }, selectedElementId: null });
  }),
  setTemplateB: (templateB) => set((state) => {
    const preservedElements = state.templateB.elements || [];
    return syncState(state, { templateB: { ...templateB, elements: preservedElements }, selectedElementId: null });
  }),

  setPage: (page) => set((state) => syncState(state, { template: { ...state.template, page: { ...state.template.page, ...page } }, templateB: { ...state.templateB, page: { ...state.templateB.page, ...page } } })),
  
  updatePageSize: (width, height) => set((state) => {
    return syncState(state, {
      template: { ...state.template, page: { ...state.template.page, width, height } },
      templateB: { ...state.templateB, page: { ...state.templateB.page, width, height } }
    });
  }),
  
  setMargins: (margins) => set((state) => syncState(state, { template: { ...state.template, margins: { ...state.template.margins, ...margins } }, templateB: { ...state.templateB, margins: { ...state.templateB.margins, ...margins } } })),
  setOrientation: (orientation) => set((state) => syncState(state, { template: { ...state.template, orientation }, templateB: { ...state.templateB, orientation } })),

  setLabelSize: (size) => set((state) => {
    const isA = state.activeLabel === "A"; const t = isA ? state.template : state.templateB;
    const newSize = { ...t.labelSize, ...size };
    const updatedElements = enforceBoundaries(t.elements, newSize.width, newSize.height, t.padding);
    if (isA) return syncState(state, { template: { ...t, labelSize: newSize, elements: updatedElements } });
    return syncState(state, { templateB: { ...t, labelSize: newSize, elements: updatedElements } });
  }),

  setShowBorder: (showBorder) => set((state) => state.activeLabel === "A" ? syncState(state, { template: { ...state.template, showBorder } }) : syncState(state, { templateB: { ...state.templateB, showBorder } })),
  setBorderSettings: (borderWidth, borderStyle) => set((state) => state.activeLabel === "A" ? syncState(state, { template: { ...state.template, borderWidth, borderStyle } }) : syncState(state, { templateB: { ...state.templateB, borderWidth, borderStyle } })),
  setSmartFill: (smartFill) => set((state) => state.activeLabel === "A" ? syncState(state, { template: { ...state.template, smartFill } }) : syncState(state, { templateB: { ...state.templateB, smartFill } })),

  setPadding: (padding) => set((state) => {
    const isA = state.activeLabel === "A"; const t = isA ? state.template : state.templateB;
    const updatedElements = enforceBoundaries(t.elements, t.labelSize.width, t.labelSize.height, padding);
    if (isA) return syncState(state, { template: { ...t, padding, elements: updatedElements } });
    return syncState(state, { templateB: { ...t, padding, elements: updatedElements } });
  }),

  setGrid: (grid) => set((state) => state.activeLabel === "A" ? syncState(state, { template: { ...state.template, grid: { ...state.template.grid, ...grid } } }) : syncState(state, { templateB: { ...state.templateB, grid: { ...state.templateB.grid, ...grid } } })),

  setLabelBackgroundColor: (color) => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { template: { ...state.template, backgroundColor: color } });
    return syncState(state, { templateB: { ...state.templateB, backgroundColor: color } });
  }),

  setSections: (sections) => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { template: { ...state.template, sections } });
    return syncState(state, { templateB: { ...state.templateB, sections } });
  }),

  updateSection: (sectionId, updates) => set((state) => {
    const isA = state.activeLabel === "A";
    const t = isA ? state.template : state.templateB;
    const newSections = (t.sections || []).map(s => s.id === sectionId ? { ...s, ...updates } : s);
    if (isA) return syncState(state, { template: { ...t, sections: newSections } });
    return syncState(state, { templateB: { ...t, sections: newSections } });
  }),

  setSectionBorderWidth: (width) => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { template: { ...state.template, sectionBorderWidth: width } });
    return syncState(state, { templateB: { ...state.templateB, sectionBorderWidth: width } });
  }),

  addElement: (element) => set((state) => {
    const isA = state.activeLabel === "A";
    
    // 🔴 Default Center Alignment එකතු කිරීම
    const newElement = {
      ...element,
      textAlign: (element.type === 'text' || element.type === 'barcode' || element.type === 'qrcode') 
                 ? (element.textAlign || "center") 
                 : element.textAlign
    };

    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements: [...state.template.elements, newElement] }, selectedElementId: newElement.id });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements: [...state.templateB.elements, newElement] }, selectedElementId: newElement.id });
  }),

  addStaticTextElement: (text: string) => set((state) => {
    const isA = state.activeLabel === "A";
    const t = isA ? state.template : state.templateB;
    
    const newElement: any = {
      id: `static-text-${Date.now()}`,
      type: 'text', 
      isStatic: true, 
      text: text, 
      x: t.padding || 5,
      y: t.padding || 5,
      width: Math.min(120, (t.labelSize?.width || 90) - 10),
      height: 15,
      fontSize: 12,
      fontFamily: "Arial",
      color: "#000000",
      fontWeight: "bold",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center" // 🔴 මෙහිද Default Center ඇත
    };
  
    if (isA) {
      return syncState(state, {
        pastElements: [...state.pastElements, state.template.elements],
        futureElements: [],
        template: { ...state.template, elements: [...state.template.elements, newElement] },
        selectedElementId: newElement.id
      });
    } else {
      return syncState(state, {
        pastElementsB: [...state.pastElementsB, state.templateB.elements],
        futureElementsB: [],
        templateB: { ...state.templateB, elements: [...state.templateB.elements, newElement] },
        selectedElementId: newElement.id
      });
    }
  }),

  updateElement: (elementId, updates) => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements: state.template.elements.map((el) => el.id === elementId ? { ...el, ...updates } : el) } });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements: state.templateB.elements.map((el) => el.id === elementId ? { ...el, ...updates } : el) } });
  }),

  removeElement: (elementId) => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements: state.template.elements.filter((el) => el.id !== elementId) }, selectedElementId: null });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements: state.templateB.elements.filter((el) => el.id !== elementId) }, selectedElementId: null });
  }),

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  clearElements: () => set((state) => {
    const isA = state.activeLabel === "A";
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements: [] }, selectedElementId: null });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements: [] }, selectedElementId: null });
  }),

  bringForward: (elementId) => set((state) => {
    const isA = state.activeLabel === "A"; const elements = isA ? [...state.template.elements] : [...state.templateB.elements];
    const index = elements.findIndex((e) => e.id === elementId);
    if (index === -1 || index === elements.length - 1) return state;
    [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements } });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements } });
  }),

  sendBackward: (elementId) => set((state) => {
    const isA = state.activeLabel === "A"; const elements = isA ? [...state.template.elements] : [...state.templateB.elements];
    const index = elements.findIndex((e) => e.id === elementId);
    if (index <= 0) return state;
    [elements[index - 1], elements[index]] = [elements[index], elements[index - 1]];
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: [], template: { ...state.template, elements } });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: [], templateB: { ...state.templateB, elements } });
  }),

  undo: () => set((state) => {
    const isA = state.activeLabel === "A"; const past = isA ? state.pastElements : state.pastElementsB;
    if (past.length === 0) return state;
    const previous = past[past.length - 1];
    if (isA) return syncState(state, { pastElements: past.slice(0, -1), futureElements: [state.template.elements, ...state.futureElements], template: { ...state.template, elements: previous } });
    return syncState(state, { pastElementsB: past.slice(0, -1), futureElementsB: [state.templateB.elements, ...state.futureElementsB], templateB: { ...state.templateB, elements: previous } });
  }),

  redo: () => set((state) => {
    const isA = state.activeLabel === "A"; const future = isA ? state.futureElements : state.futureElementsB;
    if (future.length === 0) return state;
    const next = future[0];
    if (isA) return syncState(state, { pastElements: [...state.pastElements, state.template.elements], futureElements: future.slice(1), template: { ...state.template, elements: next } });
    return syncState(state, { pastElementsB: [...state.pastElementsB, state.templateB.elements], futureElementsB: future.slice(1), templateB: { ...state.templateB, elements: next } });
  }),

  setCopiedElement: (element) => set({ copiedElement: element }),
  setOverride: (rowId, elementId, value) => set((state) => {
    const rowOverrides = state.overrides[rowId] || {};
    return { overrides: { ...state.overrides, [rowId]: { ...rowOverrides, [elementId]: value } } };
  }),
  clearOverrides: () => set({ overrides: {} }),
}));