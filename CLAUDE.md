# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Run production server
pnpm typecheck    # Type-check with tsc --noEmit
pnpm check        # Lint/format check via Ultracite (Biome)
pnpm fix          # Auto-fix lint/format issues via Ultracite
```

Add shadcn components: `npx shadcn@latest add <component>`

## Architecture

This is a **Next.js 16 App Router** template configured with shadcn/ui as a starting point for new applications.

### Key Directories

- `app/` — App Router pages and root layout. `layout.tsx` wraps the app with `ThemeProvider` and `TooltipProvider`.
- `components/ui/` — 55 pre-built shadcn/ui components (do not lint these; excluded in `biome.jsonc`).
- `components/` — App-level components: `theme-provider.tsx` (next-themes + 'd' hotkey), `theme-toggle.tsx`.
- `hooks/` — Custom hooks (`use-mobile.ts` for 768px breakpoint detection).
- `lib/utils.ts` — `cn()` helper combining `clsx` + `tailwind-merge`.

### Tech Stack

- **React 19** + **TypeScript 5.9** (strict, ES2017 target)
- **Tailwind CSS 4** with OKLch CSS variables for theming (light/dark modes via next-themes)
- **shadcn/ui** using the `radix-nova` style with **Phosphor icons** (`@phosphor-icons/react`)
- **Biome** (via Ultracite) for linting/formatting — configured in `biome.jsonc`
- Path alias: `@/` maps to the project root

### Theming

CSS custom properties are defined in `app/globals.css` for light and dark modes. The theme toggle is fixed top-right in the layout and also togglable with the `d` key (skipped when focus is in an input/textarea).

### Code Quality

Ultracite (Biome-based) is the linting/formatting preset. Run `pnpm fix` before committing. The `components/ui/`, `lib/`, and `hooks/` directories are excluded from linting per `biome.jsonc`.
