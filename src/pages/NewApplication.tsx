import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileUp, Info, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { api } from '../lib/api';

export default function NewApplication() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_email: '',
    contact_phone: '',
    business_address: '',
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'ENTERPRISE'
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'organization_name':
        if (!value) return 'Organization name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        if (value.length > 100) return 'Name is too long (max 100)';
        return '';
      case 'contact_email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'contact_phone':
        if (!value) return 'Phone number is required';
        // Nigerian phone regex: supports +234..., 080..., 070..., 090..., etc.
        const phoneRegex = /^(\+234|0)[789]\d{9}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Please enter a valid Nigerian phone number';
        return '';
      case 'business_address':
        if (!value) return 'Address is required';
        if (value.length < 10) return 'Please provide a more detailed address (min 10 chars)';
        if (value.length > 500) return 'Address is too long';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Immediate validation feedback
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const oversized = selectedFiles.some(f => f.size > 5 * 1024 * 1024);
      if (oversized) {
        setError('One or more files exceed the 5MB limit');
        return;
      }
      setFiles(selectedFiles);
      setUploadProgress(0);
      setError('');
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, (formData as any)[key]);
      if (error) errors[key] = error;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
      setError('Please fix the errors before proceeding');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep1()) {
      setError('Please fix the errors in Step 1');
      setStep(1);
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, (formData as any)[key]);
      });
      files.forEach(file => {
        data.append('documents', file);
      });

      await api.submitApplication(data, (percent) => {
        setUploadProgress(percent);
      });
      
      // Artificial delay on 100% to let the user see the completion
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
      setLoading(false);
    }
  };

  // Logic to calculate individual file progress based on aggregate progress
  const getFileProgress = (fileIndex: number) => {
    if (uploadProgress === 0) return 0;
    if (uploadProgress === 100) return 100;

    const aggregateLoadedBytes = (uploadProgress / 100) * totalFilesSize;
    let bytesBefore = 0;
    for (let i = 0; i < fileIndex; i++) {
      bytesBefore += files[i].size;
    }

    const fileLoaded = Math.max(0, Math.min(files[fileIndex].size, aggregateLoadedBytes - bytesBefore));
    return Math.floor((fileLoaded / files[fileIndex].size) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-nimc-blue transition-colors mb-4"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900 font-sans">New License Application</h1>
        <p className="text-slate-500">Provide accurate details for NIMC enrollment center licensing</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
        {[1, 2].map((i) => (
          <div 
            key={i}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= i ? 'bg-nimc-blue text-white ring-8 ring-nimc-blue/10' : 'bg-white text-slate-400 border-2 border-slate-200'
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {step === 1 ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name / Organization Name</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                      fieldErrors.organization_name ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-nimc-blue/10 focus:border-nimc-blue'
                    }`}
                    placeholder="e.g. Identity Solutions Ltd"
                  />
                  {fieldErrors.organization_name && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.organization_name}</p>}
                </div>
 
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                      fieldErrors.contact_email ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-nimc-blue/10 focus:border-nimc-blue'
                    }`}
                    placeholder="contact@org.com"
                  />
                  {fieldErrors.contact_email && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.contact_email}</p>}
                </div>
 
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                      fieldErrors.contact_phone ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-nimc-blue/10 focus:border-nimc-blue'
                    }`}
                    placeholder="+234 800 000 0000"
                  />
                  {fieldErrors.contact_phone && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.contact_phone}</p>}
                </div>
 
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">License Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-nimc-blue/10 focus:border-nimc-blue outline-none transition-all"
                  >
                    <option value="INDIVIDUAL">Individual Enrollment Agent</option>
                    <option value="ENTERPRISE">Enterprise License</option>
                  </select>
                </div>
              </div>
 
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business / Office Address</label>
                <textarea
                  name="business_address"
                  rows={3}
                  value={formData.business_address}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                    fieldErrors.business_address ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-nimc-blue/10 focus:border-nimc-blue'
                  }`}
                  placeholder="Street, City, State"
                />
                {fieldErrors.business_address && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.business_address}</p>}
              </div>
 
              <div className="pt-4">
                <button 
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 bg-nimc-blue text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-nimc-blue/20 transition-all active:scale-[0.98]"
                >
                  Next Step <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-sm">
                  <Info className="shrink-0" size={20} />
                  <p>Please upload clear PDF or image copies of your Business Registration, Identity Document, and Proof of Address.</p>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center transition-all hover:bg-slate-50/50 hover:border-nimc-blue/30 relative">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="bg-nimc-blue/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-nimc-blue">
                    <FileUp size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Upload Documents</h3>
                  <p className="text-slate-500">Drag and drop or click to browse files</p>
                  <p className="text-xs text-slate-400 mt-2">Support JPG, PNG, PDF (Max 5MB each)</p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    {loading && (
                      <div className="bg-slate-50 border border-sleek-border rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-sleek-ink uppercase tracking-wider">Batch Progress</span>
                          <span className="text-xs font-mono font-bold text-sleek-primary">{uploadProgress}%</span>
                        </div>
                        <div className="progress-bg h-2">
                          <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      {files.map((file, i) => {
                        const filePerc = getFileProgress(i);
                        return (
                          <div key={i} className="group p-4 bg-white border border-sleek-border rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 truncate">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${filePerc === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <FileUp size={16} />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-sleek-ink truncate block max-w-[200px]">{file.name}</span>
                                  <span className="text-[10px] text-sleek-secondary uppercase font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                              {loading ? (
                                <span className="text-[10px] font-mono font-bold text-sleek-primary bg-blue-50 px-2 py-0.5 rounded-full">{filePerc}%</span>
                              ) : (
                                <CheckCircle size={18} className="text-emerald-500" />
                              )}
                            </div>
                            {loading && (
                              <div className="progress-bg">
                                <div className="progress-fill" style={{ width: `${filePerc}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Previous
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-nimc-green text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-nimc-green/20 transition-all"
                >
                  <Save size={20} />
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}
