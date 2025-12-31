import { useState, useEffect, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { X, Search, ChevronRight, ChevronDown, Folder, Expand, ChevronsUpDown, CheckSquare, Square, Loader2, CheckCircle2 } from "lucide-react";
import type { FileNode } from "../types";
import { getFileIcon } from "../utils/fileIcons";
import { showNotification } from "./Notification";

// Constants
const INITIAL_EXPANDED_FOLDERS = 2;

interface FileSelectionDialogProps {
  folderPath: string;
  onClose: () => void;
  onConfirm: (files: string[]) => void;
}

export default function FileSelectionDialog({
  folderPath,
  onClose,
  onConfirm,
}: FileSelectionDialogProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Build a map of all file paths in the tree
  const allFilePaths = useMemo(() => {
    const paths = new Set<string>();
    const collectPaths = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (!node.is_dir) {
          paths.add(node.path);
        }
        if (node.children) {
          collectPaths(node.children);
        }
      });
    };
    collectPaths(tree);
    return paths;
  }, [tree]);

  // Get all descendant file paths for a node
  const getDescendantFilePaths = useCallback((node: FileNode): string[] => {
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
  }, []);

  useEffect(() => {
    loadTree();
  }, []);

  const loadPreviousSelections = useCallback(async () => {
    if (!folderPath.trim()) return;
    
    try {
      const selections = await invoke<string[]>("get_selections", {
        folderPath: folderPath.trim(),
      });
      
      if (selections.length > 0) {
        setCheckedPaths(new Set(selections));
      }
    } catch (error) {
      console.error("Error loading previous selections:", error);
    }
  }, [folderPath]);

  useEffect(() => {
    if (tree.length > 0 && folderPath.trim()) {
      loadPreviousSelections();
    }
  }, [tree, folderPath, loadPreviousSelections]);

  const loadTree = async () => {
    try {
      setLoading(true);
      const result = await invoke<FileNode[]>("scan_directory", {
        dirPath: folderPath,
      });
      setTree(result);
      
      // Expand first N folders
      const firstFolders = result
        .filter((node) => node.is_dir)
        .slice(0, INITIAL_EXPANDED_FOLDERS)
        .map((node) => node.path);
      setExpandedFolders(new Set(firstFolders));
    } catch (error) {
      console.error("Error scanning directory:", error);
      showNotification(
        `Errore durante la scansione della directory: ${error}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };


  const handleCheckboxChange = (node: FileNode, checked: boolean) => {
    const newChecked = new Set(checkedPaths);
    const descendantPaths = getDescendantFilePaths(node);
    
    if (checked) {
      descendantPaths.forEach((path) => newChecked.add(path));
    } else {
      descendantPaths.forEach((path) => newChecked.delete(path));
    }
    
    setCheckedPaths(newChecked);
  };

  const isChecked = (node: FileNode): boolean => {
    if (!node.is_dir) {
      return checkedPaths.has(node.path);
    }
    // For directories, check if all descendants are checked
    const descendants = getDescendantFilePaths(node);
    return descendants.length > 0 && descendants.every(path => checkedPaths.has(path));
  };

  const isIndeterminate = (node: FileNode): boolean => {
    if (!node.is_dir) return false;
    const descendants = getDescendantFilePaths(node);
    const checkedCount = descendants.filter(path => checkedPaths.has(path)).length;
    return checkedCount > 0 && checkedCount < descendants.length;
  };

  const handleSelectAll = () => {
    setCheckedPaths(new Set(allFilePaths));
  };

  const handleSelectNone = () => {
    setCheckedPaths(new Set());
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const shouldShowNode = (node: FileNode, searchQuery: string): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = node.name.toLowerCase().includes(query);
    
    if (node.children) {
      const childrenMatch = node.children.some(child => shouldShowNode(child, searchQuery));
      return nameMatch || childrenMatch;
    }
    
    return nameMatch;
  };

  const renderTreeNode = (node: FileNode, level: number = 0): JSX.Element | null => {
    if (!shouldShowNode(node, searchQuery)) {
      return null;
    }

    const isExpanded = expandedFolders.has(node.path);
    const checked = isChecked(node);
    const indeterminate = isIndeterminate(node);
    const isFile = !node.is_dir;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1.5 px-2 hover:bg-white/10 transition-colors cursor-pointer rounded-lg`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => {
            // Don't toggle if clicking on chevron button or checkbox
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.tagName === 'INPUT') {
              return;
            }
            
            if (node.is_dir) {
              toggleExpanded(node.path);
            } else {
              // For files, toggle checkbox when clicking on the row
              handleCheckboxChange(node, !checked);
            }
          }}
        >
          {node.is_dir ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.path);
              }}
              className="w-4 h-4 mr-2 flex items-center justify-center flex-shrink-0 hover:bg-white/20 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-white/70" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/70" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4 mr-2 flex-shrink-0" />
          )}

          <input
            type="checkbox"
            checked={checked}
            ref={(input) => {
              if (input) input.indeterminate = indeterminate;
            }}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxChange(node, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 mr-3 text-blue-500 focus:ring-2 focus:ring-blue-400/50 flex-shrink-0 cursor-pointer rounded-md border-2 border-white/30 bg-transparent checked:bg-blue-500 checked:border-blue-500 hover:border-blue-400 transition-all"
            style={{
              accentColor: '#3b82f6',
            }}
          />

          <span className="mr-2 flex-shrink-0">{getFileIcon(node.name)}</span>
          <span className="text-sm text-white flex-1 truncate" title={node.path}>
            {node.name}
          </span>
          {!isFile && (
            <span className="text-xs text-white/60 flex-shrink-0 ml-2">
              Cartella
            </span>
          )}
        </div>

        {node.is_dir && isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleConfirm = () => {
    const selectedFiles = Array.from(checkedPaths).filter(path => allFilePaths.has(path));

    if (selectedFiles.length === 0) {
      showNotification("Seleziona almeno un file!", "warning");
      return;
    }

    // Save selections by folder path
    invoke("save_selection_history", {
      folderPath: folderPath.trim(),
      files: selectedFiles,
    }).catch(console.error);

    onConfirm(selectedFiles);
  };

  const fileCount = allFilePaths.size;
  const selectedCount = Array.from(checkedPaths).filter(path => allFilePaths.has(path)).length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/20">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Source: {folderPath.split(/[/\\]/).pop()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/20 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              const allPaths = new Set<string>();
              const collect = (nodes: FileNode[]) => {
                nodes.forEach((n) => {
                  if (n.is_dir) allPaths.add(n.path);
                  if (n.children) collect(n.children);
                });
              };
              collect(tree);
              setExpandedFolders(allPaths);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/20 backdrop-blur-glass shadow-xs flex items-center gap-2"
          >
            <Expand className="w-4 h-4" />
            Espandi Tutto
          </button>
          <button
            onClick={() => setExpandedFolders(new Set())}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/20 backdrop-blur-glass shadow-xs flex items-center gap-2"
          >
            <ChevronsUpDown className="w-4 h-4" />
            Comprimi Tutto
          </button>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/20 backdrop-blur-glass shadow-xs flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Seleziona Tutti
          </button>
          <button
            onClick={handleSelectNone}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/20 backdrop-blur-glass shadow-xs flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Deseleziona Tutti
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] backdrop-blur-glass border border-white/20">
            <Search className="w-4 h-4 text-white/70 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca file..."
              className="bg-transparent outline-none text-sm text-white placeholder:text-white/50 w-32"
            />
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
              <div className="text-white/70">
                Scansione in corso...
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-white/70 flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scansione in corso...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Scansione completata - {fileCount} file trovati
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-blue-400">
              {selectedCount} file selezionati
            </div>
            <button
              onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20 backdrop-blur-glass shadow-xs"
          >
            Annulla
          </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-xs"
            >
              Conferma Selezione
            </button>
          </div>
        </div>
    </div>
  );
}