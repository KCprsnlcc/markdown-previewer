import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSearch, IconPlus, IconTag, IconX, IconUpload, IconEdit, IconFilter, IconTrash } from '@tabler/icons-react';
import { MarkdownDocument } from '../supabase';
import { showSuccess, showError, showInfo } from '../utils/toast';

const Sidebar: React.FC = () => {
  const {
    documents,
    currentDocument,
    searchQuery,
    selectedTags,
    darkMode,
    isLoading,
    setSearchQuery,
    setSelectedTags,
    selectDocument,
    createNewDocument,
    deleteCurrentDocument,
    updateCurrentDocument,
    refreshDocuments,
  } = useAppContext();
  
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // Extract all unique tags from all documents
  const allTags = Array.from(
    new Set(
      documents.flatMap(doc => doc.tags || [])
    )
  ).sort();
  
  useEffect(() => {
    // Focus the rename input when it becomes visible
    if (renamingDocId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingDocId]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchValue);
  };
  
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags([...selectedTags, tagInput]);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
      // Reset the input value so the same file can be uploaded again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Accept any file with .md extension or text files that might be markdown
      if (file.name.endsWith('.md') || file.type === 'text/markdown' || file.type === 'text/plain') {
        try {
          const content = await readFileContent(file);
          
          // Create a new document with the file content
          const newDocument: Partial<MarkdownDocument> = {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.md$/, ''),
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: ['imported'],
            user_id: 'anonymous',
          };
          
          await saveNewDocument(newDocument as MarkdownDocument);
          showSuccess(`Imported "${file.name}" successfully`);
        } catch (error) {
          console.error('Error processing file:', error);
          showError(`Failed to process file: ${file.name}`);
        }
      } else {
        showError(`File type not supported: ${file.name}. Please upload .md files only.`);
      }
    }
  };

  const saveNewDocument = async (doc: MarkdownDocument) => {
    try {
      selectDocument(doc);
      await updateCurrentDocument(doc.content, doc.title, doc.tags);
      await refreshDocuments();
    } catch (error) {
      console.error('Error saving new document:', error);
      showError('Failed to save the imported document. Please try again.');
      throw error; // Re-throw to be caught by the caller
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          const error = new Error('Failed to read file content');
          console.error(error);
          reject(error);
        }
      };
      reader.onerror = (event) => {
        const error = new Error('File read error: ' + (event.target?.error?.message || 'unknown error'));
        console.error(error);
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  const startRenaming = (doc: MarkdownDocument, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setRenamingDocId(doc.id);
    setRenameValue(doc.title);
  };

  const handleRename = async (docId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    if (renameValue.trim() === '') {
      showError('Document title cannot be empty');
      return;
    }
    
    try {
      const docToRename = documents.find(doc => doc.id === docId);
      if (docToRename) {
        const oldTitle = docToRename.title;
        // If it's the current document, update directly
        if (currentDocument?.id === docId) {
          await updateCurrentDocument(currentDocument.content, renameValue, currentDocument.tags);
        } else {
          // Otherwise, select it first, then update
          selectDocument(docToRename);
          await updateCurrentDocument(docToRename.content, renameValue, docToRename.tags);
        }
        showSuccess(`Renamed "${oldTitle}" to "${renameValue}"`);
      }
      
      setRenamingDocId(null);
      await refreshDocuments();
    } catch (error) {
      console.error('Error renaming document:', error);
      showError('Failed to rename document. Please try again.');
    }
  };
  
  const cancelRenaming = () => {
    setRenamingDocId(null);
  };
  
  const handleDeleteDocument = async (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document selection when clicking delete
    
    if (window.confirm(`Are you sure you want to delete "${doc.title || 'Untitled'}"?`)) {
      try {
        // First, select the document to make it the current document
        selectDocument(doc);
        // Then delete it using the context function
        await deleteCurrentDocument();
      } catch (error) {
        console.error('Error deleting document:', error);
        showError('Failed to delete document. Please try again.');
      }
    }
  };
  
  const safeSelectDocument = (doc: MarkdownDocument) => {
    // First check if there are unsaved changes
    const editorTextarea = window.document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (editorTextarea && currentDocument && editorTextarea.value !== currentDocument.content) {
      if (window.confirm('You have unsaved changes. Do you want to discard them and switch documents?')) {
        selectDocument(doc);
      }
    } else {
      selectDocument(doc);
    }
  };
  
  const sidebarStyle: React.CSSProperties = {
    width: '250px',
    height: '100%',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? 'var(--bg-dark)' : 'var(--bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
  };
  
  const headerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  
  const searchContainerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
  };
  
  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: darkMode ? 'var(--input-bg-dark)' : 'var(--input-bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
  };
  
  const tagsContainerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
  };
  
  const tagStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'inline-block',
    margin: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '8px',
    backgroundColor: isSelected 
      ? (darkMode ? 'var(--primary-color)' : 'var(--primary-light)') 
      : (darkMode ? 'var(--tag-bg-dark)' : 'var(--tag-bg-light)'),
    color: isSelected 
      ? '#fff' 
      : (darkMode ? 'var(--text-dark)' : 'var(--text-light)'),
    cursor: 'pointer',
    fontSize: '0.875rem',
  });
  
  const documentListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
  };
  
  const documentItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    margin: '0.25rem 0',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isSelected 
      ? (darkMode ? 'var(--bg-dark-selected)' : 'var(--bg-light-selected)') 
      : 'transparent',
    color: isSelected 
      ? '#fff' 
      : (darkMode ? 'var(--text-dark)' : 'var(--text-light)'),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
  
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  };
  
  return (
    <div 
      className="sidebar"
      style={{
        ...sidebarStyle,
        ...(isDragging && {
          backgroundColor: darkMode ? 'var(--bg-dark-hover)' : 'var(--bg-light-hover)',
          borderColor: 'var(--primary-color)',
        })
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging ? (
        <div className="drag-active">
          <p>Drop markdown files here to import</p>
        </div>
      ) : (
        <>
          {/* Search section */}
          <form onSubmit={handleSearch} className="sidebar-search">
            <IconSearch size={16} opacity={0.7} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search documents..."
              aria-label="Search documents"
            />
          </form>
          
          {/* Documents actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button 
              onClick={async () => {
                try {
                  await createNewDocument();
                } catch (error) {
                  console.error('Error creating document:', error);
                }
              }}
              className="add-document-btn"
              aria-label="Create new document"
            >
              <IconPlus size={18} /> New Document
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="editor-action-button"
              style={{ padding: '0.75rem', backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              aria-label="Import markdown files"
              title="Import markdown files"
            >
              <IconUpload size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".md,text/markdown,text/plain"
              multiple
            />
          </div>
          
          {/* Tags filter */}
          <div className="sidebar-section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconFilter size={16} />
              <span>Filter by Tags</span>
            </div>
          </div>
          
          <div className="tag-container">
            {allTags.map(tag => (
              <div
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <IconX size={14} style={{ marginLeft: '0.25rem' }} />
                )}
              </div>
            ))}
            
            {showTagInput ? (
              <form onSubmit={handleAddTag}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="New tag..."
                  autoFocus
                  onBlur={() => setShowTagInput(false)}
                  style={{
                    border: 'none',
                    borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    background: 'transparent',
                    padding: '0.25rem 0',
                    outline: 'none',
                    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
                    width: '100px'
                  }}
                />
              </form>
            ) : (
              <div
                className="tag"
                onClick={() => setShowTagInput(true)}
                style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
              >
                <IconPlus size={14} style={{ marginRight: '0.25rem' }} /> Add
              </div>
            )}
          </div>
          
          {/* Documents list */}
          <div className="sidebar-section-title" style={{ marginTop: '1.5rem' }}>
            Documents {isLoading && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(loading...)</span>}
          </div>
          
          {documents.length === 0 ? (
            <div style={{ padding: '1rem 0', color: darkMode ? 'var(--text-dark-secondary)' : 'var(--text-light-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
              {isLoading ? 'Loading documents...' : 'No documents yet. Create one to get started!'}
            </div>
          ) : (
            <div>
              {documents
                .filter(doc => {
                  // Tag filtering
                  if (selectedTags.length > 0) {
                    if (!doc.tags || doc.tags.length === 0) return false;
                    return selectedTags.every(tag => doc.tags?.includes(tag));
                  }
                  return true;
                })
                .filter(doc => {
                  // Search filtering
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    doc.title.toLowerCase().includes(query) ||
                    doc.content.toLowerCase().includes(query)
                  );
                })
                .sort((a, b) => {
                  // Sort by updated date (newest first)
                  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                })
                .map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => safeSelectDocument(doc)}
                    className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
                  >
                    {renamingDocId === doc.id ? (
                      <form onSubmit={(e) => handleRename(doc.id, e)} style={{ width: '100%' }}>
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => cancelRenaming()}
                          style={{
                            border: 'none',
                            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                            background: 'transparent',
                            padding: '0.25rem 0',
                            outline: 'none',
                            color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
                            width: '100%'
                          }}
                        />
                      </form>
                    ) : (
                      <>
                        <div className="document-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title || 'Untitled'}
                        </div>
                        
                        <div style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => startRenaming(doc, e)}
                            className="document-close-btn"
                            aria-label="Rename document"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(doc, e)}
                            className="document-close-btn"
                            aria-label="Delete document"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;