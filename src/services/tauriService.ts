import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile, readDir, exists, mkdir, remove } from "@tauri-apps/plugin-fs";
import { documentDir, join, dirname } from "@tauri-apps/api/path"; 
import { invoke } from "@tauri-apps/api/core";
import type { ExcelWorkbook } from "../shared/types/excel";

export const tauriService = {
  // 📂 Get Default Workspace Path (Documents/Label Studio Projects)
  async getWorkspacePath(): Promise<string> {
    const docs = await documentDir();
    return await join(docs, "Label Studio Projects");
  },

  // 🔍 Check if file/folder exists
  async checkExists(path: string): Promise<boolean> {
    return await exists(path);
  },

  // 📁 Create Directory
  async createDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  },

  // 📖 Read Directory (Workspace Projects list)
  async readWorkspaceDir(workspacePath: string) {
    return await readDir(workspacePath);
  },

  // 🔗 Join Paths helper
  async joinPaths(...paths: string[]): Promise<string> {
    return await join(...paths);
  },

  // 🗂️ Get Parent Directory
  async getParentDir(filePath: string): Promise<string> {
    return await dirname(filePath);
  },

  // 🗑️ Remove File
  async removeFile(path: string): Promise<void> {
    await remove(path);
  },

  // 📄 Read Text File (.json or .lproj)
  async readText(path: string): Promise<string> {
    return await readTextFile(path);
  },

  // 💾 Write Text File
  async writeText(path: string, content: string): Promise<void> {
    await writeTextFile(path, content);
  },

  // 📊 Read Excel via Rust Backend Command
  async readExcelFile(filePath: string): Promise<ExcelWorkbook> {
    return await invoke<ExcelWorkbook>("read_excel", { filePath });
  },

  // 🪟 Native Dialogs (Open, Save, Ask)
  dialog: {
    async openFile(filters: { name: string; extensions: string[] }[]) {
      return await open({ multiple: false, directory: false, filters });
    },

    async saveFile(defaultPath: string, filters: { name: string; extensions: string[] }[]) {
      return await save({ title: "Save Project", defaultPath, filters });
    },

    async confirm(message: string, title = "Confirm"): Promise<boolean> {
      return await ask(message, { title, kind: 'warning' });
    }
  }
};