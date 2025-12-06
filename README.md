# Maintenance Knowledge Management System

## Overview

This is a full-stack maintenance knowledge management system built with React, Express, and PostgreSQL. The application allows maintenance teams to document problems, solutions, and machine-related knowledge with role-based access control. It features AI-powered semantic search using OpenAI embeddings to help users find relevant solutions across problems documented in multiple languages (English and French).

The system implements a role hierarchy (Visitor → Editor → Supervisor → Admin) where each role has progressively more permissions, from read-only access to full administrative control over users and content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling

**Design System**: Material Design 3 principles with custom Tailwind configuration
- Typography: Roboto (primary), Roboto Mono (data/codes)
- Color system using CSS custom properties supporting light/dark themes
- Spacing based on Tailwind's spacing scale (2, 4, 6, 8, 12, 16)

**State Management**: 
- TanStack Query (React Query) for server state and API data caching
- React Context for authentication state and theme preferences
- React Hook Form with Zod for form state and validation

**Routing**: wouter for client-side routing (lightweight alternative to React Router)

**Key Features**:
- Responsive sidebar navigation with collapsible mobile drawer
- Role-based UI rendering that shows/hides features based on user permissions
- Dashboard with statistics cards and recent activity
- Advanced filtering for problems (by tags, machine parts, date ranges)
- Semantic search interface with similarity scoring
- CRUD operations for problems with rich form validation
- User management interface (admin only)

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Authentication**: 
- JWT tokens stored in HttpOnly cookies (secure, not accessible to JavaScript)
- bcrypt for password hashing with salt rounds of 10
- Cookie-based sessions for stateless authentication
- Middleware-based role checking with helper functions (canEdit, canManage, isAdmin)

**API Design**: RESTful API with the following structure:
- `/api/auth/*` - Authentication endpoints (login, logout, session validation)
- `/api/users/*` - User management (admin only)
- `/api/problems/*` - CRUD operations for problems with role-based permissions
- `/api/stats` - Dashboard statistics
- `/api/search` - Semantic search endpoint

**Role-Based Access Control**:
- **Visitor**: Read-only access to problems
- **Editor**: Read + create problems
- **Supervisor**: Read, create, update, delete problems
- **Admin**: All permissions + user management

**Middleware Chain**:
1. Cookie parser for authentication tokens
2. JSON body parser with raw body preservation (for webhooks if needed)
3. Authentication middleware validating JWT tokens
4. Role-based authorization middleware for protected routes
5. Logging middleware for request/response tracking

### Data Storage

**Database**: PostgreSQL with Drizzle ORM

**Schema Design**:

**Users Table**:
- UUID primary key with auto-generation
- Unique constraints on username and email
- Role enum field (visitor, editor, supervisor, admin)
- Hashed password storage
- Timestamps for creation and updates

**Problems Table**:
- UUID primary key with auto-generation
- Problem description (text, required)
- Solution description (text, required)
- Machine part (text, optional)
- Tags (text array with default empty array)
- Photos (text array for future file URLs)
- Date timestamp
- Foreign key reference to users (createdBy)
- JSONB field for OpenAI embedding vectors (1536 dimensions)
- Updated timestamp

**Indexing Strategy**: The schema should include indexes on frequently queried fields (tags, machinePart, date) for performance optimization, though not explicitly defined in the current schema file.

**Migration Strategy**: Drizzle Kit for schema migrations with the `db:push` command

### External Dependencies

**OpenAI Integration**:
- API: OpenAI Embeddings API (text-embedding-3-small model)
- Purpose: Generate 1536-dimensional vector embeddings for semantic search
- Implementation: Embeddings stored as JSONB in PostgreSQL, compared using cosine similarity
- Search flow: User query → generate embedding → compare with stored embeddings → rank by similarity

**Key Third-Party Services**:
- OpenAI API for semantic search embeddings (requires OPENAI_API_KEY)
- PostgreSQL database (requires DATABASE_URL environment variable)

**Major NPM Dependencies**:
- **UI/Components**: @radix-ui/* (20+ component primitives), shadcn/ui
- **Forms**: react-hook-form, @hookform/resolvers, zod for validation
- **Data Fetching**: @tanstack/react-query
- **Authentication**: jsonwebtoken, bcrypt, cookie-parser
- **Database**: drizzle-orm, pg (node-postgres)
- **Date Handling**: date-fns
- **Routing**: wouter
- **Styling**: tailwindcss, class-variance-authority, clsx, tailwind-merge

**Development Tools**:
- TypeScript for type safety
- Vite for fast development and optimized production builds
- tsx for TypeScript execution in development
- esbuild for server bundling in production

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings (optional but required for search)
- `SESSION_SECRET`: JWT signing secret (falls back to "fallback-secret-key" in development)
- `NODE_ENV`: Environment mode (development/production)

**Build and Deployment**:
- Client built with Vite to `dist/public`
- Server bundled with esbuild to `dist/index.cjs`
- Static file serving in production from built client
- Development mode uses Vite middleware for HMR