import { createClient } from '@metagptx/web-sdk';

// Create client instance
export const client = createClient();

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await client.auth.me();
    if (!user.data) return false;
    
    const response = await client.entities.users_extended.query({
      query: { id: user.data.id },
      limit: 1,
    });
    
    return response.data.items[0]?.role === 'admin';
  } catch {
    return false;
  }
}

// Helper function to check if user is affiliate
export async function isAffiliate(): Promise<boolean> {
  try {
    const user = await client.auth.me();
    if (!user.data) return false;
    
    const response = await client.entities.users_extended.query({
      query: { id: user.data.id },
      limit: 1,
    });
    
    return response.data.items[0]?.role === 'affiliate';
  } catch {
    return false;
  }
}

// Helper function to check if user is driver
export async function isDriver(): Promise<boolean> {
  try {
    const user = await client.auth.me();
    if (!user.data) return false;
    
    const response = await client.entities.users_extended.query({
      query: { id: user.data.id },
      limit: 1,
    });
    
    return response.data.items[0]?.role === 'driver';
  } catch {
    return false;
  }
}

// Helper to get current user role
export async function getUserRole(): Promise<string | null> {
  try {
    const user = await client.auth.me();
    if (!user.data) return null;
    
    const response = await client.entities.users_extended.query({
      query: { id: user.data.id },
      limit: 1,
    });
    
    return response.data.items[0]?.role || null;
  } catch {
    return null;
  }
}