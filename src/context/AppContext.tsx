import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MarkdownDocument, getDocuments, saveDocument, deleteDocument } from '../supabase';
import { showSuccess, showError, showInfo } from '../utils/toast';

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
        showError('Failed to load documents. Please try again later.');
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
      showError('Failed to refresh documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectDocument = (document: MarkdownDocument) => {
    setCurrentDocument(document);
  };
  
  const createNewDocument = async () => {
    try {
      const newDocument: Partial<MarkdownDocument> = {
        id: crypto.randomUUID(),
        title: 'Untitled Document',
        content: '# Untitled Document\n\nStart writing your markdown here...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [],
        user_id: 'anonymous', // Will be replaced with actual user ID in saveDocument
      };
      
      // First save the document to the database
      const savedDocument = await saveDocument(newDocument);
      
      if (savedDocument) {
        // Then set it as current document
        setCurrentDocument(savedDocument);
        await refreshDocuments();
        showSuccess('New document created');
      } else {
        showError('Failed to create new document');
      }
    } catch (error) {
      console.error('Error creating new document:', error);
      showError('Failed to create new document. Please try again.');
    }
  };
  
  const updateCurrentDocument = async (content: string, title?: string, tags?: string[]) => {
    if (!currentDocument) return;
    
    try {
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
        if (title) {
          showSuccess(`Document "${title}" saved successfully`);
        } else {
          // Only show save notification when title changes to avoid too many notifications during autosave
        }
      } else {
        showError('Failed to save document');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      showError('Failed to update document. Please try again.');
    }
  };
  
  const deleteCurrentDocument = async () => {
    if (!currentDocument) return;
    
    try {
      const documentTitle = currentDocument.title;
      const success = await deleteDocument(currentDocument.id);
      if (success) {
        await refreshDocuments();
        setCurrentDocument(documents.length > 0 ? documents[0] : null);
        showSuccess(`Document "${documentTitle}" deleted successfully`);
      } else {
        showError('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document. Please try again.');
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