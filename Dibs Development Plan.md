# "Dibs" — Estate Item Sharing App - Development Plan

## Tech Stack

- **Frontend**: React with Vite for fast development
- **Backend**: Supabase (PostgreSQL database + Storage + Auth)
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Image Storage**: Supabase Storage (built-in file hosting)
- **Authentication**: Supabase Auth with 8 pre-configured user accounts
- **Styling**: Tailwind CSS for mobile-first responsive design
- **Deployment**: Frontend on Vercel/Netlify (free), Backend on Supabase (free tier)

## Database Schema (Supabase PostgreSQL)

**profiles** (extends Supabase auth.users)

- id (references auth.users), full_name, created_at

**items**

- id, name, description, image_url, uploaded_by (references profiles), created_at

**claims**

- id, item_id (references items), user_id (references profiles), status ('interested', 'declined'), claimed_at
- Unique constraint on (item_id, user_id)

## Core Features

### 1. Authentication System

- Login page with email/password
- Supabase Auth for session management
- 8 pre-configured user accounts in Supabase Auth
- Simple logout functionality

### 2. Image Upload (Mobile-Optimized)

- Upload page with camera/gallery access on mobile
- File input with image preview before upload
- Optional item name and description fields
- Upload images to Supabase Storage bucket
- Store public URLs in database

### 3. Browse Items Gallery

- Grid layout of item cards (responsive: 1/2/3 columns)
- Each card shows: image, name, description, claim status
- Filter options:
  - All items
  - Items I'm interested in
  - Items I've declined
  - Unclaimed items
  - Items with conflicts (multiple people interested)

### 4. Dibs/Decline Actions

- Each item card has "I want this" and "Not interested" buttons
- Visual indicators for user's current choice
- Ability to change choice (undo dibs or decline)
- Real-time status showing how many people claimed each item

### 5. My Choices View

- Dedicated page showing all user's claims
- Separate sections for "Interested" and "Declined"
- Quick access to change any choice
- Shows conflict warnings (items others also want)

### 6. Conflict Resolution View

- Admin/shared view showing all items with multiple claims
- Lists all users interested in each contested item
- Displays statistics: total items, claimed, conflicts, unclaimed

## File Structure

```
dibs/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── api/           # API client functions
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── db/
│   │   ├── database.js    # SQLite connection
│   │   └── seed.js        # Initial user setup
│   ├── routes/
│   │   ├── auth.js        # Login/logout endpoints
│   │   ├── items.js       # Item CRUD operations
│   │   └── claims.js      # Dibs/decline endpoints
│   ├── middleware/
│   │   └── auth.js        # Session verification
│   ├── uploads/           # Image storage directory
│   └── server.js          # Express app entry point
└── README.md
```

## API Endpoints

**Authentication**

- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user

**Items**

- GET `/api/items` - Get all items with claim counts
- POST `/api/items` - Upload new item with image
- GET `/api/items/:id` - Get single item details
- PUT `/api/items/:id` - Edit item (optional)
- DELETE `/api/items/:id` - Delete item (optional)

**Claims**

- POST `/api/claims` - Create/update claim (dibs or decline)
- GET `/api/claims/mine` - Get current user's claims
- GET `/api/claims/conflicts` - Get items with multiple interested users

## Implementation Notes

1. **Mobile-First Design**: Use large touch targets, optimize for vertical scrolling, support camera upload
2. **Image Handling**: Use multer middleware for uploads, sharp library for compression
3. **Security**: Use bcrypt for password hashing, express-session with secure cookies
4. **Flexible Deployment**: Use environment variables for config (DB path, upload directory, session secret)
5. **Database**: Use better-sqlite3 for synchronous SQLite access

## Future Enhancements (Post-MVP)

- Item categories/tags
- Comments on items
- Export functionality (CSV of final decisions)
- Email notifications for conflicts
- Image galleries (multiple photos per item)
- Cloud storage integration (AWS S3)