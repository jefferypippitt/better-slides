"use client";

import { getMdxComponentByName } from "@/components/mdx/component-registry";

interface UploadedDeckWidgetLike {
  compiledJs: string;
  componentName: string;
}

interface ClientWidgetSlotProps {
  componentName: string;
  uploadedWidgets: UploadedDeckWidgetLike[];
}

export function ClientWidgetSlot({
  componentName,
  uploadedWidgets,
}: ClientWidgetSlotProps) {
  const Component = getMdxComponentByName(componentName, uploadedWidgets);
  if (!Component) {
    return (
      <p className="rounded bg-amber-100 px-2 py-1 text-[11px] text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
        Unknown component: <code>{componentName}</code>
      </p>
    );
  }
  return <Component />;
}
