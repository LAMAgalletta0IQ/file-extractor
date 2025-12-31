<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  
  export let selectedFiles: string[] = [];
  export let onSelectedFilesChange: (files: string[]) => void = () => {};
  export let lastFolder: string = '';
  export let onLastFolderChange: (folder: string) => void = () => {};
  export let onScanFolder: (folder: string) => void = () => {};
  
  let filesPreview = '';
  
  async function handleScanFolder() {
    try {
      const folder = await open({
        directory: true,
        multiple: false,
        defaultPath: lastFolder || undefined,
      });

      if (folder && typeof folder === 'string') {
        onLastFolderChange(folder);
        onScanFolder(folder);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  }

  async function handleAddFiles() {
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
          const lastBackslash = firstFile.lastIndexOf('\\');
          const lastSlash = firstFile.lastIndexOf('/');
          const lastSeparator = Math.max(lastBackslash, lastSlash);
          if (lastSeparator >= 0) {
            const folder = firstFile.substring(0, lastSeparator);
            onLastFolderChange(folder);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }

  function handleClearSelection() {
    onSelectedFilesChange([]);
  }

  function updatePreview() {
    if (selectedFiles.length === 0) {
      filesPreview = 'Nessun file selezionato...';
      return;
    }

    const folders = new Map<string, string[]>();
    
    selectedFiles.forEach((file) => {
      const lastBackslash = file.lastIndexOf('\\');
      const lastSlash = file.lastIndexOf('/');
      const lastSeparator = Math.max(lastBackslash, lastSlash);
      const folder = lastSeparator >= 0 ? file.substring(0, lastSeparator) : '';
      const fileName = lastSeparator >= 0 ? file.substring(lastSeparator + 1) : file;
      
      if (!folders.has(folder)) {
        folders.set(folder, []);
      }
      folders.get(folder)!.push(fileName);
    });

    let text = `${selectedFiles.length} file selezionati:\n\n`;
    let shownFolders = 0;

    for (const [folder, files] of folders.entries()) {
      if (shownFolders >= 2) {
        const remaining = folders.size - shownFolders;
        text += `\n... e altri file in ${remaining} cartell${remaining === 1 ? 'a' : 'e'}`;
        break;
      }

      const lastBackslash = folder.lastIndexOf('\\');
      const lastSlash = folder.lastIndexOf('/');
      const lastSeparator = Math.max(lastBackslash, lastSlash);
      const folderName = lastSeparator >= 0 ? folder.substring(lastSeparator + 1) : folder;
      text += `${folderName}/\n`;

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

    filesPreview = text;
  }
  
  $: {
    updatePreview();
  }
</script>

<div style="display: flex; flex-direction: column; gap: 12px;">
  <div style="display: block; font-size: 14px; font-weight: 600; color: var(--fg); display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
    Step 2: Seleziona Source o File
  </div>
  
  <div style="display: flex; gap: 12px;">
    <button
      type="button"
      on:click={handleScanFolder}
      class="btn-primary"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
      Scansiona Cartella
    </button>
    
    <button
      type="button"
      on:click={handleAddFiles}
      class="btn-primary"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      Aggiungi File
    </button>
    
    <button
      type="button"
      on:click={handleClearSelection}
      class="btn-icon"
      title="Pulisci selezione"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  </div>

  <div class="preview-container">
    <textarea
      readonly
      value={filesPreview}
      class="preview-textarea"
      placeholder="Nessun file selezionato..."
    />
  </div>
</div>

<style>
  .btn-primary {
    flex: 1;
    height: 40px;
    padding: 0 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px !important;
    color: var(--fg);
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .btn-primary:hover {
    background: var(--input-bg);
  }
  
  .btn-icon {
    width: 48px;
    height: 40px;
    padding: 0;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px !important;
    color: var(--fg);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-icon:hover {
    background: var(--input-bg);
  }
  
  .preview-container {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px !important;
    padding: 16px;
  }
  
  .preview-textarea {
    width: 100%;
    height: 112px;
    background: transparent;
    color: var(--fg);
    font-size: 13px;
    font-family: 'Courier New', monospace;
    resize: none;
    outline: none;
    border: none;
    white-space: pre-wrap;
    line-height: 1.5;
  }
  
  .preview-textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
</style>

