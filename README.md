# Daylock

Your day. Locked. One room at a time.

## Overview

Daylock is a time-based accountability app where you create "rooms" for different activities (Gym, Work, Study, etc.) with specific time windows. Assign accountability partners as admins who set rules and verify your attendance with proof photos.

## Features

- 🏋️ **Time-Based Rooms** - Create rooms with specific time windows
- 👥 **Accountability Partners** - Invite admins to manage each room
- 📸 **Proof Verification** - Submit photo proof during time windows
- 📊 **Attendance Tracking** - Track streaks, perfect days, and stats
- 🔐 **Locked Access** - Miss the time window? Door stays locked
- 📈 **History & Analytics** - View your attendance calendar and trends

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Google OAuth via Supabase

## Getting Started

### Prerequisites

- Node.js 16+
- Supabase account
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IndieJourney-7/daylock.git
cd daylock
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL from `supabase/schema.sql` in the SQL Editor
   - Enable Google OAuth in Authentication → Providers
   - Configure redirect URLs (see below)

5. Start development server:
```bash
npm run dev
```

### Supabase Configuration

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/login` (add 5174, 5175, 5176 for dev)

### Google OAuth Setup

1. Create OAuth 2.0 Client in Google Cloud Console
2. Add authorized origins: `http://localhost:5173`, etc.
3. Add redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase → Authentication → Providers → Google

## Database Schema

See `supabase/schema.sql` for complete schema including:
- Profiles (user data)
- Rooms (time-based activities)
- Room Rules (admin-defined rules)
- Room Invites (admin assignment codes)
- Attendance (daily proof submissions)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Roadmap

- [ ] Push notifications for room reminders
- [ ] PWA installation
- [ ] Mobile app (React Native)
- [ ] Social features (friend challenges)
- [ ] Gamification (achievements, leaderboards)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
