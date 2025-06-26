# Agent Development Guide

## Build/Lint/Test Commands
- `pnpm f:debugger dev` - Start Next.js dev server for mini-app-debugger
- `pnpm f:debugger build` - Build mini-app-debugger for production
- `pnpm f:debugger lint` - Run ESLint on mini-app-debugger
- `pnpm f:debugger start` - Start production server for mini-app-debugger
- No test command configured yet - tests need to be set up

## Architecture & Structure
- **Monorepo**: pnpm workspace with packages in `packages/` directory
- **Main project**: `packages/mini-app-debugger` - Next.js 15 app with React 19
- **UI Framework**: Tailwind CSS 4 with shadcn/ui components and Radix UI primitives
- **State**: React hooks and context (SidebarProvider pattern)
- **Icons**: Lucide React

## Code Style & Conventions
- **Formatting**: Prettier with default config (`{}`)
- **Linting**: ESLint with TypeScript and React recommended configs
- **TypeScript**: Strict mode enabled, ES2021 target
- **Imports**: Use `@/` alias for internal imports (components, lib, hooks)
- **Components**: Store UI components in `components/ui/`, feature components in `components/[Feature]/`
- **Utilities**: Use `cn()` from `lib/utils.ts` for conditional className merging
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File structure**: Keep related files grouped by feature/domain
