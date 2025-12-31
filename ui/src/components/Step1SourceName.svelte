<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let sourceName: string = '';
  export let onSourceNameChange: (name: string) => void;
  export let recentSources: string[] = [];
  
  let showSuggestions = false;
  let inputElement: HTMLInputElement;
  let filteredSuggestions: string[] = [];
  
  function handleFocus() {
    showSuggestions = true;
    updateFilteredSuggestions(sourceName);
  }
  
  function handleSelect(name: string) {
    sourceName = name;
    onSourceNameChange(name);
    showSuggestions = false;
  }
  
  function updateFilteredSuggestions(search: string) {
    filteredSuggestions = recentSources.filter((s) =>
      s.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (inputElement && !inputElement.contains(target)) {
      // Check if click is inside suggestions container
      const suggestionsContainer = document.querySelector('.suggestions');
      if (!suggestionsContainer || !suggestionsContainer.contains(target)) {
        showSuggestions = false;
      }
    }
  }
  
  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside);
    updateFilteredSuggestions(sourceName);
  });
  
  onDestroy(() => {
    document.removeEventListener('mousedown', handleClickOutside);
  });
  
  $: if (sourceName !== undefined) {
    updateFilteredSuggestions(sourceName);
  }
</script>

<div style="display: flex; flex-direction: column; gap: 12px;">
  <label for="source-name-input" style="display: block; font-size: 14px; font-weight: 600; color: var(--fg); display: flex; align-items: center; gap: 8px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
    Step 1: Nome della Source
  </label>
  
  <div style="position: relative;">
    <input
      id="source-name-input"
      bind:this={inputElement}
      type="text"
      bind:value={sourceName}
      on:input={(e) => {
        const value = e.currentTarget.value;
        onSourceNameChange(value);
        showSuggestions = true;
        updateFilteredSuggestions(value);
      }}
      on:focus={handleFocus}
      placeholder="Inserisci il nome della source..."
      class="source-input"
      class:has-suggestions={showSuggestions && filteredSuggestions.length > 0}
      class:has-value={sourceName.trim() !== ''}
    />
    
    {#if showSuggestions && filteredSuggestions.length > 0}
      <div class="suggestions" role="listbox">
        {#each filteredSuggestions as suggestion}
          <button
            type="button"
            on:click|preventDefault|stopPropagation={() => handleSelect(suggestion)}
            class="suggestion-item"
            role="option"
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .source-input {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1px solid var(--input-border);
    border-radius: 12px;
    background: var(--input-bg);
    color: var(--fg);
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .source-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .source-input:focus {
    outline: none;
    border-color: var(--input-focus);
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.15);
  }
  
  .source-input.has-suggestions {
    border-color: var(--input-focus);
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
  }
  
  .source-input.has-value {
    background: var(--input-bg);
  }
  
  .source-input:not(.has-value) {
    background: var(--input-bg);
    color: rgba(255, 255, 255, 0.7);
  }
  
  .suggestions {
    position: absolute;
    z-index: 10;
    width: 100%;
    margin-top: 4px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    max-height: 192px;
    overflow-y: auto;
  }
  
  .suggestions::-webkit-scrollbar {
    width: 5px;
  }
  
  .suggestions::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .suggestions::-webkit-scrollbar-thumb {
    background: var(--bar-fill);
    border-radius: 3px;
  }
  
  .suggestion-item {
    width: 100%;
    padding: 8px 16px;
    text-align: left;
    background: transparent;
    border: none;
    color: var(--fg);
    transition: background-color 0.2s;
    font-size: 14px;
  }
  
  .suggestion-item:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .suggestion-item:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  .suggestion-item:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
</style>

