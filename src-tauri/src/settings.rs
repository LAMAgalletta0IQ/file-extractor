use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsData {
    pub dark_mode: bool,
    pub recent_sources: Vec<String>,
    pub last_folder: String,
}

impl Default for SettingsData {
    fn default() -> Self {
        Self {
            dark_mode: true,
            recent_sources: Vec::new(),
            last_folder: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceSelection {
    pub files: Vec<String>,
}

fn get_settings_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot find home directory")?;
    let settings_dir = home.join(".source_processor");
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&settings_dir)
        .map_err(|e| format!("Failed to create settings directory: {}", e))?;
    
    Ok(settings_dir)
}

pub fn load_settings() -> Result<SettingsData, String> {
    let settings_file = get_settings_dir()?.join("settings.json");
    
    if !settings_file.exists() {
        return Ok(SettingsData::default());
    }
    
    let content = fs::read_to_string(&settings_file)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    
    let settings: SettingsData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

pub fn save_settings(settings: &SettingsData) -> Result<(), String> {
    let settings_file = get_settings_dir()?.join("settings.json");
    
    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(&settings_file, content)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    
    Ok(())
}

pub fn load_selections(source_name: &str) -> Result<Vec<String>, String> {
    let history_file = get_settings_dir()?.join("history.json");
    
    if !history_file.exists() {
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(&history_file)
        .map_err(|e| format!("Failed to read history file: {}", e))?;
    
    let history: BTreeMap<String, SourceSelection> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse history: {}", e))?;
    
    Ok(history
        .get(source_name)
        .map(|s| s.files.clone())
        .unwrap_or_default())
}

pub fn save_selections(source_name: &str, files: Vec<String>) -> Result<(), String> {
    let history_file = get_settings_dir()?.join("history.json");
    
    let mut history: BTreeMap<String, SourceSelection> = if history_file.exists() {
        let content = fs::read_to_string(&history_file)
            .map_err(|e| format!("Failed to read history file: {}", e))?;
        // Try to parse JSON, if it fails log error and start with empty map
        match serde_json::from_str(&content) {
            Ok(h) => h,
            Err(e) => {
                eprintln!("Warning: Failed to parse history file ({}), starting with empty history", e);
                BTreeMap::new()
            }
        }
    } else {
        BTreeMap::new()
    };
    
    history.insert(
        source_name.to_string(),
        SourceSelection { files: files.clone() },
    );
    
    // Keep only last 20 sources (BTreeMap maintains insertion order by key, so we can reliably remove oldest)
    const MAX_HISTORY_SIZE: usize = 20;
    if history.len() > MAX_HISTORY_SIZE {
        let keys_to_remove: Vec<String> = history
            .keys()
            .take(history.len() - MAX_HISTORY_SIZE)
            .cloned()
            .collect();
        for key in keys_to_remove {
            history.remove(&key);
        }
    }
    
    let content = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;
    
    fs::write(&history_file, content)
        .map_err(|e| format!("Failed to write history file: {}", e))?;
    
    Ok(())
}
