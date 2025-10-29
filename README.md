# Augmented Memories Scrapbook

A virtual scrapbook where users can upload media tied to GPS locations, timestamps, and short descriptions. View memories on an interactive map with beautiful UI and seamless user experience.

## Features

- 🗺️ **Interactive Map**: View memories on a beautiful Mapbox-powered map
- 📸 **Media Upload**: Upload photos and videos with drag-and-drop interface
- 📍 **Location Tagging**: Automatically capture GPS coordinates and addresses
- 🏷️ **Tagging System**: Organize memories with custom tags
- 🔒 **Privacy Controls**: Choose between public and private memories
- 🔍 **Search & Filter**: Find memories by title, description, or tags
- 👤 **User Authentication**: Secure login with Google OAuth
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🎨 **Modern UI**: Beautiful, intuitive interface with smooth animations

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Maps**: Mapbox GL JS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Lucide React icons
- **Styling**: Custom CSS with modern design patterns
- **File Upload**: React Dropzone

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Mapbox account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd mapory
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the database schema:

```bash
# Copy the contents of supabase-setup.sql and run in Supabase SQL Editor
```

4. Enable Google OAuth in Authentication > Providers
5. Create a storage bucket named `memory-media` (public)

### 3. Set up Mapbox

1. Create an account at [mapbox.com](https://mapbox.com)
2. Get your access token from your account dashboard

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

### 5. Run the Application

```bash
npm run dev
```

Open [https://mapory-4j8w.vercel.app/
](https://mapory-4j8w.vercel.app/) to view it in the browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── Map.tsx         # Interactive map component
│   ├── MemoryForm.tsx  # Memory creation form
│   └── MemoryDisplay.tsx # Memory viewing modal
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client configuration
│   └── mapbox.ts       # Mapbox configuration
├── types/              # TypeScript type definitions
│   └── index.ts        # Main type definitions
├── App.tsx             # Main application component
├── App.css             # Global styles
└── main.tsx            # Application entry point
```

## Database Schema

The application uses two main tables:

### `memories`

- Stores memory data with location, media, and metadata
- Includes RLS policies for user privacy
- Supports full-text search and location-based queries

### `profiles`

- Extends Supabase auth.users
- Stores user profile information

## Key Features Explained

### Memory Creation

- Click anywhere on the map to select a location
- Upload multiple photos/videos with drag-and-drop
- Add title, description, and tags
- Choose privacy settings (public/private)

### Memory Viewing

- Click map markers to view memories
- Full-screen media viewing
- Download media files
- Share memories with others

### Search & Discovery

- Search by title or description
- Filter by tags
- View public memories from other users
- Location-based memory discovery

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any static hosting service:

- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check the console for errors
2. Verify your environment variables
3. Ensure Supabase and Mapbox are properly configured
4. Open an issue on GitHub

## Roadmap

- [ ] Memory editing functionality
- [ ] Advanced filtering (date ranges, location radius)
- [ ] Memory collections/albums
- [ ] Social features (likes, comments)
- [ ] Offline support
- [ ] Mobile app (React Native)
- [ ] AI-powered memory suggestions
- [ ] Export memories to PDF/photo books
