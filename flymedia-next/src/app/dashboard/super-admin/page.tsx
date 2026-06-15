'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Building,
  Plus,
  ShieldCheck,
  Globe,
  Mail,
  User,
  MapPin,
  Phone,
  Settings2,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Store as StoreIcon,
  Trash2,
  Edit,
  Layers,
  DollarSign,
  Tag,
  ListCollapse,
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  Roles?: Role[];
}

interface StoreDetail {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: 'active' | 'inactive' | 'suspended';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  Stores?: StoreDetail[];
  Users?: UserDetail[];
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  highlights: string[];
}

interface Package {
  id: string;
  name: string;
  price: string;
  billing_cycle: string;
  features: string[];
  is_popular: boolean;
  service_id: string | null;
  service?: {
    id: string;
    title: string;
  };
}

export default function SuperAdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Redirect if not Super Admin
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated') {
      const roles = (session?.user as any)?.roles || [];
      if (!roles.includes('Super Admin')) {
        router.push('/dashboard');
      }
    }
  }, [sessionStatus, session, router]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'organizations' | 'services' | 'packages'>('organizations');

  // Organizations states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [errorOrgs, setErrorOrgs] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    storeName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    storeAddress: '',
    storePhone: '',
    subscriptionPlan: 'starter',
  });

  // Services states
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    icon: 'Sparkles',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    highlightsInput: '',
  });

  // Packages states
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [errorPackages, setErrorPackages] = useState<string | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    billing_cycle: 'monthly',
    featuresInput: '',
    is_popular: false,
    service_id: '',
  });

  // 1. Fetch Organizations
  const fetchOrgs = async () => {
    setLoadingOrgs(true);
    setErrorOrgs(null);
    try {
      const res = await fetch('/api/super-admin/organizations');
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations || []);
      } else {
        setErrorOrgs(data.message || 'Failed to fetch organizations.');
      }
    } catch (err: any) {
      setErrorOrgs(err.message || 'Network error fetching organizations.');
    } finally {
      setLoadingOrgs(false);
    }
  };

  // 2. Fetch Services
  const fetchServices = async () => {
    setLoadingServices(true);
    setErrorServices(null);
    try {
      const res = await fetch('/api/super-admin/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      } else {
        setErrorServices(data.message || 'Failed to fetch services.');
      }
    } catch (err: any) {
      setErrorServices(err.message || 'Network error fetching services.');
    } finally {
      setLoadingServices(false);
    }
  };

  // 3. Fetch Packages
  const fetchPackages = async () => {
    setLoadingPackages(true);
    setErrorPackages(null);
    try {
      const res = await fetch('/api/super-admin/packages');
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages || []);
      } else {
        setErrorPackages(data.message || 'Failed to fetch packages.');
      }
    } catch (err: any) {
      setErrorPackages(err.message || 'Network error fetching packages.');
    } finally {
      setLoadingPackages(false);
    }
  };

  // Load active tab data
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if (activeTab === 'organizations') fetchOrgs();
      if (activeTab === 'services') fetchServices();
      if (activeTab === 'packages') {
        fetchPackages();
        fetchServices(); // Needed for dropdown association
      }
    }
  }, [sessionStatus, activeTab]);

  // Handle Org Input changes
  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrgForm({
      ...orgForm,
      [e.target.name]: e.target.value,
    });
  };

  // Submit manual org onboarding
  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (
      !orgForm.organizationName ||
      !orgForm.storeName ||
      !orgForm.name ||
      !orgForm.email ||
      !orgForm.password
    ) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/super-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess('Organization successfully provisioned!');
        setOrgForm({
          organizationName: '',
          storeName: '',
          name: '',
          email: '',
          password: '',
          phone: '',
          storeAddress: '',
          storePhone: '',
          subscriptionPlan: 'starter',
        });
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess(null);
          fetchOrgs();
        }, 1500);
      } else {
        setFormError(data.message || 'Failed to create organization.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update Subscription Tier or Status
  const handleUpdateOrg = async (id: string, updates: Partial<Organization>) => {
    try {
      const res = await fetch('/api/super-admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setOrganizations((prev) =>
          prev.map((org) => (org.id === id ? { ...org, ...data.organization } : org))
        );
      } else {
        alert(data.message || 'Failed to update organization');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating organization');
    }
  };

  // --- SERVICE CRUD IMPLEMENTATION ---
  const openServiceCreate = () => {
    setEditingService(null);
    setServiceForm({
      title: '',
      description: '',
      icon: 'Sparkles',
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      highlightsInput: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowServiceModal(true);
  };

  const openServiceEdit = (srv: Service) => {
    setEditingService(srv);
    setServiceForm({
      title: srv.title,
      description: srv.description,
      icon: srv.icon || 'Sparkles',
      color: srv.color || 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      highlightsInput: srv.highlights ? srv.highlights.join(', ') : '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const { title, description, icon, color, highlightsInput } = serviceForm;
    if (!title || !description) {
      setFormError('Title and description are required.');
      return;
    }

    const highlights = highlightsInput
      ? highlightsInput.split(',').map((h) => h.trim()).filter((h) => h.length > 0)
      : [];

    setSubmitLoading(true);
    try {
      const isEdit = !!editingService;
      const url = '/api/super-admin/services';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { id: editingService.id, title, description, icon, color, highlights }
        : { title, description, icon, color, highlights };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(isEdit ? 'Service updated successfully!' : 'Service created successfully!');
        setTimeout(() => {
          setShowServiceModal(false);
          setFormSuccess(null);
          fetchServices();
        }, 1500);
      } else {
        setFormError(data.message || 'Operation failed.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? All linked packages will be unlinked.')) return;
    try {
      const res = await fetch(`/api/super-admin/services?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(data.message || 'Failed to delete service.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    }
  };

  // --- PACKAGE CRUD IMPLEMENTATION ---
  const openPackageCreate = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      price: '',
      billing_cycle: 'monthly',
      featuresInput: '',
      is_popular: false,
      service_id: services[0]?.id || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowPackageModal(true);
  };

  const openPackageEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      price: pkg.price.toString(),
      billing_cycle: pkg.billing_cycle || 'monthly',
      featuresInput: pkg.features ? pkg.features.join(', ') : '',
      is_popular: pkg.is_popular,
      service_id: pkg.service_id || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const { name, price, billing_cycle, featuresInput, is_popular, service_id } = packageForm;
    if (!name || !price) {
      setFormError('Name and price are required.');
      return;
    }

    const features = featuresInput
      ? featuresInput.split(',').map((f) => f.trim()).filter((f) => f.length > 0)
      : [];

    setSubmitLoading(true);
    try {
      const isEdit = !!editingPackage;
      const url = '/api/super-admin/packages';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { id: editingPackage.id, name, price, billing_cycle, features, is_popular, service_id }
        : { name, price, billing_cycle, features, is_popular, service_id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(isEdit ? 'Package updated successfully!' : 'Package created successfully!');
        setTimeout(() => {
          setShowPackageModal(false);
          setFormSuccess(null);
          fetchPackages();
        }, 1500);
      } else {
        setFormError(data.message || 'Operation failed.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      const res = await fetch(`/api/super-admin/packages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchPackages();
      } else {
        alert(data.message || 'Failed to delete package.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" /> Global Platform Console
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Super Admin Control Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Provision storefronts, manage organization subscriptions, and update core business services & package catalog globally.
          </p>
        </div>
        {activeTab === 'organizations' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
          >
            <Plus className="h-4 w-4" /> Add Restaurant
          </button>
        )}
        {activeTab === 'services' && (
          <button
            onClick={openServiceCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
          >
            <Plus className="h-4 w-4" /> Create Service
          </button>
        )}
        {activeTab === 'packages' && (
          <button
            onClick={openPackageCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
          >
            <Plus className="h-4 w-4" /> Create Package
          </button>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-850 gap-4">
        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition ${
            activeTab === 'organizations'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building className="h-4 w-4" /> Organizations & Tenants
          </span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition ${
            activeTab === 'services'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ListCollapse className="h-4 w-4" /> Core Services
          </span>
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 text-sm font-bold border-b-2 px-1 transition ${
            activeTab === 'packages'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" /> Package Tiers
          </span>
        </button>
      </div>

      {/* --- TAB 1: ORGANIZATIONS & TENANTS --- */}
      {activeTab === 'organizations' && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Total Restaurants', val: organizations.length, icon: Building, color: 'text-orange-500 bg-orange-500/10' },
              { name: 'Total Branches', val: organizations.reduce((acc, curr) => acc + (curr.Stores?.length || 0), 0), icon: StoreIcon, color: 'text-sky-400 bg-sky-400/10' },
              { name: 'Active Subscriptions', val: organizations.filter((o) => o.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
              { name: 'Enterprise Tiers', val: organizations.filter((o) => o.subscription_plan === 'enterprise').length, icon: Sparkles, color: 'text-purple-400 bg-purple-400/10' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md hover:border-slate-700 transition"
                >
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.name}</p>
                    <p className="text-2xl font-black text-white mt-1.5">{loadingOrgs ? '...' : stat.val}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Table */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <h2 className="text-lg font-bold text-white">Registered Stores & SaaS Organizations</h2>
              <button
                onClick={fetchOrgs}
                className="text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850"
              >
                Refresh List
              </button>
            </div>

            {loadingOrgs ? (
              <div className="p-12 text-center text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 font-semibold text-sm">Fetching tenant databases...</p>
              </div>
            ) : errorOrgs ? (
              <div className="p-12 text-center text-red-400 flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8" />
                <p className="font-bold">{errorOrgs}</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Building className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">No organizations registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Brand / Restaurant Name</th>
                      <th className="px-6 py-4">Slug / Domain Route</th>
                      <th className="px-6 py-4">Contact (Owner)</th>
                      <th className="px-6 py-4 text-center">Branches</th>
                      <th className="px-6 py-4">Subscription Tier</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {organizations.map((org) => {
                      const primaryOwner = org.Users?.find(
                        (u) => u.Roles?.some((r) => r.name === 'Restaurant Owner')
                      ) || org.Users?.[0];

                      return (
                        <tr key={org.id} className="hover:bg-slate-850/40 transition">
                          <td className="px-6 py-4 font-bold text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-sm">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div>{org.name}</div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ID: {org.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-orange-400">
                            <a
                              href={`http://${org.slug}.${process.env.NEXT_PUBLIC_APP_URL}/order-online/menu`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1.5"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {org.slug}.{process.env.NEXT_PUBLIC_APP_URL}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            {primaryOwner ? (
                              <div>
                                <div className="font-semibold text-slate-200">{primaryOwner.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" /> {primaryOwner.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs italic">No user registered</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-200">
                            {org.Stores?.length || 0}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={org.subscription_plan}
                              onChange={(e) =>
                                handleUpdateOrg(org.id, {
                                  subscription_plan: e.target.value as any,
                                })
                              }
                              className="bg-slate-800 border border-slate-700 text-xs rounded-lg text-white px-2 py-1 outline-none transition focus:border-orange-500 font-bold"
                            >
                              <option value="starter">Starter Plan</option>
                              <option value="professional">Professional</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                org.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : org.status === 'suspended'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  org.status === 'active'
                                    ? 'bg-emerald-400'
                                    : org.status === 'suspended'
                                    ? 'bg-red-400'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {org.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateOrg(org.id, {
                                    status: org.status === 'active' ? 'suspended' : 'active',
                                  })
                                }
                                className={`text-xs px-2.5 py-1.5 font-bold rounded-lg transition ${
                                  org.status === 'active'
                                    ? 'text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30'
                                    : 'text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30'
                                }`}
                              >
                                {org.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- TAB 2: SERVICES MANAGER --- */}
      {activeTab === 'services' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <h2 className="text-lg font-bold text-white font-sans">Core Services Catalog</h2>
            <button
              onClick={fetchServices}
              className="text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850"
            >
              Refresh Services
            </button>
          </div>

          {loadingServices ? (
            <div className="p-12 text-center text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 font-semibold text-sm">Fetching core services...</p>
            </div>
          ) : errorServices ? (
            <div className="p-12 text-center text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="font-bold">{errorServices}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Sparkles className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-sm">No services listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {services.map((srv) => (
                <div key={srv.id} className="bg-slate-950/40 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-xl border border-slate-800 text-xs font-bold uppercase`}>
                        {srv.icon || 'Sparkles'}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openServiceEdit(srv)}
                          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="Edit Service"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-2 rounded-lg bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-950/60 transition"
                          title="Delete Service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mt-4">{srv.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{srv.description}</p>
                  </div>

                  {srv.highlights && srv.highlights.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-850/60">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Key Areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {srv.highlights.map((hl, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                            {hl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: PACKAGES MANAGER --- */}
      {activeTab === 'packages' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <h2 className="text-lg font-bold text-white font-sans">Pricing Packages Catalog</h2>
            <button
              onClick={fetchPackages}
              className="text-xs font-bold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850"
            >
              Refresh Packages
            </button>
          </div>

          {loadingPackages ? (
            <div className="p-12 text-center text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 font-semibold text-sm">Fetching packages...</p>
            </div>
          ) : errorPackages ? (
            <div className="p-12 text-center text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="font-bold">{errorPackages}</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Tag className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-sm">No packages listed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Package Name</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Billing Cycle</th>
                    <th className="px-6 py-4">Linked Service</th>
                    <th className="px-6 py-4">Popular State</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-850/40 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        <div>
                          <div>{pkg.name}</div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ID: {pkg.id.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-white">
                        ${parseFloat(pkg.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-300">
                        {pkg.billing_cycle}
                      </td>
                      <td className="px-6 py-4">
                        {pkg.service ? (
                          <span className="text-xs text-orange-400 font-semibold">{pkg.service.title}</span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">None / Independent</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {pkg.is_popular ? (
                          <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-400 border border-orange-500/20 uppercase">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openPackageEdit(pkg)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-2 rounded-lg bg-red-950/30 text-red-400 hover:text-red-350 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS SECTION --- */}

      {/* 1. manual storefront provisioner modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-white">Manual Storefront Provisioner</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-semibold text-sm"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleOrgSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Brand Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider pb-1 border-b border-slate-800">
                    1. Brand / Organization Details
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Organization Name *</label>
                    <input
                      name="organizationName"
                      required
                      value={orgForm.organizationName}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. F-Ordering Pizzas"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Initial Branch Name *</label>
                    <input
                      name="storeName"
                      required
                      value={orgForm.storeName}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. Main Outlet"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Branch Address</label>
                    <input
                      name="storeAddress"
                      value={orgForm.storeAddress}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. 505 Broadway St, NYC"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Branch Phone</label>
                    <input
                      name="storePhone"
                      value={orgForm.storePhone}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. +1 555-4040"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Subscription Tier</label>
                    <select
                      name="subscriptionPlan"
                      value={orgForm.subscriptionPlan}
                      onChange={handleOrgInputChange}
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition font-bold"
                    >
                      <option value="starter">Starter Plan</option>
                      <option value="professional">Professional Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                </div>

                {/* Owner details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider pb-1 border-b border-slate-800">
                    2. Owner Credentials
                  </h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Owner Full Name *</label>
                    <input
                      name="name"
                      required
                      value={orgForm.name}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. Alice Cooper"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Owner Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={orgForm.email}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. alice@brand.com"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Password *</label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={orgForm.password}
                      onChange={handleOrgInputChange}
                      placeholder="••••••••"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Owner Phone Number</label>
                    <input
                      name="phone"
                      value={orgForm.phone}
                      onChange={handleOrgInputChange}
                      placeholder="e.g. +1 555-3030"
                      className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition disabled:opacity-50"
                >
                  {submitLoading ? 'Provisioning Tenant Database...' : 'Onboard Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Service Management Add/Edit Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <ListCollapse className="h-5 w-5 text-orange-500" />
                {editingService ? 'Edit Service Details' : 'Onboard Core Service'}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-white font-semibold text-sm"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Search Engine Optimization (SEO)"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Description *</label>
                <textarea
                  required
                  placeholder="Describe details of service deliverables..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white h-24 outline-none resize-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lucide Icon Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Search, Code2, Sparkles"
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Color Theme Class</label>
                  <input
                    type="text"
                    placeholder="CSS styles for icon wrapper..."
                    value={serviceForm.color}
                    onChange={(e) => setServiceForm({ ...serviceForm, color: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Highlights / Areas (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Keyword Research, On-Page Audits, Link Acquisition"
                  value={serviceForm.highlightsInput}
                  onChange={(e) => setServiceForm({ ...serviceForm, highlightsInput: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
                >
                  {submitLoading ? 'Saving changes...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Package Management Add/Edit Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-500" />
                {editingPackage ? 'Edit Package Tier' : 'Onboard Pricing Package'}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-slate-400 hover:text-white font-semibold text-sm"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {formSuccess}
              </div>
            )}

            <form onSubmit={handlePackageSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEO Professional Pack"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price USD ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 499.00"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billing Cycle</label>
                  <select
                    value={packageForm.billing_cycle}
                    onChange={(e) => setPackageForm({ ...packageForm, billing_cycle: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500 transition font-bold"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Associate with Service</label>
                <select
                  value={packageForm.service_id}
                  onChange={(e) => setPackageForm({ ...packageForm, service_id: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500 transition font-bold"
                >
                  <option value="">None (Independent Package)</option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Package Features (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 10 Keyword tracking, Monthly Analytics audit, Premium Backlink"
                  value={packageForm.featuresInput}
                  onChange={(e) => setPackageForm({ ...packageForm, featuresInput: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_popular"
                  checked={packageForm.is_popular}
                  onChange={(e) => setPackageForm({ ...packageForm, is_popular: e.target.checked })}
                  className="h-4.5 w-4.5 rounded border-slate-750 bg-slate-800 text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="is_popular" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                  Display as Popular / Highlighted Tier
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
                >
                  {submitLoading ? 'Saving changes...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
