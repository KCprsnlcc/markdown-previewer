import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSearch, IconPlus, IconTag, IconX, IconUpload, IconEdit } from '@tabler/icons-react';
import { MarkdownDocument } from '../supabase';

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
        } catch (error) {
          console.error('Error processing file:', error);
          alert(`Failed to process file: ${file.name}`);
        }
      } else {
        alert(`File type not supported: ${file.name}. Please upload .md files only.`);
      }
    }
  };

  const saveNewDocument = async (doc: MarkdownDocument) => {
    selectDocument(doc);
    await updateCurrentDocument(doc.content, doc.title, doc.tags);
    await refreshDocuments();
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('File read error'));
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
      return; // Don't save empty titles
    }
    
    const docToRename = documents.find(doc => doc.id === docId);
    if (docToRename) {
      // If it's the current document, update directly
      if (currentDocument?.id === docId) {
        await updateCurrentDocument(currentDocument.content, renameValue, currentDocument.tags);
      } else {
        // Otherwise, select it first, then update
        selectDocument(docToRename);
        await updateCurrentDocument(docToRename.content, renameValue, docToRename.tags);
      }
    }
    
    setRenamingDocId(null);
    await refreshDocuments();
  };
  
  const cancelRenaming = () => {
    setRenamingDocId(null);
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
    backgroundColor: darkMode ? 'var(--bg-dark)' : 'var(--bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
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
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Documents</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: 'none' }} 
            accept=".md,.txt,text/markdown,text/plain" 
            onChange={handleFileUpload}
            multiple
          />
          <button 
            style={buttonStyle} 
            onClick={() => fileInputRef.current?.click()}
            title="Import Markdown File"
          >
            <IconUpload size={18} />
          </button>
          <button 
            style={buttonStyle} 
            onClick={createNewDocument}
            title="Create New Document"
          >
            <IconPlus size={18} />
          </button>
        </div>
      </div>
      
      <div style={searchContainerStyle}>
        <form onSubmit={handleSearch}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search..."
              style={searchInputStyle}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
              }}
            >
              <IconSearch size={18} />
            </button>
          </div>
        </form>
      </div>
      
      <div style={tagsContainerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Tags</h3>
          {!showTagInput && (
            <button
              style={{
                ...buttonStyle,
                padding: '0.25rem',
              }}
              onClick={() => setShowTagInput(true)}
              title="Add Tag Filter"
            >
              <IconPlus size={14} />
            </button>
          )}
        </div>
        
        {showTagInput && (
          <form onSubmit={handleAddTag} style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                style={{
                  ...searchInputStyle,
                  flex: 1,
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
                  marginLeft: '0.5rem',
                }}
              >
                <IconX size={18} />
              </button>
            </div>
          </form>
        )}
        
        <div>
          {selectedTags.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <small style={{ fontWeight: 'bold' }}>Selected:</small>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  style={tagStyle(true)}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag} <IconX size={12} />
                </span>
              ))}
            </div>
          )}
          
          {allTags
            .filter(tag => !selectedTags.includes(tag))
            .map(tag => (
              <span
                key={tag}
                style={tagStyle(false)}
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </span>
            ))}
        </div>
      </div>
      
      <div style={documentListStyle}>
        {isLoading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            No documents found
            {searchQuery && <div>Try a different search term</div>}
            {selectedTags.length > 0 && <div>Try removing some tag filters</div>}
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              style={{
                ...documentItemStyle(currentDocument?.id === doc.id),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {renamingDocId === doc.id ? (
                <form 
                  onSubmit={(e) => handleRename(doc.id, e)} 
                  style={{ flex: 1, display: 'flex' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    style={{
                      ...searchInputStyle,
                      flex: 1,
                      padding: '0.25rem 0.5rem',
                    }}
                    onBlur={() => handleRename(doc.id, { preventDefault: () => {} } as React.FormEvent)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelRenaming();
                      }
                    }}
                  />
                </form>
              ) : (
                <>
                  <div 
                    style={{ 
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }} 
                    onClick={() => selectDocument(doc)}
                  >
                    {doc.title}
                  </div>
                  <div style={{ display: 'flex' }}>
                    <button
                      onClick={(e) => startRenaming(doc, e)}
                      style={{
                        ...iconButtonStyle,
                        marginRight: '4px',
                        visibility: 'hidden'
                      }}
                      title="Rename document"
                      className="document-action-btn"
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                          if (currentDocument?.id === doc.id) {
                            deleteCurrentDocument();
                          } else {
                            selectDocument(doc);
                            setTimeout(() => deleteCurrentDocument(), 100);
                          }
                        }
                      }}
                      style={{
                        ...iconButtonStyle,
                        visibility: 'hidden'
                      }}
                      title="Delete document"
                      className="document-action-btn"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <style>
        {`
          div:hover > .document-action-btn {
            visibility: visible !important;
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;