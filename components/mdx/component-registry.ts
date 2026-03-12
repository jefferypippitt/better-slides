import type { MDXRemoteProps } from "next-mdx-remote";
import { type ComponentType, createElement } from "react";
import { mdxBaseComponents } from "@/components/mdx/mdx-components";
import { RuntimeWidget } from "@/components/mdx/runtime-widget";
import { mdxWidgetComponents } from "@/components/mdx/widgets/generated-registry";

type MdxComponentMap = NonNullable<MDXRemoteProps["components"]>;

interface MdxComponentEntry {
  component: ComponentType<Record<string, unknown>>;
  description: string;
  label: string;
}

const COMPONENT_TAG_RE = /<([A-Z][A-Za-z0-9]*)\b/g;

function detectAllComponentLikeTagNames(mdx: string): string[] {
  const names = new Set<string>();
  for (const match of mdx.matchAll(COMPONENT_TAG_RE)) {
    const matchedName = match[1];
    if (!matchedName) {
      continue;
    }
    names.add(matchedName);
  }
  return [...names];
}

function createMissingMdxComponent(
  name: string
): ComponentType<Record<string, unknown>> {
  return function MissingMdxComponent() {
    return createElement(
      "div",
      {
        className:
          "rounded border border-amber-300 bg-amber-50 p-2 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
      },
      `Unknown MDX component: ${name}`
    );
  };
}

export const mdxComponentRegistry: Record<string, MdxComponentEntry> =
  Object.fromEntries(
    Object.entries(mdxWidgetComponents).map(([name, component]) => [
      name,
      {
        component: component as ComponentType<Record<string, unknown>>,
        description: `${name} widget`,
        label: name.replace(/([A-Z])/g, " $1").trim(),
      },
    ])
  );

export type MdxComponentName = Extract<
  keyof typeof mdxComponentRegistry,
  string
>;

export interface RegisteredMdxComponent {
  description: string;
  label: string;
  name: string;
}

export interface UploadedDeckWidget {
  compiledJs: string;
  componentName: string;
}

function createRuntimeDeckWidget(
  compiledJs: string
): ComponentType<Record<string, unknown>> {
  return function RuntimeDeckWidget() {
    return createElement(RuntimeWidget, { compiledJs });
  };
}

function buildRegistry(
  deckWidgets: UploadedDeckWidget[] = []
): Record<string, MdxComponentEntry> {
  const registry: Record<string, MdxComponentEntry> = {
    ...mdxComponentRegistry,
  };
  for (const widget of deckWidgets) {
    registry[widget.componentName] = {
      component: createRuntimeDeckWidget(widget.compiledJs),
      description: `${widget.componentName} uploaded widget`,
      label: widget.componentName.replace(/([A-Z])/g, " $1").trim(),
    };
  }
  return registry;
}

export function detectMdxComponentNames(
  mdx: string,
  deckWidgets: UploadedDeckWidget[] = []
): string[] {
  const names = new Set<string>();
  const validNames = new Set(Object.keys(buildRegistry(deckWidgets)));

  for (const match of mdx.matchAll(COMPONENT_TAG_RE)) {
    const matchedName = match[1];
    if (!(matchedName && validNames.has(matchedName))) {
      continue;
    }
    names.add(matchedName);
  }

  return [...names];
}

export function listDetectedMdxComponents(
  mdx: string,
  deckWidgets: UploadedDeckWidget[] = []
): RegisteredMdxComponent[] {
  const registry = buildRegistry(deckWidgets);
  return detectMdxComponentNames(mdx, deckWidgets).map((name) => {
    const entry = registry[name];
    return {
      description: entry.description,
      label: entry.label,
      name,
    };
  });
}

export function getMdxComponentByName(
  name: string,
  deckWidgets: UploadedDeckWidget[] = []
): ComponentType<Record<string, unknown>> | null {
  const entry = buildRegistry(deckWidgets)[name];
  return entry?.component ?? null;
}

export function resolveMdxComponents(
  mdx: string,
  deckWidgets: UploadedDeckWidget[] = []
): MdxComponentMap {
  const registry = buildRegistry(deckWidgets);
  const resolved: Record<string, unknown> = { ...mdxBaseComponents };
  const detectedKnown = detectMdxComponentNames(mdx, deckWidgets);
  for (const name of detectedKnown) {
    resolved[name] = registry[name].component;
  }
  for (const name of detectAllComponentLikeTagNames(mdx)) {
    if (resolved[name]) {
      continue;
    }
    resolved[name] = createMissingMdxComponent(name);
  }
  return resolved as MdxComponentMap;
}
