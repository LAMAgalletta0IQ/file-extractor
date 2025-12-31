<script lang="ts">
  import type { FileNode } from '../types';
  import { getFileIcon } from '../utils/fileIcons';
  
  export let node: FileNode;
  export let level: number = 0;
  export let expandedFolders: Set<string>;
  export let checkedPaths: Set<string>;
  export let searchQuery: string = '';
  export let checkboxRefs: Map<string, HTMLInputElement>;
  export let onToggleExpanded: (path: string) => void;
  export let onCheckboxChange: (node: FileNode, checked: boolean) => void;
  export let getDescendantFilePaths: (node: FileNode) => string[];
  export let isChecked: (node: FileNode) => boolean;
  export let isIndeterminate: (node: FileNode) => boolean;
  export let shouldShowNode: (node: FileNode, query: string) => boolean;
  
  $: isExpanded = expandedFolders.has(node.path);
  $: checked = isChecked(node);
  $: indeterminate = isIndeterminate(node);
  $: isFile = !node.is_dir;
  $: hasChildren = node.children && node.children.length > 0;
  $: showThis = shouldShowNode(node, searchQuery);
  
  function handleRowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'INPUT') {
      return;
    }
    
    if (node.is_dir) {
      onToggleExpanded(node.path);
    } else {
      onCheckboxChange(node, !checked);
    }
  }
  
  function handleCheckboxChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onCheckboxChange(node, target.checked);
  }
  
  function handleToggleExpanded(e: MouseEvent) {
    e.stopPropagation();
    onToggleExpanded(node.path);
  }
  
  $: if (checkboxRefs) {
    const checkbox = checkboxRefs.get(node.path);
    if (checkbox) {
      checkbox.indeterminate = indeterminate;
    }
  }
</script>

{#if showThis}
  <div>
    <div
      class="tree-item"
      style="padding-left: {level * 16 + 8}px;"
      role="button"
      tabindex="0"
      on:click={handleRowClick}
    >
      {#if node.is_dir}
        <button
          type="button"
          on:click={handleToggleExpanded}
          class="chevron-btn"
        >
          {#if isExpanded}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          {/if}
        </button>
      {:else}
        <div style="width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0;"></div>
      {/if}

      {#if checkboxRefs}
        <input
          type="checkbox"
          checked={checked}
          bind:this={checkboxRefs.get(node.path)}
          on:change={handleCheckboxChange}
          on:click|stopPropagation
          class="file-checkbox"
        />
      {/if}

      <span class="file-icon">{getFileIcon(node.name)}</span>
      <span class="file-name" title={node.path}>{node.name}</span>
      {#if !isFile}
        <span class="file-type">Cartella</span>
      {/if}
    </div>

    {#if node.is_dir && isExpanded && hasChildren && node.children}
      <div>
        {#each node.children as child (child.path)}
          <TreeNode
            node={child}
            level={level + 1}
            {expandedFolders}
            {checkedPaths}
            {searchQuery}
            {checkboxRefs}
            {onToggleExpanded}
            {onCheckboxChange}
            {getDescendantFilePaths}
            {isChecked}
            {isIndeterminate}
            {shouldShowNode}
          />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tree-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    transition: background-color 0.2s;
    cursor: pointer;
    border-radius: 8px;
  }
  
  .tree-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .chevron-btn {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.2s;
    border-radius: 4px;
  }
  
  .chevron-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .file-checkbox {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .file-icon {
    margin-right: 8px;
    flex-shrink: 0;
  }
  
  .file-name {
    font-size: 14px;
    color: var(--fg);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-type {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    flex-shrink: 0;
    margin-left: 8px;
  }
</style>

