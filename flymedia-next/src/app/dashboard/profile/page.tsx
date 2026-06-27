'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Building,
  LayoutDashboard,
  Info,
  Calendar,
  FileText,
  Users,
  Edit3,
  Save,
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlignLeft,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  DollarSign,
  Gift,
  Tag,
  RefreshCw,
  ShieldCheck,
  UserX,
  UserPlus,
  Upload,
  Palette,
} from 'lucide-react';

export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'dashboard' | 'info' | 'reservations' | 'eod' | 'delegated' | 'campaigns' | 'styling'>('profile');

  // Staff / Delegated Accounts State
  const [staff, setStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', password: '', roleName: 'Cashier' });
  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '', roleName: '', status: 'active' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [seedStaffLoading, setSeedStaffLoading] = useState(false);
  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PER_PAGE = 8;
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string; description: string | null }[]>([]);
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [store, setStore] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);

  // Coupon Campaigns State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    profileName: '',
    category: '',
    address: '',
    zipCode: '',
    state: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    currency: 'AUD',
    website: '',
    description: '',
    banner: '',
    companyName: '',
    logo: '',
    slug: '',
    themePrimaryColor: '#2A0E07',
    themeAccentColor: '#C39A3C',
    themeBgColor: '#F9F6F0',
    themeLayout: 'classic',
    themeFont: 'serif',
  });

  const [editMode, setEditMode] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('File is too large. Max size is 5MB.');
      return;
    }

    try {
      setLogoUploading(true);
      setLogoUploadError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      setFormData((prev) => ({ ...prev, logo: data.url }));
    } catch (err: any) {
      setLogoUploadError(err.message || 'Something went wrong during upload.');
    } finally {
      setLogoUploading(false);
    }
  };
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setBannerUploadError('File is too large. Max size is 5MB.');
      return;
    }

    try {
      setBannerUploading(true);
      setBannerUploadError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner');

      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload banner');
      }

      setFormData((prev) => ({ ...prev, banner: data.url }));
    } catch (err: any) {
      setBannerUploadError(err.message || 'Something went wrong during upload.');
    } finally {
      setBannerUploading(false);
    }
  };

  // Load Profile Data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/profile');
      const data = await res.json();
      
      if (data.success) {
        setStore(data.store);
        setOrganization(data.organization);
        
        // Populate form fields
        setFormData({
          profileName: data.store.name || '',
          category: data.store.category || 'Restaurant',
          address: data.store.address || '',
          zipCode: data.store.zip_code || '',
          state: data.store.state || '',
          city: data.store.city || '',
          country: data.store.country || '',
          phone: data.store.phone || '',
          email: data.store.email || '',
          currency: data.store.currency || 'AUD',
          website: data.store.website || '',
          description: data.store.description || '',
          banner: data.store.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200',
          companyName: data.organization?.name || '',
          logo: data.organization?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300',
          slug: data.organization?.slug || '',
          themePrimaryColor: data.store.theme_primary_color || '#2A0E07',
          themeAccentColor: data.store.theme_accent_color || '#C39A3C',
          themeBgColor: data.store.theme_bg_color || '#F9F6F0',
          themeLayout: data.store.theme_layout || 'classic',
          themeFont: data.store.theme_font || 'serif',
        });
      } else {
        setError(data.error || 'Failed to fetch business profile.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading the profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await fetch('/api/dashboard/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      setStaffError(null);
      const [staffRes, rolesRes] = await Promise.all([
        fetch('/api/dashboard/staff'),
        fetch('/api/dashboard/roles'),
      ]);
      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();
      if (staffData.success) { setStaff(staffData.staff || []); setStaffPage(1); }
      else setStaffError(staffData.error || 'Failed to load staff.');
      if (rolesData.success) setAvailableRoles(rolesData.roles || []);
    } catch { setStaffError('Network error.'); }
    finally { setStaffLoading(false); }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true); setStaffError(null); setStaffSuccess(null);
      const res = await fetch('/api/dashboard/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });
      const data = await res.json();
      if (data.success) {
        setStaffSuccess(data.message); setShowCreateModal(false);
        setNewStaff({ name: '', email: '', phone: '', password: '', roleName: 'Cashier' });
        await fetchStaff();
      } else { setStaffError(data.error || 'Failed to create account.'); }
    } catch { setStaffError('Network error.'); }
    finally { setCreateLoading(false); }
  };

  const handleRevokeStaff = async (userId: string, userName: string) => {
    if (!window.confirm(`Remove "${userName}" from this restaurant? This cannot be undone.`)) return;
    try {
      setRevokeLoadingId(userId); setStaffError(null); setStaffSuccess(null);
      const res = await fetch(`/api/dashboard/staff?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setStaffSuccess(data.message); setStaff(prev => prev.filter(u => u.id !== userId)); }
      else { setStaffError(data.error || 'Failed to revoke access.'); }
    } catch { setStaffError('Network error.'); }
    finally { setRevokeLoadingId(null); }
  };

  const openEditModal = (member: any) => {
    const memberRoles: any[] = member.Roles || [];
    setEditingStaff(member);
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '',
      roleName: memberRoles[0]?.name || 'Cashier',
      status: member.status || 'active',
    });
    setStaffError(null);
    setStaffSuccess(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      setUpdateLoading(true); setStaffError(null); setStaffSuccess(null);
      const res = await fetch('/api/dashboard/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingStaff.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setStaffSuccess(data.message);
        setEditingStaff(null);
        await fetchStaff();
      } else { setStaffError(data.error || 'Failed to update account.'); }
    } catch { setStaffError('Network error.'); }
    finally { setUpdateLoading(false); }
  };

  const handleSeedStaff = async () => {
    try {
      setSeedStaffLoading(true); setStaffError(null); setStaffSuccess(null);
      const res = await fetch('/api/dashboard/staff/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStaffSuccess(`${data.message} Default password: Staff@123`);
        await fetchStaff();
      } else { setStaffError(data.error || 'Failed to seed staff.'); }
    } catch { setStaffError('Network error.'); }
    finally { setSeedStaffLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCoupons();
    if (activeTab === 'delegated') fetchStaff();
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setStore(data.store);
        setOrganization(data.organization);
        setSuccess('Business profile updated successfully!');
        setEditMode(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('profileUpdated'));
        }
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (store && organization) {
      setFormData({
        profileName: store.name || '',
        category: store.category || 'Restaurant',
        address: store.address || '',
        zipCode: store.zip_code || '',
        state: store.state || '',
        city: store.city || '',
        country: store.country || '',
        phone: store.phone || '',
        email: store.email || '',
        currency: store.currency || 'AUD',
        website: store.website || '',
        description: store.description || '',
        banner: store.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200',
        companyName: organization.name || '',
        logo: organization.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300',
        slug: organization.slug || '',
        themePrimaryColor: store.theme_primary_color || '#2A0E07',
        themeAccentColor: store.theme_accent_color || '#C39A3C',
        themeBgColor: store.theme_bg_color || '#F9F6F0',
        themeLayout: store.theme_layout || 'classic',
        themeFont: store.theme_font || 'serif',
      });
    }
    setEditMode(false);
    setError(null);
  };

  // Helper tabs list
  const tabsList = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', name: 'View Profile', icon: Building },
    { id: 'styling', name: 'Menu Card Styling', icon: Palette },
    { id: 'info', name: 'Additional Business Info.', icon: Info },
    { id: 'reservations', name: 'Current Reservations', icon: Calendar },
    { id: 'eod', name: 'EoD Report.', icon: FileText },
    { id: 'delegated', name: 'Delegated Accounts', icon: Users },
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 p-4 md:p-8">
      
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white flex items-center gap-2">
            <Building className="h-7 w-7 text-[#f59e0b]" />
            BUSINESS PROFILE SETTINGS
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
            Manage your store attributes, contact info, operating details and layout.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 flex items-start gap-3 text-sm animate-fadeIn">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 flex items-start gap-3 text-sm animate-fadeIn">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Success:</span> {success}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
            <p className="mt-4 text-slate-400 font-semibold tracking-wider text-xs">Loading profile settings...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Visual Tabs Sidebar */}
          <div className="w-full lg:w-72 shrink-0 bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-4 space-y-1.5 shadow-xl shadow-slate-950/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3 mb-2">Navigation Options</p>
            {tabsList.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition duration-150 text-left ${
                    isActive
                      ? 'bg-[#1a2336] text-[#f59e0b] border-l-2 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  <TabIcon className="h-4.5 w-4.5" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Main Tab Content Panel */}
          <div className="flex-1 w-full bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl shadow-xl shadow-slate-950/50 overflow-hidden">
            
            {/* View Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                {/* Banner Preview Block */}
                <div className="relative h-44 md:h-56 bg-slate-900 overflow-hidden group">
                  {formData.banner && (
                    <img
                      src={formData.banner}
                      alt="Store Banner"
                      className="w-full h-full  opacity-80"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c101b] via-[#0c101b]/20 to-transparent"></div>
                  {editMode && (
                    <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-sm border border-[#1e293b] rounded-xl p-3 max-w-xs transition shadow-lg flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Banner Image</p>
                        <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#080b11] hover:bg-slate-900 text-slate-200 hover:text-white cursor-pointer transition text-xs font-semibold">
                          <Upload className={`h-3.5 w-3.5 text-[#f59e0b] ${bannerUploading ? 'animate-bounce' : ''}`} />
                          <span>{bannerUploading ? 'Uploading...' : 'Choose Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            disabled={bannerUploading}
                            className="hidden"
                          />
                        </label>
                        {bannerUploadError && (
                          <p className="text-[9px] font-semibold text-red-400 mt-1 max-w-[180px]">
                            {bannerUploadError}
                          </p>
                        )}
                      </div>
                      <div className="border-t border-[#1e293b]/60 my-0.5"></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Or Banner URL</p>
                        <input
                          type="text"
                          name="banner"
                          value={formData.banner}
                          onChange={handleInputChange}
                          placeholder="Banner Image URL"
                          className="w-full bg-[#080b11] border border-[#1e293b] text-slate-100 rounded-lg px-2.5 py-1 text-xs focus:border-[#f59e0b] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Header (Logo + Title Block) */}
                <div className="relative px-6 pb-6 border-b border-[#1e293b]/60">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20">
                    {/* Logo wrapper */}
                    <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-2xl overflow-hidden border-4 border-[#0c101b] bg-[#0c101b] shadow-xl shrink-0 group flex flex-col items-center justify-center">
                      {formData.logo && (
                        <img
                          src={formData.logo}
                          alt="Store Logo"
                          className="w-full h-full object-contain"
                        />
                      )}
                      {editMode && (
                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-2 text-center transition hover:bg-slate-950/90">
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <Upload className={`h-5 w-5 text-[#f59e0b] mb-1 ${logoUploading ? 'animate-bounce' : 'animate-pulse'}`} />
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                              {logoUploading ? 'Uploading...' : 'Upload Logo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={logoUploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {editMode && logoUploadError && (
                      <p className="text-[10px] font-semibold text-red-400 mt-1 max-w-[120px] text-center">
                        {logoUploadError}
                      </p>
                    )}

                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide truncate">
                            {formData.profileName || 'Store Name'}
                          </h2>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                            <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#f59e0b]/20">
                              {formData.category || 'Restaurant'}
                            </span>
                            <span className="bg-[#1e293b] text-slate-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                              {formData.currency || 'AUD'}
                            </span>
                          </div>
                        </div>
                        
                        {!editMode ? (
                          <button
                            onClick={() => setEditMode(true)}
                            className="bg-slate-900 border border-[#1e293b] text-slate-200 hover:text-white hover:bg-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit Profile
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#d97706] hover:to-[#dd571c] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#f59e0b]/10 disabled:opacity-50"
                            >
                              <Save className="h-3.5 w-3.5" />
                              {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form fields grid */}
                <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                  {/* General Business Info */}
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 border-b border-[#1e293b]/60 pb-1 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      General Business Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Business ID (Non-editable UUID) */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Business ID
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={store?.id || ''}
                            disabled
                            className="w-full bg-[#080b11]/70 border border-[#1e293b]/80 text-slate-500 rounded-xl px-4 py-2.5 text-xs font-mono outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Profile Name (Store Name) */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Profile Name <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="profileName"
                          value={formData.profileName}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Category <span className="text-[#ea580c]">*</span>
                        </label>
                        {editMode ? (
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-[#080b11] border border-[#f59e0b]/60 text-white focus:border-[#f59e0b] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                          >
                            <option value="Restaurant">Restaurant</option>
                            <option value="Café">Café</option>
                            <option value="Bar / Pub">Bar / Pub</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Bistro">Bistro</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.category}
                            disabled
                            className="w-full bg-[#080b11] border border-[#1e293b] text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none"
                          />
                        )}
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Company Name <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* Store Subdomain Slug */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Store Subdomain Slug <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                            setFormData((prev) => ({ ...prev, slug: val }));
                          }}
                          disabled={!editMode}
                          required
                          placeholder="e.g. mitrandadhaba"
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                        {editMode && (
                          <p className="text-[9px] text-[#f59e0b]/80 mt-1">
                            Live URL: <strong className="text-white">{formData.slug || 'slug'}.fly-pos.com</strong>
                          </p>
                        )}
                      </div>

                      {/* Currency */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Currency
                        </label>
                        {editMode ? (
                          <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleInputChange}
                            className="w-full bg-[#080b11] border border-[#f59e0b]/60 text-white focus:border-[#f59e0b] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                          >
                            <option value="AUD">AUD ($)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="CAD">CAD ($)</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.currency}
                            disabled
                            className="w-full bg-[#080b11] border border-[#1e293b] text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none"
                          />
                        )}
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Website
                        </label>
                        <div className="relative flex items-center">
                          <Globe className="absolute left-4 h-4 w-4 text-slate-500" />
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            placeholder="https://example.com"
                            className={`w-full bg-[#080b11] border ${
                              editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                            } rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold outline-none transition`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 border-b border-[#1e293b]/60 pb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Phone */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Phone Number <span className="text-[#ea580c]">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="absolute left-4 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            required
                            className={`w-full bg-[#080b11] border ${
                              editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                            } rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold outline-none transition`}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Business Email <span className="text-[#ea580c]">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-4 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            required
                            className={`w-full bg-[#080b11] border ${
                              editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                            } rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold outline-none transition`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Physical Address Details */}
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 border-b border-[#1e293b]/60 pb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Physical Address Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* Street Address */}
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Street Address <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          City <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          State / Province <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* Zip Code */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Zip / Postal Code <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Country <span className="text-[#ea580c]">*</span>
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full bg-[#080b11] border ${
                            editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                          } rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Description */}
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 border-b border-[#1e293b]/60 pb-1 flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" />
                      About / Description
                    </h3>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        rows={4}
                        placeholder="Brief summary of your restaurant or dining hall..."
                        className={`w-full bg-[#080b11] border ${
                          editMode ? 'border-[#f59e0b]/60 text-white focus:border-[#f59e0b]' : 'border-[#1e293b] text-slate-300'
                        } rounded-xl px-4 py-3 text-xs font-semibold outline-none transition resize-none`}
                      />
                    </div>
                  </div>

                  {/* Floating Action Bar (Edit Mode Only) */}
                  {editMode && (
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1e293b]/60 animate-fadeIn">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition"
                      >
                        Cancel Edits
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#d97706] hover:to-[#dd571c] text-white font-bold px-8 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#f59e0b]/10 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Menu Card Styling Tab */}
            {activeTab === 'styling' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b]/60 pb-4">
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">ONLINE MENU CARD STYLING</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Customize how your public customer-facing menu card looks. Choose a layout, font, and brand colors.
                    </p>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#d97706] hover:to-[#dd571c] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#f59e0b]/10 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save Theme'}
                  </button>
                </div>

                {/* Theme Preset cards */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Style Presets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          themePrimaryColor: '#2A0E07',
                          themeAccentColor: '#C39A3C',
                          themeBgColor: '#F9F6F0',
                          themeLayout: 'classic',
                          themeFont: 'serif',
                        }));
                      }}
                      className="border border-[#1e293b] hover:border-[#f59e0b]/40 bg-slate-950 p-4 rounded-2xl text-left transition space-y-2 hover:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Classic Warm</span>
                        <span className="rounded bg-[#C39A3C]/10 border border-[#C39A3C]/20 px-1.5 py-0.5 text-[9px] text-[#C39A3C] font-bold">Serif</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#2A0E07]" title="Primary"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#C39A3C]" title="Accent"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#F9F6F0]" title="Background"></span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Elegant deep warm colors perfect for classic dining experience.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          themePrimaryColor: '#0c101b',
                          themeAccentColor: '#f59e0b',
                          themeBgColor: '#05070c',
                          themeLayout: 'modern_dark',
                          themeFont: 'sans',
                        }));
                      }}
                      className="border border-[#1e293b] hover:border-[#f59e0b]/40 bg-slate-950 p-4 rounded-2xl text-left transition space-y-2 hover:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Cyber Dark</span>
                        <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-400 font-bold">Sans</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#0c101b]" title="Primary"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#f59e0b]" title="Accent"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#05070c]" title="Background"></span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Sleek dark-mode aesthetic with neon highlights for night venues.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          themePrimaryColor: '#18181b',
                          themeAccentColor: '#06b6d4',
                          themeBgColor: '#fafafa',
                          themeLayout: 'grid_minimal',
                          themeFont: 'sans',
                        }));
                      }}
                      className="border border-[#1e293b] hover:border-[#f59e0b]/40 bg-slate-950 p-4 rounded-2xl text-left transition space-y-2 hover:bg-slate-900/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Clean Minimal</span>
                        <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-400 font-bold">Sans</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#18181b]" title="Primary"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#06b6d4]" title="Accent"></span>
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-[#fafafa]" title="Background"></span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">Clean, flat, high-contrast style suited for cafes, bakeries, or bistros.</p>
                    </button>
                  </div>
                </div>

                {/* Configuration form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#080b11]/30 p-5 rounded-2xl border border-[#1e293b]">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-2">Layout & Typography</h4>
                    
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        Layout Style
                      </label>
                      <select
                        name="themeLayout"
                        value={formData.themeLayout}
                        onChange={handleInputChange}
                        className="w-full bg-[#080b11] border border-[#1e293b] text-white focus:border-[#f59e0b] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                      >
                        <option value="classic">Classic (Sidebar + Category Headers)</option>
                        <option value="modern_dark">Modern Dark (Glassmorphic Grids)</option>
                        <option value="grid_minimal">Grid Minimal (Modern Flat Cards)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        Typography (Font)
                      </label>
                      <select
                        name="themeFont"
                        value={formData.themeFont}
                        onChange={handleInputChange}
                        className="w-full bg-[#080b11] border border-[#1e293b] text-white focus:border-[#f59e0b] rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                      >
                        <option value="serif">Elegant Serif (Classic restaurant feeling)</option>
                        <option value="sans">Clean Sans-Serif (Standard modern interface)</option>
                        <option value="playfair">Playfair Display (Premium Luxury styling)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-2">Brand Theme Colors</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            name="themePrimaryColor"
                            value={formData.themePrimaryColor}
                            onChange={handleInputChange}
                            className="h-10 w-10 shrink-0 rounded-lg bg-transparent border-0 cursor-pointer outline-none font-sans"
                          />
                          <input
                            type="text"
                            name="themePrimaryColor"
                            value={formData.themePrimaryColor}
                            onChange={handleInputChange}
                            placeholder="#000000"
                            className="w-full bg-[#080b11] border border-[#1e293b] text-white focus:border-[#f59e0b] rounded-xl px-2.5 text-[10px] font-mono outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Accent Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            name="themeAccentColor"
                            value={formData.themeAccentColor}
                            onChange={handleInputChange}
                            className="h-10 w-10 shrink-0 rounded-lg bg-transparent border-0 cursor-pointer outline-none font-sans"
                          />
                          <input
                            type="text"
                            name="themeAccentColor"
                            value={formData.themeAccentColor}
                            onChange={handleInputChange}
                            placeholder="#000000"
                            className="w-full bg-[#080b11] border border-[#1e293b] text-white focus:border-[#f59e0b] rounded-xl px-2.5 text-[10px] font-mono outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                          Page Background
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            name="themeBgColor"
                            value={formData.themeBgColor}
                            onChange={handleInputChange}
                            className="h-10 w-10 shrink-0 rounded-lg bg-transparent border-0 cursor-pointer outline-none font-sans"
                          />
                          <input
                            type="text"
                            name="themeBgColor"
                            value={formData.themeBgColor}
                            onChange={handleInputChange}
                            placeholder="#000000"
                            className="w-full bg-[#080b11] border border-[#1e293b] text-white focus:border-[#f59e0b] rounded-xl px-2.5 text-[10px] font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Live Preview Banner (Simulated) */}
                <div className="rounded-2xl border border-[#1e293b] p-5 shadow-inner flex flex-col items-center justify-center space-y-4" style={{ backgroundColor: formData.themeBgColor }}>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full self-start">Live Theme Style Preview</span>
                  <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-xl border border-slate-200/20 bg-white" style={{ fontFamily: formData.themeFont === 'serif' ? 'Georgia, serif' : formData.themeFont === 'playfair' ? 'Times New Roman, serif' : 'system-ui, sans-serif' }}>
                    
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: formData.themePrimaryColor, color: '#ffffff' }}>
                      <span className="text-xs font-black uppercase tracking-wider">{formData.profileName || 'Restaurant Name'}</span>
                      <span className="text-[10px] font-bold" style={{ color: formData.themeAccentColor }}>Menu Card</span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3" style={{ backgroundColor: formData.themeBgColor, color: '#1e293b' }}>
                      <div className="h-2 w-1/4 rounded" style={{ backgroundColor: formData.themePrimaryColor, opacity: 0.15 }}></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 bg-white p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="h-3 w-2/3 rounded mb-1" style={{ backgroundColor: formData.themePrimaryColor }}></div>
                            <div className="h-2 w-1/2 rounded" style={{ backgroundColor: formData.themePrimaryColor, opacity: 0.4 }}></div>
                          </div>
                          <span className="text-xs font-black" style={{ color: formData.themeAccentColor }}>$12.50</span>
                        </div>
                        <div className="border border-slate-200 bg-white p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="h-3 w-3/4 rounded mb-1" style={{ backgroundColor: formData.themePrimaryColor }}></div>
                            <div className="h-2 w-1/3 rounded" style={{ backgroundColor: formData.themePrimaryColor, opacity: 0.4 }}></div>
                          </div>
                          <span className="text-xs font-black" style={{ color: formData.themeAccentColor }}>$18.00</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="p-6 md:p-8">
                <h2 className="text-lg font-black tracking-wide text-white mb-4">PROFILE OVERVIEW & STATS</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Store Rating & Status</span>
                    <h3 className="text-2xl font-black text-emerald-400 mt-2">Active</h3>
                    <p className="text-xs text-slate-500 mt-1">Accepting online reservations and POS entries.</p>
                  </div>
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Store Currency Code</span>
                    <h3 className="text-2xl font-black text-white mt-2">{formData.currency}</h3>
                    <p className="text-xs text-slate-500 mt-1">Main transaction currency on receipts.</p>
                  </div>
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact E-mail</span>
                    <h3 className="text-base font-black text-[#f59e0b] truncate mt-2.5">{formData.email}</h3>
                    <p className="text-xs text-slate-500 mt-1">Primary administrative inquiries address.</p>
                  </div>
                </div>

                <div className="mt-8 bg-[#080b11]/30 border border-[#1e293b]/60 rounded-2xl p-6">
                  <h4 className="text-xs font-black tracking-wider text-white uppercase mb-3">System Quick Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/pos"
                      target="_blank"
                      className="bg-[#1e293b] hover:bg-slate-800 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-[#334155]/30"
                    >
                      <LayoutDashboard className="h-4 w-4 text-emerald-400" />
                      Open POS System
                    </a>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                    >
                      Configure Profile Fields
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Business Info Tab */}
            {activeTab === 'info' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-black tracking-wide text-white mb-2">ADDITIONAL BUSINESS CONFIGURATION</h2>
                  <p className="text-xs text-slate-400">Configure business hours, default tax parameters, and dining parameters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Business Hours */}
                  <div className="bg-[#080b11]/60 border border-[#1e293b] rounded-2xl p-5">
                    <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Standard Operating Hours
                    </h3>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      {store?.business_hours ? (
                        Object.entries(store.business_hours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex justify-between border-b border-[#1e293b]/40 pb-1.5 capitalize">
                            <span className="font-semibold text-slate-400">{day}</span>
                            <span className="font-mono text-slate-200">
                              {hours.open} AM - {hours.close} PM
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic py-2">No operating hours configured.</div>
                      )}
                    </div>
                  </div>

                  {/* Tax Rate Settings */}
                  <div className="bg-[#080b11]/60 border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing & Tax Configuration
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Standard Tax Rate</span>
                          <span className="text-2xl font-black text-white">{store?.tax_rate || '5.00'} %</span>
                          <p className="text-xs text-slate-500 mt-1">Applied to item sales in receipts.</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Active Integration</span>
                          <span className="text-xs bg-[#1e293b] text-slate-300 px-3 py-1 rounded-full font-bold">SQLite Internal DB</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1e293b]/40 mt-4">
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Note: Tax rates and billing values must be configured using backend migrations or super-admin database triggers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">RESTAURANT TABLE RESERVATIONS</h2>
                    <p className="text-xs text-slate-400">Incoming online table reservation requests.</p>
                  </div>
                  <button className="bg-slate-900 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5 text-[#f59e0b]" /> New Booking
                  </button>
                </div>

                <div className="bg-[#080b11]/60 border border-[#1e293b] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#1e293b] bg-slate-950/20 text-xs font-bold text-slate-400 uppercase tracking-wider grid grid-cols-4 gap-4">
                    <span>Customer Details</span>
                    <span>Date & Time</span>
                    <span>Guests</span>
                    <span>Status</span>
                  </div>

                  {/* Empty state or list */}
                  <div className="divide-y divide-[#1e293b]/60">
                    <div className="p-5 grid grid-cols-4 gap-4 items-center text-xs">
                      <div>
                        <p className="font-bold text-white">Amelia Thorne</p>
                        <p className="text-slate-500 font-medium">+61 491 570 156</p>
                      </div>
                      <span className="font-mono text-slate-300">2026-06-18 19:30</span>
                      <span className="text-slate-300 font-bold">4 Guests</span>
                      <div>
                        <span className="bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-[10px] font-extrabold uppercase">
                          Pending
                        </span>
                      </div>
                    </div>

                    <div className="p-5 grid grid-cols-4 gap-4 items-center text-xs">
                      <div>
                        <p className="font-bold text-white">Marcus Finch</p>
                        <p className="text-slate-500 font-medium">+61 491 570 188</p>
                      </div>
                      <span className="font-mono text-slate-300">2026-06-19 20:00</span>
                      <span className="text-slate-300 font-bold">2 Guests</span>
                      <div>
                        <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EoD Report Tab */}
            {activeTab === 'eod' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-black tracking-wide text-white mb-2">END OF DAY (EOD) TERMINAL REPORT</h2>
                  <p className="text-xs text-slate-400">View sales and checkout summaries for the current business date.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Gross Sales</span>
                    <span className="text-lg font-black text-white">$1,482.50</span>
                  </div>
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Completed Orders</span>
                    <span className="text-lg font-black text-white">32 Orders</span>
                  </div>
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Average Ticket</span>
                    <span className="text-lg font-black text-white">$46.32</span>
                  </div>
                  <div className="bg-[#080b11]/60 border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Tax Collected (8.25%)</span>
                    <span className="text-lg font-black text-white">$122.30</span>
                  </div>
                </div>

                <div className="bg-[#080b11]/30 border border-[#1e293b]/60 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">Close Terminal Batch</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">
                        Closing the batch submits final totals to report logs and resets registers for the next day.
                      </p>
                    </div>
                    <button className="bg-red-950/20 hover:bg-red-950/55 text-red-400 border border-red-900/30 font-bold px-5 py-2.5 rounded-xl text-xs transition">
                      Trigger End of Day Sync
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delegated Accounts Tab */}
            {activeTab === 'delegated' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b]/60 pb-5">
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#f59e0b]" /> DELEGATED ACCOUNT ACCESS
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Manage POS cashier logins and store admin roles.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={fetchStaff} disabled={staffLoading} className="rounded-xl border border-[#1e293b] bg-slate-900/40 p-2.5 text-slate-400 hover:text-white transition" title="Refresh">
                      <RefreshCw className={`h-4 w-4 ${staffLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleSeedStaff}
                      disabled={seedStaffLoading}
                      className="rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white font-bold text-xs px-4 py-2.5 transition flex items-center gap-1.5 disabled:opacity-50"
                      title="Populate with demo restaurant staff"
                    >
                      {seedStaffLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                      Seed Demo Staff
                    </button>
                    <button onClick={() => { setShowCreateModal(true); setStaffError(null); setStaffSuccess(null); }} className="bg-[#f59e0b] hover:bg-amber-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow">
                      <UserPlus className="h-4 w-4" /> Add Staff Account
                    </button>
                  </div>
                </div>

                {staffSuccess && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 px-4 py-3 text-xs font-bold text-emerald-400 flex items-center gap-2"><CheckCircle className="h-4 w-4" />{staffSuccess}</div>}
                {staffError && <div className="rounded-xl border border-red-500/30 bg-red-950/10 px-4 py-3 text-xs font-bold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{staffError}</div>}

                {staffLoading ? (
                  <div className="py-16 text-center"><RefreshCw className="h-7 w-7 animate-spin text-[#f59e0b] mx-auto" /><p className="mt-3 text-xs text-slate-400 font-medium">Loading staff...</p></div>
                ) : (
                  <div className="bg-[#080b11]/60 border border-[#1e293b] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[#1e293b] bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider grid grid-cols-6 gap-3">
                      <span className="col-span-2">Staff Member</span><span>Role</span><span>Phone</span><span>Status</span><span className="text-right">Actions</span>
                    </div>
                    <div className="divide-y divide-[#1e293b]/60">
                      {staff.length === 0 ? (
                        <div className="py-14 text-center">
                          <Users className="h-10 w-10 text-slate-700 stroke-[1.5] mx-auto mb-2" />
                          <p className="text-sm font-extrabold text-white">No delegated staff accounts</p>
                          <p className="text-xs text-slate-500 mt-1">Add a cashier or manager account to grant POS access.</p>
                          <button onClick={() => setShowCreateModal(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#f59e0b] text-black font-bold px-4 py-2 text-xs hover:bg-amber-400 transition">
                            <UserPlus className="h-3.5 w-3.5" /> Add First Account
                          </button>
                        </div>
                      ) : (() => {
                        const totalPages = Math.ceil(staff.length / STAFF_PER_PAGE);
                        const paginated = staff.slice((staffPage - 1) * STAFF_PER_PAGE, staffPage * STAFF_PER_PAGE);
                        return (
                          <>
                            {paginated.map((member) => {
                              const memberRoles: any[] = member.Roles || [];
                              const primaryRole = memberRoles[0]?.name || 'No Role';
                              const isProtected = primaryRole === 'Super Admin' || primaryRole === 'Restaurant Owner';
                              return (
                                <div key={member.id} className="p-4 grid grid-cols-6 gap-3 items-center text-xs hover:bg-slate-950/20 transition">
                                  <div className="col-span-2 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                      <span className="text-xs font-black text-white">{member.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-white truncate">{member.name}</p>
                                      <p className="text-slate-500 text-[10px] truncate">{member.email}</p>
                                    </div>
                                  </div>
                                  <span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${primaryRole === 'Super Admin' ? 'border-purple-500/30 bg-purple-950/20 text-purple-400' : primaryRole === 'Restaurant Owner' ? 'border-[#f59e0b]/30 bg-amber-950/20 text-[#f59e0b]' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                                      {primaryRole}
                                    </span>
                                  </span>
                                  <span className="font-mono text-slate-400">{member.phone || '—'}</span>
                                  <span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${member.status === 'active' ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-red-500/30 bg-red-950/20 text-red-400'}`}>
                                      {member.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                  </span>
                                  <div className="flex justify-end gap-1.5">
                                    {isProtected ? (
                                      <span className="text-[10px] text-slate-600 italic">Protected</span>
                                    ) : (
                                      <>
                                        <button onClick={() => openEditModal(member)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition" title="Edit Account">
                                          <Edit3 className="h-3 w-3" /> Edit
                                        </button>
                                        <button onClick={() => handleRevokeStaff(member.id, member.name)} disabled={revokeLoadingId === member.id} className="inline-flex items-center gap-1 rounded-lg border border-red-900/30 bg-red-950/10 px-2.5 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-900/30 transition disabled:opacity-50" title="Delete Account">
                                          {revokeLoadingId === member.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />} Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Pagination Footer */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b]/60 bg-slate-950/10">
                              <p className="text-[10px] text-slate-500 font-medium">
                                Showing <span className="text-slate-300 font-bold">{((staffPage - 1) * STAFF_PER_PAGE) + 1}–{Math.min(staffPage * STAFF_PER_PAGE, staff.length)}</span> of <span className="text-slate-300 font-bold">{staff.length}</span> staff
                              </p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setStaffPage(p => Math.max(1, p - 1))}
                                  disabled={staffPage === 1}
                                  className="px-3 py-1.5 rounded-lg border border-[#1e293b] text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                  ← Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                  <button
                                    key={page}
                                    onClick={() => setStaffPage(page)}
                                    className={`h-7 w-7 rounded-lg text-[10px] font-extrabold transition ${
                                      page === staffPage
                                        ? 'bg-[#f59e0b] text-black shadow'
                                        : 'border border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setStaffPage(p => Math.min(totalPages, p + 1))}
                                  disabled={staffPage === totalPages}
                                  className="px-3 py-1.5 rounded-lg border border-[#1e293b] text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Edit Staff Modal */}
                {editingStaff && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2"><Edit3 className="h-4 w-4 text-[#f59e0b]" /> Edit Staff Account</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Editing: {editingStaff.name}</p>
                        </div>
                        <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                      </div>
                      {staffError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/15 p-3 text-xs font-semibold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{staffError}</div>}
                      <form onSubmit={handleUpdateStaff} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Full Name *</label>
                            <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" />
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Phone</label>
                            <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" />
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Email Address *</label>
                          <input required type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" />
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">New Password <span className="text-slate-600 normal-case font-normal">(leave blank to keep current)</span></label>
                          <input type="password" minLength={6} value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" placeholder="Min. 6 chars to change" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Role</label>
                            <select value={editForm.roleName} onChange={e => setEditForm(p => ({ ...p, roleName: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition">
                              <option value="Cashier">Cashier</option>
                              <option value="Restaurant Owner">Restaurant Owner</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Status</label>
                            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition">
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition">Cancel</button>
                          <button type="submit" disabled={updateLoading} className="flex-1 py-3 bg-[#f59e0b] text-black rounded-xl text-xs font-extrabold hover:bg-amber-400 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {updateLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />} Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {showCreateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5">
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2"><UserPlus className="h-4 w-4 text-[#f59e0b]" /> Create Staff Account</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                      </div>
                      {staffError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/15 p-3 text-xs font-semibold text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{staffError}</div>}
                      <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Full Name *</label>
                            <input required value={newStaff.name} onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" placeholder="Sarah Connor" />
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Phone</label>
                            <input value={newStaff.phone} onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" placeholder="+1 555-0211" />
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Email Address *</label>
                          <input required type="email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" placeholder="staff@restaurant.com" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Password *</label>
                            <input required type="password" minLength={6} value={newStaff.password} onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition" placeholder="Min. 6 chars" />
                          </div>
                          <div>
                            <label className="text-slate-400 font-bold uppercase tracking-wide block mb-1.5">Role</label>
                            <select value={newStaff.roleName} onChange={e => setNewStaff(p => ({ ...p, roleName: e.target.value }))} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition">
                              <option value="Cashier">Cashier</option>
                              <option value="Restaurant Owner">Restaurant Owner</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition">Cancel</button>
                          <button type="submit" disabled={createLoading} className="flex-1 py-3 bg-[#f59e0b] text-black rounded-xl text-xs font-extrabold hover:bg-amber-400 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {createLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />} Create Account
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div className="p-6 md:p-8 space-y-8">
                <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-5">
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">PROMOTIONS & MARKETING CAMPAIGNS</h2>
                    <p className="text-xs text-slate-400">Track active discount coupons and monitor channel performance analytics.</p>
                  </div>
                  <a
                    href="/dashboard/offers"
                    className="bg-slate-900 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#f59e0b]" /> Create Campaign
                  </a>
                </div>

                {/* 1. Active Coupon Campaigns */}
                <div>
                  <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Active Coupon Campaigns
                  </h3>
                  
                  {couponsLoading ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                      <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto mb-2"></div>
                      Loading active coupons...
                    </div>
                  ) : coupons.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
                      <Tag className="h-8 w-8 mx-auto stroke-[1.5] text-slate-700 mb-2" />
                      No promotional coupon codes active currently.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="rounded-xl border border-dashed border-[#1e293b] bg-slate-950/40 p-4.5 flex flex-col justify-between relative overflow-hidden"
                        >
                          <div className="absolute right-0 top-0 h-12 w-12 bg-orange-600/5 rounded-bl-full flex items-center justify-end pr-2.5 pb-2.5">
                            <Tag className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                          
                          <div>
                            <span className="font-mono text-sm font-extrabold text-[#f59e0b] tracking-wider bg-[#f59e0b]/5 px-2.5 py-1 rounded border border-[#f59e0b]/10">
                              {coupon.code}
                            </span>
                            
                            <div className="mt-4 space-y-1 text-xs text-slate-400">
                              <p>
                                Discount Rate:{' '}
                                <span className="text-white font-bold">
                                  {coupon.discount_type === 'percentage'
                                    ? `${parseFloat(coupon.discount_value).toFixed(0)}%`
                                    : `$${parseFloat(coupon.discount_value).toFixed(2)}`}
                                </span>
                              </p>
                              <p>
                                Min Order Threshold:{' '}
                                <span className="text-white font-bold">
                                  ${parseFloat(coupon.min_order_amount).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#1e293b]/60 flex justify-between items-center">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-black">
                              ACTIVE
                            </span>
                            <a
                              href="/dashboard/offers"
                              className="text-[10px] font-bold text-slate-400 hover:text-white transition"
                            >
                              Manage
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Marketing Channels Stats */}
                <div className="pt-4">
                  <h3 className="text-xs font-black tracking-wider text-[#f59e0b] uppercase mb-4 flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Marketing Channels & Performance
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Email Newsletter */}
                    <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black text-white">Email Newsletter Spec.</span>
                          <span className="bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
                            Delivering
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                          Weekly digest of special courses sent to your subscriber list.
                        </p>
                      </div>
                      
                      <div className="mt-5 pt-3 border-t border-[#1e293b]/40 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Sent</span>
                          <span className="text-sm font-black text-white">1,240</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Open Rate</span>
                          <span className="text-sm font-black text-[#10b981]">42.5%</span>
                        </div>
                      </div>
                    </div>

                    {/* SMS Friday Alert */}
                    <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black text-white">SMS Friday Alert</span>
                          <span className="bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                          Weekend seat reservations and fast lunch checkout reminders.
                        </p>
                      </div>
                      
                      <div className="mt-5 pt-3 border-t border-[#1e293b]/40 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Delivered</span>
                          <span className="text-sm font-black text-white">850</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Conversion</span>
                          <span className="text-sm font-black text-[#10b981]">12.2%</span>
                        </div>
                      </div>
                    </div>

                    {/* Google Search Ads */}
                    <div className="bg-[#080b11]/60 border border-[#1e293b] p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black text-white">Google Local Search Ads</span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] font-extrabold uppercase">
                            Running
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                          Targeting "fine dining Sydney" and "warners bay restaurants".
                        </p>
                      </div>
                      
                      <div className="mt-5 pt-3 border-t border-[#1e293b]/40 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Clicks</span>
                          <span className="text-sm font-black text-white">320</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Spent (Monthly)</span>
                          <span className="text-sm font-black text-white">$120.40</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
