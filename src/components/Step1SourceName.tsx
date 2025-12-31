import { useState, useEffect, useRef } from "react";
import { Target } from "lucide-react";

interface Step1SourceNameProps {
  sourceName: string;
  onSourceNameChange: (name: string) => void;
  recentSources: string[];
}

export default function Step1SourceName({
  sourceName,
  onSourceNameChange,
  recentSources,
}: Step1SourceNameProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    onSourceNameChange(name);
    setShowSuggestions(false);
  };

  const filteredSuggestions = recentSources.filter((s) =>
    s.toLowerCase().includes(sourceName.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-white flex items-center gap-2">
        <Target className="w-4 h-4" />
        Step 1: Nome della Source
      </label>
      <div className="relative" ref={inputRef}>
        <input
          type="text"
          value={sourceName}
          onChange={(e) => {
            onSourceNameChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Inserisci il nome della source..."
          className={`w-full h-11 px-4 border transition-all text-white ${
            showSuggestions && filteredSuggestions.length > 0
              ? "border-blue-400 ring-2 ring-blue-400/30"
              : "border-white/20"
          } ${
            sourceName
              ? "bg-black/8 backdrop-blur-glass"
              : "bg-black/6 backdrop-blur-glass text-white/70"
          } focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/50`}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 backdrop-blur-glass border border-white/20 rounded-xl shadow-lg max-h-48 overflow-y-auto hide-scrollbar">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-white/20 text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
