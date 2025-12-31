import { useMemo } from "react";
import { open } from "@tauri-apps/api/dialog";

interface Step2FileSelectionProps {
  selectedFiles: string[];
  onSelectedFilesChange: (files: string[]) => void;
  lastFolder: string;
  onLastFolderChange: (folder: string) => void;
  sourceName: string;
  onScanFolder: (folder: string) => void;
}

export default function Step2FileSelection({
  selectedFiles,
  onSelectedFilesChange,
  lastFolder,
  onLastFolderChange,
  sourceName,
  onScanFolder,
}: Step2FileSelectionProps) {
  const handleScanFolder = async () => {
    try {
      const folder = await open({
        directory: true,
        multiple: false,
        defaultPath: lastFolder || undefined,
      });

      if (folder && typeof folder === "string") {
        onLastFolderChange(folder);
        onScanFolder(folder);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const handleAddFiles = async () => {
    try {
      const files = await open({
        multiple: true,
        defaultPath: lastFolder || undefined,
      });

      if (files && Array.isArray(files)) {
        const newFiles = files.filter(
          (f) => !selectedFiles.includes(f as string)
        ) as string[];
        onSelectedFilesChange([...selectedFiles, ...newFiles]);

        if (newFiles.length > 0) {
          const firstFile = newFiles[0] as string;
          const lastBackslash = firstFile.lastIndexOf("\\");
          const lastSlash = firstFile.lastIndexOf("/");
          const lastSeparator = Math.max(lastBackslash, lastSlash);
          if (lastSeparator >= 0) {
            const folder = firstFile.substring(0, lastSeparator);
            onLastFolderChange(folder);
          }
        }
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  };

  const handleClearSelection = () => {
    onSelectedFilesChange([]);
  };

  const filesPreview = useMemo(() => {
    if (selectedFiles.length === 0) {
      return "Nessun file selezionato...";
    }

    const folders = new Map<string, string[]>();
    
    selectedFiles.forEach((file) => {
      const lastBackslash = file.lastIndexOf("\\");
      const lastSlash = file.lastIndexOf("/");
      const lastSeparator = Math.max(lastBackslash, lastSlash);
      const folder = lastSeparator >= 0 ? file.substring(0, lastSeparator) : "";
      const fileName = lastSeparator >= 0 ? file.substring(lastSeparator + 1) : file;
      
      if (!folders.has(folder)) {
        folders.set(folder, []);
      }
      folders.get(folder)!.push(fileName);
    });

    let text = `📋 ${selectedFiles.length} file selezionati:\n\n`;
    let shownFolders = 0;

    for (const [folder, files] of folders.entries()) {
      if (shownFolders >= 2) {
        const remaining = folders.size - shownFolders;
        text += `\n... e altri file in ${remaining} cartell${remaining === 1 ? "a" : "e"}`;
        break;
      }

      const lastBackslash = folder.lastIndexOf("\\");
      const lastSlash = folder.lastIndexOf("/");
      const lastSeparator = Math.max(lastBackslash, lastSlash);
      const folderName = lastSeparator >= 0 ? folder.substring(lastSeparator + 1) : folder;
      text += `📁 ${folderName}/\n`;

      let shownFiles = 0;
      for (const file of files) {
        if (shownFiles >= 3) {
          text += `  ... +${files.length - shownFiles} file\n`;
          break;
        }
        text += `  • ${file}\n`;
        shownFiles++;
      }

      shownFolders++;
    }

    return text;
  }, [selectedFiles]);

  return (
    <>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white">
          📂 Step 2: Seleziona Source o File
        </label>
        <div className="flex gap-3">
          <button
            onClick={handleScanFolder}
            className="flex-1 h-10 px-4 rounded-[10px] backdrop-blur-glass hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
          >
            📁 Scansiona Cartella
          </button>
          <button
            onClick={handleAddFiles}
            className="flex-1 h-10 px-4 rounded-[10px] backdrop-blur-glass hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
          >
            📄 Aggiungi File
          </button>
          <button
            onClick={handleClearSelection}
            className="h-10 w-12 rounded-[10px] backdrop-blur-glass hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
            title="Pulisci selezione"
          >
            🗑️
          </button>
        </div>

        <div className="backdrop-blur-glass border border-white/20 rounded-[12px] p-4">
          <textarea
            readOnly
            value={filesPreview}
            className="w-full h-28 bg-transparent text-sm text-white resize-none outline-none font-mono whitespace-pre-wrap"
            placeholder="Nessun file selezionato..."
          />
        </div>
      </div>

    </>
  );
}
