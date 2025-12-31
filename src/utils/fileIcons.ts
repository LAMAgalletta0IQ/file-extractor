export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const icons: Record<string, string> = {
    'py': '🐍', 'pyw': '🐍', 'pyi': '🐍',
    'js': '📜', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️',
    'html': '🌐', 'htm': '🌐', 'css': '🎨', 'scss': '🎨', 'sass': '🎨',
    'txt': '📄', 'md': '📝', 'rst': '📝', 'log': '📋',
    'json': '📊', 'xml': '📋', 'yaml': '📋', 'yml': '📋', 'toml': '⚙️',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🎨', 'ico': '🖼️',
    'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵',
    'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'mkv': '🎬', 'webm': '🎬',
    'zip': '📦', 'rar': '📦', 'tar': '📦', 'gz': '📦', '7z': '📦',
    'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📊', 'xlsx': '📊',
    'cpp': '⚙️', 'c': '⚙️', 'h': '⚙️', 'hpp': '⚙️',
    'java': '☕', 'class': '☕', 'jar': '☕',
    'rs': '🦀', 'go': '🐹', 'swift': '🦉', 'kt': '🎯',
    'rb': '💎', 'php': '🐘', 'pl': '🐪', 'lua': '🌙',
    'sh': '🖥️', 'bash': '🖥️', 'zsh': '🖥️', 'fish': '🐠',
    'exe': '⚡', 'dll': '🔧', 'so': '🔧', 'dylib': '🔧',
    'env': '🔐', 'ini': '⚙️', 'cfg': '⚙️', 'conf': '⚙️',
    'sql': '🗄️', 'db': '🗄️', 'sqlite': '🗄️',
  };
  
  return icons[ext] || '📄';
}
