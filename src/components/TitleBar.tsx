import { X, Minus } from "lucide-react";
import { appWindow } from "@tauri-apps/api/window";

export default function TitleBar() {
  const handleClose = () => {
    appWindow.close();
  };

  const handleMinimize = () => {
    appWindow.minimize();
  };


  return (
    <div
      className="h-14 flex items-center justify-between px-5 border-b border-white/20 flex-shrink-0 relative"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        overflow: 'hidden',
      }}
      data-tauri-drag-region
    >
      {/* Title - centered */}
      <div
        className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center gap-2 font-bold text-base text-white pointer-events-none"
        data-tauri-drag-region
      >
        <img src="/icon.ico" alt="File Extractor Icon" className="w-5 h-5" />
        File Extractor
      </div>

      {/* Window controls on the right */}
      <div className="flex items-center gap-2 ml-auto relative z-10">
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full hover:opacity-80 flex items-center justify-center transition-all group border-none outline-none"
          style={{ backgroundColor: '#FFBD2E' }}
        >
          <Minus className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          disabled
          className="w-3 h-3 rounded-full flex items-center justify-center cursor-default opacity-50 border-none outline-none"
          style={{ backgroundColor: '#28C840' }}
        >
        </button>
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full hover:opacity-80 flex items-center justify-center transition-all group border-none outline-none"
          style={{ backgroundColor: '#FF5F57' }}
        >
          <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}
