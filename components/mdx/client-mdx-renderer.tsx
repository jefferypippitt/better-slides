"use client";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useEffect, useMemo, useState } from "react";
import {
  resolveMdxComponents,
  type UploadedDeckWidget,
} from "@/components/mdx/component-registry";

interface ClientMdxRendererProps {
  className?: string;
  emptyText?: string;
  loadingText?: string;
  source: string;
  uploadedWidgets?: UploadedDeckWidget[];
}

export function ClientMdxRenderer({
  className,
  emptyText = "No content",
  loadingText = "Rendering…",
  source,
  uploadedWidgets = [],
}: ClientMdxRendererProps) {
  const [serialized, setSerialized] = useState<MDXRemoteSerializeResult | null>(
    null
  );
  const components = useMemo(
    () => resolveMdxComponents(source, uploadedWidgets),
    [source, uploadedWidgets]
  );

  useEffect(() => {
    let cancelled = false;
    if (!source.trim()) {
      setSerialized(null);
      return () => {
        cancelled = true;
      };
    }
    setSerialized(null);
    serialize(source, { parseFrontmatter: false })
      .then((next) => {
        if (!cancelled) {
          setSerialized(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSerialized(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (serialized) {
    return (
      <div className={className}>
        <MDXRemote {...serialized} components={components} />
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm italic">
        {source.trim() ? loadingText : emptyText}
      </p>
    </div>
  );
}
