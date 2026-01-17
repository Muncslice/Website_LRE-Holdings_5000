import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqelblopiighxcvbbzij.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZWxibG9waWlnaHhjdmJiemlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzI1MjgsImV4cCI6MjA4NDE0ODUyOH0.4YYFUgvM8Yewau0ttMkLZNekRLxJqrmvZnN8E_vB_4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('isAdmin error:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (e) {
    console.error('isAdmin exception:', e);
    return false;
  }
}

// Helper function to check if user is affiliate
export async function isAffiliate(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('isAffiliate error:', error);
      return false;
    }
    
    return data?.role === 'affiliate';
  } catch (e) {
    console.error('isAffiliate exception:', e);
    return false;
  }
}

// Helper function to check if user is driver
export async function isDriver(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('isDriver error:', error);
      return false;
    }
    
    return data?.role === 'driver';
  } catch (e) {
    console.error('isDriver exception:', e);
    return false;
  }
}

// Helper to get current user role
export async function getUserRole(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    console.log('getUserRole - current user:', user?.id);
    
    if (!user) {
      console.log('getUserRole - no user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('getUserRole - Supabase error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('getUserRole - data retrieved:', data);
    return data?.role || null;
  } catch (e) {
    console.error('getUserRole - exception:', e);
    return null;
  }
}