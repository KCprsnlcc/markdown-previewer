import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MarkdownDocument, getDocuments, saveDocument, deleteDocument } from '../supabase';

interface AppContextType {
  documents: MarkdownDocument[];
  currentDocument: MarkdownDocument | null;
  isLoading: boolean;
  searchQuery: string;
  selectedTags: string[];
  editorTheme: string;
  previewTheme: string;
  fontSize: number;
  autoSave: boolean;
  darkMode: boolean;
  hideEditor: boolean;
  hidePreview: boolean;
  hideSidebar: boolean;
  
  // Methods
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setEditorTheme: (theme: string) => void;
  setPreviewTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  setAutoSave: (autoSave: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setHideEditor: (hide: boolean) => void;
  setHidePreview: (hide: boolean) => void;
  setHideSidebar: (hide: boolean) => void;
  selectDocument: (document: MarkdownDocument) => void;
  createNewDocument: () => void;
  updateCurrentDocument: (content: string, title?: string, tags?: string[]) => Promise<void>;
  deleteCurrentDocument: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

const defaultContext: AppContextType = {
  documents: [],
  currentDocument: null,
  isLoading: false,
  searchQuery: '',
  selectedTags: [],
  editorTheme: 'github',
  previewTheme: 'default',
  fontSize: 14,
  autoSave: true,
  darkMode: false,
  hideEditor: false,
  hidePreview: false,
  hideSidebar: false,
  
  setSearchQuery: () => {},
  setSelectedTags: () => {},
  setEditorTheme: () => {},
  setPreviewTheme: () => {},
  setFontSize: () => {},
  setAutoSave: () => {},
  setDarkMode: () => {},
  setHideEditor: () => {},
  setHidePreview: () => {},
  setHideSidebar: () => {},
  selectDocument: () => {},
  createNewDocument: () => {},
  updateCurrentDocument: async () => {},
  deleteCurrentDocument: async () => {},
  refreshDocuments: async () => {},
};

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useState<MarkdownDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<MarkdownDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Configuration options
  const [editorTheme, setEditorTheme] = useState<string>('github');
  const [previewTheme, setPreviewTheme] = useState<string>('default');
  const [fontSize, setFontSize] = useState<number>(14);
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [hideEditor, setHideEditor] = useState<boolean>(false);
  const [hidePreview, setHidePreview] = useState<boolean>(false);
  const [hideSidebar, setHideSidebar] = useState<boolean>(false);
  
  // Load documents when search or tags change
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const docs = await getDocuments(searchQuery, selectedTags);
        setDocuments(docs);
        // If current document is not in the filtered list anymore, reset it
        if (currentDocument && !docs.some(doc => doc.id === currentDocument.id)) {
          setCurrentDocument(docs.length > 0 ? docs[0] : null);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocuments();
  }, [searchQuery, selectedTags, currentDocument]);
  
  const refreshDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getDocuments(searchQuery, selectedTags);
      setDocuments(docs);
    } catch (error) {
      console.error('Error refreshing documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectDocument = (document: MarkdownDocument) => {
    setCurrentDocument(document);
  };
  
  const createNewDocument = () => {
    const newDocument: Partial<MarkdownDocument> = {
      id: crypto.randomUUID(),
      title: 'Untitled Document',
      content: '# Untitled Document\n\nStart writing your markdown here...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      user_id: 'anonymous', // Replace with actual user ID if authentication is implemented
    };
    
    setCurrentDocument(newDocument as MarkdownDocument);
    saveDocument(newDocument);
    refreshDocuments();
  };
  
  const updateCurrentDocument = async (content: string, title?: string, tags?: string[]) => {
    if (!currentDocument) return;
    
    const updatedDocument: Partial<MarkdownDocument> = {
      ...currentDocument,
      content,
      updated_at: new Date().toISOString(),
    };
    
    if (title) updatedDocument.title = title;
    if (tags) updatedDocument.tags = tags;
    
    const saved = await saveDocument(updatedDocument);
    if (saved) {
      setCurrentDocument(saved);
      await refreshDocuments();
    }
  };
  
  const deleteCurrentDocument = async () => {
    if (!currentDocument) return;
    
    const success = await deleteDocument(currentDocument.id);
    if (success) {
      await refreshDocuments();
      setCurrentDocument(documents.length > 0 ? documents[0] : null);
    }
  };
  
  const value: AppContextType = {
    documents,
    currentDocument,
    isLoading,
    searchQuery,
    selectedTags,
    editorTheme,
    previewTheme,
    fontSize,
    autoSave,
    darkMode,
    hideEditor,
    hidePreview,
    hideSidebar,
    
    setSearchQuery,
    setSelectedTags,
    setEditorTheme,
    setPreviewTheme,
    setFontSize,
    setAutoSave,
    setDarkMode,
    setHideEditor,
    setHidePreview,
    setHideSidebar,
    selectDocument,
    createNewDocument,
    updateCurrentDocument,
    deleteCurrentDocument,
    refreshDocuments,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};