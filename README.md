# SocialSync - AI Relationship Manager (2026 Edition)

SocialSync is a "High-Touch" Relationship Management PWA designed to help you stay connected with your network through intelligent, AI-driven interactions.

## 🚀 Features

- **Dynamic Health Scoring**: Automatically tracks relationship health based on interaction frequency and intimacy.
- **AI Drafts**: Generates context-aware message drafts for birthdays, anniversaries, and check-ins.
- **Zero-Touch Sync**: Real-time synchronization across devices using Supabase Realtime.
- **PWA Ready**: Installable on mobile/desktop with offline support.
- **Immersive UI**: Glassmorphism design with ambient animations and "2026" aesthetics.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **State**: Custom BLoC Pattern (Hooks)
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Postgres, Realtime, Edge Functions)
- **Testing**: Vitest, React Testing Library

## 📂 Project Structure

```
frontend/
├── src/
│   ├── bloc/          # Business Logic Components (State)
│   ├── components/    # UI Components
│   ├── services/      # SDK Layer (Supabase interactions)
│   ├── hooks/         # Utility Hooks
│   ├── utils/         # Helpers (Math, Date Logic)
│   └── test/          # Test Setup
├── docs/              # Architecture & API documentation
└── public/            # Static Assets
```

## 🚦 Getting Started

1. **Clone & Install**

   ```bash
   git clone https://github.com/your-repo/socialsync.git
   cd socialsync/frontend
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and add your Supabase credentials.

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm run test
   ```

## 📖 Documentation

- [Architecture Overview](frontend/docs/architecture.md)
- [API Reference](frontend/docs/api-reference.md)
- [Contributing Guidelines](frontend/CONTRIBUTING.md)

## 📱 PWA Features

- **Offline Mode**: Core assets are cached via Service Worker.
- **Installable**: Supports "Add to Homescreen" on iOS/Android.
- **Push Notifications**: Integrated (requires permission).
- **AI Drafting**: Automated personalized message generation
- **Smart Automation**: Hierarchical auto-send vs review policies
- **Dark UI**: Modern glassmorphism "Nocturnal Glass" interface

```
SocialSync-Calendar-Relationship-Manager-Bot/
├── database/
│   └── schema.sql          # PostgreSQL schema for Supabase
├── docs/
│   └── automation_policy.md # Auto-send vs Review logic
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── layouts/        # Dashboard layouts
│   │   ├── pages/          # Route pages
│   │   └── styles/         # Tailwind CSS globals
│   └── package.json
└── README.md
```

## Database Schema

The PostgreSQL schema includes:

- `contacts` - User relationships with automation defaults
- `events` - Triggers with override policies
- `interaction_logs` - AI context memory
- `message_queue` - Draft management
- `user_assets` - Context injection data
- `user_preferences` - Global settings

## Quick Start

### Database Setup

1. Create a new Supabase project
2. Run `database/schema.sql` in the SQL Editor
3. Configure Row Level Security (included in schema)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## License

MIT
