import { useState, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/window";
import TitleBar from "./components/TitleBar";
import Step1SourceName from "./components/Step1SourceName";
import Step2FileSelection from "./components/Step2FileSelection";
import Step3Generate from "./components/Step3Generate";
import FileSelectionDialog from "./components/FileSelectionDialog";
import { NotificationContainer } from "./components/Notification";
import { invoke } from "@tauri-apps/api/tauri";
import type { SettingsData } from "./types";

const NORMAL_SIZE = { width: 620, height: 580 };
const SELECTION_SIZE = { width: 900, height: 650 };

function App() {
  const [sourceName, setSourceName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [recentSources, setRecentSources] = useState<string[]>([]);
  const [lastFolder, setLastFolder] = useState("");
  const [scanningFolder, setScanningFolder] = useState<string | null>(null);

  useEffect(() => {
    // Load settings on mount
    invoke<SettingsData>("get_settings")
      .then((settings) => {
        setRecentSources(settings.recent_sources || []);
        setLastFolder(settings.last_folder || "");
      })
      .catch(console.error);

    // Force dark mode
    document.documentElement.classList.add("dark");
  }, []);

  const updateSettings = (updates: Partial<SettingsData>) => {
    const newSettings = {
      dark_mode: true,
      recent_sources: recentSources,
      last_folder: lastFolder,
      ...updates,
    };
    
    if (updates.recent_sources) {
      setRecentSources(updates.recent_sources);
    }
    if (updates.last_folder !== undefined) {
      setLastFolder(updates.last_folder);
    }
    
    invoke("update_settings", { settings: newSettings }).catch(console.error);
  };

  const handleSourceNameChange = (name: string) => {
    setSourceName(name);
    
    // Add to recent sources if not already present and not empty
    if (name.trim() && !recentSources.includes(name.trim())) {
      const updated = [name.trim(), ...recentSources.slice(0, 9)];
      updateSettings({ recent_sources: updated });
    }
  };

  const handleScanFolder = async (folder: string) => {
    setScanningFolder(folder);
    // Resize window to selection size
    try {
      // Enable resizable temporarily to allow size change
      await appWindow.setResizable(true);
      // Small delay to ensure resizable is enabled
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.setSize(new LogicalSize(SELECTION_SIZE.width, SELECTION_SIZE.height));
      // Small delay before centering to ensure size change is applied
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.center();
      // Keep resizable enabled for selection view
    } catch (error) {
      console.error("Failed to resize window:", error);
    }
  };

  const handleCloseSelection = async () => {
    setScanningFolder(null);
    // Resize window back to normal size
    try {
      await appWindow.setSize(new LogicalSize(NORMAL_SIZE.width, NORMAL_SIZE.height));
      // Small delay before centering to ensure size change is applied
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.center();
      // Small delay before disabling resizable to ensure centering is complete
      await new Promise(resolve => setTimeout(resolve, 50));
      // Disable resizable for normal view
      await appWindow.setResizable(false);
    } catch (error) {
      console.error("Failed to resize window:", error);
    }
  };

  const handleConfirmSelection = (files: string[]) => {
    const newFiles = files.filter((f) => !selectedFiles.includes(f));
    setSelectedFiles([...selectedFiles, ...newFiles]);
    handleCloseSelection();
  };

  return (
    <div className="w-full h-full overflow-hidden" style={{ borderRadius: '10px' }}>
      <NotificationContainer />
      <div 
        className="w-full h-full flex flex-col overflow-hidden border border-white/20"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <TitleBar />
        
        {scanningFolder ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <FileSelectionDialog
              folderPath={scanningFolder}
              onClose={handleCloseSelection}
              onConfirm={handleConfirmSelection}
              sourceName={sourceName}
            />
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-8 bg-transparent hide-scrollbar min-h-0"
          >
            <div className="max-w-2xl mx-auto space-y-6">
              <Step1SourceName
                sourceName={sourceName}
                onSourceNameChange={handleSourceNameChange}
                recentSources={recentSources}
              />
              
              <Step2FileSelection
                selectedFiles={selectedFiles}
                onSelectedFilesChange={setSelectedFiles}
                lastFolder={lastFolder}
                onLastFolderChange={(folder) => updateSettings({ last_folder: folder })}
                sourceName={sourceName}
                onScanFolder={handleScanFolder}
              />
              
              <Step3Generate
                sourceName={sourceName}
                selectedFiles={selectedFiles}
                onSuccess={() => {
                  setSelectedFiles([]);
                }}
              />
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
