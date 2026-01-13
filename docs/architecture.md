# Architecture Overview

SocialSync follows a layered architecture with clear separation of concerns between UI, business logic, and data access.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Dashboard  │  │   Calendar  │  │  War Room   │  │  Contacts   │    │
│  │    Page     │  │    Page     │  │    Page     │  │    Page     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐    │
│  │                     UI COMPONENTS                               │    │
│  │  GlassCard │ OrbitView │ Timeline │ DraftCard │ ErrorBoundary  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Props / Events
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LOGIC LAYER (BLoC)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ contacts.bloc   │  │  events.bloc    │  │  drafts.bloc    │          │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤          │
│  │ useContacts()   │  │ useEvents()     │  │ useDrafts()     │          │
│  │ filterContacts()│  │ groupByDate()   │  │ approve/reject()|          │
│  │ sortContacts()  │  │ calcDaysUntil() │  │ determinePolicy│          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                    │
│  ┌────────┴────────────────────┴────────────────────┴────────┐          │
│  │                        HOOKS                               │          │
│  │  React hooks that encapsulate async data fetching         │          │
│  │  and state management with loading/error states           │          │
│  └────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Function calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │   supabase.service.ts       │  │      logger.ts              │      │
│  ├─────────────────────────────┤  ├─────────────────────────────┤      │
│  │ - Connection management     │  │ - Structured logging        │      │
│  │ - Retry logic (3 attempts)  │  │ - log(debug|info|warn|error)│      │
│  │ - Error handling            │  │ - Performance timing        │      │
│  │ - Type transformations      │  │ - Error wrapping            │      │
│  └──────────────┬──────────────┘  └─────────────────────────────┘      │
│                 │                                                        │
└─────────────────┼────────────────────────────────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (Supabase)                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      PostgreSQL Database                         │    │
│  │  contacts │ events │ interaction_logs │ message_queue │ assets  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Row Level Security (RLS)                      │    │
│  │  Users can only access their own data via auth.uid()            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
SocialSync-Calendar-Relationship-Manager-Bot/
├── database/
│   └── schema.sql              # PostgreSQL schema with RLS
├── docs/
│   ├── architecture.md         # This file
│   └── automation_policy.md    # Auto-send vs Review logic
├── frontend/
│   ├── src/
│   │   ├── bloc/               # Business logic components
│   │   │   ├── contacts.bloc.ts
│   │   │   ├── events.bloc.ts
│   │   │   └── drafts.bloc.ts
│   │   ├── components/         # UI components
│   │   │   ├── ui/             # Primitives (GlassCard, etc.)
│   │   │   ├── orbit-view/     # Orbit visualization
│   │   │   ├── calendar/       # Timeline components
│   │   │   └── error-boundary.tsx
│   │   ├── layouts/            # Page layouts
│   │   ├── lib/                # Shared utilities
│   │   │   ├── utils.ts        # General helpers
│   │   │   └── logger.ts       # Structured logging
│   │   ├── pages/              # Route pages
│   │   ├── services/           # External integrations
│   │   │   └── supabase.service.ts
│   │   ├── styles/             # CSS
│   │   └── types/              # TypeScript interfaces
│   └── __tests__/              # Unit tests
├── .github/workflows/          # CI/CD
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

## Key Design Decisions

### ADR-001: BLoC Pattern for Business Logic

**Context**: Need to separate business logic from UI components for testability and maintainability.

**Decision**: Adopt the BLoC pattern where each domain (contacts, events, drafts) has its own file containing:
- Pure business logic functions
- React hooks for data fetching
- Type definitions

**Consequences**:
- UI components become purely presentational
- Business logic is testable in isolation
- Clear dependency direction (UI -> BLoC -> Services)

### ADR-002: Hierarchical Automation Policy

**Context**: Need flexible rules for when messages auto-send vs require review.

**Decision**: Implement 3-level hierarchy:
1. Event override (highest priority)
2. Contact default policy
3. Event significance (fallback)

**Consequences**:
- Fine-grained control per event
- Sensible defaults per contact
- Safety fallback for high-significance events

### ADR-003: Demo Mode for Development

**Context**: Allow development without Supabase configuration.

**Decision**: When VITE_SUPABASE_URL is not set, fall back to hardcoded demo data.

**Consequences**:
- Easy onboarding for new developers
- UI can be developed independently of backend
- Clear separation between demo and production modes
