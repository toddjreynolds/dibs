# Dibs - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                    (React + Vite + Tailwind)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │  Browse  │  │  Upload  │  │MyChoices │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐                                               │
│  │Conflicts │  Pages (React Router)                        │
│  └──────────┘                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐                                │
│  │ItemCard  │  │  Layout  │  Components (Reusable)         │
│  └──────────┘  └──────────┘                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐                                │
│  │useAuth() │  │AuthContext│  Hooks & Context              │
│  └──────────┘  └──────────┘                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐                       │
│  │   Supabase Client (@supabase)   │  API Layer           │
│  └─────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/WSS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │  PostgreSQL  │  │   Storage    │     │
│  │              │  │   Database   │  │              │     │
│  │ - Sessions   │  │ - profiles   │  │ - item-images│     │
│  │ - JWT tokens │  │ - items      │  │ - Public CDN │     │
│  │ - Users      │  │ - claims     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │  Realtime    │  Real-time subscriptions via WebSocket   │
│  │  (WebSocket) │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User → Login Page
  ↓
  Enter Email/Password
  ↓
  supabase.auth.signInWithPassword()
  ↓
  Supabase Auth validates credentials
  ↓
  JWT token issued (stored in localStorage)
  ↓
  AuthContext updates user state
  ↓
  Redirect to Browse page
```

### 2. Item Upload Flow

```
User → Upload Page
  ↓
  Select/Capture Image
  ↓
  Enter Name & Description
  ↓
  Submit Form
  ↓
  Upload image to Supabase Storage
  ↓
  Get public URL
  ↓
  Insert record into items table
  ↓
  Database trigger updates profiles
  ↓
  Realtime broadcast to all clients
  ↓
  Browse page automatically updates
```

### 3. Claim/Decline Flow

```
User → Click "Want" or "Pass" button
  ↓
  Check if claim exists
  ↓
  If exists → Update status (or delete if same)
  If not → Insert new claim
  ↓
  Update claims table
  ↓
  Realtime broadcast to all clients
  ↓
  All users see updated claim counts
  ↓
  Conflicts page updates if necessary
```

### 4. Real-time Sync Flow

```
User A makes change
  ↓
  Database updated
  ↓
  Supabase Realtime detects change
  ↓
  WebSocket broadcast to subscribed clients
  ↓
  User B, C, D... receive update
  ↓
  React components re-render
  ↓
  UI updates instantly
```

## Component Architecture

### Page Components

```
Login (Public)
├── Email input
├── Password input
└── Submit button

Browse (Protected)
├── Filter pills
├── ItemCard grid
│   ├── ItemCard
│   ├── ItemCard
│   └── ...
└── Statistics panel

Upload (Protected)
├── Image picker/camera
├── Image preview
├── Name input
├── Description textarea
└── Submit button

MyChoices (Protected)
├── Interested section
│   └── ItemCard grid
├── Conflict warning
└── Declined section
    └── ItemCard grid

Conflicts (Protected)
├── Statistics panel
└── Conflict cards
    ├── Image
    ├── Item details
    └── User list
```

### Shared Components

```
Layout
├── Header
│   ├── Logo/Title
│   ├── User email
│   └── Sign out button
├── Main content (children)
└── Navigation
    ├── Browse link
    ├── Upload link
    ├── My Choices link
    └── Conflicts link

ItemCard
├── Image
├── Badges (conflict, status)
├── Name
├── Description
└── Action buttons
    ├── Want button
    └── Pass button
```

## State Management

### Global State (AuthContext)
- `user` - Current user object (or null)
- `loading` - Auth loading state
- `signIn()` - Login function
- `signOut()` - Logout function

### Local Component State
Each page manages its own:
- `items` - Array of items
- `userClaims` - Map of user's claims
- `loading` - Loading state
- `filter` - Current filter selection

### Server State (Supabase)
- Single source of truth
- Optimistic updates not implemented
- Real-time sync keeps all clients updated

## Database Schema

### Tables

```sql
profiles
├── id (UUID, PK, FK → auth.users)
├── full_name (TEXT)
└── created_at (TIMESTAMP)

items
├── id (UUID, PK)
├── name (TEXT)
├── description (TEXT)
├── image_url (TEXT)
├── uploaded_by (UUID, FK → profiles)
└── created_at (TIMESTAMP)

claims
├── id (UUID, PK)
├── item_id (UUID, FK → items)
├── user_id (UUID, FK → profiles)
├── status (TEXT: 'interested' | 'declined')
├── claimed_at (TIMESTAMP)
└── UNIQUE(item_id, user_id)
```

### Relationships

```
auth.users (Supabase)
  ↓ 1:1
profiles
  ↓ 1:many
items (uploaded_by)

items
  ↓ 1:many
claims

profiles
  ↓ 1:many
claims
```

## Security Model

### Row Level Security (RLS)

```sql
profiles:
  SELECT: true (anyone can view)
  UPDATE: auth.uid() = id (users can update own profile)

items:
  SELECT: true (anyone can view)
  INSERT: authenticated users only
  UPDATE: auth.uid() = uploaded_by (own items only)
  DELETE: auth.uid() = uploaded_by (own items only)

claims:
  SELECT: true (anyone can view)
  INSERT: auth.uid() = user_id (own claims only)
  UPDATE: auth.uid() = user_id (own claims only)
  DELETE: auth.uid() = user_id (own claims only)
```

### Storage Policies

```
item-images bucket:
  SELECT: public (anyone can view)
  INSERT: authenticated users only
  UPDATE: authenticated users only
  DELETE: authenticated users only
```

## Routing Structure

```
/ (root)
├── /login (public)
└── Protected routes:
    ├── / (Browse)
    ├── /upload (Upload)
    ├── /my-choices (MyChoices)
    └── /conflicts (Conflicts)

Route Guards:
- AuthContext checks user
- Redirects to /login if not authenticated
- Redirects to / if authenticated on /login
```

## API Integration

### Supabase Client Methods Used

```javascript
// Auth
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
supabase.auth.getSession()
supabase.auth.onAuthStateChange(callback)

// Database
supabase.from('table').select('*')
supabase.from('table').insert(data)
supabase.from('table').update(data).eq('id', id)
supabase.from('table').delete().eq('id', id)

// Storage
supabase.storage.from('bucket').upload(path, file)
supabase.storage.from('bucket').getPublicUrl(path)

// Realtime
supabase.channel('name')
  .on('postgres_changes', { event, schema, table }, callback)
  .subscribe()
```

## Performance Optimizations

### Current
- ✅ Real-time subscriptions (efficient WebSocket)
- ✅ Indexes on database tables
- ✅ Public CDN for images (Supabase Storage)
- ✅ Code splitting via Vite
- ✅ Tailwind CSS purging (production)
- ✅ React.StrictMode for development

### Potential Improvements
- [ ] React Query for caching
- [ ] Optimistic updates
- [ ] Virtual scrolling for large lists
- [ ] Image lazy loading
- [ ] Pagination/infinite scroll
- [ ] Service Worker for offline support

## Deployment Architecture

```
GitHub Repository
  ↓
  push to main
  ↓
Vercel/Netlify Build
  ↓
  npm run build
  ↓
Static Assets
  ↓
  Deploy to Edge CDN
  ↓
Production Site (HTTPS)
  ↓
  API calls
  ↓
Supabase Cloud (managed)
```

## Error Handling

### Client-Side
- Try/catch blocks around async operations
- Console.error for debugging
- User-friendly alert messages
- Loading states to prevent double-submissions

### Server-Side (Supabase)
- Database constraints (UNIQUE, FK)
- Row Level Security denials
- Auth token expiration
- Storage upload limits

## Real-time Synchronization

### Subscriptions Setup

```javascript
// Items subscription
supabase
  .channel('items_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'items'
  }, () => loadData())
  .subscribe()

// Claims subscription
supabase
  .channel('claims_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'claims'
  }, () => loadData())
  .subscribe()
```

### Cleanup
- Subscriptions unsubscribed in useEffect cleanup
- Prevents memory leaks
- Proper React lifecycle integration

## Mobile Considerations

### Touch Targets
- Minimum 44x44px buttons
- Large, easy-to-tap areas
- Adequate spacing between elements

### Camera Integration
```html
<input 
  type="file" 
  accept="image/*" 
  capture="environment"  <!-- Direct camera access -->
/>
```

### Responsive Breakpoints (Tailwind)
- `sm:` 640px (small tablets)
- `md:` 768px (tablets)
- `lg:` 1024px (laptops)

### Navigation
- Bottom nav on mobile (< 768px)
- Top nav on desktop (>= 768px)

## Technology Decisions

### Why React?
- Component reusability
- Large ecosystem
- Great mobile support
- Easy to learn

### Why Vite?
- Faster than Create React App
- Better dev experience
- Smaller bundle sizes
- Modern tooling

### Why Supabase?
- PostgreSQL (powerful, reliable)
- Built-in auth
- Real-time out of the box
- Free tier sufficient
- No backend code needed

### Why Tailwind CSS?
- Rapid development
- Consistent design system
- Mobile-first by default
- Purges unused CSS
- No CSS file management

## Scaling Considerations

### Current Limits (Free Tier)
- 50K monthly active users
- 500 MB database
- 1 GB storage
- 2 GB bandwidth

### When to Scale
- Database > 400 MB → Upgrade Supabase
- Storage > 800 MB → Upgrade or add CDN
- Users > 40K → Upgrade Supabase
- Need 99.9% uptime → Pro tier

### Horizontal Scaling
Supabase handles:
- Database replication
- Load balancing
- CDN distribution
- Auto-scaling

Frontend (Vercel/Netlify):
- Edge CDN
- Global distribution
- Auto-scaling
- No config needed

## Monitoring & Observability

### Available Metrics (Supabase Dashboard)
- API requests/day
- Database size
- Active connections
- Storage usage
- Active users

### Recommended Addition
- Sentry for error tracking
- PostHog for analytics
- LogRocket for session replay

## Development Workflow

```
1. Make changes locally
2. Test in dev server (npm run dev)
3. Check for linter errors (npm run lint)
4. Commit to Git
5. Push to GitHub
6. Auto-deploy via Vercel/Netlify
7. Test in production
```

## Testing Strategy (Recommended)

### Unit Tests
- Component logic
- Hook behavior
- Utility functions

### Integration Tests
- Page interactions
- API calls
- State management

### E2E Tests
- Complete user flows
- Multi-user scenarios
- Real-time sync

## Conclusion

The Dibs app follows modern web development best practices:
- Separation of concerns
- Secure by default
- Mobile-first design
- Real-time collaboration
- Scalable architecture
- Simple deployment

The architecture is designed to be:
- **Simple** - Easy to understand and maintain
- **Secure** - RLS and authentication built-in
- **Scalable** - Can grow with usage
- **Fast** - Real-time updates, optimized assets
- **Reliable** - Managed services, automatic backups

