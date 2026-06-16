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
  Wand2,
  Edit3,
  Save,
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlignLeft,
  Upload,
  Plus,
  Trash2,
  Clock,
  Settings,
  Clipboard,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  Percent,
  DollarSign,
  Gift,
  Tag
} from 'lucide-react';

export default function BusinessProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'dashboard' | 'info' | 'reservations' | 'eod' | 'delegated' | 'setup' | 'campaigns'>('profile');
  
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
  });

  const [editMode, setEditMode] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCoupons();
    }
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
      });
    }
    setEditMode(false);
    setError(null);
  };

  // Helper tabs list
  const tabsList = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', name: 'View Profile', icon: Building },
    { id: 'info', name: 'Additional Business Info.', icon: Info },
    { id: 'reservations', name: 'Current Reservations', icon: Calendar },
    { id: 'eod', name: 'EoD Report.', icon: FileText },
    { id: 'delegated', name: 'Delegated Accounts', icon: Users },
    { id: 'setup', name: 'Setup Wizard', icon: Wand2 },
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
                  <img
                    src={formData.banner}
                    alt="Store Banner"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c101b] via-[#0c101b]/20 to-transparent"></div>
                  {editMode && (
                    <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-sm border border-[#1e293b] rounded-xl p-2 max-w-xs transition shadow-lg">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Banner URL</p>
                      <input
                        type="text"
                        name="banner"
                        value={formData.banner}
                        onChange={handleInputChange}
                        placeholder="Banner Image URL"
                        className="w-full bg-[#080b11] border border-[#1e293b] text-slate-100 rounded-lg px-2.5 py-1 text-xs focus:border-[#f59e0b] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Profile Header (Logo + Title Block) */}
                <div className="relative px-6 pb-6 border-b border-[#1e293b]/60">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20">
                    {/* Logo wrapper */}
                    <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-2xl overflow-hidden border-4 border-[#0c101b] bg-[#0c101b] shadow-xl shrink-0 group">
                      <img
                        src={formData.logo}
                        alt="Store Logo"
                        className="w-full h-full object-cover"
                      />
                      {editMode && (
                        <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center p-2 text-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Logo URL</p>
                          <input
                            type="text"
                            name="logo"
                            value={formData.logo}
                            onChange={handleInputChange}
                            placeholder="Logo URL"
                            className="w-full bg-[#080b11] border border-[#1e293b] text-slate-100 rounded-lg px-1.5 py-0.5 text-[10px] focus:border-[#f59e0b] outline-none text-center"
                          />
                        </div>
                      )}
                    </div>

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
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">DELEGATED ACCOUNT ACCESS</h2>
                    <p className="text-xs text-slate-400">Configure staff roles, access privileges, and terminal handlers.</p>
                  </div>
                  <button className="bg-slate-900 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5 text-[#f59e0b]" /> Create Account
                  </button>
                </div>

                <div className="bg-[#080b11]/60 border border-[#1e293b] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#1e293b] bg-slate-950/20 text-xs font-bold text-slate-400 uppercase tracking-wider grid grid-cols-4 gap-4">
                    <span>Name</span>
                    <span>Role / Privilege</span>
                    <span>Phone</span>
                    <span>Actions</span>
                  </div>

                  <div className="divide-y divide-[#1e293b]/60">
                    <div className="p-5 grid grid-cols-4 gap-4 items-center text-xs">
                      <div>
                        <p className="font-bold text-white">John Doe</p>
                        <p className="text-slate-500">owner@fordering.com</p>
                      </div>
                      <span className="font-bold text-[#f59e0b]">Restaurant Owner</span>
                      <span className="font-mono text-slate-300">+1 555-0210</span>
                      <span className="text-slate-500 italic">Global Owner</span>
                    </div>

                    <div className="p-5 grid grid-cols-4 gap-4 items-center text-xs">
                      <div>
                        <p className="font-bold text-white">Sarah Connor</p>
                        <p className="text-slate-500">cashier@fordering.com</p>
                      </div>
                      <span className="font-semibold text-slate-300">Cashier Staff</span>
                      <span className="font-mono text-slate-300">+1 555-0211</span>
                      <button className="text-red-400 hover:text-red-300 font-bold transition text-left">
                        Revoke Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Wizard Tab */}
            {activeTab === 'setup' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-black tracking-wide text-white mb-2">STORE CONFIGURATION WIZARD</h2>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider text-[#f59e0b]">
                    Status: 4/5 Steps Completed
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#080b11] h-3 rounded-full overflow-hidden border border-[#1e293b]">
                  <div className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] h-full w-4/5"></div>
                </div>

                {/* Steps checklist */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 bg-[#080b11]/50 border border-[#1e293b] p-4 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">1. Core Database Initialization</p>
                      <p className="text-[10px] text-slate-400">Schema synchronized and roles populated.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#080b11]/50 border border-[#1e293b] p-4 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">2. Profile Settings Customization</p>
                      <p className="text-[10px] text-slate-400">Store location parameters and category saved.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#080b11]/50 border border-[#1e293b] p-4 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">3. Table Manager Allocation</p>
                      <p className="text-[10px] text-slate-400">Added restaurant tables mapping POS checkouts.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#080b11]/50 border border-[#1e293b] p-4 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">4. Menu Item Synchronization</p>
                      <p className="text-[10px] text-slate-400">Added courses, variants and customer modifiers.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">5. Connect Custom Domain Routing</p>
                      <p className="text-[10px] text-slate-400">Configure DNS parameters for tenant custom hostname.</p>
                    </div>
                  </div>
                </div>
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
