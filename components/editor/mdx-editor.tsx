"use client";

import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

interface MdxEditorProps {
  onChange: (value: string) => void;
  value: string;
}

export function MdxEditor({ value, onChange }: MdxEditorProps) {
  return (
    <CodeMirror
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
      }}
      className="h-full overflow-auto text-sm"
      extensions={[markdown()]}
      height="100%"
      onChange={onChange}
      theme={oneDark}
      value={value}
    />
  );
}
