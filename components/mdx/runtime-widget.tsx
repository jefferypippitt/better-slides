"use client";

import { icons as lucideIcons } from "lucide-react";
import React, { useMemo } from "react";
import { runtimeUiModules } from "@/components/ui/runtime-widget-modules";

interface RuntimeWidgetProps {
  compiledJs: string;
}

function getRuntimeComponent(
  compiledJs: string
): React.ComponentType<Record<string, unknown>> | null {
  try {
    const runtimeModules: Record<string, unknown> = {
      react: { ...React, default: React },
      "lucide-react": { ...lucideIcons },
      ...runtimeUiModules,
    };
    const runtimeRequire = (moduleName: string): unknown => {
      const moduleValue = runtimeModules[moduleName];
      if (moduleValue === undefined) {
        throw new Error(`Unsupported runtime import: ${moduleName}`);
      }
      return moduleValue;
    };
    const exportsRef: Record<string, unknown> = {};
    const moduleRef: { exports: Record<string, unknown> } = {
      exports: exportsRef,
    };
    // eslint-disable-next-line no-new-func
    const runner = new Function(
      "React",
      "exports",
      "module",
      "require",
      compiledJs
    );
    runner(React, exportsRef, moduleRef, runtimeRequire);
    const candidate =
      (moduleRef.exports.default as React.ComponentType<
        Record<string, unknown>
      >) ??
      (exportsRef.default as React.ComponentType<Record<string, unknown>>) ??
      null;
    return candidate;
  } catch {
    return null;
  }
}

export function RuntimeWidget({ compiledJs }: RuntimeWidgetProps) {
  const Component = useMemo(
    () => getRuntimeComponent(compiledJs),
    [compiledJs]
  );
  if (!Component) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        Unable to render uploaded widget.
      </div>
    );
  }
  return <Component />;
}
