import { supabase } from './supabase';

export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in a hypothetical admin_users table
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Helper to create an admin user (should only be called by super admin)
export async function makeUserAdmin(userId: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error making user admin:', err);
    return null;
  }
}
