"use client";

import { Component, type ReactNode } from "react";

interface EmbedErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface EmbedErrorBoundaryState {
  hasError: boolean;
}

/**
 * Keeps a broken third-party embed (e.g. a tweet with unexpected data) from
 * crashing the whole editor canvas.
 */
// biome-ignore lint/style/useReactFunctionComponents: React only supports error boundaries as class components.
export class EmbedErrorBoundary extends Component<
  EmbedErrorBoundaryProps,
  EmbedErrorBoundaryState
> {
  state: EmbedErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EmbedErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
