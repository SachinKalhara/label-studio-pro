import { useEffect } from "react";
import { useSettingsStore } from "./stores/settingsStore"; 

// 🎨 STYLES & COMPONENTS
import { ThemeStyles } from "./shared/styles/ThemeStyles";
import SettingsModal from "./shared/components/SettingsModal";
import NewProjectModal from "./features/project-manager/components/NewProjectModal";
import OpenProjectModal from "./features/project-manager/components/OpenProjectModal";
import TopNavBar from "./shared/components/TopNavBar";
import WelcomeScreen from "./features/project-manager/components/WelcomeScreen"; 

// 🟢 MAIN PAGES
import ExcelTable from "./features/excel-data/components/ExcelTable";
import LabelDesigner from "./features/label-designer/components/LabelDesigner";
import LabelPreview from "./features/label-preview/components/LabelPreview";

// 🪝 CUSTOM HOOK
import { useProjectManager } from "./features/project-manager/hooks/useProjectManager";

function App() {
  const settings = useSettingsStore();
  
  const {
    workbook,
    isLoading,
    currentPage,
    setCurrentPage,
    hasDraft,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    isRecentProjectsModalOpen,
    setIsRecentProjectsModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    tempProjectName,
    tempExcelPath,
    tempSavePath,
    workspaceProjects,
    
    // 🔴 Blank Project සඳහා අලුතින් එක්කළ States
    projectType,
    setProjectType,
    blankRowCount,
    setBlankRowCount,

    handleOpenRecentModal,
    handleDeleteProject,
    handleNameChange,
    handleOpenNewProjectModal,
    handleSelectExcelForNewProject,
    handleSelectSaveLocation,
    handleCreateNewProject,
    handleCreateBlankProject, // 🔴 මෙය අනිවාර්යයෙන්ම ලබාගත යුතුයි
    handleSaveProject,
    loadProjectFromPath,
    handleBrowseComputer,
    handleGoHome,
    handleLoadDraft,
    handleClearDraft
  } = useProjectManager();

  // 🌙 DYNAMIC THEME ENGINE
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (themeStr: string) => {
      if (themeStr === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", systemPrefersDark ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", themeStr);
      }
    };
    applyTheme(settings.theme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => { if (settings.theme === "system") applyTheme("system"); };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [settings.theme]);

  return (
    <>
      <ThemeStyles />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-primary)", fontFamily: "Inter, Arial, Helvetica, sans-serif", display: "flex", flexDirection: "column", transition: "var(--theme-transition)" }}>
        
        {/* MODALS */}
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
        
        <NewProjectModal 
          isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)}
          tempProjectName={tempProjectName} tempSavePath={tempSavePath} tempExcelPath={tempExcelPath}
          isLoading={isLoading} onNameChange={handleNameChange}
          
          // 🔴 අලුත් Props ටික Modal එකට යැවීම
          projectType={projectType} 
          setProjectType={setProjectType}
          blankRowCount={blankRowCount} 
          setBlankRowCount={setBlankRowCount}
          
          onSelectSaveLocation={handleSelectSaveLocation} onSelectExcel={handleSelectExcelForNewProject}
          onCreateProject={handleCreateNewProject} 
          onCreateBlankProject={handleCreateBlankProject} // 🔴 "Continue without Excel" බොත්තම සඳහා මෙය යැවිය යුතුමයි
        />
        
        <OpenProjectModal 
          isOpen={isRecentProjectsModalOpen} onClose={() => setIsRecentProjectsModalOpen(false)}
          workspaceProjects={workspaceProjects} onLoadProject={loadProjectFromPath}
          onDeleteProject={handleDeleteProject} onBrowseComputer={handleBrowseComputer} 
        />

        {/* NAVIGATION */}
        {workbook && (
          <TopNavBar currentPage={currentPage} setCurrentPage={setCurrentPage} onGoHome={handleGoHome} onSaveProject={handleSaveProject} />
        )}

        {/* MAIN ROUTING */}
        <main style={{ flex: 1, padding: "24px", maxWidth: "1800px", margin: "0 auto", width: "100%", boxSizing: "border-box", position: "relative" }}>
          
          {!workbook && (
            <WelcomeScreen 
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenNewProject={handleOpenNewProjectModal}
              onOpenRecent={handleOpenRecentModal}
              hasDraft={hasDraft}
              onLoadDraft={handleLoadDraft}
              onClearDraft={handleClearDraft}
            />
          )}

          {workbook && currentPage === "data" && <section><ExcelTable onContinue={() => setCurrentPage("designer")} /></section>}
          {workbook && currentPage === "designer" && <section><LabelDesigner /></section>}
          {workbook && currentPage === "preview" && <section><LabelPreview /></section>}
          
        </main>
      </div>
    </>
  );
}

export default App;