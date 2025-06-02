import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  let query = supabase
    .from('markdown_documents')
    .select('*')
    .order('updated_at', { ascending: false });

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
  const { data, error } = await supabase
    .from('markdown_documents')
    .upsert(document)
    .select()
    .single();
  
  if (error) {
    console.error('Error saving document:', error);
    return null;
  }
  
  return data;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('markdown_documents')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }
  
  return true;
}