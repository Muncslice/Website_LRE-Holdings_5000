# LRE HOLDINGS - B2B Inventory & Logistics Platform

## Project Overview
A centralized B2B portal for managing consignment inventory, financial settlements, and delivery logistics with offline-capable driver interface.

## Design Guidelines

### Design References
- **Stripe Dashboard**: Clean data tables, high information density
- **Linear.app**: Minimalist UI, excellent typography hierarchy
- **Industrial Aesthetic**: Functional, no-nonsense design

### Color Palette
- **Primary Background**: #0f172a (Slate 900 - Deep Navy)
- **Secondary Background**: #1e293b (Slate 800 - Cards/Panels)
- **Surface**: #334155 (Slate 700 - Elevated elements)
- **Accent**: #FF6B35 (Safety Orange - CTAs, alerts, active states)
- **Success**: #10b981 (Emerald 500)
- **Warning**: #f59e0b (Amber 500)
- **Error**: #ef4444 (Red 500)
- **Text Primary**: #f8fafc (Slate 50)
- **Text Secondary**: #cbd5e1 (Slate 300)
- **Border**: #475569 (Slate 600)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Heading 1**: Inter 700 (32px) - Page titles
- **Heading 2**: Inter 600 (24px) - Section headers
- **Heading 3**: Inter 600 (18px) - Card titles
- **Body Large**: Inter 500 (16px) - Primary content
- **Body Normal**: Inter 400 (14px) - Standard text
- **Body Small**: Inter 400 (12px) - Labels, metadata
- **Button**: Inter 600 (14px) - All buttons

### Component Styles

#### Buttons
- **Primary**: Orange background (#FF6B35), white text, 8px rounded, hover: brighten 10%
- **Secondary**: Slate 700 background, white text, 8px rounded, hover: Slate 600
- **Ghost**: Transparent, Slate 300 text, hover: Slate 800 background
- **Danger**: Red 600 background, white text
- **Driver Touch Targets**: Minimum 48px height for mobile

#### Cards
- **Background**: Slate 800 (#1e293b)
- **Border**: 1px Slate 700 (#334155)
- **Rounded**: 12px
- **Padding**: 24px (desktop), 16px (mobile)
- **Hover**: Lift 4px with shadow, 200ms transition

#### Tables
- **Header**: Slate 700 background, Slate 300 text, 12px uppercase
- **Row**: Slate 800 background, 1px Slate 700 border
- **Hover**: Slate 700 background
- **Zebra Striping**: Alternate rows with Slate 800/Slate 850

#### Forms
- **Input**: Slate 700 background, Slate 600 border, focus: Orange border
- **Label**: Slate 300, 12px uppercase, 600 weight
- **Error**: Red 500 text, Red 900/20 background

#### Status Badges
- **WAREHOUSE**: Blue 500 background
- **TRANSIT**: Yellow 500 background
- **CONSIGNED**: Purple 500 background
- **SOLD**: Green 500 background
- **RETURNED**: Red 500 background

### Layout & Spacing
- **Max Width**: 1440px (desktop), full width (mobile)
- **Sidebar**: 280px fixed (desktop), slide-over (mobile)
- **Section Padding**: 32px vertical, 24px horizontal
- **Card Gaps**: 24px (desktop), 16px (mobile)
- **Touch Targets (Driver)**: Minimum 48px × 48px

### Images to Generate
1. **hero-warehouse-industrial.jpg** - Modern warehouse interior with organized inventory, industrial lighting (Style: photorealistic, high contrast)
2. **icon-barcode-scanner.png** - Minimalist barcode scanner icon, orange accent (Style: vector-style, transparent background)
3. **icon-delivery-truck.png** - Delivery truck icon, industrial style (Style: vector-style, transparent background)
4. **placeholder-signature.png** - Signature pad placeholder graphic (Style: minimalist, grayscale)

---

## Database Schema

### Tables Structure

#### users (extends auth.users)
- id (uuid, pk, references auth.users)
- role (enum: 'admin', 'affiliate', 'driver')
- status (enum: 'active', 'suspended')
- full_name (text)
- email (text)
- phone (text)
- created_at (timestamptz)
- deleted_at (timestamptz, nullable)

#### inventory
- id (uuid, pk)
- sku (text, unique)
- product_name (text)
- description (text)
- category (text)
- unit_cost (decimal)
- retail_price (decimal)
- status (enum: 'WAREHOUSE', 'TRANSIT', 'CONSIGNED', 'SOLD', 'RETURNED')
- location (text) - warehouse location or affiliate_id
- search_vector (tsvector) - for full-text search
- barcode (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)

#### consignments
- id (uuid, pk)
- affiliate_id (uuid, fk -> users.id)
- inventory_id (uuid, fk -> inventory.id)
- quantity (integer)
- consigned_date (timestamptz)
- return_date (timestamptz, nullable)
- status (enum: 'PENDING', 'CONFIRMED', 'PARTIAL', 'RETURNED')
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)

#### deliveries
- id (uuid, pk)
- driver_id (uuid, fk -> users.id)
- consignment_id (uuid, fk -> consignments.id)
- delivery_address (text)
- scheduled_date (timestamptz)
- completed_date (timestamptz, nullable)
- status (enum: 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')
- route_priority (integer)
- signature_url (text, nullable)
- photo_url (text, nullable)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)

#### payments
- id (uuid, pk)
- affiliate_id (uuid, fk -> users.id)
- consignment_id (uuid, fk -> consignments.id)
- amount (decimal)
- payment_type (enum: 'SALE', 'RETURN', 'ADJUSTMENT')
- payment_date (timestamptz)
- status (enum: 'PENDING', 'COMPLETED', 'CANCELLED')
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)

#### audit_logs
- id (uuid, pk)
- table_name (text)
- record_id (uuid)
- action (enum: 'INSERT', 'UPDATE', 'DELETE')
- old_data (jsonb, nullable)
- new_data (jsonb)
- user_id (uuid, fk -> users.id)
- created_at (timestamptz)

#### issues
- id (uuid, pk)
- affiliate_id (uuid, fk -> users.id)
- inventory_id (uuid, fk -> inventory.id)
- issue_type (enum: 'DAMAGE', 'MISSING', 'MISMATCH', 'OTHER')
- description (text)
- photo_url (text, nullable)
- status (enum: 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, nullable)

---

## Row Level Security (RLS) Policies

### Affiliates
- SELECT: WHERE affiliate_id = auth.uid() AND deleted_at IS NULL
- INSERT: WHERE affiliate_id = auth.uid()
- UPDATE: WHERE affiliate_id = auth.uid() AND deleted_at IS NULL

### Drivers
- SELECT deliveries: WHERE driver_id = auth.uid() AND deleted_at IS NULL
- UPDATE deliveries: WHERE driver_id = auth.uid() AND status IN ('PENDING', 'IN_PROGRESS')

### Admins
- Full access to all tables (role = 'admin')

---

## Storage Buckets

### signatures (Private)
- Policy: Drivers can INSERT, Admins can SELECT
- Max file size: 2MB
- Allowed types: image/png, image/jpeg

### damages (Authenticated Read)
- Policy: Authenticated users can SELECT, Affiliates can INSERT
- Max file size: 300KB (client-side compressed)
- Allowed types: image/png, image/jpeg

### documents (Authenticated Read)
- Policy: Admins can INSERT/UPDATE, Authenticated users can SELECT
- Max file size: 10MB
- Allowed types: application/pdf, image/png, image/jpeg

---

## Implementation Tasks

### Phase 1: Backend Foundation
- [x] Activate Atoms Backend
- [ ] Create database schema with all tables
- [ ] Implement RLS policies for each role
- [ ] Create audit log triggers for consignments and payments
- [ ] Set up storage buckets with policies
- [ ] Create full-text search index on inventory

### Phase 2: Authentication & User Management
- [ ] Implement admin-controlled user creation (no public signup)
- [ ] Create user management interface for admins
- [ ] Implement role-based routing and guards
- [ ] Set up real-time session monitoring (auto-kill suspended users)
- [ ] Create login/logout flows

### Phase 3: Shared Components
- [ ] OfflineIndicator component (global sync status)
- [ ] ImageUploader component (client-side compression)
- [ ] CSVButton component (export data views)
- [ ] SearchBar component (full-text inventory search)
- [ ] StatusBadge component (color-coded status)
- [ ] DataTable component (reusable table with sorting/filtering)

### Phase 4: Affiliate Dashboard
- [ ] Live inventory view (filtered by affiliate)
- [ ] Packing list receiving workflow
- [ ] Partial receipt handling
- [ ] Issue reporting with photo upload
- [ ] Financial statements (Net Profitability calculation)
- [ ] Monthly CSV export functionality

### Phase 5: Admin Dashboard
- [ ] Aggregate inventory view (Warehouse vs Consigned)
- [ ] Audit log viewer with filtering
- [ ] Affiliate impersonation feature ("View As")
- [ ] Analytics dashboard with sales leaderboard
- [ ] Daily digest notifications system
- [ ] User management (create, suspend, delete)

### Phase 6: Driver Interface (Mobile PWA)
- [ ] Offline-first architecture (IndexedDB + dexie.js)
- [ ] Serial sync queue (p-queue)
- [ ] Delivery work queue (sorted by route priority)
- [ ] Barcode scanner integration (html5-qrcode)
- [ ] Signature canvas component
- [ ] Photo capture for proof of delivery
- [ ] Auto-sync when network returns
- [ ] Large touch-friendly UI (min 48px targets)

### Phase 7: Real-time Features
- [ ] Inventory update subscriptions
- [ ] Session management subscriptions (suspended user auto-kill)
- [ ] Delivery status change notifications
- [ ] WebSocket connection management

### Phase 8: PWA & Optimization
- [ ] Configure next-pwa for offline caching
- [ ] Service worker for offline functionality
- [ ] IndexedDB sync strategy
- [ ] Image optimization and lazy loading
- [ ] Performance testing and optimization

### Phase 9: Testing & Quality Assurance
- [ ] Test RLS policies for each role
- [ ] Test offline sync scenarios
- [ ] Validate image compression
- [ ] Test CSV exports
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

---

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend (Atoms Backend)
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM

### Offline/PWA
- next-pwa
- dexie.js (IndexedDB wrapper)
- p-queue (serial sync)

### Additional Libraries
- browser-image-compression (client-side image compression)
- html5-qrcode (barcode scanning)
- react-signature-canvas (signature capture)
- date-fns (date formatting)
- recharts (analytics charts)

---

## Key Features Implementation Notes

### Offline Sync Strategy
1. All driver actions stored in IndexedDB when offline
2. Upon reconnection, sync manager processes queue serially (one-by-one)
3. Each sync operation updates UI with progress
4. Failed syncs retry with exponential backoff

### Image Compression
- Client-side compression using browser-image-compression
- Target: <300KB for damage photos
- Maintain aspect ratio
- Quality: 0.8

### Audit Trail
- Postgres triggers on consignments and payments tables
- Capture old_data and new_data as JSONB
- Include user_id and timestamp
- Never delete audit logs (no soft delete)

### Session Management
- Real-time subscription to user status changes
- If status becomes 'suspended', immediately call logout
- Clear all local storage and redirect to login

### CSV Export
- Generate CSV from current filtered view
- Include all visible columns
- Format dates and numbers appropriately
- Download with descriptive filename (e.g., "affiliate-statement-2024-01.csv")

---

## Security Considerations

1. **No Public Signup**: All user accounts created by admin only
2. **RLS Enforcement**: Every query filtered by user role and ownership
3. **Soft Deletes**: Never hard delete, always set deleted_at
4. **Audit Everything**: Log all changes to sensitive tables
5. **Storage Security**: Private buckets for sensitive data (signatures)
6. **Session Validation**: Real-time monitoring of user status
7. **Input Validation**: Sanitize all user inputs
8. **File Upload Limits**: Enforce max file sizes and types

---

## Performance Targets

- **Initial Load**: <2s on 4G
- **Offline Sync**: <5s for 10 items
- **Search Results**: <500ms
- **Image Upload**: <3s (with compression)
- **Real-time Updates**: <1s latency

---

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)