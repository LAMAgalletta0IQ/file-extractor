<script lang="ts">
  import { onMount } from 'svelte';
  import { appWindow } from '@tauri-apps/api/window';
  
  const appWindowInstance = appWindow;

  async function handleClose() {
    await appWindowInstance.close();
  }

  async function handleMinimize() {
    await appWindowInstance.minimize();
  }

  async function handleDragStart(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest('button, .traffic')) {
      e.preventDefault();
      try {
        await appWindowInstance.startDragging();
      } catch (err) {
        console.warn('Failed to start dragging:', err);
      }
    }
  }
</script>

<div
  class="titlebar"
  style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); flex-shrink: 0; position: relative; background-color: rgba(0, 0, 0, 0.08); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); border-top-left-radius: 10px; border-top-right-radius: 10px; overflow: hidden;"
  data-tauri-drag-region
  on:mousedown={handleDragStart}
>
  <!-- Title - centered -->
  <div
    class="draggable"
    style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; font-size: 16px; color: white; pointer-events: none;"
    data-tauri-drag-region
  >
    <img src="/icon.ico" alt="File Extractor Icon" style="width: 20px; height: 20px;" />
    File Extractor
  </div>

  <!-- Window controls on the right -->
  <div style="display: flex; align-items: center; gap: 8px; margin-left: auto; position: relative; z-index: 10;">
    <button
      on:click={handleMinimize}
      style="width: 12px; height: 12px; border-radius: 50%; background-color: #FFBD2E; border: none; outline: none; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; cursor: pointer;"
      on:mouseenter={(e) => e.currentTarget.style.opacity = '0.8'}
      on:mouseleave={(e) => e.currentTarget.style.opacity = '1'}
      title="Minimize"
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0; transition: opacity 0.2s;">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button
      disabled
      style="width: 12px; height: 12px; border-radius: 50%; background-color: #4ADE80; border: none; outline: none; display: flex; align-items: center; justify-content: center; cursor: default;"
      title="Maximize (disabled)"
    >
    </button>
    <button
      on:click={handleClose}
      style="width: 12px; height: 12px; border-radius: 50%; background-color: #FF5F57; border: none; outline: none; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; cursor: pointer;"
      on:mouseenter={(e) => e.currentTarget.style.opacity = '0.8'}
      on:mouseleave={(e) => e.currentTarget.style.opacity = '1'}
      title="Close"
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0; transition: opacity 0.2s;">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</div>

<style>
  .titlebar button:hover svg {
    opacity: 1 !important;
  }
</style>

