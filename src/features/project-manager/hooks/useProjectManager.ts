import { useState, useEffect } from "react";
import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile, readDir, exists, mkdir, remove } from "@tauri-apps/plugin-fs";
import { documentDir, join, dirname } from "@tauri-apps/api/path"; 
import { invoke } from "@tauri-apps/api/core";

import { useExcelStore } from "../../../stores/excelStore";
import { useLabelStore } from "../../../stores/labelStore";
import type { ExcelWorkbook } from "../../../shared/types/excel";

export type AppPage = "data" | "designer" | "preview";

interface WorkspaceProject {
  name: string;
  path: string;
}

export function useProjectManager() {
  const workbook = useExcelStore((state) => state.workbook);
  const setWorkbook = useExcelStore((state) => state.setWorkbook);
  const setProjectName = useExcelStore((state) => state.setProjectName);
  const setSavePath = useExcelStore((state) => state.setSavePath);
  const loadExcelProject = useExcelStore((state) => state.loadProjectData);
  const clearProject = useExcelStore((state) => state.clearProject);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("data");
  const [hasDraft, setHasDraft] = useState(false);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isRecentProjectsModalOpen, setIsRecentProjectsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 

  const [tempProjectName, setTempProjectName] = useState("Untitled Project");
  const [tempExcelPath, setTempExcelPath] = useState<string | null>(null);
  const [tempSavePath, setTempSavePath] = useState<string | null>(null);

  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>([]);
  const [defaultWorkspacePath, setDefaultWorkspacePath] = useState<string>("");

  const [projectType, setProjectType] = useState<string>("excel");
  const [blankRowCount, setBlankRowCount] = useState<number>(50);

  useEffect(() => {
    const draft = localStorage.getItem("label_studio_draft");
    if (draft) setHasDraft(true);

    const setupWorkspace = async () => {
      try {
        const docs = await documentDir();
        const wsPath = await join(docs, "Label Studio Projects");
        setDefaultWorkspacePath(wsPath);
        const folderExists = await exists(wsPath);
        if (!folderExists) await mkdir(wsPath, { recursive: true });
      } catch (e) { console.error("Workspace setup failed", e); }
    };
    setupWorkspace();
  }, []);

  const loadWorkspaceProjects = async () => {
    if (!defaultWorkspacePath) return;
    try {
      const folderExists = await exists(defaultWorkspacePath);
      if (!folderExists) return;
      const entries = await readDir(defaultWorkspacePath);
      const projs = await Promise.all(
        entries.filter(e => e.isFile && e.name.endsWith(".lproj")).map(async e => ({
            name: e.name.replace(".lproj", ""),
            path: await join(defaultWorkspacePath, e.name)
        }))
      );
      setWorkspaceProjects(projs);
    } catch (e) { console.error("Failed to read workspace", e); }
  };

  const handleOpenRecentModal = async () => {
    await loadWorkspaceProjects();
    setIsRecentProjectsModalOpen(true);
  };

  const handleDeleteProject = async (e: React.MouseEvent, path: string, name: string) => {
    e.stopPropagation(); 
    const isConfirmed = await ask(`Are you sure you want to delete the project "${name}"?\nThis action cannot be undone.`, { title: 'Delete Project', kind: 'warning' });
    if (!isConfirmed) return;
    try {
      await remove(path);
      await loadWorkspaceProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Could not delete the project. Error: ${error}`);
    }
  };

  const handleNameChange = async (newName: string) => {
    setTempProjectName(newName);
    if (defaultWorkspacePath) {
      const finalName = newName.trim() === "" ? "Untitled Project" : newName.trim();
      setTempSavePath(await join(defaultWorkspacePath, `${finalName}.lproj`));
    }
  };

  const handleOpenNewProjectModal = async () => {
    setTempProjectName("Untitled Project");
    setTempExcelPath(null);
    if (defaultWorkspacePath) setTempSavePath(await join(defaultWorkspacePath, "Untitled Project.lproj"));
    setIsNewProjectModalOpen(true);
  };

  const handleSelectExcelForNewProject = async () => {
    try {
      const selected = await open({ multiple: false, directory: false, filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }] });
      if (selected === null || Array.isArray(selected)) return;
      setTempExcelPath(selected);
    } catch (error) { console.error(error); }
  };

  const handleSelectSaveLocation = async () => {
    try {
      const path = await save({ title: "Set Project Save Location", defaultPath: tempProjectName ? tempProjectName : "Untitled Project" });
      if (path) {
        const finalPath = path.endsWith(".lproj") ? path : `${path}.lproj`;
        setTempSavePath(finalPath);
      }
    } catch (error) { console.error(error); }
  };

  const handleCreateNewProject = async () => {
    if (!tempExcelPath || !tempSavePath) { alert("Please select both Data Source and a Save Location!"); return; }
    try {
      const isFileExists = await exists(tempSavePath);
      if (isFileExists) { alert(`⚠️ A project named "${tempProjectName}" already exists.`); return; }

      setIsLoading(true);
      const dirPath = await dirname(tempSavePath);
      const dirExists = await exists(dirPath);
      if (!dirExists) await mkdir(dirPath, { recursive: true });

      const result = await invoke<ExcelWorkbook>("read_excel", { filePath: tempExcelPath });
      setWorkbook(result);
      
      const finalProjectName = tempProjectName.trim() === "" ? "Untitled Project" : tempProjectName.trim();
      setProjectName(finalProjectName);
      setSavePath(tempSavePath); 
      
      setCurrentPage("data");
      setIsNewProjectModalOpen(false);
    } catch (error) {
      console.error(error); alert(`Could not read Excel file.\n\n${String(error)}`);
    } finally { setIsLoading(false); }
  };

  // 🔴 Excel Data නොමැතිව (Blank) ප්‍රොජෙක්ට් එක සෑදීම
  const handleCreateBlankProject = async () => {
    if (!tempSavePath) { alert("Please select a Save Location!"); return; }
    try {
      const isFileExists = await exists(tempSavePath);
      if (isFileExists) { alert(`⚠️ A project named "${tempProjectName}" already exists.`); return; }

      setIsLoading(true);
      const dirPath = await dirname(tempSavePath);
      const dirExists = await exists(dirPath);
      if (!dirExists) await mkdir(dirPath, { recursive: true });

      const columns = [
        { id: `col-${Date.now()}-1`, name: "Column 1" },
        { id: `col-${Date.now()}-2`, name: "Column 2" },
        { id: `col-${Date.now()}-3`, name: "Column 3" },
      ];
      
      const rows = Array.from({ length: blankRowCount }).map((_, i) => ({
        id: `row-${Date.now()}-${i}`,
        values: ["", "", ""]
      }));

      // 🔴 මෙතැන fileName සහ filePath අනිවාර්යයෙන්ම ලබා දී ඇත.
      const blankWorkbook: ExcelWorkbook = {
        fileName: "Blank Project",
        filePath: "manual_data",
        sheets: [{ id: `sheet-${Date.now()}`, name: "Manual Data", columns, rows }]
      };

      setWorkbook(blankWorkbook);
      
      const finalProjectName = tempProjectName.trim() === "" ? "Untitled Project" : tempProjectName.trim();
      setProjectName(finalProjectName);
      setSavePath(tempSavePath); 
      
      setCurrentPage("data");
      setIsNewProjectModalOpen(false);
    } catch (error) {
      console.error(error); alert(`Could not create project.\n\n${String(error)}`);
    } finally { setIsLoading(false); }
  };
  
  const handleSaveProject = async () => {
    const excelState = useExcelStore.getState();
    const labelState = useLabelStore.getState();
    if (!excelState.savePath) { alert("Save path is missing! Please re-create the project."); return; }

    const projectData = {
      excel: {
        projectName: excelState.projectName, workbook: excelState.workbook, activeSheetId: excelState.activeSheetId, activeSheet: excelState.activeSheet, originalActiveSheetRows: excelState.originalActiveSheetRows, selectedData: excelState.selectedData,
      },
      sets: labelState.sets, activeSetId: labelState.activeSetId, isDualMode: labelState.isDualMode, isDataLinked: labelState.isDataLinked, activeLabel: labelState.activeLabel,
    };

    try {
      const dirPath = await dirname(excelState.savePath);
      const dirExists = await exists(dirPath);
      if (!dirExists) await mkdir(dirPath, { recursive: true });

      await writeTextFile(excelState.savePath, JSON.stringify(projectData));
      const btn = document.getElementById("save-btn");
      if (btn) { const oldText = btn.innerHTML; btn.innerHTML = "✅ Saved!"; setTimeout(() => btn.innerHTML = oldText, 2000); }
    } catch (error) { console.error("Save error:", error); alert(`Failed to save natively.\nError: ${error}`); }
  };

  const loadProjectFromPath = async (filePath: string) => {
    try {
      const fileContent = await readTextFile(filePath);
      const data = JSON.parse(fileContent);

      if (data.excel) loadExcelProject({ ...data.excel, savePath: filePath });
      if (data.sets) {
        useLabelStore.getState().loadProjectData(data);
      } else if (data.label) {
        const legacySet = { id: "set-1", name: "Loaded Project", isDualMode: data.isDualMode || false, isDataLinked: data.isDataLinked !== false, activeLabel: data.activeLabel || "A", template: data.label, templateB: data.labelB || data.label, pastElements: [], futureElements: [], pastElementsB: [], futureElementsB: [] };
        useLabelStore.getState().loadProjectData({ sets: [legacySet], activeSetId: "set-1" });
      }

      setCurrentPage("data");
      setIsRecentProjectsModalOpen(false);
    } catch (err) { console.error(err); alert("Could not load the project. The file might have been moved or deleted."); await loadWorkspaceProjects(); }
  };

  const handleBrowseComputer = async () => {
    try {
      const selected = await open({ multiple: false, directory: false, filters: [{ name: "Label Project", extensions: ["lproj"] }] });
      if (selected === null || Array.isArray(selected)) return;
      await loadProjectFromPath(selected);
    } catch (err) { console.error(err); }
  };

  const handleGoHome = () => {
    const excelState = useExcelStore.getState(); const labelState = useLabelStore.getState();
    const projectData = {
      excel: { projectName: excelState.projectName, savePath: excelState.savePath, workbook: excelState.workbook, activeSheetId: excelState.activeSheetId, activeSheet: excelState.activeSheet, originalActiveSheetRows: excelState.originalActiveSheetRows, selectedData: excelState.selectedData },
      sets: labelState.sets, activeSetId: labelState.activeSetId, isDualMode: labelState.isDualMode, isDataLinked: labelState.isDataLinked, activeLabel: labelState.activeLabel,
    };
    localStorage.setItem("label_studio_draft", JSON.stringify(projectData));
    setHasDraft(true);
    clearProject();
  };

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem("label_studio_draft");
      if (draft) {
        const data = JSON.parse(draft);
        if (data.excel) loadExcelProject(data.excel);
        if (data.sets) useLabelStore.getState().loadProjectData(data);
        else if (data.label) {
          const legacySet = { id: "set-1", name: "Draft Project", isDualMode: data.isDualMode || false, isDataLinked: data.isDataLinked !== false, activeLabel: data.activeLabel || "A", template: data.label, templateB: data.labelB || data.label, pastElements: [], futureElements: [], pastElementsB: [], futureElementsB: [] };
          useLabelStore.getState().loadProjectData({ sets: [legacySet], activeSetId: "set-1" });
        }
        setCurrentPage("data");
      }
    } catch (err) { alert("Failed to load draft."); }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("label_studio_draft");
    setHasDraft(false);
  };

  return {
    workbook, isLoading, currentPage, setCurrentPage, hasDraft,
    isNewProjectModalOpen, setIsNewProjectModalOpen,
    isRecentProjectsModalOpen, setIsRecentProjectsModalOpen,
    isSettingsModalOpen, setIsSettingsModalOpen,
    tempProjectName, tempExcelPath, tempSavePath, workspaceProjects,
    
    projectType, setProjectType,
    blankRowCount, setBlankRowCount,

    handleOpenRecentModal, handleDeleteProject, handleNameChange,
    handleOpenNewProjectModal, handleSelectExcelForNewProject,
    handleSelectSaveLocation, handleCreateNewProject, handleSaveProject,
    handleCreateBlankProject, 
    loadProjectFromPath, handleBrowseComputer, handleGoHome,
    handleLoadDraft, handleClearDraft
  };
}