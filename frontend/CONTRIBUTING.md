# Contributing to SocialSync

Welcome to the SocialSync team! We're building the future of relationship management. Please follow these guidelines to ensure code quality and consistency.

## Code Style

We use **Prettier** and **ESLint** to enforce code style.

- **Indentation**: 2 spaces
- **Semicolons**: Yes
- **Quotes**: Single quotes

Run linting before committing:

```bash
npm run lint
```

## Architecture Standards

### 1. BLoC Pattern

- **Logic in Hooks**: Never write business logic inside UI components. Move it to a `use[Feature]` hook in `src/bloc/`.
- **SDK Usage**: UI components should NEVER import `supabase` directly. Always use the appropriate SDK class methods.

### 2. Testing

- **Business Logic**: All new SDK methods and Utils MUST have unit tests in `src/services/*.test.ts` or `src/utils/*.test.ts`.
- **UI Components**: Complex UI components (like cards with state) should have snapshot tests.
- **Coverage**: Aim for 80% coverage on Utils and SDKs.

### 3. Tailwind CSS

- Use utility classes for styling.
- Use the defined color tokens (e.g., `text-neon-violet`, `bg-void-black`) instead of raw hex values.
- For complex conditional styling, use `cn()` utility.

## Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests

**Example:**

```
feat: implement relationship health scoring algorithm
fix: prevent duplicate event creation on double-click
```

## Pull Request Process

1. Create a branch from `main`: `feature/your-feature-name`.
2. Implement your changes.
3. Add tests for new functionality.
4. Update documentation if necessary.
5. Create a PR description explaining the "Why" and "How".

## Getting Started

1. Clone repository
2. `npm install`
3. `cp .env.example .env` (Ask lead for credentials)
4. `npm run dev`
