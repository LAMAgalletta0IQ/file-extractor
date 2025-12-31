export interface SettingsData {
  dark_mode: boolean;
  recent_sources: string[];
  last_folder: string;
}

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

