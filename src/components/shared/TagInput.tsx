"use client";
// שדה תגים — מאפשר הוספה/הסרה של תגיות עם Enter או פסיק
import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  maxTags = 20,
  maxTagLength = 30,
  placeholder = "הקלד ולחץ Enter",
}: TagInputProps) {
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
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-lg bg-background min-h-10 focus-within:ring-2 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="h-3.5 w-3.5"
          >
            <X size={10} />
          </Button>
        </Badge>
      ))}
      {!disabled && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-20 h-auto border-none shadow-none focus-visible:ring-0 p-0 text-sm bg-transparent"
        />
      )}
    </div>
  );
}
