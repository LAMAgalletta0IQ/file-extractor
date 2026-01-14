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

  function handleMaximize() {
    // Does nothing, but the button is active
  }

  async function handleDragStart(e: MouseEvent) {
    // Only if it's a left click and not on an interactive element (button, input, select, .traffic, .controls)
    const target = e.target as HTMLElement;
    // If the click is on a traffic button or inside the controls, don't drag
    if (target.closest('.traffic') || target.closest('.controls')) {
      return;
    }
    
    if (e.button === 0 && !target.closest('button, input, select')) {
      e.preventDefault();
      e.stopPropagation();
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
      const cursorUrl = 'url("/cursors/Frieren move.cur"), move';
      
      const titlebar = document.querySelector('.titlebar') as HTMLElement;
      const draggable = document.querySelector('.draggable') as HTMLElement;
      
      if (titlebar) {
        titlebar.style.setProperty('cursor', cursorUrl, 'important');
      }
      if (draggable) {
        draggable.style.setProperty('cursor', cursorUrl, 'important');
      }
    };
    
    // Apply immediately and repeatedly to ensure it gets applied
    setTimeout(() => applyCursor(), 50);
    setTimeout(() => applyCursor(), 100);
    setTimeout(() => applyCursor(), 200);
  });
</script>

<div
  class="titlebar"
  style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; position: relative; background-color: rgba(255, 255, 255, 0.02); border-top-left-radius: 12px; border-top-right-radius: 12px; overflow: hidden;"
  role="banner"
>
  <!-- Empty div to balance the controls on the right -->
  <div class="spacer" style="width: 51px; flex-shrink: 0;"></div>

  <!-- Title - centered -->
  <div
    class="draggable"
    style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; font-size: 16px; color: white; pointer-events: auto; z-index: 1;"
    on:mousedown={handleDragStart}
    role="button"
    tabindex="0"
    aria-label="Drag window"
  >
    <img src="/icon.ico" alt="File Extractor Icon" style="width: 20px; height: 20px; pointer-events: none; user-select: none;" />
    File Extractor
  </div>

  <!-- Window controls on the right -->
  <div class="controls">
    <button
      type="button"
      on:click|stopPropagation={handleMaximize}
      class="traffic max"
      title="Maximize"
      aria-label="Maximize"
    >
    </button>
    <button
      type="button"
      on:click|stopPropagation={handleMinimize}
      class="traffic min"
      title="Minimize"
      aria-label="Minimize"
    >
    </button>
    <button
      type="button"
      on:click|stopPropagation={handleClose}
      class="traffic close"
      title="Close"
      aria-label="Close"
    >
    </button>
  </div>
</div>

<style>
  .titlebar {
    user-select: none;
    -webkit-app-region: no-drag;
    cursor: url("/cursors/Frieren move.cur"), move !important;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    overflow: hidden;
  }
  
  .draggable {
    cursor: url("/cursors/Frieren move.cur"), move !important;
    -webkit-app-region: no-drag;
    user-select: none;
  }
  
  .spacer {
    visibility: hidden;
  }

  .controls {
    display: flex;
    gap: 5px;
    position: relative;
    z-index: 100;
    pointer-events: auto;
    flex-shrink: 0;
  }
  
  .traffic {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    outline: none;
    cursor: url("/cursors/Frieren hand.cur"), pointer !important;
    padding: 0;
    -webkit-app-region: no-drag;
    transition: all 0.2s ease;
    position: relative;
    z-index: 101;
    pointer-events: auto !important;
  }
  
  
  .traffic:disabled {
    cursor: url("/cursors/Frieren unavailable.cur"), not-allowed !important;
  }
  
  .traffic:disabled:hover {
    transform: none;
  }
  
  .close {
    background: #ff5f57 !important;
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    filter: brightness(1.15) saturate(1.25);
  }
  
  .min {
    background: #ffbd2e !important;
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    filter: brightness(1.15) saturate(1.25);
  }
  
  .max {
    background: #28c840 !important;
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    filter: brightness(1.15) saturate(1.25);
  }
  
  .traffic:hover {
    filter: brightness(1.3) saturate(1.4);
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: scale(1.15);
  }
</style>
