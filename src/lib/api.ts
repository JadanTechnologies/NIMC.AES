import { User, Application, AuditLog, UserRole } from '../types';

// Mock DB keys
const DB_KEYS = {
  USERS: 'nimc_users',
  APPLICATIONS: 'nimc_apps',
  DOCS: 'nimc_docs',
  NOTES: 'nimc_notes',
  LOGS: 'nimc_logs',
  SESSION: 'nimc_session'
};

// Initial data setup
const initializeStorage = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const defaultAdmin = {
      id: 1,
      name: 'NIMC Super Admin',
      email: 'admin@nimc.gov.ng',
      password: 'admin123', // In a real app we'd hash, but for local mock this is fine
      role: 'ADMIN' as UserRole
    };
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify([defaultAdmin]));
  }
  if (!localStorage.getItem(DB_KEYS.APPLICATIONS)) {
    const sampleApps = [
      {
        id: 101,
        user_id: 1,
        full_name: 'Abubakar Usman Bello',
        organization_name: 'Arewa Tech Solutions',
        contact_email: 'abubakar.b@arewatech.ng',
        contact_phone: '08031234567',
        business_address: 'No 42 Ahmadu Bello Way, Kano State',
        type: 'ENTERPRISE',
        status: 'PENDING',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        state: 'Kano',
        lga: 'Kano Municipal',
        nin: '12345678901',
        device_imei: '358901234567890',
        device_name: 'NIMC Biometric Tablet v3'
      },
      {
        id: 102,
        user_id: 1,
        full_name: 'Zainab Ibrahim',
        organization_name: 'Zainab Ibrahim (Individual)',
        contact_email: 'zainab.i@gmail.com',
        contact_phone: '09077665544',
        business_address: 'Ungwar Rimi, Kaduna South, Kaduna',
        type: 'INDIVIDUAL',
        status: 'APPROVED',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        state: 'Kaduna',
        lga: 'Kaduna South',
        nin: '98765432109',
        device_imei: '351234567890123',
        device_name: 'Samsung Galaxy Tab Active'
      },
      {
        id: 103,
        user_id: 1,
        full_name: 'Musa Garba Katsina',
        organization_name: 'Danbatta Digital Services',
        contact_email: 'musa.garba@danbatta.net',
        contact_phone: '08100223344',
        business_address: 'Kofar Kudu, Katsina City',
        type: 'ENTERPRISE',
        status: 'REJECTED',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        state: 'Katsina',
        lga: 'Katsina',
        nin: '44556677889',
        device_imei: '359988776655441',
        device_name: 'SecureScan Elite'
      }
    ];
    localStorage.setItem(DB_KEYS.APPLICATIONS, JSON.stringify(sampleApps));
    
    // Seed some initial notes for the rejected/approved ones
    const sampleNotes = [
      {
        id: 501,
        application_id: 102,
        admin_id: 1,
        note: 'All biometric verification hardware meets NIMC standards. License approved for field deployment.',
        timestamp: new Date(Date.now() - 82800000).toISOString()
      },
      {
        id: 502,
        application_id: 103,
        admin_id: 1,
        note: 'Missing Business Registration Certificate (CAC). NIN verification failed for the secondary operator.',
        timestamp: new Date(Date.now() - 169200000).toISOString()
      }
    ];
    localStorage.setItem(DB_KEYS.NOTES, JSON.stringify(sampleNotes));
  }
  if (!localStorage.getItem(DB_KEYS.DOCS)) localStorage.setItem(DB_KEYS.DOCS, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.NOTES)) localStorage.setItem(DB_KEYS.NOTES, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.LOGS)) localStorage.setItem(DB_KEYS.LOGS, JSON.stringify([]));
};

initializeStorage();

const getData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const getSession = () => JSON.parse(localStorage.getItem(DB_KEYS.SESSION) || 'null');

export const api = {
  // Auth
  async login(credentials: any) {
    await new Promise(r => setTimeout(r, 500));
    const users = getData(DB_KEYS.USERS);
    const user = users.find((u: any) => u.email === credentials.email && u.password === credentials.password);
    
    if (!user) throw new Error('Invalid email or password');
    
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem('token', 'mock-jwt-token');
    return { user: session, token: 'mock-jwt-token' };
  },

  async register(data: any) {
    await new Promise(r => setTimeout(r, 500));
    const users = getData(DB_KEYS.USERS);
    if (users.some((u: any) => u.email === data.email)) throw new Error('Email already registered');
    
    const newUser = {
      ...data,
      id: Date.now(),
      role: 'APPLICANT' as UserRole
    };
    users.push(newUser);
    setData(DB_KEYS.USERS, users);
    return { message: 'User registered successfully' };
  },

  // Applications
  async getApplications(): Promise<Application[]> {
    await new Promise(r => setTimeout(r, 300));
    const session = getSession();
    if (!session) throw new Error('Unauthorized');
    
    const apps = getData(DB_KEYS.APPLICATIONS);
    return apps.filter((a: any) => a.user_id === session.id);
  },

  async getApplicationDetails(id: number): Promise<any> {
    await new Promise(r => setTimeout(r, 300));
    const session = getSession();
    if (!session) throw new Error('Unauthorized');

    const apps = getData(DB_KEYS.APPLICATIONS);
    const application = apps.find((a: any) => a.id === id);
    if (!application) throw new Error('Application not found');

    if (session.role !== 'ADMIN' && application.user_id !== session.id) {
      throw new Error('Forbidden');
    }

    const docs = getData(DB_KEYS.DOCS).filter((d: any) => d.application_id === id);
    const notes = getData(DB_KEYS.NOTES).filter((n: any) => n.application_id === id);
    
    return { ...application, documents: docs, notes: notes };
  },

  async submitApplication(formData: FormData, onProgress?: (percent: number) => void) {
    const session = getSession();
    if (!session) throw new Error('Unauthorized');

    // Simulate progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        onProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const apps = getData(DB_KEYS.APPLICATIONS);
    const docs = getData(DB_KEYS.DOCS);
    
    const appId = Date.now();
    const newApp: any = {
      id: appId,
      user_id: session.id,
      organization_name: formData.get('organization_name'),
      contact_email: formData.get('contact_email'),
      contact_phone: formData.get('contact_phone'),
      business_address: formData.get('business_address'),
      type: formData.get('type'),
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    apps.push(newApp);
    setData(DB_KEYS.APPLICATIONS, apps);

    // Mock documents
    const files = formData.getAll('documents');
    files.forEach((file: any) => {
      docs.push({
        id: Math.random(),
        application_id: appId,
        file_name: file.name,
        file_url: '#' // Local mock doesn't store files
      });
    });
    setData(DB_KEYS.DOCS, docs);

    return { id: appId, message: 'Submitted successfully' };
  },

  async submitBatch(batchData: any[]) {
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');

    const apps = getData(DB_KEYS.APPLICATIONS);
    const logs = getData(DB_KEYS.LOGS);
    
    batchData.forEach(item => {
      const appId = Date.now() + Math.floor(Math.random() * 1000);
      apps.push({
        id: appId,
        user_id: session.id,
        organization_name: item.organization_name || item.full_name || 'Individual Applicant',
        contact_email: item.contact_email || item.email || 'N/A',
        contact_phone: item.contact_phone || item.phone_number || 'N/A',
        business_address: item.business_address || item.address || 'N/A',
        type: (item.type || 'INDIVIDUAL').toUpperCase(),
        status: 'PENDING',
        created_at: new Date().toISOString(),
        
        // Extended fields
        full_name: item.full_name,
        state: item.state,
        lga: item.lga,
        address: item.address,
        phone_number: item.phone_number,
        device_imei: item.device_imei,
        device_name: item.device_name,
        nin: item.nin,
        profile_picture: item.profile_picture
      });
    });

    setData(DB_KEYS.APPLICATIONS, apps);
    
    logs.push({
      id: Date.now(),
      admin_id: session.id,
      action: `Imported batch of ${batchData.length} applications`,
      target_id: null,
      timestamp: new Date().toISOString(),
      admin_name: session.name
    });
    setData(DB_KEYS.LOGS, logs);

    await new Promise(r => setTimeout(r, 1000));
    return { message: `Successfully imported ${batchData.length} applications` };
  },

  // Admin
  async getAdminApplications(): Promise<Application[]> {
    await new Promise(r => setTimeout(r, 400));
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');
    
    const apps = getData(DB_KEYS.APPLICATIONS);
    const users = getData(DB_KEYS.USERS);
    
    return apps.map((app: any) => ({
      ...app,
      applicant_name: users.find((u: any) => u.id === app.user_id)?.name || 'Unknown'
    }));
  },

  async getAdminStats() {
    const apps = getData(DB_KEYS.APPLICATIONS);
    return {
      total: apps.length,
      pending: apps.filter((a: any) => a.status === 'PENDING').length,
      approved: apps.filter((a: any) => a.status === 'APPROVED').length,
      rejected: apps.filter((a: any) => a.status === 'REJECTED').length
    };
  },

  async updateStatus(id: number, status: string, note: string) {
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');

    const apps = getData(DB_KEYS.APPLICATIONS);
    const appIndex = apps.findIndex((a: any) => a.id === id);
    if (appIndex === -1) throw new Error('Not found');

    apps[appIndex].status = status;
    setData(DB_KEYS.APPLICATIONS, apps);

    // Add note
    const notes = getData(DB_KEYS.NOTES);
    notes.push({
      id: Date.now(),
      application_id: id,
      admin_id: session.id,
      note: note,
      timestamp: new Date().toISOString()
    });
    setData(DB_KEYS.NOTES, notes);

    // Add log
    const logs = getData(DB_KEYS.LOGS);
    logs.push({
      id: Date.now(),
      admin_id: session.id,
      action: `${status} application`,
      target_id: id,
      timestamp: new Date().toISOString(),
      admin_name: session.name
    });
    setData(DB_KEYS.LOGS, logs);

    return { message: 'Updated successfully' };
  },

  async addNote(id: number, note: string) {
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');

    const notes = getData(DB_KEYS.NOTES);
    notes.push({
      id: Date.now(),
      application_id: id,
      admin_id: session.id,
      note: note,
      timestamp: new Date().toISOString()
    });
    setData(DB_KEYS.NOTES, notes);
    return { message: 'Note added' };
  },

  async editNote(noteId: number, newNote: string) {
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');

    const notes = getData(DB_KEYS.NOTES);
    const noteIndex = notes.findIndex((n: any) => n.id === noteId);
    if (noteIndex === -1) throw new Error('Note not found');

    notes[noteIndex].note = newNote;
    setData(DB_KEYS.NOTES, notes);
    return { message: 'Note updated' };
  },

  async deleteNote(noteId: number) {
    const session = getSession();
    if (session?.role !== 'ADMIN') throw new Error('Forbidden');

    const notes = getData(DB_KEYS.NOTES);
    const filteredNotes = notes.filter((n: any) => n.id !== noteId);
    setData(DB_KEYS.NOTES, filteredNotes);
    return { message: 'Note deleted' };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return getData(DB_KEYS.LOGS).sort((a: any, b: any) => b.id - a.id);
  }
};
