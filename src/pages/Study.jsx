import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, X, Edit2, Trash2, Tag } from 'lucide-react';
import supabase from '../lib/supabase';
import { format } from 'date-fns'; // Fixed import

const Study = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', subject: '' });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [searchTerm, selectedSubject, notes]);

  const fetchNotes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
      setFilteredNotes(data || []);

      const uniqueSubjects = [
        ...new Set((data || []).map(note => note.subject).filter(Boolean))
      ];
      setSubjects(uniqueSubjects);

    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;
    
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }
    
    setFilteredNotes(filtered);
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) return;

    try {
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: newNote.title,
            content: newNote.content,
            subject: newNote.subject || null
          })
          .eq('id', editingNote.id);

        if (error) throw error;
      } else {
        // Insert new note
        const { error } = await supabase
          .from('notes')
          .insert([
            {
              title: newNote.title,
              content: newNote.content,
              subject: newNote.subject || null,
              created_at: new Date().toISOString()
            }
          ]);

        if (error) throw error;
      }

      // Refresh notes after save
      await fetchNotes();

      // Reset form and close modal
      setShowAddModal(false);
      setEditingNote(null);
      setNewNote({ title: '', content: '', subject: '' });

    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note. Please try again.');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setNotes(notes.filter(n => n.id !== id));
      
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNewNote({ 
      title: note.title || '', 
      content: note.content || '', 
      subject: note.subject || '' 
    });
    setShowAddModal(true);
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-14 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#EDEDED]">Study Notes</h1>
            <p className="text-sm text-[#6A6A6A] mt-1">Organize your knowledge</p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setNewNote({ title: '', content: '', subject: '' });
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6A6A6A]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>
          
          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          )}
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A2A2A] border-t-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#3A3A3A] transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#EDEDED] mb-1">{note.title}</h3>
                      {note.subject && (
                        <div className="flex items-center space-x-1 text-xs text-[#6A6A6A]">
                          <Tag className="h-3 w-3" />
                          <span>{note.subject}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1.5 text-[#6A6A6A] hover:text-blue-500 rounded-md hover:bg-[#1A1A1A]"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-[#6A6A6A] hover:text-red-500 rounded-md hover:bg-[#1A1A1A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#9A9A9A] line-clamp-3 mb-4">
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6A6A6A]">
                      {formatDate(note.created_at)}
                    </span>
                    <BookOpen className="h-3.5 w-3.5 text-[#6A6A6A]" />
                  </div>
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 text-[#2A2A2A] mx-auto mb-3" />
                <p className="text-[#6A6A6A] text-sm">No notes yet. Create your first note!</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
                <h2 className="font-medium text-[#EDEDED]">
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                    setNewNote({ title: '', content: '', subject: '' });
                  }}
                  className="p-1 text-[#6A6A6A] hover:text-[#EDEDED] rounded-md hover:bg-[#1A1A1A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={newNote.subject}
                  onChange={(e) => setNewNote({...newNote, subject: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                
                <textarea
                  placeholder="Write your notes here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  rows="8"
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 p-4 border-t border-[#2A2A2A]">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                    setNewNote({ title: '', content: '', subject: '' });
                  }}
                  className="px-4 py-2 text-sm text-[#9A9A9A] hover:text-[#EDEDED] rounded-lg hover:bg-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!newNote.title || !newNote.content}
                >
                  {editingNote ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Study;