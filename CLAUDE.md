# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Development
npm run dev                 # Start dev server on localhost:3000
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint

# PM2 Process Management
npm run pm2:dev            # Start dev instance with PM2
npm run pm2:prod           # Start production cluster with PM2
npm run pm2:reload         # Reload PM2 processes
npm run pm2:logs           # View PM2 logs
npm run pm2:monit          # Open PM2 monitor dashboard
```

## Project Architecture

**Next.js 15+ App Router** memoir application with TypeScript, built for couples to share memories, photos, and locations.

### Core Tech Stack
- **Frontend**: Next.js 15.3.2, React 19+, TypeScript
- **Styling**: Tailwind CSS 3.4.1 + custom CSS variables theming
- **State**: React Context for auth + theme management
- **HTTP**: Axios-based API client with token refresh + auto-proxy for dev
- **Location**: AMap integration for location sharing
- **Storage**: Aliyun OSS direct upload with STS tokens

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [route]/(page.tsx)  # Pages for major features
│   ├── globals.css         # Global styles with CSS variables
│   └── layout.tsx          # Root layout with providers
├── components/             # Reusable UI components
│   ├── [ComponentName].tsx # Feature-specific components
│   └── ui/                 # Generic UI primitives
├── services/              # API service layer
│   ├── [feature]-service.ts # Business logic per feature
│   ├── api-client.ts       # Central HTTP client
│   └── api-types.ts        # TypeScript interfaces
├── lib/                   # Core utilities
│   ├── config/env.ts       # Environment configuration
│   └── [feature]/          # Feature-specific utilities
├── contexts/              # React Context providers
│   ├── auth-context.tsx    # Authentication state
│   └── theme-context.tsx   # Theme management
└── styles/                # CSS modules and utilities
```

### Major Features
- **Authentication**: Login/register with JWT token management
- **Albums**: Create/edit/view photo albums with covers
- **Timeline**: Chronological memory timeline with infinite scroll
- **Gallery**: Photo grid with upload via Aliyun OSS
- **Couple Locations**: AMap-integrated location sharing and memories
- **Wishlist**: Shared wishes and goals tracking
- **Personal Info**: User profiles and account settings

## Development Setup

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_PREFIX=/api/v1
NEXT_PUBLIC_AMAP_API_KEY=your_amap_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### API Architecture
- **Base Client**: `src/services/api-client.ts:42`
  - Configurable base URL via environment
  - Automatic token injection + refresh
  - Standard error handling with AxiosError mapping
  - Dev-proxy via next.config.ts rewrite rules

- **Service Pattern**: Feature-specific services (album-service.ts, etc.)
  - Consistent return types via `ApiResponse<T>` interface
  - Auth token management automatically handled

### Key Integration Points

**Aliyun OSS** (`src/lib/services/`):
- STS token-based direct user upload
- Batch album image uploads
- CORS-configured bucket integration

**AMap Integration** (`@uiw/react-amap`):
- Location picker modals
- Couple-focused location sharing
- Address autocomplete and geocoding

**CSS Variables Theming** (`src/app/globals.css`):
- Consistent color scheme definitions
- Dark mode automatic switching
- Reusable component variables

### Common Development Tasks

**Adding new service method**:
1. Extend corresponding `*-service.ts` file
2. Use existing `apiClient.get/post/put/delete` patterns
3. Add TypeScript interface to `api-types.ts`

**Creating new page**:
1. Create `page.tsx` in appropriate `src/app/` directory
2. Use `MainLayout` wrapper for consistent styling
3. Add route-specific styling to component CSS files

**Working with uploads**:
1. Use `useAlbumUpload.ts` for album-centric workflows
2. Access `useOSSUpload.ts` for generic file handling
3. Handle STS token refresh via automatic service layer

### Testing & Quality
- ESLint: Next.js + TypeScript rules with custom warnings
- Type checking: TypeScript with strict mode
- PM2: Production deployment with cluster mode

### Error Handling Patterns
- API errors: `ApiError` class with code/message structure
- Loading states: Full-screen loaders + component spinners
- Auth failures: Automatic redirect to login
- Upload failures: retry mechanism via service layer