import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { IconSearch, IconPlus, IconX, IconUpload, IconEdit, IconFilter, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { MarkdownDocument } from '../supabase';
import { showSuccess, showError } from '../utils/toast';
import { Modal, Button, Group, Text } from '@mantine/core';

// Import MobileSidebarContext from App component
import { MobileSidebarContext } from '../App';

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
  
  // Access the setShowMobileSidebar function from context
  const mobileSidebarContext = React.useContext(MobileSidebarContext);
  
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MarkdownDocument | null>(null);
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
  
  const openDeleteModal = (doc: MarkdownDocument, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document selection when clicking delete
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // First, select the document to make it the current document
      selectDocument(documentToDelete);
      // Then delete it using the context function
      await deleteCurrentDocument();
      showSuccess(`"${documentToDelete.title || 'Untitled'}" has been deleted`);
      setDocumentToDelete(null);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document. Please try again.');
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
    width: '240px',
    height: '100%',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? 'var(--bg-dark)' : 'var(--bg-light)',
    color: darkMode ? 'var(--text-dark)' : 'var(--text-light)',
  };
  

  

  
  return (
    <div 
      className={`sidebar ${isDragging ? 'drag-active' : ''}`}
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
      {/* Mobile sidebar header is only shown on mobile */}
      <div className="mobile-sidebar-header">
        <h2>MarkDown</h2>
        <button 
          className="mobile-close-button"
          onClick={() => {
            // Use the context to set the state if available
            if (mobileSidebarContext.setShowMobileSidebar) {
              mobileSidebarContext.setShowMobileSidebar(false);
            }
          }}
        >
          <IconX size={20} />
        </button>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={<Text size="lg" fw={700} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconAlertTriangle color="var(--danger-color)" size={20} />
          Confirm Deletion
        </Text>}
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        centered
        withCloseButton
        closeButtonProps={{
          'aria-label': 'Close',
        }}
        radius="md"
        size="md"
      >
        <div style={{ marginBottom: '1rem' }}>
          <Text>
            Are you sure you want to delete "<strong>{documentToDelete?.title || 'Untitled'}</strong>"? 
            This action cannot be undone.
          </Text>
        </div>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteDocument}>
            Yes, Delete
          </Button>
        </Group>
      </Modal>

      {isDragging ? (
        <div className="drag-active-overlay">
          <p>Drop markdown files here to import</p>
        </div>
      ) : (
        <div className="sidebar-content">
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
          
          {/* Documents actions - Compact design */}
          <div className="document-actions-container">
            <button 
              onClick={async () => {
                try {
                  await createNewDocument();
                } catch (error) {
                  console.error('Error creating document:', error);
                }
              }}
              className="document-action-button"
              aria-label="New Document"
              title="Create new document"
            >
              <IconPlus size={16} />
              <span>New</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="document-action-button"
              aria-label="Import markdown files"
              title="Import markdown files"
            >
              <IconUpload size={16} />
              <span>Import</span>
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
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <IconFilter size={16} />
              <span>Filter by Tags</span>
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
                    <IconX size={14} />
                  )}
                </div>
              ))}
              
              {showTagInput ? (
                <form onSubmit={handleAddTag} className="tag-input-form">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="New tag..."
                    autoFocus
                    onBlur={() => setShowTagInput(false)}
                    className="tag-input"
                  />
                </form>
              ) : (
                <div
                  className="tag add-tag"
                  onClick={() => setShowTagInput(true)}
                >
                  <IconPlus size={14} /> Add
                </div>
              )}
            </div>
          </div>
          
          {/* Documents list */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Documents</span>
              {isLoading && <span className="loading-indicator">(loading...)</span>}
            </div>
            
            <div className="documents-list">
              {documents.length === 0 ? (
                <div className="no-documents-message">
                  {isLoading ? 'Loading documents...' : 'No documents yet. Create one to get started!'}
                </div>
              ) : (
                <>
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
                          <form onSubmit={(e) => handleRename(doc.id, e)} className="rename-form">
                            <input
                              ref={renameInputRef}
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => cancelRenaming()}
                              className="rename-input"
                              autoFocus
                            />
                          </form>
                        ) : (
                          <>
                            <div className="document-title">
                              {doc.title || 'Untitled'}
                            </div>
                            
                            <div className="document-actions">
                              <button
                                onClick={(e) => startRenaming(doc, e)}
                                className="document-action-btn"
                                aria-label="Rename document"
                                title="Rename document"
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                onClick={(e) => openDeleteModal(doc, e)}
                                className="document-action-btn document-delete-btn"
                                aria-label="Delete document"
                                title="Delete document"
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;