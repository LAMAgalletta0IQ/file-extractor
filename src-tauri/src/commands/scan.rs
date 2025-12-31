use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

/// List of directory names to ignore (like .gitignore)
const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    "venv",
    ".venv",
    "env",
    ".env",
    "__pycache__",
    ".pytest_cache",
    "target",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".cache",
    ".idea",
    ".vscode",
    ".git",
    ".svn",
    ".hg",
    ".DS_Store",
    "vendor",
    ".bundle",
    ".sass-cache",
    "coverage",
    ".nyc_output",
    ".gradle",
    ".mvn",
    "bin",
    "obj",
    ".vs",
];

fn should_ignore_dir(dir_name: &str) -> bool {
    IGNORED_DIRS.contains(&dir_name.to_lowercase().as_str())
}

/// Validate that the path is safe and exists
fn validate_directory_path(dir_path: &str) -> Result<PathBuf, String> {
    let path = Path::new(dir_path);
    
    // Check if path exists
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", dir_path));
    }
    
    // Check if path is a directory
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", dir_path));
    }
    
    // Canonicalize path to resolve any symlinks and normalize
    let canonical_path = path.canonicalize()
        .map_err(|e| format!("Failed to canonicalize path: {}", e))?;
    
    Ok(canonical_path)
}

#[tauri::command]
pub async fn scan_directory(dir_path: String) -> Result<Vec<FileNode>, String> {
    let base_path = validate_directory_path(&dir_path)?;
    
    let mut root_nodes = Vec::new();
    
    // Recursively scan directory
    scan_directory_recursive(&base_path, &base_path, &mut root_nodes, 0, 6)?;
    
    // Sort: directories first, then files, both alphabetically
    root_nodes.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(root_nodes)
}

fn scan_directory_recursive(
    base_path: &Path,
    dir_path: &Path,
    result: &mut Vec<FileNode>,
    current_depth: usize,
    max_depth: usize,
) -> Result<(), String> {
    if current_depth >= max_depth {
        return Ok(());
    }
    
    // Ensure we don't escape from the base directory (additional safety check)
    // Canonicalize to resolve symlinks
    let canonical_dir = match dir_path.canonicalize() {
        Ok(p) => p,
        Err(_) => {
            // If we can't canonicalize, skip this directory
            return Ok(());
        }
    };
    
    if !canonical_dir.starts_with(base_path) {
        // Path traversal detected - skip this directory
        return Ok(());
    }
    
    let entries = match fs::read_dir(dir_path) {
        Ok(entries) => entries,
        Err(e) => {
            // Log permission errors for debugging but continue gracefully
            eprintln!("Warning: Cannot read directory {:?}: {}", dir_path, e);
            return Ok(());
        }
    };
    
    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        
        let entry_path = entry.path();
        
        // Skip hidden files/directories
        if entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.starts_with('.'))
            .unwrap_or(false)
        {
            continue;
        }
        
        let name = entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| entry_path.to_string_lossy().to_string());
        
        let path_str = entry_path.to_string_lossy().to_string();
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        
        let is_dir = metadata.is_dir();
        
        // Skip ignored directories (like node_modules, venv, etc.)
        if is_dir && should_ignore_dir(&name) {
            continue;
        }
        
        if is_dir {
            let mut children = Vec::new();
            scan_directory_recursive(base_path, &entry_path, &mut children, current_depth + 1, max_depth)?;
            
            result.push(FileNode {
                name,
                path: path_str,
                is_dir: true,
                children: if children.is_empty() { None } else { Some(children) },
            });
        } else {
            result.push(FileNode {
                name,
                path: path_str,
                is_dir: false,
                children: None,
            });
        }
    }
    
    Ok(())
}