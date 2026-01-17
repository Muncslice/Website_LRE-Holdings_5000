# LRE HOLDINGS - Inventory & Logistics Platform

A comprehensive full-stack web application for managing inventory, logistics, and business operations.

## Features

- **Inventory Management**: Track and manage inventory items with real-time updates
- **User Management**: Role-based access control (Admin/User) with approval workflow
- **Consignments**: Manage consignment tracking and status
- **Deliveries**: Track delivery status and logistics
- **Payments**: Payment processing and tracking
- **Issues Tracking**: Report and manage operational issues
- **Reports & Analytics**: Comprehensive dashboard with data visualization

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Shadcn-ui** for UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Supabase** for:
  - Authentication (Auth)
  - Database (PostgreSQL)
  - File Storage
  - Real-time subscriptions
  - Edge Functions

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configurations
│   │   ├── hooks/          # Custom React hooks
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json
├── backend/
│   ├── routers/            # API endpoints
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   └── data_models/        # JSON schemas
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JungleMonkey5000/Website_LRE-Holdings.git
cd Website_LRE-Holdings
```

2. Install frontend dependencies:
```bash
cd frontend
pnpm install
```

3. Configure Supabase:
   - Update `frontend/src/lib/supabase.ts` with your Supabase URL and anon key
   - Set up database tables using the schemas in `backend/data_models/`

4. Start development server:
```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
cd frontend
pnpm run build
```

## Database Setup

The application requires the following Supabase tables:
- `users_extended` - Extended user profiles with roles
- `inventory` - Inventory items
- `consignments` - Consignment tracking
- `deliveries` - Delivery management
- `payments` - Payment records
- `issues` - Issue tracking
- `audit_logs` - System audit logs

Refer to `backend/data_models/*.json` for detailed schemas.

## Authentication

The app uses Supabase Auth with email/password authentication. Users are assigned roles (admin/user) in the `users_extended` table.

## Deployment

### Frontend Deployment
- Can be deployed to Vercel, Netlify, or any static hosting service
- Build command: `pnpm run build`
- Output directory: `dist/`

### Backend
- Supabase handles all backend operations
- No separate backend deployment needed

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Private - All rights reserved

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for LRE HOLDINGS
