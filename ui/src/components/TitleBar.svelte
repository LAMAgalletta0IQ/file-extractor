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

  onMount(() => {
    // Apply cursor to titlebar like TMC
    const applyCursor = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const cursorUrl = theme === 'dark' 
        ? 'url(/cursors/dark/sizeall.cur), move' 
        : 'url(/cursors/light/sizeall.cur), move';
      
      const titlebar = document.querySelector('.titlebar') as HTMLElement;
      const draggable = document.querySelector('.draggable') as HTMLElement;
      
      if (titlebar) {
        titlebar.style.setProperty('cursor', cursorUrl, 'important');
      }
      if (draggable) {
        draggable.style.setProperty('cursor', cursorUrl, 'important');
      }
    };
    
    setTimeout(() => applyCursor(), 50);
    setTimeout(() => applyCursor(), 100);
    setTimeout(() => applyCursor(), 200);
    
    const observer = new MutationObserver(() => {
      setTimeout(() => applyCursor(), 50);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  });
</script>

<div
  class="titlebar"
  style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); flex-shrink: 0; position: relative; background-color: rgba(0, 0, 0, 0.04); border-top-left-radius: 10px; border-top-right-radius: 10px; overflow: hidden;"
  data-tauri-drag-region
  on:mousedown={handleDragStart}
  role="banner"
>
  <!-- Title - centered -->
  <div
    class="draggable"
    style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; font-size: 16px; color: white; pointer-events: none;"
    data-tauri-drag-region
  >
    <img src="/icon.ico" alt="File Extractor Icon" style="width: 20px; height: 20px; pointer-events: none;" />
    File Extractor
  </div>

  <!-- Window controls on the right -->
  <div style="display: flex; align-items: center; gap: 8px; margin-left: auto; position: relative; z-index: 10;">
    <button
      on:click={handleMinimize}
      class="traffic min"
      title="Minimize"
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0; transition: opacity 0.2s;">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button
      disabled
      class="traffic max"
      title="Maximize (disabled)"
    >
    </button>
    <button
      on:click={handleClose}
      class="traffic close"
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
  .titlebar {
    user-select: none;
  }
  
  .draggable {
    /* Cursor is set via JavaScript based on theme */
  }
  
  .traffic {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .traffic:hover {
    transform: scale(1.15);
  }
  
  .traffic:hover svg {
    opacity: 1 !important;
  }
  
  .traffic:disabled {
    cursor: default;
  }
  
  .traffic:disabled:hover {
    transform: none;
  }
  
  .min {
    background-color: #FFBD2E;
  }
  
  .max {
    background-color: #4ADE80;
  }
  
  .close {
    background-color: #FF5F57;
  }
</style>
