# Supabase Setup Guide for LRE HOLDINGS Platform

## Database Tables Setup

You need to create the following tables in your Supabase project:

### 1. users_extended
```sql
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'affiliate', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON users_extended
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON users_extended
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_extended
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. inventory
```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_cost DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  status TEXT NOT NULL CHECK (status IN ('WAREHOUSE', 'TRANSIT', 'CONSIGNED', 'SOLD', 'RETURNED')),
  location TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view inventory" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);
```

### 3. consignments
```sql
CREATE TABLE consignments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  affiliate_id UUID REFERENCES auth.users(id),
  inventory_id INTEGER REFERENCES inventory(id),
  quantity INTEGER NOT NULL,
  consigned_date TIMESTAMP WITH TIME ZONE,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PARTIAL', 'RETURNED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own consignments" ON consignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consignments" ON consignments
  FOR ALL USING (auth.uid() = user_id);
```

### 4. deliveries
```sql
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID REFERENCES auth.users(id),
  consignment_id INTEGER REFERENCES consignments(id),
  delivery_address TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  route_priority INTEGER,
  signature_url TEXT,
  photo_urls TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update assigned deliveries" ON deliveries
  FOR UPDATE USING (auth.uid() = driver_id);
```

### 5. payments
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  affiliate_id UUID REFERENCES auth.users(id),
  consignment_id INTEGER REFERENCES consignments(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('SALE', 'RETURN', 'COMMISSION')),
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);
```

### 6. audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data TEXT,
  new_data TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_extended
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 7. issues
```sql
CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  consignment_id INTEGER REFERENCES consignments(id),
  delivery_id INTEGER REFERENCES deliveries(id),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('DAMAGE', 'MISSING', 'QUALITY', 'OTHER')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  resolution TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own issues" ON issues
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Storage Buckets Setup

Create the following storage buckets in Supabase:

### 1. signatures (Private)
- Name: `signatures`
- Public: No
- File size limit: 5MB
- Allowed MIME types: `image/png, image/jpeg`

### 2. damages (Public)
- Name: `damages`
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: `image/png, image/jpeg`

### 3. documents (Public)
- Name: `documents`
- Public: Yes
- File size limit: 20MB
- Allowed MIME types: `application/pdf, image/png, image/jpeg`

## Authentication Setup

1. Enable Email/Password authentication in Supabase Dashboard
2. Disable public signups (admin-controlled only)
3. Configure email templates if needed

## Environment Variables

The Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`:
- URL: `https://tzsvtdt0nx5whnkrnoohqw.supabase.co`
- Anon Key: `sb_publishable_TzNvTDt0Nx5wHNKrNoOhQw_V96BI3Dk`

## Initial Admin User

Create your first admin user through Supabase Dashboard:

1. Go to Authentication > Users
2. Add a new user with email/password
3. Copy the user's UUID
4. Insert into `users_extended`:
```sql
INSERT INTO users_extended (id, role, status, full_name, phone)
VALUES ('USER_UUID_HERE', 'admin', 'active', 'Admin User', '+1-555-0100');
```

## Testing

After setup, you should be able to:
1. Login with the admin credentials
2. View the admin dashboard
3. Create affiliate and driver users
4. Test role-based access control