#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
use tauri::AppHandle;

// Helper to convert ICO to high-resolution PNG
#[cfg(windows)]
fn convert_ico_to_highres_png(ico_data: &[u8]) -> Result<Vec<u8>, String> {
    // Load ICO using image::load_from_memory which automatically handles the format
    let img =
        image::load_from_memory(ico_data).map_err(|e| format!("Failed to load ICO: {}", e))?;

    // Convert to RGBA8
    let rgba_img = img.to_rgba8();

    // Resize to 256x256 (high resolution for Windows Toast)
    let resized =
        image::imageops::resize(&rgba_img, 256, 256, image::imageops::FilterType::Lanczos3);

    // Encode as PNG
    let dynamic_img = image::DynamicImage::ImageRgba8(resized);

    // Save to memory buffer
    let mut png_data = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut png_data);
        dynamic_img
            .write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    Ok(png_data)
}

// Helper to get the path of the high-resolution PNG icon
// Windows Toast works better with high-resolution PNG (128x128 or larger) instead of ICO
#[cfg(windows)]
fn ensure_notification_icon_available() -> Option<std::path::PathBuf> {
    use std::fs;

    // Try to read PNG 128x128 from runtime directory first
    // Otherwise use embedded ICO and convert to PNG using image library
    let (icon_data, icon_ext) = {
        let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();

        // Try to read PNG from runtime directory
        if let Ok(png_data) = fs::read(exe_dir.join("icons").join("128x128.png")) {
            (png_data, "png")
        } else if let Ok(png_data) = fs::read(exe_dir.join("128x128.png")) {
            (png_data, "png")
        } else if let Ok(png_data) = fs::read(exe_dir.join("icons").join("icon.png")) {
            (png_data, "png")
        } else if let Ok(png_data) = fs::read(exe_dir.join("icon.png")) {
            (png_data, "png")
        } else {
            // Fallback: convert embedded ICO to high-res PNG 256x256
            match convert_ico_to_highres_png(include_bytes!("../../icons/icon.ico")) {
                Ok(png_data) => {
                    eprintln!("Converted ICO to high-res PNG (256x256) for better notification quality");
                    (png_data, "png")
                }
                Err(e) => {
                    eprintln!("Failed to convert ICO to PNG, using ICO: {}", e);
                    (include_bytes!("../../icons/icon.ico").to_vec(), "ico")
                }
            }
        }
    };

    // Try to save icon to executable directory first (more accessible for Windows Toast)
    // Fallback to app data directory, then temp directory
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    
    // First try: executable directory (most accessible for Windows Toast)
    let exe_dir_icon = exe_dir.join(format!("notification_icon.{}", icon_ext));
    if fs::write(&exe_dir_icon, &icon_data).is_ok() {
        eprintln!("Icon saved to executable directory: {}", exe_dir_icon.display());
        return Some(exe_dir_icon);
    }
    
    // Second try: app data directory
    let icon_path = {
        if let Some(data_dir) = dirs::data_dir() {
            let app_data_dir = data_dir.join("file-extractor");
            app_data_dir.join(format!("icon.{}", icon_ext))
        } else {
            // Fallback to temp directory
            std::env::temp_dir().join(format!("file_extractor_icon.{}", icon_ext))
        }
    };

    // Create directory if it doesn't exist
    if let Some(parent) = icon_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            eprintln!("Failed to create icon directory: {}", e);
            return None;
        }
    }

    // Copy icon only if it doesn't exist or has been modified
    let needs_copy = match fs::metadata(&icon_path) {
        Ok(meta) => meta.len() != icon_data.len() as u64,
        Err(_) => true, // File doesn't exist, need to copy
    };

    if needs_copy {
        if let Err(e) = fs::write(&icon_path, &icon_data) {
            eprintln!("Failed to write notification icon: {}", e);
            return None;
        }
        eprintln!("Notification icon (format: {}) copied to: {}", icon_ext, icon_path.display());
    }

    Some(icon_path)
}

/// Show Windows notification with proper icon and app identity
#[cfg(windows)]
pub fn show_windows_notification(
    app: &AppHandle,
    title: &str,
    body: &str,
) -> Result<(), String> {
    eprintln!("Attempting to show notification - Title: '{}', Body: '{}'", title, body);

    // Use PowerShell with XML Toast template that includes icon explicitly
    // This ensures the icon is displayed correctly
    #[cfg(windows)]
    {
        // Try to use dedicated icon file for better results
        let icon_path_opt = ensure_notification_icon_available();

        // Helper for URL encoding path (needed for spaces and special characters)
        // Windows Toast requires file:/// with proper encoding
        let encode_uri = |path: &str| -> String {
            // Convert backslash to forward slash
            let path_normalized = path.replace("\\", "/");
            // For Windows file:/// URIs, we need to encode special characters
            let mut encoded = String::new();
            for ch in path_normalized.chars() {
                match ch {
                    ' ' => encoded.push_str("%20"),
                    '!' => encoded.push_str("%21"),
                    '#' => encoded.push_str("%23"),
                    '$' => encoded.push_str("%24"),
                    '%' => encoded.push_str("%25"),
                    '&' => encoded.push_str("%26"),
                    '\'' => encoded.push_str("%27"),
                    '(' => encoded.push_str("%28"),
                    ')' => encoded.push_str("%29"),
                    '*' => encoded.push_str("%2A"),
                    '+' => encoded.push_str("%2B"),
                    ',' => encoded.push_str("%2C"),
                    ':' => encoded.push_str("%3A"),
                    ';' => encoded.push_str("%3B"),
                    '=' => encoded.push_str("%3D"),
                    '?' => encoded.push_str("%3F"),
                    '@' => encoded.push_str("%40"),
                    '[' => encoded.push_str("%5B"),
                    ']' => encoded.push_str("%5D"),
                    _ => encoded.push(ch),
                }
            }
            // Windows Toast needs file:/// format (three slashes)
            format!("file:///{}", encoded)
        };

        // Get icon path - prefer saved icon, fallback to exe
        let icon_uri = if let Some(icon_path) = icon_path_opt {
            // Verify icon file exists and is readable
            if icon_path.exists() {
                let icon_path_str = icon_path.to_string_lossy().to_string();
                eprintln!("Using icon path: {} (exists: true)", icon_path_str);
                encode_uri(&icon_path_str)
            } else {
                eprintln!("Icon path doesn't exist: {}, using exe", icon_path.display());
                // Fallback: use exe itself (contains embedded icon)
                let exe_path = std::env::current_exe()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                encode_uri(&exe_path)
            }
        } else {
            // Fallback: use exe itself (contains embedded icon)
            let exe_path = std::env::current_exe()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            eprintln!("No icon path available, using exe path as icon: {}", exe_path);
            encode_uri(&exe_path)
        };
        
        eprintln!("Final Icon URI: {}", icon_uri);

        // Create custom XML Toast template with icon
        // Use appLogoOverride placement to show app icon
        let xml_template = format!(
            r#"<toast launch="app-defined-string" scenario="default">
<visual>
<binding template="ToastGeneric">
<text hint-maxLines="1">{}</text>
<text>{}</text>
<image placement="appLogoOverride" hint-crop="circle" src="{}"/>
</binding>
</visual>
<audio src="ms-winsoundevent:Notification.Default" />
</toast>"#,
            title, body, icon_uri
        );
        
        eprintln!("XML Template:\n{}", xml_template);

        // Save XML to temporary file
        let temp_dir = std::env::temp_dir();
        let xml_path = temp_dir.join("file_extractor_notification.xml");
        if let Err(e) = std::fs::write(&xml_path, &xml_template) {
            eprintln!("Failed to write notification XML: {}", e);
        } else {
            // Execute PowerShell to show notification
            let app_id = "File Extractor";
            let ps_script = format!(
                r#"
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

try {{
    $appId = '{}'
    $regPath = 'HKCU:\Software\Classes\AppUserModelId\' + $appId
    $displayName = 'File Extractor'
    
    # Force DisplayName registration before every notification
    # This ensures Windows uses the correct name even if cache was invalidated
    if (-not (Test-Path $regPath)) {{
        New-Item -Path $regPath -Force | Out-Null
    }}
    Set-ItemProperty -Path $regPath -Name DisplayName -Value $displayName -Type String -Force | Out-Null
    Write-Output "DisplayName forced to: $displayName"
    
    # Load and show notification
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml([System.IO.File]::ReadAllText('{}'))
    
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    
    # Create notifier - Windows should automatically use DisplayName if registered
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId)
    $notifier.Show($toast)
    
    Write-Output "Toast notification shown successfully with DisplayName: $displayName"
}} catch {{
    Write-Error "Failed to show toast: $_"
    exit 1
}}
"#,
                app_id,
                xml_path.to_string_lossy().replace("'", "''")
            );

            match std::process::Command::new("powershell")
                .arg("-NoProfile")
                .arg("-NonInteractive")
                .arg("-ExecutionPolicy")
                .arg("Bypass")
                .arg("-Command")
                .arg(&ps_script)
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .output()
            {
                Ok(output) => {
                    // Clean up temp file
                    let _ = std::fs::remove_file(&xml_path);
                    if output.status.success() {
                        eprintln!("✓ Windows Toast notification shown successfully with icon: {}", icon_uri);
                        return Ok(());
                    } else {
                        let error = String::from_utf8_lossy(&output.stderr);
                        eprintln!("✗ PowerShell Toast notification failed: {}, trying fallback", error);
                    }
                }
                Err(e) => {
                    let _ = std::fs::remove_file(&xml_path);
                    eprintln!("✗ Failed to execute PowerShell Toast notification: {}, trying fallback", e);
                }
            }
        }
    }

    // Fallback: Use Tauri API notification
    eprintln!("Trying Tauri API notification as fallback...");
    #[cfg(windows)]
    let icon_path = ensure_notification_icon_available()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .or_else(|| {
            std::env::current_exe().ok().and_then(|exe_path| {
                eprintln!("Using embedded icon from exe: {}", exe_path.display());
                exe_path.to_str().map(|s| s.to_string())
            })
        })
        .unwrap_or_else(|| {
            eprintln!("Cannot get icon path, notification may fail");
            String::new()
        });

    #[cfg(not(windows))]
    let icon_path = String::new();

    if !icon_path.is_empty() {
        use tauri_plugin_notification::NotificationExt;
        match app
            .notification()
            .builder()
            .title(title)
            .body(body)
            .icon(icon_path)
            .show()
        {
            Ok(_) => {
                eprintln!("✓ Tauri API notification shown successfully");
                return Ok(());
            }
            Err(e) => {
                eprintln!("✗ Tauri API notification failed: {}", e);
            }
        }
    }

    // Last fallback: PowerShell Balloon
    #[cfg(windows)]
    {
        eprintln!("Trying PowerShell balloon notification as last fallback...");
        let title_clone = title.to_string();
        let body_clone = body.to_string();
        let ps_script = format!(
            r#"
try {{
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Information
    $notification.BalloonTipTitle = '{}'
    $notification.BalloonTipText = '{}'
    $notification.Visible = $true
    $notification.ShowBalloonTip(5000)
    Start-Sleep -Seconds 6
    $notification.Dispose()
    Write-Output "Notification shown successfully"
}} catch {{
    Write-Error "Failed to show notification: $_"
    exit 1
}}
"#,
            title_clone
                .replace("'", "''")
                .replace("\n", " ")
                .replace("\r", " "),
            body_clone
                .replace("'", "''")
                .replace("\n", " ")
                .replace("\r", " ")
        );

        match std::process::Command::new("powershell")
            .arg("-NoProfile")
            .arg("-NonInteractive")
            .arg("-Command")
            .arg(&ps_script)
            .creation_flags(0x08000000)
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    eprintln!("✓ PowerShell balloon notification shown successfully");
                    return Ok(());
                } else {
                    let error = String::from_utf8_lossy(&output.stderr);
                    eprintln!("✗ PowerShell notification failed: {}", error);
                }
            }
            Err(e) => {
                eprintln!("✗ Failed to execute PowerShell notification: {}", e);
            }
        }
    }

    Err("All notification methods failed".to_string())
}

#[cfg(not(windows))]
pub fn show_windows_notification(
    _app: &AppHandle,
    _title: &str,
    _body: &str,
) -> Result<(), String> {
    Ok(())
}

/// Register the app for Windows Toast notifications
#[cfg(windows)]
pub fn register_app_for_notifications() {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::System::Registry::{RegSetValueExW, HKEY_CURRENT_USER, REG_SZ};

    // Use "File Extractor" as app_id to match what we use in notifications
    let app_id = "File Extractor";
    let exe_path = std::env::current_exe()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    if exe_path.is_empty() {
        eprintln!("Cannot register app for notifications: exe path not found");
        return;
    }

    // Register AppUserModelID in registry with DisplayName and IconUri
    // IMPORTANT: Windows requires this registration BEFORE any notification
    // Use the same app_id as in notifications
    let key_path = format!(r"Software\Classes\AppUserModelId\{}", app_id);
    let display_name = "File Extractor";

    // Try to use dedicated icon file for better results
    let icon_path = ensure_notification_icon_available()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .unwrap_or_else(|| exe_path.clone());

    // Convert strings to wide strings
    let key_path_wide: Vec<u16> = OsStr::new(&key_path).encode_wide().chain(Some(0)).collect();
    let display_name_wide: Vec<u16> = OsStr::new(display_name)
        .encode_wide()
        .chain(Some(0))
        .collect();

    unsafe {
        // Create key if it doesn't exist and set values
        let mut hkey: windows_sys::Win32::Foundation::HANDLE = std::ptr::null_mut();
        let result = windows_sys::Win32::System::Registry::RegCreateKeyExW(
            HKEY_CURRENT_USER,
            key_path_wide.as_ptr(),
            0,
            std::ptr::null(),
            0,
            0x20006, // KEY_WRITE
            std::ptr::null(),
            &mut hkey,
            0 as *mut u32,
        );

        if result == 0 {
            // Set DisplayName (default value of the key)
            RegSetValueExW(
                hkey,
                std::ptr::null(),
                0,
                REG_SZ,
                display_name_wide.as_ptr() as *const u8,
                (display_name_wide.len() * 2) as u32,
            );

            // Set DisplayName as a named value (some Windows versions need both)
            let display_name_value: Vec<u16> = OsStr::new("DisplayName")
                .encode_wide()
                .chain(Some(0))
                .collect();
            RegSetValueExW(
                hkey,
                display_name_value.as_ptr(),
                0,
                REG_SZ,
                display_name_wide.as_ptr() as *const u8,
                (display_name_wide.len() * 2) as u32,
            );

            // Set IconUri
            let icon_uri_value: Vec<u16> =
                OsStr::new("IconUri").encode_wide().chain(Some(0)).collect();
            let icon_path_wide: Vec<u16> = OsStr::new(&icon_path)
                .encode_wide()
                .chain(Some(0))
                .collect();
            RegSetValueExW(
                hkey,
                icon_uri_value.as_ptr(),
                0,
                REG_SZ,
                icon_path_wide.as_ptr() as *const u8,
                (icon_path_wide.len() * 2) as u32,
            );

            // Set Application subkey with executable path (required for proper DisplayName)
            let application_key_path = format!("{}\\Application", key_path);
            let application_key_wide: Vec<u16> = OsStr::new(&application_key_path)
                .encode_wide()
                .chain(Some(0))
                .collect();
            let mut app_hkey: windows_sys::Win32::Foundation::HANDLE = std::ptr::null_mut();
            let app_result = windows_sys::Win32::System::Registry::RegCreateKeyExW(
                HKEY_CURRENT_USER,
                application_key_wide.as_ptr(),
                0,
                std::ptr::null(),
                0,
                0x20006, // KEY_WRITE
                std::ptr::null(),
                &mut app_hkey,
                0 as *mut u32,
            );

            if app_result == 0 {
                // Set the executable path as the default value of Application subkey
                let exe_path_wide: Vec<u16> = OsStr::new(&exe_path)
                    .encode_wide()
                    .chain(Some(0))
                    .collect();
                RegSetValueExW(
                    app_hkey,
                    std::ptr::null(),
                    0,
                    REG_SZ,
                    exe_path_wide.as_ptr() as *const u8,
                    (exe_path_wide.len() * 2) as u32,
                );
                windows_sys::Win32::System::Registry::RegCloseKey(app_hkey);
            }

            windows_sys::Win32::System::Registry::RegCloseKey(hkey);
            eprintln!("App registered for Windows notifications: {}", display_name);
        } else {
            eprintln!("Failed to register app for notifications: 0x{:08X}", result);
        }
    }
}

#[cfg(not(windows))]
pub fn register_app_for_notifications() {
    // No-op on non-Windows platforms
}
