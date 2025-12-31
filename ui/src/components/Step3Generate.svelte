<script lang="ts">
  import { save } from '@tauri-apps/plugin-dialog';
  import { generateOutput } from '../lib/api';
  import { showToastNotification } from '../lib/notifications';
  
  export let sourceName: string = '';
  export let selectedFiles: string[] = [];
  export let onSuccess: () => void = () => {};
  export let onSourceNameSave: (name: string) => void = () => {};
  
  let generating = false;
  
  async function handleGenerate() {
    if (!sourceName.trim()) {
      await showToastNotification('Inserisci il nome della source!', 'warning');
      return;
    }

    if (selectedFiles.length === 0) {
      await showToastNotification('Seleziona almeno un file!', 'warning');
      return;
    }

    try {
      const outputPath = await save({
        defaultPath: `${sourceName.replace(/\s+/g, '_')}_output.txt`,
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (!outputPath) {
        return;
      }

      generating = true;

      const trimmedName = sourceName.trim();
      
      const message = await generateOutput(
        selectedFiles,
        trimmedName,
        outputPath as string
      );

      // Save source name to recent sources only when exporting
      onSourceNameSave(trimmedName);
      
      await showToastNotification(message, 'success');
      onSuccess();
    } catch (error) {
      console.error('Error generating output:', error);
      await showToastNotification(
        `Errore durante la generazione del file: ${error}`,
        'error'
      );
    } finally {
      generating = false;
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 12px;">
  <div style="display: block; font-size: 14px; font-weight: 600; color: var(--fg); display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
    Step 3: Genera output
  </div>
  
  <button
    type="button"
    on:click={handleGenerate}
    disabled={generating || !sourceName.trim() || selectedFiles.length === 0}
    class="generate-btn"
    class:disabled={generating || !sourceName.trim() || selectedFiles.length === 0}
  >
    {#if generating}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      Generazione in corso...
    {:else}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"></path>
      </svg>
      GENERA FILE OUTPUT
    {/if}
  </button>
</div>

<style>
  .generate-btn {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    background: #2563eb;
    border: none;
    border-radius: 10px !important;
    color: white;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .generate-btn:hover:not(.disabled) {
    background: #1d4ed8;
  }
  
  .generate-btn.disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

