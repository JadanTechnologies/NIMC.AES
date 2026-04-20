import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { History, Activity, ShieldCheck, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}
  </div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-3 rounded-2xl text-white">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-sans">System Audit Trail</h1>
          <p className="text-slate-500">History of all admin actions and system events</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No logs found</div>
          ) : (
            logs.map((log, index) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-1">
                  <Activity size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-slate-900">
                      {log.admin_name} <span className="font-normal text-slate-500">performed</span> {log.action}
                    </p>
                    <span className="text-xs font-mono text-slate-400 uppercase">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold uppercase tracking-tighter">
                      Admin ID: #{log.admin_id}
                    </span>
                    {log.target_id && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase tracking-tighter">
                        Target Application: #{log.target_id}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
