<script lang="ts">
  import { onMount } from 'svelte';
  import { appWindow, LogicalSize } from '@tauri-apps/api/window';
  import { getSettings, updateSettings } from './lib/api';
  import type { SettingsData } from './types';
  import TitleBar from './components/TitleBar.svelte';
  import Step1SourceName from './components/Step1SourceName.svelte';
  import Step2FileSelection from './components/Step2FileSelection.svelte';
  import Step3Generate from './components/Step3Generate.svelte';
  import FileSelectionDialog from './components/FileSelectionDialog.svelte';
  
  const NORMAL_SIZE = { width: 620, height: 580 };
  const SELECTION_SIZE = { width: 900, height: 650 };
  
  let sourceName = '';
  let selectedFiles: string[] = [];
  let recentSources: string[] = [];
  let lastFolder = '';
  let scanningFolder: string | null = null;
  
  onMount(async () => {
    try {
      const settings = await getSettings();
      recentSources = settings.recent_sources || [];
      lastFolder = settings.last_folder || '';
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  });
  
  async function updateSettingsData(updates: Partial<SettingsData>) {
    const newSettings: SettingsData = {
      dark_mode: true,
      recent_sources: recentSources,
      last_folder: lastFolder,
      ...updates,
    };
    
    if (updates.recent_sources) {
      recentSources = updates.recent_sources;
    }
    if (updates.last_folder !== undefined) {
      lastFolder = updates.last_folder;
    }
    
    try {
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }
  
  function handleSourceNameChange(name: string) {
    sourceName = name;
  }
  
  function handleSourceNameSave(name: string) {
    const trimmedName = name.trim();
    if (trimmedName && !recentSources.includes(trimmedName)) {
      const updated = [trimmedName, ...recentSources.slice(0, 9)];
      updateSettingsData({ recent_sources: updated });
    }
  }
  
  async function handleScanFolder(folder: string) {
    scanningFolder = folder;
    try {
      await appWindow.setResizable(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.setSize(new LogicalSize(SELECTION_SIZE.width, SELECTION_SIZE.height));
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.center();
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  }
  
  async function handleCloseSelection() {
    scanningFolder = null;
    try {
      await appWindow.setSize(new LogicalSize(NORMAL_SIZE.width, NORMAL_SIZE.height));
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.center();
      await new Promise(resolve => setTimeout(resolve, 50));
      await appWindow.setResizable(false);
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  }
  
  function handleConfirmSelection(files: string[]) {
    const newFiles = files.filter((f) => !selectedFiles.includes(f));
    selectedFiles = [...selectedFiles, ...newFiles];
    handleCloseSelection();
  }
  
  function handleSuccess() {
    selectedFiles = [];
  }
</script>

<div class="app-container">
  <div class="app-content">
    <TitleBar />
    
    {#if scanningFolder}
      <div class="selection-container">
        <FileSelectionDialog
          folderPath={scanningFolder || ''}
          onClose={handleCloseSelection}
          onConfirm={handleConfirmSelection}
        />
      </div>
    {:else}
      <div class="main-content">
        <div class="content-wrapper">
          <Step1SourceName
            bind:sourceName
            onSourceNameChange={handleSourceNameChange}
            {recentSources}
          />
          
          <Step2FileSelection
            {selectedFiles}
            onSelectedFilesChange={(files) => selectedFiles = files}
            {lastFolder}
            onLastFolderChange={(folder) => updateSettingsData({ last_folder: folder })}
            onScanFolder={handleScanFolder}
          />
          
          <Step3Generate
            {sourceName}
            {selectedFiles}
            onSuccess={handleSuccess}
            onSourceNameSave={handleSourceNameSave}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .app-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 10px;
  }
  
  .app-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: transparent; /* Trasparente per far passare il blur Mica */
    border-radius: 10px;
    overflow: hidden;
  }
  
  .selection-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  
  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    background: transparent;
    min-height: 0;
  }
  
  .main-content::-webkit-scrollbar {
    display: none;
  }
  
  .content-wrapper {
    max-width: 672px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
</style>

