import { invoke } from '@tauri-apps/api/core';
import type { SettingsData, FileNode } from '../types';

export async function getSettings(): Promise<SettingsData> {
  return await invoke<SettingsData>('get_settings');
}

export async function updateSettings(settings: SettingsData): Promise<void> {
  await invoke('update_settings', { settings });
}

export async function scanDirectory(dirPath: string): Promise<FileNode[]> {
  return await invoke<FileNode[]>('scan_directory', { dirPath });
}

export async function generateOutput(
  selectedPaths: string[],
  sourceName: string,
  outputPath: string
): Promise<string> {
  return await invoke<string>('generate_output', {
    selectedPaths,
    sourceName,
    outputPath,
  });
}

export async function getSelections(folderPath: string): Promise<string[]> {
  return await invoke<string[]>('get_selections', { folderPath });
}

export async function saveSelectionHistory(
  folderPath: string,
  files: string[]
): Promise<void> {
  await invoke('save_selection_history', { folderPath, files });
}

