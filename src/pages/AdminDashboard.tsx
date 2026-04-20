import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus,
  Download,
  ChevronRight,
  FileJson,
  Upload,
  X,
  AlertCircle,
  FileDown,
  Edit3,
  Trash2,
  Building,
  Check
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Application } from '../types';

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchMode, setBatchMode] = useState<'IMPORT' | 'MANUAL'>('IMPORT');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');
  
  // Manual Batch Form State
  const [manualBatchData, setManualBatchData] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({
    full_name: '',
    state: '',
    lga: '',
    address: '',
    phone_number: '',
    device_imei: '',
    device_name: '',
    nin: '',
    profile_picture: '',
    organization_name: '',
    business_address: '',
    contact_email: '',
    contact_phone: ''
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setManualForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualForm(prev => ({ ...prev, profile_picture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addToBatch = () => {
    if (!manualForm.full_name || !manualForm.nin) {
      setBatchError('Full Name and NIN are required for batch manual entry');
      return;
    }

    if (editingEntryId) {
      setManualBatchData(prev => prev.map(item => item.id === editingEntryId ? { ...manualForm, id: editingEntryId } : item));
      setEditingEntryId(null);
    } else {
      setManualBatchData(prev => [...prev, { ...manualForm, id: Date.now() }]);
    }

    setManualForm({
      full_name: '',
      state: '',
      lga: '',
      address: '',
      phone_number: '',
      device_imei: '',
      device_name: '',
      nin: '',
      profile_picture: '',
      organization_name: '',
      business_address: '',
      contact_email: '',
      contact_phone: ''
    });
    setBatchError('');
  };

  const editManualEntry = (item: any) => {
    setManualForm(item);
    setEditingEntryId(item.id);
    setBatchMode('MANUAL');
  };

  const removeFromManualBatch = (id: number) => {
    setManualBatchData(prev => prev.filter(item => item.id !== id));
    if (editingEntryId === id) {
      setEditingEntryId(null);
      setManualForm({
        full_name: '',
        state: '',
        lga: '',
        address: '',
        phone_number: '',
        device_imei: '',
        device_name: '',
        nin: '',
        profile_picture: '',
        organization_name: '',
        business_address: '',
        contact_email: '',
        contact_phone: ''
      });
    }
  };

  const submitManualBatch = async () => {
    if (manualBatchData.length === 0) {
      setBatchError('Add at least one entry to the batch');
      return;
    }
    setBatchLoading(true);
    try {
      await api.submitBatch(manualBatchData);
      setShowBatchModal(false);
      setManualBatchData([]);
      loadData();
    } catch (err: any) {
      setBatchError(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [apps, statData] = await Promise.all([
        api.getAdminApplications(),
        api.getAdminStats()
      ]);
      setApplications(apps);
      setStats(statData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (applications.length === 0) return;
    
    // Create CSV content
    const headers = ['ID', 'Organization', 'Applicant', 'Type', 'Status', 'Applied Date'];
    const rows = applications.map(app => [
      app.id,
      app.organization_name,
      app.applicant_name,
      app.type,
      app.status,
      new Date(app.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `license_applications_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;

    setBatchLoading(true);
    setBatchError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          let data: any[] = [];

          if (batchFile.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else if (batchFile.name.endsWith('.csv')) {
            // Very basic CSV parsing
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            data = lines.slice(1).filter(l => l.trim()).map(line => {
              const values = line.split(',');
              const obj: any = {};
              headers.forEach((h, i) => {
                obj[h] = values[i]?.trim();
              });
              return obj;
            });
          } else {
            throw new Error('Unsupported file format. Please use CSV or JSON.');
          }

          if (!Array.isArray(data)) throw new Error('Invalid format: Top-level should be an array of objects.');

          await api.submitBatch(data);
          setShowBatchModal(false);
          setBatchFile(null);
          loadData();
        } catch (err: any) {
          setBatchError(err.message || 'Failed to parse batch file');
          setBatchLoading(false);
        }
      };
      reader.readAsText(batchFile);
    } catch (err: any) {
      setBatchError(err.message || 'Failed to read file');
      setBatchLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.organization_name.toLowerCase().includes(search.toLowerCase()) || 
                          app.id.toString().includes(search);
    const matchesFilter = filter === 'ALL' || app.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
    </div>
    <div className="h-96 bg-slate-200 rounded-3xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sleek-ink">Admin Dashboard</h1>
          <p className="text-sleek-secondary text-sm">Overview of all center enrollment licensing activity</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleExport}
             className="btn btn-outline flex items-center gap-2"
           >
             <Download size={16} /> Export Report
           </button>
           <button 
             onClick={() => setShowBatchModal(true)}
             className="btn btn-primary flex items-center gap-2 shadow-lg shadow-sleek-primary/20"
           >
             <Plus size={16} /> New Batch
           </button>
        </div>
      </div>

      {/* Modal for Batch Import */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowBatchModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-60 border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Batch</h2>
                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={() => setBatchMode('IMPORT')}
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${batchMode === 'IMPORT' ? 'border-sleek-primary text-sleek-primary' : 'border-transparent text-slate-400'}`}
                    >
                      File Import
                    </button>
                    <button 
                      onClick={() => setBatchMode('MANUAL')}
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${batchMode === 'MANUAL' ? 'border-sleek-primary text-sleek-primary' : 'border-transparent text-slate-400'}`}
                    >
                      Manual Entry
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBatchModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {batchError && (
                <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-2 text-sm border border-rose-100">
                  <AlertCircle size={18} />
                  {batchError}
                </div>
              )}

              {batchMode === 'IMPORT' ? (
                <form onSubmit={handleBatchSubmit} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-800 flex gap-3">
                    <FileDown className="shrink-0" size={20} />
                    <div>
                      <p className="font-bold mb-1">Extended Batch Support</p>
                      <p className="text-xs opacity-80 leading-relaxed text-blue-700">
                        CSV/JSON now supports: <code className="bg-blue-200/50 px-1 rounded">full_name</code>, 
                        <code className="bg-blue-200/50 px-1 rounded">nin</code>, 
                        <code className="bg-blue-200/50 px-1 rounded">device_imei</code>, 
                        <code className="bg-blue-200/50 px-1 rounded">state</code>, 
                        <code className="bg-blue-200/50 px-1 rounded">lga</code>.
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group ${
                      batchFile ? 'border-sleek-primary bg-blue-50/30' : 'border-slate-200 hover:border-sleek-primary hover:bg-slate-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept=".csv,.json"
                      onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                      batchFile ? 'bg-sleek-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-sleek-primary/10 group-hover:text-sleek-primary'
                    }`}>
                      <Upload size={24} />
                    </div>
                    {batchFile ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900">{batchFile.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase">{(batchFile.size / 1024).toFixed(1)} KB • Ready to Import</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-slate-900">Select Batch File</p>
                        <p className="text-xs text-slate-400 mt-1">JSON or CSV with enrollment metrics</p>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={!batchFile || batchLoading}
                    className="w-full flex items-center justify-center gap-2 bg-sleek-primary text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-sleek-primary/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {batchLoading ? 'Processing...' : 'Start Bulk Import'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Progress Header if editing */}
                  {editingEntryId && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center">
                      <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
                        <Edit3 size={16} /> Editing Entry
                      </p>
                      <button 
                        onClick={() => {
                          setEditingEntryId(null);
                          setManualForm({
                            full_name: '', state: '', lga: '', address: '', phone_number: '',
                            device_imei: '', device_name: '', nin: '', profile_picture: '',
                            organization_name: '', business_address: '', contact_email: '', contact_phone: ''
                          });
                        }}
                        className="text-amber-700 hover:bg-amber-100 p-1 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex justify-center mb-2">
                       <label className="relative cursor-pointer group">
                          <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
                          <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-sleek-primary transition-all">
                             {manualForm.profile_picture ? (
                               <img src={manualForm.profile_picture} className="w-full h-full object-cover" />
                             ) : (
                               <Upload className="text-slate-400 group-hover:text-sleek-primary" size={24} />
                             )}
                          </div>
                          <div className="text-[10px] text-center mt-1 font-bold text-slate-400 uppercase">Applicant Picture</div>
                       </label>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-2 text-sleek-primary mb-2">
                         <Users size={16} />
                         <span className="text-xs font-bold uppercase tracking-wider">Personal Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                          <input name="full_name" value={manualForm.full_name} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="John Doe" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NIN Number</label>
                          <input name="nin" value={manualForm.nin} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="12345678901" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State</label>
                          <input name="state" value={manualForm.state} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="Lagos" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Local Govt (LGA)</label>
                          <input name="lga" value={manualForm.lga} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="Ikeja" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-sleek-primary mb-2">
                         <Building size={16} />
                         <span className="text-xs font-bold uppercase tracking-wider">Business Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Business/Organization Name</label>
                            <input name="organization_name" value={manualForm.organization_name} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="Arewa Tech Solutions" />
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Business Email</label>
                            <input name="contact_email" value={manualForm.contact_email} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="info@biz.com" />
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Business Phone</label>
                            <input name="contact_phone" value={manualForm.contact_phone} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="080 000 0000" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Business Address</label>
                            <textarea name="business_address" value={manualForm.business_address} onChange={handleManualFormChange} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary resize-none" placeholder="No 12 Business Street, Area 1" />
                         </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-sleek-primary mb-2">
                         <FileDown size={16} />
                         <span className="text-xs font-bold uppercase tracking-wider">Device Metadata</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Device IMEI</label>
                          <input name="device_imei" value={manualForm.device_imei} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="351234..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Device Name</label>
                          <input name="device_name" value={manualForm.device_name} onChange={handleManualFormChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-sleek-primary" placeholder="Biometric Tablet X1" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                       <button 
                         onClick={addToBatch}
                         className="w-full py-3 bg-sleek-ink text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                       >
                         {editingEntryId ? <Check size={18} /> : <Plus size={18} />}
                         {editingEntryId ? 'Update Entry in Batch' : 'Add to Current Batch'}
                       </button>
                    </div>
                  </div>

                  {manualBatchData.length > 0 && (
                    <div className="border-t border-slate-100 pt-6">
                       <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex justify-between">
                         Items in Batch <span>{manualBatchData.length} entries</span>
                       </h3>
                       <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                          {manualBatchData.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                                     {item.profile_picture ? <img src={item.profile_picture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">P</div>}
                                  </div>
                                  <div className="truncate">
                                     <p className="text-sm font-bold text-slate-900 truncate">{item.full_name}</p>
                                     <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                                       {item.organization_name || 'Individual'} • {item.nin}
                                     </p>
                                  </div>
                               </div>
                               <div className="flex gap-1">
                                  <button 
                                    onClick={() => editManualEntry(item)} 
                                    className="p-1.5 text-slate-400 hover:text-sleek-primary hover:bg-white rounded-lg transition-all"
                                    title="Edit entry"
                                  >
                                     <Edit3 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => removeFromManualBatch(item.id)} 
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                                    title="Delete entry"
                                  >
                                     <Trash2 size={14} />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>
                       <button 
                         onClick={submitManualBatch}
                         disabled={batchLoading}
                         className="w-full mt-4 flex items-center justify-center gap-2 bg-nimc-green text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-nimc-green/20 transition-all active:scale-[0.98]"
                       >
                         {batchLoading ? 'Saving Batch...' : 'Submit Batch Request'}
                       </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Requests" 
          value={stats.total.toLocaleString()} 
          change="↑ 12% vs last month"
          changeColor="text-emerald-500"
        />
        <StatCard 
          label="Pending Review" 
          value={stats.pending} 
          change="Requires attention"
          changeColor="text-amber-500"
        />
        <StatCard 
          label="Approved" 
          value={stats.approved} 
          change="82% Conversion rate"
          changeColor="text-slate-400"
        />
        <StatCard 
          label="Rejection Rate" 
          value={`${((stats.rejected / (stats.total || 1)) * 100).toFixed(1)}%`}
          change="↑ 2.1% Compliance gap"
          changeColor="text-rose-500"
        />
      </div>

      <div className="table-container">
        <div className="p-6 border-b border-sleek-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-sleek-ink">Recent License Applications</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sleek-primary transition-all text-sm w-[240px]"
              />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-sleek-primary transition-all text-sm font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-sleek-border">Applicant / Org</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-sleek-border">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-sleek-border">Applied Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-sleek-border">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-sleek-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                        {app.organization_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sleek-ink leading-tight">{app.organization_name}</p>
                        <p className="text-xs text-sleek-secondary uppercase tracking-tighter">{app.applicant_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-600 uppercase">
                      {app.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-sleek-secondary">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/application/${app.id}`}
                      className="btn btn-outline py-1 px-3 text-[11px] uppercase tracking-wider hover:border-sleek-primary hover:text-sleek-primary"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredApps.length === 0 && (
          <div className="py-20 text-center">
             <p className="text-slate-400 text-sm">No applications matching your search</p>
          </div>
        )}

        <div className="p-4 text-center border-top border-sleek-border">
           <button className="text-sleek-primary font-bold text-sm hover:underline">Show All Applications</button>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, change, changeColor }: any) => (
  <div className="stat-card">
    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-bold text-sleek-ink">{value}</div>
    {change && <div className={`text-[11px] mt-1 font-medium ${changeColor}`}>{change}</div>}
  </div>
);

