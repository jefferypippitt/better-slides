"use client";

import { UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";

interface FileDropzoneProps {
  onMdx: (mdx: string) => void;
}

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function FileDropzone({ onMdx }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setError("");
    try {
      // Markdown files: read directly, no AI conversion needed
      if (MARKDOWN_EXTS.has(getExtension(file.name))) {
        const text = await file.text();
        onMdx(text);
        return;
      }

      // All other formats: send to AI conversion endpoint
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Import failed");
      }
      const data = await res.json();
      onMdx(data.mdx);
    } catch {
      setError("Failed to import file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      upload(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      upload(file);
    }
  }

  return (
    <button
      aria-label="Drop file to import or click to browse"
      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-border border-dashed p-8 transition-colors ${
        dragging ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDrop={handleDrop}
      type="button"
    >
      <UploadSimple className="text-muted-foreground" size={32} />
      <div className="text-center">
        <p className="font-medium text-sm">
          {loading ? "Converting with AI…" : "Drop a file to import"}
        </p>
        <p className="text-muted-foreground text-xs">
          MD, MDX — or convert PDF, DOCX, XLSX, CSV, TXT, HTML with AI
        </p>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <input
        accept=".md,.mdx,.pdf,.docx,.xlsx,.xls,.csv,.txt,.html,.htm,.json"
        className="hidden"
        onChange={handleFileInput}
        ref={inputRef}
        type="file"
      />
    </button>
  );
}
