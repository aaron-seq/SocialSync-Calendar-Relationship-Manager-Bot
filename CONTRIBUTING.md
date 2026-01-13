# Contributing to SocialSync

Thank you for your interest in contributing to SocialSync. This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a welcoming and inclusive community.

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/SocialSync-Calendar-Relationship-Manager-Bot.git
cd SocialSync-Calendar-Relationship-Manager-Bot

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feature/short-description` - New features
- `fix/issue-description` - Bug fixes
- `docs/what-changed` - Documentation updates
- `refactor/what-changed` - Code refactoring
- `test/what-tested` - Test additions

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Code Standards

### Architecture

We follow the **BLoC (Business Logic Component)** pattern:

```
src/
├── bloc/           # Business logic (data fetching, state, validation)
├── components/     # UI components (purely presentational)
├── pages/          # Route pages (compose components + inject BLoC)
├── services/       # External integrations (Supabase, APIs)
├── types/          # TypeScript interfaces
└── lib/            # Shared utilities
```

### Key Principles

1. **Separation of Concerns**: UI components should be data-agnostic
2. **Error Handling**: Never silently fail; always log and handle errors
3. **Comments**: Write comments that explain "why", not "what"
4. **Types First**: Define types before implementation

### File Structure

```typescript
/**
 * Component/Module Name
 * 
 * Brief description of purpose.
 * 
 * Why this exists:
 * - Reason 1
 * - Reason 2
 */

// IMPORTS - grouped by: external, internal, types
import { external } from 'package';
import { internal } from '@/lib/utils';
import type { MyType } from '@/types';

// CONSTANTS
const MY_CONSTANT = 'value';

// TYPES (if not in types/)
interface LocalType {}

// IMPLEMENTATION
export function myFunction() {}

// EXPORTS (if barrel file)
export { something } from './something';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | kebab-case | `glass-card.tsx` |
| Files (utilities) | kebab-case | `date-utils.ts` |
| Functions | camelCase | `calculateHealth()` |
| Components | PascalCase | `GlassCard` |
| Interfaces/Types | PascalCase | `Contact` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| CSS classes | kebab-case | `glass-card-hover` |

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Examples

```
feat(contacts): add health score calculation

fix(drafts): resolve null pointer in approval flow

docs(readme): update installation instructions

test(bloc): add unit tests for automation policy
```

---

## Pull Request Process

### Before Opening a PR

1. **Update from main**: `git pull origin main`
2. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
3. **Self-review**: Check your own code for obvious issues

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All checks pass
```

### Review Process

1. At least one approval required
2. All CI checks must pass
3. No unresolved comments
4. Squash merge to main

---

## Questions?

Open an issue with the `question` label or reach out to the maintainers.
