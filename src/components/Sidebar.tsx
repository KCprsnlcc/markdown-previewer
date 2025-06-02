import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSearch, IconPlus, IconTag, IconX, IconUpload } from '@tabler/icons-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extract all unique tags from all documents
  const allTags = Array.from(
    new Set(
      documents.flatMap(doc => doc.tags || [])
    )
  ).sort();
  
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
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only process markdown files
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
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
        
        // Set as current document and then update it
        selectDocument(newDocument as MarkdownDocument);
        await updateCurrentDocument(content, file.name.replace(/\.md$/, ''), ['imported']);
      }
    }
    
    // Refresh documents list
    refreshDocuments();
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
      reader.onerror = (e) => {
        reject(new Error('File read error'));
      };
      reader.readAsText(file);
    });
  };
  
  const sidebarStyle: React.CSSProperties = {
    width: '250px',
    height: '100%',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
    color: darkMode ? '#e0e0e0' : '#333',
  };
  
  const headerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  
  const searchContainerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e0e0e0',
  };
  
  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: darkMode ? '#333' : '#fff',
    color: darkMode ? '#fff' : '#333',
  };
  
  const tagsContainerStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #e0e0e0',
  };
  
  const tagStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'inline-block',
    margin: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: isSelected 
      ? (darkMode ? '#4caf50' : '#81c784') 
      : (darkMode ? '#333' : '#e0e0e0'),
    color: isSelected 
      ? '#fff' 
      : (darkMode ? '#e0e0e0' : '#333'),
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
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isSelected 
      ? (darkMode ? '#2c5282' : '#90caf9') 
      : 'transparent',
    color: isSelected 
      ? '#fff' 
      : (darkMode ? '#e0e0e0' : '#333'),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
  
  const buttonStyle: React.CSSProperties = {
    backgroundColor: darkMode ? '#333' : '#e0e0e0',
    color: darkMode ? '#fff' : '#333',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  return (
    <div 
      style={{
        ...sidebarStyle,
        ...(isDragging && {
          backgroundColor: darkMode ? '#2a2a2a' : '#e9f0f7',
          borderColor: '#4caf50',
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
            accept=".md,text/markdown" 
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
                color: darkMode ? '#aaa' : '#666',
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
                  color: darkMode ? '#aaa' : '#666',
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
                  background: 'none',
                  border: 'none',
                  color: darkMode ? '#aaa' : '#666',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  visibility: 'hidden'
                }}
                title="Delete document"
                className="document-close-btn"
              >
                <IconX size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;