"use client";
import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
}

export default function TagInput({ value, onChange, maxTags = 20, maxTagLength = 30, placeholder = "הקלד ולחץ Enter" }: TagInputProps) {
  const [input, setInput] = useState("");
  const disabled = value.length >= maxTags;

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || tag.length > maxTagLength || value.includes(tag) || disabled) return;
    onChange([...value, tag]);
    setInput("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-white min-h-[42px] focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="hover:text-teal-900">
            <X size={10} />
          </button>
        </span>
      ))}
      {!disabled && (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent placeholder:text-gray-300"
        />
      )}
    </div>
  );
}
