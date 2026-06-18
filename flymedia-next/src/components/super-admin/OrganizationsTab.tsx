'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building,
  Plus,
  ShieldCheck,
  Globe,
  Mail,
  AlertCircle,
  CheckCircle2,
  Store as StoreIcon,
  Sparkles,
  Loader2,
  Server,
  CheckCircle,
} from 'lucide-react';
import Pagination from './Pagination';

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

export default function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [errorOrgs, setErrorOrgs] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil(organizations.length / itemsPerPage));
  const paginatedOrgs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return organizations.slice(start, start + itemsPerPage);
  }, [organizations, currentPage, itemsPerPage]);
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePerPageChange = (perPage: number) => { setItemsPerPage(perPage); setCurrentPage(1); };

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

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrgForm({
      ...orgForm,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleProvision = async (org: Organization) => {
    if (!confirm(`Provision isolated database for '${org.name}'?`)) return;
    setProvisioningId(org.id);
    try {
      const res = await fetch(`/api/super-admin/organizations/${org.id}/provision`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✔ ${data.message}`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err: any) {
      alert('Provisioning failed: ' + err.message);
    } finally {
      setProvisioningId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" /> Global Platform Console
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Organizations & Tenants
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Provision storefronts, manage organization subscriptions, and monitor active databases.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
        >
          <Plus className="h-4 w-4" /> Add Restaurant
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
        ) : (<>
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
                {paginatedOrgs.map((org) => {
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
                          <button
                            onClick={() => handleProvision(org)}
                            disabled={provisioningId === org.id}
                            className="text-xs px-2.5 py-1.5 font-bold rounded-lg transition text-violet-400 bg-violet-950/20 hover:bg-violet-950/40 border border-violet-900/30 flex items-center gap-1 disabled:opacity-50"
                          >
                            {provisioningId === org.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Provisioning...</>
                            ) : (
                              <><Server className="h-3 w-3" /> Provision DB</>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={organizations.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePerPageChange}
            itemLabel="organizations"
          /></>
        )}
      </div>

      {/* manual storefront provisioner modal */}
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
    </div>
  );
}
