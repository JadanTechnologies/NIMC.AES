import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Application } from '../types';

export const StatusBadge = ({ status }: { status: Application['status'] }) => {
  const styles = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected'
  };
  const Icons = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle
  };
  const Icon = Icons[status];

  return (
    <span className={`status-badge ${styles[status]} flex items-center gap-1.5 w-fit whitespace-nowrap`}>
      <Icon size={14} />
      {status}
    </span>
  );
};
