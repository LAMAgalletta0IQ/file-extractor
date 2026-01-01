use std::fs;
use std::io::Write;
use std::path::Path;
use std::sync::atomic::Ordering;
use scopeguard;
use crate::GENERATION_RUNNING;

// Constants for resource limits
const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024; // 50MB

#[tauri::command]
pub async fn generate_output(
    selected_paths: Vec<String>,
    source_name: String,
    output_path: String,
) -> Result<String, String> {
    // Check if a generation is already in progress
    if GENERATION_RUNNING.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
        return Err("Generation already in progress, please wait for completion".to_string());
    }
    
    // Use scopeguard to ensure the flag is always released
    // even in case of panic or early return
    let _guard = scopeguard::guard((), |_| {
        GENERATION_RUNNING.store(false, Ordering::SeqCst);
    });
    
    let output_path = Path::new(&output_path);
    
    // Create output file
    let mut output_file = fs::File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    
    // Write header
    writeln!(output_file, "{}", "=".repeat(40))
        .map_err(|e| format!("Failed to write header: {}", e))?;
    writeln!(output_file, "{}", source_name)
        .map_err(|e| format!("Failed to write source name: {}", e))?;
    writeln!(output_file, "{}", "=".repeat(40))
        .map_err(|e| format!("Failed to write header: {}", e))?;
    writeln!(output_file)
        .map_err(|e| format!("Failed to write newline: {}", e))?;
    
    // Process each selected file
    for file_path in selected_paths {
        let path = Path::new(&file_path);
        
        // Write file markers
        writeln!(output_file, "=== PATH: {} ===", file_path)
            .map_err(|e| format!("Failed to write path marker: {}", e))?;
        
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&file_path);
        
        writeln!(output_file, "=== NAME: {} ===", file_name)
            .map_err(|e| format!("Failed to write name marker: {}", e))?;
        
        // Try to read file with encoding fallback
        let content = match read_file_with_fallback(&file_path) {
            Ok(content) => content,
            Err(e) => {
                writeln!(output_file, "[Error: unable to read file - {}]", e)
                    .map_err(|e| format!("Failed to write error: {}", e))?;
                writeln!(output_file)
                    .map_err(|e| format!("Failed to write newline: {}", e))?;
                continue;
            }
        };
        
        // Write file content
        write!(output_file, "{}", content)
            .map_err(|e| format!("Failed to write content: {}", e))?;
        writeln!(output_file)
            .map_err(|e| format!("Failed to write newline: {}", e))?;
        writeln!(output_file)
            .map_err(|e| format!("Failed to write newline: {}", e))?;
    }
    
    Ok(format!(
        "File generated successfully!\n\n📄 {}\n📁 {}",
        output_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("output.txt"),
        output_path
            .parent()
            .and_then(|p| p.to_str())
            .unwrap_or("")
    ))
}

/// Try to read file as UTF-8, fallback to Latin-1, or return error message
fn read_file_with_fallback(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);
    
    // Check file size before reading
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    if metadata.len() > MAX_FILE_SIZE {
        return Err(format!(
            "File too large: {}MB (max: {}MB)",
            metadata.len() / (1024 * 1024),
            MAX_FILE_SIZE / (1024 * 1024)
        ));
    }
    
    // First try: UTF-8
    match fs::read_to_string(path) {
        Ok(content) => return Ok(content),
        Err(e) => {
            // If it's not a UTF-8 decode error, return immediately
            if e.kind() != std::io::ErrorKind::InvalidData {
                return Err(format!("Failed to read file: {}", e));
            }
        }
    }
    
    // Second try: Latin-1 (ISO-8859-1)
    // Read as bytes and convert assuming Latin-1
    match fs::read(path) {
        Ok(bytes) => {
            // Additional safety check for size
            if bytes.len() as u64 > MAX_FILE_SIZE {
                return Err(format!(
                    "File too large: {}MB (max: {}MB)",
                    bytes.len() / (1024 * 1024),
                    MAX_FILE_SIZE / (1024 * 1024)
                ));
            }
            let content: String = bytes.iter().map(|&b| b as char).collect();
            Ok(content)
        }
        Err(e) => Err(format!("Failed to read file as binary: {}", e)),
    }
}
