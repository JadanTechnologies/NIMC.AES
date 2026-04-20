export type UserRole = 'APPLICANT' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Application {
  id: number;
  user_id: number;
  organization_name: string;
  contact_email: string;
  contact_phone: string;
  business_address: string;
  type: 'INDIVIDUAL' | 'ENTERPRISE';
  status: ApplicationStatus;
  created_at: string;
  applicant_name?: string;
  
  // New fields for detailed enrollment tracking
  full_name?: string;
  state?: string;
  lga?: string;
  address?: string;
  phone_number?: string;
  device_imei?: string;
  device_name?: string;
  nin?: string;
  profile_picture?: string;
}

export interface Document {
  id: number;
  application_id: number;
  file_url: string;
  file_name: string;
}

export interface AdminNote {
  id: number;
  application_id: number;
  admin_id: number;
  note: string;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  target_id: number;
  timestamp: string;
}
