import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqelblopiighxcvbbzij.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZWxibG9waWlnaHhjdmJiemlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzI1MjgsImV4cCI6MjA4NDE0ODUyOH0.4YYFUgvM8Yewau0ttMkLZNekRLxJqrmvZnN8E_vB_4w';

console.log('🔌 SUPABASE: Initializing Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ SUPABASE: Client initialized successfully');

// Helper function to get current user
export async function getCurrentUser() {
  console.log('👤 SUPABASE: Getting current user...');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('❌ SUPABASE: Error getting user:', error);
    return null;
  }
  console.log('✅ SUPABASE: Current user:', user?.id || 'none');
  return user;
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    console.log('🔍 SUPABASE: Checking if user is admin...');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ SUPABASE: No user found for admin check');
      return false;
    }
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('❌ SUPABASE: isAdmin error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    const result = data?.role === 'admin';
    console.log('✅ SUPABASE: isAdmin result:', result);
    return result;
  } catch (e) {
    console.error('❌ SUPABASE: isAdmin exception:', e);
    return false;
  }
}

// Helper function to check if user is affiliate
export async function isAffiliate(): Promise<boolean> {
  try {
    console.log('🔍 SUPABASE: Checking if user is affiliate...');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ SUPABASE: No user found for affiliate check');
      return false;
    }
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('❌ SUPABASE: isAffiliate error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    const result = data?.role === 'affiliate';
    console.log('✅ SUPABASE: isAffiliate result:', result);
    return result;
  } catch (e) {
    console.error('❌ SUPABASE: isAffiliate exception:', e);
    return false;
  }
}

// Helper function to check if user is driver
export async function isDriver(): Promise<boolean> {
  try {
    console.log('🔍 SUPABASE: Checking if user is driver...');
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ SUPABASE: No user found for driver check');
      return false;
    }
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('❌ SUPABASE: isDriver error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    const result = data?.role === 'driver';
    console.log('✅ SUPABASE: isDriver result:', result);
    return result;
  } catch (e) {
    console.error('❌ SUPABASE: isDriver exception:', e);
    return false;
  }
}

// Helper to get current user role
export async function getUserRole(): Promise<string | null> {
  try {
    console.log('🎭 SUPABASE: getUserRole called');
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ SUPABASE: getUserRole - no user found');
      return null;
    }
    
    console.log('🔍 SUPABASE: Querying users_extended for user:', user.id);
    
    const { data, error } = await supabase
      .from('users_extended')
      .select('role, status')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('❌ SUPABASE: getUserRole - Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      
      // If user doesn't exist in users_extended, return null
      if (error.code === 'PGRST116') {
        console.log('⚠️ SUPABASE: User not found in users_extended table');
        return null;
      }
      
      return null;
    }
    
    console.log('✅ SUPABASE: getUserRole - data retrieved:', data);
    
    // Check if user is suspended
    if (data?.status === 'suspended') {
      console.log('⚠️ SUPABASE: User is suspended');
      return null;
    }
    
    const role = data?.role || null;
    console.log('✅ SUPABASE: getUserRole returning:', role);
    return role;
  } catch (e: any) {
    console.error('❌ SUPABASE: getUserRole - exception:', {
      message: e?.message,
      stack: e?.stack,
      fullError: e
    });
    return null;
  }
}