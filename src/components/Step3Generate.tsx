import { useState } from "react";
import { save } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { showNotification } from "./Notification";
import { Sparkles, Rocket, Loader2 } from "lucide-react";

interface Step3GenerateProps {
  sourceName: string;
  selectedFiles: string[];
  onSuccess: () => void;
  onSourceNameSave: (name: string) => void;
}

export default function Step3Generate({
  sourceName,
  selectedFiles,
  onSuccess,
  onSourceNameSave,
}: Step3GenerateProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!sourceName.trim()) {
      showNotification("Inserisci il nome della source!", "warning");
      return;
    }

    if (selectedFiles.length === 0) {
      showNotification("Seleziona almeno un file!", "warning");
      return;
    }

    try {
      const outputPath = await save({
        defaultPath: `${sourceName.replace(/\s+/g, "_")}_output.txt`,
        filters: [{ name: "Text Files", extensions: ["txt"] }],
      });

      if (!outputPath) {
        return;
      }

      setGenerating(true);

      const trimmedName = sourceName.trim();
      
      const message = await invoke<string>("generate_output", {
        selectedPaths: selectedFiles,
        sourceName: trimmedName,
        outputPath: outputPath as string,
      });

      // Save source name to recent sources only when exporting
      onSourceNameSave(trimmedName);
      
      showNotification(message, "success");
      onSuccess();
    } catch (error) {
      console.error("Error generating output:", error);
      showNotification(
        `Errore durante la generazione del file: ${error}`,
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Step 3: Genera output
      </label>
      <button
        onClick={handleGenerate}
        disabled={generating || !sourceName.trim() || selectedFiles.length === 0}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generazione in corso...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            GENERA FILE OUTPUT
          </>
        )}
      </button>
    </div>
  );
}
