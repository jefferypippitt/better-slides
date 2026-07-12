import ts from "typescript";

const DISALLOWED_PATTERNS = [
  /\brequire\s*\(/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bdocument\./,
  /\bwindow\./,
  /\bprocess\./,
  /\beval\s*\(/,
] as const;

const COMPONENT_DECLARATION_RE =
  /export\s+default\s+function\s+([A-Z][A-Za-z0-9]*)\s*\(/;

const NON_ALPHANUMERIC_RE = /[^a-zA-Z0-9]/;

export function toPascalCase(input: string): string {
  return input
    .split(NON_ALPHANUMERIC_RE)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

export function validateSafeWidgetSource(sourceTsx: string): void {
  const sourceFile = ts.createSourceFile(
    "widget.tsx",
    sourceTsx,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    const moduleName = ts.isStringLiteral(statement.moduleSpecifier)
      ? statement.moduleSpecifier.text
      : "";
    const importClause = statement.importClause;
    const isTypeOnly = importClause?.isTypeOnly ?? false;
    if (isTypeOnly) {
      continue;
    }
    const isReactImport = moduleName === "react";
    const isLucideImport = moduleName === "lucide-react";
    const isPhosphorImport = moduleName === "@phosphor-icons/react";
    const isUiImport = moduleName.startsWith("@/components/ui/");
    if (!(isReactImport || isLucideImport || isPhosphorImport || isUiImport)) {
      throw new Error(
        `Unsupported import "${moduleName}". Allowed runtime imports: react, lucide-react, @phosphor-icons/react, and @/components/ui/* (type-only imports are also allowed).`
      );
    }
  }
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(sourceTsx)) {
      throw new Error(
        "Uploaded TSX uses disallowed browser or server APIs. Keep widgets UI-only."
      );
    }
  }
  if (!COMPONENT_DECLARATION_RE.test(sourceTsx)) {
    throw new Error(
      "Widget must export default a PascalCase function component."
    );
  }
}

export function extractDefaultWidgetComponentName(sourceTsx: string): string {
  const match = sourceTsx.match(COMPONENT_DECLARATION_RE);
  const componentName = match?.[1]?.trim();
  if (!componentName) {
    throw new Error(
      "Widget must export default a PascalCase function component."
    );
  }
  return componentName;
}

export function compileWidgetTsx(sourceTsx: string): string {
  validateSafeWidgetSource(sourceTsx);
  const result = ts.transpileModule(sourceTsx, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  if (!result.outputText.trim()) {
    throw new Error("Failed to compile widget TSX.");
  }
  return result.outputText;
}
