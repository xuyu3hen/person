# AI Design System Integration & API Guide

This design system is heavily inspired by the minimalist, high-contrast, and highly accessible interfaces of leading AI companies (Anthropic, OpenAI). It is built with **Next.js**, **React 19**, **Tailwind CSS v4**, and **Framer Motion**.

## 🚀 How to Embed (网闸集成指南)

Since you are operating within a strict network boundary ("网闸"), relying on external CDNs or unvetted npm packages is risky. We designed this "Skill" to be **copy-paste ready** (similar to shadcn/ui).

### Option 1: Direct File Copy (Recommended)
1. Copy `src/components/ui/` to your target project's `components/` directory.
2. Copy the CSS variables from `src/app/globals.css` to your project's main CSS file.
3. Install the required dependencies in your offline environment:
   ```bash
   npm install framer-motion clsx tailwind-merge next-themes lucide-react prismjs
   ```

### Option 2: Internal NPM Registry
If you have an internal Verdaccio or Nexus repository:
1. Extract `src/components/ui` into a separate workspace package (e.g., `@my-org/ui`).
2. Add a `package.json` exporting the components.
3. Publish to your internal registry and `npm install @my-org/ui`.

## 🎨 Themes (5 Presets)
We use `next-themes` and `data-theme` attributes to handle 5 pre-configured palettes:
1. `dark` (OpenAI Dark - Default)
2. `light` (OpenAI Light)
3. `anthropic-dark` (Claude Dark)
4. `anthropic-light` (Claude Light)
5. `monochrome` (High Contrast B&W)

You can switch themes via the `<ThemeSwitcher />` component.

## 📚 Component API

### `<Button />`
A versatile button with built-in spring animations (Framer Motion).
- `variant`: `'default' | 'secondary' | 'outline' | 'ghost'`
- `size`: `'sm' | 'default' | 'lg' | 'icon'`
- **Accessibility**: Properly supports `disabled`, focus rings (`focus-visible`), and screen readers.

### `<Card />`
A modular card component for layout grouping.
- Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### `<Input />`
Form input with robust focus states and error handling.
- Inherits all standard `React.InputHTMLAttributes`.

### `<CodeBlock />`
Syntax-highlighted code blocks using `prismjs`.
- `code` (string): The raw code to display.
- `language` (string): Language for PrismJS (default: `typescript`).
- Features a copy-to-clipboard button.

### `<Navbar />`
A top-level navigation bar that detects scroll position to apply a frosted-glass (`backdrop-blur`) effect dynamically.
