import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, CheckCircle, XCircle, FileText, ChevronRight, Plus } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Application } from '../types';

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse flex flex-col gap-4">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sleek-ink">Applications</h1>
          <p className="text-sleek-secondary text-sm">Manage and track your license enrollment requests</p>
        </div>
        <Link 
          to="/new-request" 
          className="btn btn-primary inline-flex items-center gap-2 shadow-lg shadow-sleek-primary/20"
        >
          <Plus size={18} />
          New Request
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-sleek-border rounded-2xl p-16 text-center shadow-sleek">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-slate-300" size={40} />
          </div>
          <h2 className="text-xl font-bold text-sleek-ink">No applications yet</h2>
          <p className="text-sleek-secondary mb-8 max-w-sm mx-auto">
            Submit your first license request to start your enrollment partnership with NIMC.
          </p>
          <Link 
            to="/new-request"
            className="btn btn-primary bg-slate-100 !text-sleek-primary hover:bg-slate-200"
          >
            Get Started &rarr;
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <div className="hidden md:grid grid-cols-[1fr_150px_150px_100px] gap-4 px-6 py-3 bg-slate-50/50 border-b border-sleek-border text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Applicant / Organization</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-slate-100">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={`/application/${app.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px_100px] items-center gap-4 p-6 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-sleek-primary group-hover:text-white transition-all">
                      {app.organization_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sleek-ink group-hover:text-sleek-primary transition-colors">{app.organization_name}</h3>
                      <p className="text-xs text-sleek-secondary">ID: #{app.id} • Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded uppercase">
                      {app.type}
                    </span>
                  </div>

                  <div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="text-right">
                    <span className="btn btn-outline py-1 px-3 text-xs group-hover:border-sleek-primary group-hover:text-sleek-primary transition-all">
                      View
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
