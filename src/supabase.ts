import { createClient } from '@supabase/supabase-js';

// Supabase configuration and client setup
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Log environment variables availability for debugging
console.log('Supabase URL available:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('Supabase URL value:', supabaseUrl);
console.log('Supabase Anon Key available:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

// Check for missing configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing! Please check your environment variables:',
    { supabaseUrl, supabaseAnonKeyAvailable: !!supabaseAnonKey });
}

// Create client with additional options for better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Set a custom fetch implementation that includes retries and better error handling
  global: {
    fetch: async (url, options = {}) => {
      // Add some logging to help debug issues
      console.log(`Supabase fetch: ${url.toString().split('?')[0]}`);
      
      try {
        const response = await fetch(url, options);
        
        // Log API errors for debugging
        if (!response.ok) {
          console.error(`Supabase API error: ${response.status}`, { 
            url: url.toString().split('?')[0], 
            status: response.status,
            statusText: response.statusText
          });
        }
        
        return response;
      } catch (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
    }
  }
});

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  user_id: string;
}

export async function getDocuments(searchQuery = '', tags: string[] = []): Promise<MarkdownDocument[]> {
  // Get the current authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  let query = supabase
    .from('markdown_documents')
    .select('*')
    .order('updated_at', { ascending: false });

  // Filter by user_id if user is authenticated
  if (user) {
    query = query.eq('user_id', user.id);
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  
  return data || [];
}

export async function saveDocument(document: Partial<MarkdownDocument>): Promise<MarkdownDocument | null> {
  // Get the current authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    console.error('No authenticated user found when trying to save document');
    return null;
  }
  
  // Include the user_id from authenticated user
  const documentWithUserId = {
    ...document,
    user_id: user.id
  };
  
  const { data, error } = await supabase
    .from('markdown_documents')
    .upsert(documentWithUserId)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving document:', error);
    return null;
  }
  
  return data;
}

export async function deleteDocument(id: string): Promise<boolean> {
  // Get the current authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) {
    console.error('No authenticated user found when trying to delete document');
    return false;
  }
  
  // Ensure the document belongs to the current user before deleting
  const { error } = await supabase
    .from('markdown_documents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // This ensures only the owner can delete their document
  
  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }
  
  return true;
}