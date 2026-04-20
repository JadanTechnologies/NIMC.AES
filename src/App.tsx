import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  PlusCircle, 
  ShieldCheck, 
  User as UserIcon,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Menu,
  X,
  FileUp,
  History,
  Info
} from 'lucide-react';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewApplication from './pages/NewApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogs from './pages/AuditLogs';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: UserRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, role: 'BOTH' },
    { name: 'New Request', path: '/new-request', icon: PlusCircle, role: 'APPLICANT' },
    { name: 'Audit Logs', path: '/logs', icon: History, role: 'ADMIN' },
  ];

  const filteredLinks = navLinks.filter(link => 
    link.role === 'BOTH' || link.role === user?.role
  );

  return (
    <div className="flex min-h-screen bg-sleek-bg text-sleek-ink">
      {/* Desktop Sidebar */}
      {user && (
        <aside className="hidden lg:flex flex-col w-[260px] bg-sleek-aside text-slate-300 h-screen sticky top-0 py-8 px-4 border-r border-sleek-aside/10">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-sleek-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sleek-primary/30">
              N
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight uppercase">NIMC</div>
              <div className="text-[10px] opacity-60 uppercase font-semibold tracking-widest text-slate-300">License Manager</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {filteredLinks.map((link) => (
              <NavLink 
                key={link.path} 
                to={link.path} 
                icon={<link.icon size={18} />} 
                label={link.name} 
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {user && (
          <header className="lg:hidden h-16 bg-white border-b border-sleek-border px-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sleek-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <span className="font-bold text-sleek-ink">NIMC</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-sleek-secondary"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </header>
        )}

        {/* Global Nav for non-logged in users */}
        {!user && (
          <header className="h-16 bg-white border-b border-sleek-border px-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sleek-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <span className="font-bold text-sleek-ink">NIMC License Portal</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="btn btn-outline">Log in</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          </header>
        )}

        <main className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-[280px] bg-sleek-aside h-full p-6 text-white"
              onClick={e => e.stopPropagation()}
            >
               <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-sleek-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  N
                </div>
                <div className="font-bold text-lg uppercase tracking-wider">NIMC</div>
              </div>

              <nav className="space-y-1">
                {filteredLinks.map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <link.icon size={20} />
                    {link.name}
                  </Link>
                ))}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mt-6"
                >
                  <LogOut size={20} /> Logout
                </button>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavLink = ({ to, icon, label, key }: any) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to || (to !== '/' && window.location.pathname.startsWith(to));

  return (
    <button 
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        isActive 
          ? 'bg-sleek-sidebar-active text-white shadow-sm' 
          : 'text-slate-400 hover:bg-sleek-aside-hover hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {isActive && <motion.div layoutId="activeInd" className="ml-auto w-1 h-1 bg-sleek-primary rounded-full" />}
    </button>
  );
};


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardContainer />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/new-request" element={
            <ProtectedRoute role="APPLICANT">
              <Layout>
                <NewApplication />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/application/:id" element={
            <ProtectedRoute>
              <Layout>
                <ApplicationDetail />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/logs" element={
            <ProtectedRoute role="ADMIN">
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const DashboardContainer = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <Dashboard />;
};

