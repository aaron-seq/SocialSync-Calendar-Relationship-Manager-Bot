# SocialSync: Calendar Relationship Manager Bot

A personal CRM with AI-powered automation for managing relationships and automating personalized messages.

## Features

- **Contact Management**: Track relationships with intimacy levels and health scores
- **Event Tracking**: Birthdays, anniversaries, promotions with smart reminders
- **AI Drafting**: Automated personalized message generation
- **Smart Automation**: Hierarchical auto-send vs review policies
- **Dark UI**: Modern glassmorphism "Nocturnal Glass" interface

## Project Structure

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
