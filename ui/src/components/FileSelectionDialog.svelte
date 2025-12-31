<script lang="ts">
  import { onMount } from 'svelte';
  import { scanDirectory, getSelections, saveSelectionHistory } from '../lib/api';
  import { showToastNotification } from '../lib/notifications';
  import type { FileNode } from '../types';
  import TreeNode from './TreeNode.svelte';
  
  export let folderPath: string = '';
  export let onClose: () => void = () => {};
  export let onConfirm: (files: string[]) => void = () => {};
  
  const INITIAL_EXPANDED_FOLDERS = 2;
  
  let tree: FileNode[] = [];
  let loading = true;
  let searchQuery = '';
  let checkedPaths = new Set<string>();
  let expandedFolders = new Set<string>();
  let allFilePaths = new Set<string>();
  let checkboxRefs: Map<string, HTMLInputElement> = new Map();
  
  function toggleExpandedHandler(path: string) {
    toggleExpanded(path);
  }
  
  function checkboxChangeHandler(node: FileNode, checked: boolean) {
    handleCheckboxChange(node, checked);
  }
  
  function collectAllPaths(nodes: FileNode[]) {
    const paths = new Set<string>();
    const collect = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (!node.is_dir) {
          paths.add(node.path);
        }
        if (node.children) {
          collect(node.children);
        }
      });
    };
    collect(nodes);
    return paths;
  }
  
  function getDescendantFilePaths(node: FileNode): string[] {
    const paths: string[] = [];
    if (!node.is_dir) {
      paths.push(node.path);
    }
    if (node.children) {
      node.children.forEach((child) => {
        paths.push(...getDescendantFilePaths(child));
      });
    }
    return paths;
  }
  
  async function loadTree() {
    try {
      loading = true;
      const result = await scanDirectory(folderPath);
      tree = result;
      allFilePaths = collectAllPaths(result);
      
      // Expand first N folders
      const firstFolders = result
        .filter((node) => node.is_dir)
        .slice(0, INITIAL_EXPANDED_FOLDERS)
        .map((node) => node.path);
      expandedFolders = new Set(firstFolders);
      
      // Load previous selections
      await loadPreviousSelections();
    } catch (error) {
      console.error('Error scanning directory:', error);
      await showToastNotification(
        `Errore durante la scansione della directory: ${error}`,
        'error'
      );
    } finally {
      loading = false;
    }
  }
  
  async function loadPreviousSelections() {
    if (!folderPath.trim()) return;
    
    try {
      const selections = await getSelections(folderPath.trim());
      if (selections.length > 0) {
        checkedPaths = new Set(selections);
      }
    } catch (error) {
      console.error('Error loading previous selections:', error);
    }
  }
  
  function handleCheckboxChange(node: FileNode, checked: boolean) {
    const newChecked = new Set(checkedPaths);
    const descendantPaths = getDescendantFilePaths(node);
    
    if (checked) {
      descendantPaths.forEach((path) => newChecked.add(path));
    } else {
      descendantPaths.forEach((path) => newChecked.delete(path));
    }
    
    checkedPaths = newChecked;
  }
  
  function isChecked(node: FileNode): boolean {
    if (!node.is_dir) {
      return checkedPaths.has(node.path);
    }
    const descendants = getDescendantFilePaths(node);
    return descendants.length > 0 && descendants.every(path => checkedPaths.has(path));
  }
  
  function isIndeterminate(node: FileNode): boolean {
    if (!node.is_dir) return false;
    const descendants = getDescendantFilePaths(node);
    const checkedCount = descendants.filter(path => checkedPaths.has(path)).length;
    return checkedCount > 0 && checkedCount < descendants.length;
  }
  
  function handleSelectAll() {
    checkedPaths = new Set(allFilePaths);
  }
  
  function handleSelectNone() {
    checkedPaths = new Set();
  }
  
  function toggleExpanded(path: string) {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    expandedFolders = newExpanded;
  }
  
  function expandAll() {
    const allPaths = new Set<string>();
    const collect = (nodes: FileNode[]) => {
      nodes.forEach((n) => {
        if (n.is_dir) allPaths.add(n.path);
        if (n.children) collect(n.children);
      });
    };
    collect(tree);
    expandedFolders = allPaths;
  }
  
  function collapseAll() {
    expandedFolders = new Set();
  }
  
  function shouldShowNode(node: FileNode, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const nameMatch = node.name.toLowerCase().includes(q);
    
    if (node.children) {
      const childrenMatch = node.children.some(child => shouldShowNode(child, query));
      return nameMatch || childrenMatch;
    }
    
    return nameMatch;
  }
  
  async function handleConfirm() {
    const selectedFiles = Array.from(checkedPaths).filter(path => allFilePaths.has(path));

    if (selectedFiles.length === 0) {
      await showToastNotification('Seleziona almeno un file!', 'warning');
      return;
    }

    await saveSelectionHistory(folderPath.trim(), selectedFiles);
    onConfirm(selectedFiles);
  }
  
  const fileCount = allFilePaths.size;
  $: selectedCount = Array.from(checkedPaths).filter(path => allFilePaths.has(path)).length;
  
  onMount(() => {
    loadTree();
  });
  
</script>

<div class="dialog-container">
  <!-- Header -->
  <div class="dialog-header">
    <div>
      <h2 class="dialog-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        Source: {folderPath.split(/[/\\]/).pop()}
      </h2>
    </div>
    <button type="button" on:click={onClose} class="close-btn" title="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <button type="button" on:click={expandAll} class="toolbar-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      Espandi Tutto
    </button>
    <button type="button" on:click={collapseAll} class="toolbar-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
      Comprimi Tutto
    </button>
    <button type="button" on:click={handleSelectAll} class="toolbar-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      Seleziona Tutti
    </button>
    <button type="button" on:click={handleSelectNone} class="toolbar-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
      Deseleziona Tutti
    </button>
    <div style="flex: 1;"></div>
    <div class="search-box">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cerca file..."
        class="search-input"
      />
    </div>
  </div>

  <!-- Tree View -->
  <div class="tree-view">
    {#if loading}
      <div class="loading-state">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span>Scansione in corso...</span>
      </div>
    {:else}
      <div class="tree-content">
        {#each tree as node (node.path)}
          <TreeNode
            {node}
            level={0}
            {expandedFolders}
            {checkedPaths}
            {searchQuery}
            onToggleExpanded={toggleExpandedHandler}
            onCheckboxChange={checkboxChangeHandler}
            {getDescendantFilePaths}
            {isChecked}
            {isIndeterminate}
            {shouldShowNode}
          />
        {/each}
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="dialog-footer">
    <div class="footer-info">
      {#if loading}
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
        <span>Scansione in corso...</span>
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Scansione completata - {fileCount} file trovati</span>
      {/if}
    </div>
    <div class="footer-actions">
      <div class="selected-count">{selectedCount} file selezionati</div>
      <button type="button" on:click={onClose} class="btn-secondary">Annulla</button>
      <button type="button" on:click={handleConfirm} disabled={selectedCount === 0} class="btn-primary" class:disabled={selectedCount === 0}>
        Conferma Selezione
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    border-radius: 10px;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .dialog-title {
    font-size: 18px;
    font-weight: bold;
    color: var(--fg);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--fg);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .toolbar {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .toolbar-btn {
    padding: 6px 12px;
    border-radius: 10px !important;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--fg);
    font-size: 13px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 12px !important;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    color: var(--fg);
  }
  
  .search-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--fg);
    font-size: 13px;
    width: 128px;
  }
  
  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .tree-view {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  
  .tree-view::-webkit-scrollbar {
    width: 5px;
  }
  
  .tree-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .tree-view::-webkit-scrollbar-thumb {
    background: var(--bar-fill);
    border-radius: 3px !important;
  }
  
  .tree-view::-webkit-scrollbar-track {
    border-radius: 3px !important;
  }
  
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .tree-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .dialog-footer {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    overflow: hidden;
  }
  
  .footer-info {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .footer-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .selected-count {
    font-size: 13px;
    font-weight: 600;
    color: #60a5fa;
  }
  
  .btn-secondary {
    padding: 8px 16px;
    border-radius: 10px !important;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--fg);
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .btn-primary {
    padding: 8px 16px;
    border-radius: 10px !important;
    background: #2563eb;
    border: none;
    color: white;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .btn-primary:hover:not(.disabled) {
    background: #1d4ed8;
  }
  
  .btn-primary.disabled {
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

