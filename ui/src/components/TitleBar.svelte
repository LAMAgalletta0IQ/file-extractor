<script lang="ts">
  import { onMount } from 'svelte';
  import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
  
  const appWindowInstance = WebviewWindow.getCurrent();

  async function handleClose() {
    await appWindowInstance.close();
  }

  async function handleMinimize() {
    await appWindowInstance.minimize();
  }

  async function handleDragStart(e: MouseEvent) {
    // Solo se è click sinistro e non su un elemento interattivo (button, input, select)
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest('button, input, select, .traffic')) {
      e.preventDefault();
      try {
        await appWindowInstance.startDragging();
      } catch (err) {
        console.warn('Failed to start dragging:', err);
      }
    }
  }

  onMount(() => {
    // Apply cursor to titlebar - Konata Izumi
    const applyCursor = () => {
      const cursorUrl = 'url(/cursors/sizeall.cur), move';
      
      const titlebar = document.querySelector('.titlebar') as HTMLElement;
      const draggable = document.querySelector('.draggable') as HTMLElement;
      
      if (titlebar) {
        titlebar.style.setProperty('cursor', cursorUrl, 'important');
      }
      if (draggable) {
        draggable.style.setProperty('cursor', cursorUrl, 'important');
      }
    };
    
    // Applica subito e ripetutamente per assicurarsi che venga applicato
    setTimeout(() => applyCursor(), 50);
    setTimeout(() => applyCursor(), 100);
    setTimeout(() => applyCursor(), 200);
    
    // Applica anche su mouseenter per essere sicuri
    const titlebarEl = document.querySelector('.titlebar');
    const draggableEl = document.querySelector('.draggable');
    if (titlebarEl) {
      titlebarEl.addEventListener('mouseenter', applyCursor);
    }
    if (draggableEl) {
      draggableEl.addEventListener('mouseenter', applyCursor);
    }
  });
</script>

<div
  class="titlebar"
  style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); flex-shrink: 0; position: relative; background-color: rgba(0, 0, 0, 0.04); border-top-left-radius: 10px; border-top-right-radius: 10px; overflow: hidden;"
  on:mousedown={handleDragStart}
  role="banner"
>
  <!-- Title - centered -->
  <div
    class="draggable"
    style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; font-size: 16px; color: white; pointer-events: none;"
    on:mousedown={handleDragStart}
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
    -webkit-app-region: no-drag;
    cursor: url('/cursors/sizeall.cur'), move !important;
  }
  
  .draggable {
    cursor: url('/cursors/sizeall.cur'), move !important;
    -webkit-app-region: no-drag;
  }
  
  .traffic {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    cursor: url('/cursors/hand.cur'), pointer !important;
    padding: 0;
    -webkit-app-region: no-drag;
  }
  
  .traffic:hover {
    transform: scale(1.15);
  }
  
  .traffic:hover svg {
    opacity: 1 !important;
  }
  
  .traffic:disabled {
    cursor: url('/cursors/no.cur'), not-allowed !important;
  }
  
  .traffic:disabled:hover {
    transform: none;
  }
  
  .min {
    background: #ffbd2e;
  }
  
  .max {
    background: #28c840;
  }
  
  .close {
    background: #ff5f57;
  }
</style>
