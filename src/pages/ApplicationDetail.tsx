import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  MessageSquare,
  Send,
  User as UserIcon,
  Trash2,
  Edit3,
  X as XIcon,
  Check
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { useAuth } from '../App';
import { Application, Document, AdminNote } from '../types';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const result = await api.getApplicationDetails(Number(id));
      setData(result);
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!newNote.trim()) {
      alert('Please provide a note explaining the decision');
      return;
    }
    setUpdating(true);
    try {
      await api.updateStatus(Number(id), status, newNote);
      setNewNote('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setUpdating(true);
    try {
      await api.addNote(Number(id), newNote);
      setNewNote('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEdit = (note: AdminNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.note);
  };

  const handleSaveEdit = async (noteId: number) => {
    if (!editContent.trim()) return;
    setUpdating(true);
    try {
      await api.editNote(noteId, editContent);
      setEditingNoteId(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setUpdating(true);
    try {
      await api.deleteNote(noteId);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !data) return <div className="animate-pulse space-y-8">
    <div className="h-8 w-1/4 bg-slate-200 rounded" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-64 bg-slate-200 rounded-3xl" />
      <div className="h-64 bg-slate-200 rounded-3xl" />
    </div>
  </div>;

  const statusColors = {
    PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    APPROVED: 'text-green-600 bg-green-50 border-green-100',
    REJECTED: 'text-red-600 bg-red-50 border-red-100'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-outline p-2"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-sleek-ink">{data.organization_name}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-sleek-secondary text-sm">Application ID: #{data.id} • Submitted {new Date(data.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Application Progress Tracker */}
      <div className="bg-white rounded-2xl border border-sleek-border shadow-sleek p-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">License Lifecycle Progress</h2>
        <div className="relative flex justify-between items-start max-w-3xl mx-auto">
          {/* Progress Connector Line */}
          <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-slate-100 -z-0" />
          <div 
            className="absolute top-[18px] left-0 h-0.5 bg-sleek-primary transition-all duration-1000 -z-0" 
            style={{ 
              width: data.status === 'APPROVED' ? '100%' : data.status === 'PENDING' ? '50%' : '0%' 
            }}
          />

          <ProgressStep 
            icon={<FileText size={18} />} 
            label="Submitted" 
            date={new Date(data.created_at).toLocaleDateString()} 
            active={true} 
            completed={true} 
          />
          <ProgressStep 
            icon={<Clock size={18} />} 
            label="In Review" 
            date="In progress" 
            active={data.status === 'PENDING'} 
            completed={data.status !== 'PENDING'} 
            warn={data.status === 'REJECTED'}
          />
          <ProgressStep 
            icon={data.status === 'REJECTED' ? <XCircle size={18} /> : <CheckCircle size={18} />} 
            label={data.status === 'REJECTED' ? 'Rejected' : 'Approved'} 
            date={data.status !== 'PENDING' ? 'Finalized' : 'Pending'} 
            active={data.status !== 'PENDING'} 
            completed={data.status === 'APPROVED'}
            error={data.status === 'REJECTED'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-sleek-border shadow-sleek p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-sleek-ink">
              <Building2 size={20} className="text-sleek-primary" />
              Information Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License Type</p>
                <p className="font-semibold text-sleek-ink text-sm">{data.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Email</p>
                <p className="font-semibold text-sleek-ink text-sm flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> {data.contact_email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Phone</p>
                <p className="font-semibold text-sleek-ink text-sm flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {data.contact_phone}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Address</p>
                <p className="font-semibold text-sleek-ink text-sm flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> {data.business_address}
                </p>
              </div>
            </div>
          </div>

          {/* New Enrollment Details Section */}
          {(data.full_name || data.nin || data.device_imei) && (
            <div className="bg-white rounded-2xl border border-sleek-border shadow-sleek p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-sleek-ink">
                <UserIcon size={20} className="text-sleek-primary" />
                Enrollment & Unit Details
              </h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                {data.profile_picture && (
                  <div className="shrink-0">
                    <img 
                      src={data.profile_picture} 
                      alt="Applicant" 
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-50 shadow-sm"
                    />
                  </div>
                )}
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.full_name && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                      <p className="font-semibold text-sleek-ink text-sm">{data.full_name}</p>
                    </div>
                  )}
                  {data.nin && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIN Number</p>
                      <p className="font-semibold text-sleek-primary text-sm font-mono tracking-wider">{data.nin}</p>
                    </div>
                  )}
                  {data.state && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State / LGA</p>
                      <p className="font-semibold text-sleek-ink text-sm">{data.state} {data.lga ? `/ ${data.lga}` : ''}</p>
                    </div>
                  )}
                  {data.phone_number && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Phone</p>
                      <p className="font-semibold text-sleek-ink text-sm">{data.phone_number}</p>
                    </div>
                  )}
                  {data.device_name && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Device Name</p>
                      <p className="font-semibold text-slate-600 text-sm">{data.device_name}</p>
                    </div>
                  )}
                  {data.device_imei && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Device IMEI</p>
                      <p className="font-semibold text-slate-600 text-sm font-mono">{data.device_imei}</p>
                    </div>
                  )}
                  {data.address && (
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deployment Address</p>
                      <p className="font-semibold text-sleek-ink text-sm">{data.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-sleek-border shadow-sleek p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-sleek-ink">
              <FileText size={20} className="text-sleek-primary" />
              Uploaded Documents
            </h2>
            <div className="grid gap-3">
              {data.documents.map((doc: Document) => (
                <a 
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-50 border border-transparent rounded-xl hover:border-sleek-primary transition-all group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                      <FileText size={18} className="text-slate-400 group-hover:text-sleek-primary" />
                    </div>
                    <span className="font-semibold text-slate-700 text-sm truncate">{doc.file_name}</span>
                  </div>
                  <ExternalLink size={16} className="text-slate-300 group-hover:text-sleek-primary" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Notes & Actions */}
        <div className="space-y-8">
          {/* Admin Actions */}
          {user?.role === 'ADMIN' && data.status === 'PENDING' && (
            <div className="bg-sleek-aside rounded-2xl p-8 text-white shadow-xl shadow-sleek-aside/20">
              <h3 className="text-lg font-bold mb-4">Admin Review</h3>
              <textarea 
                placeholder="Enter review notes..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm mb-4 outline-none focus:border-sleek-primary transition-all h-32"
              />
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={updating}
                  className="btn bg-rose-600 hover:bg-rose-700 py-3 font-bold transition-all disabled:opacity-50"
                >
                   Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={updating}
                  className="btn bg-emerald-600 hover:bg-emerald-700 py-3 font-bold transition-all disabled:opacity-50"
                >
                   Approve
                </button>
              </div>
            </div>
          )}

          {/* Audit Trail / Notes */}
          <div className="bg-white rounded-2xl border border-sleek-border shadow-sleek p-6 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-sleek-ink">
              <MessageSquare size={20} className="text-sleek-primary" />
              Notes & History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {data.notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No notes records</p>
                </div>
              ) : (
                data.notes.map((note: AdminNote) => (
                  <div key={note.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 group relative">
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-sleek-primary transition-all h-24"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <XIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={updating || !editContent.trim()}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700 mb-2 leading-relaxed">{note.note}</p>
                        <div className="flex items-center justify-between mt-2 border-t border-slate-200 pt-2">
                           <span className="text-[9px] font-bold text-sleek-primary uppercase tracking-widest">Review Officer</span>
                           <span className="text-[10px] text-slate-400 font-mono">{new Date(note.timestamp).toLocaleDateString()}</span>
                        </div>
                        
                        {user?.role === 'ADMIN' && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(note)}
                              className="p-1.5 text-slate-400 hover:text-sleek-primary hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                              title="Edit note"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                              title="Delete note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {user?.role === 'ADMIN' && data.status !== 'PENDING' && (
              <form onSubmit={handleAddNote} className="relative">
                <input 
                  type="text"
                  placeholder="Add a new note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-sleek-primary transition-all"
                />
                <button 
                  type="submit"
                  disabled={updating || !newNote.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary p-1.5 rounded-lg"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ProgressStep = ({ icon, label, date, active, completed, error, warn }: any) => (
  <div className="flex flex-col items-center text-center relative z-10">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
      completed ? 'bg-sleek-primary border-sleek-primary text-white' : 
      error ? 'bg-rose-500 border-rose-500 text-white' :
      warn ? 'bg-amber-100 border-amber-300 text-amber-600' :
      active ? 'bg-white border-sleek-primary text-sleek-primary shadow-lg shadow-sleek-primary/20' : 
      'bg-white border-slate-200 text-slate-300'
    }`}>
      {completed ? <Check size={18} /> : icon}
    </div>
    <div className="mt-3">
      <p className={`text-xs font-bold uppercase tracking-tight ${active || completed || error ? 'text-slate-900' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{date}</p>
    </div>
  </div>
);
