'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Tag,
  Edit,
  Trash2,
} from 'lucide-react';
import Pagination from './Pagination';

interface Service {
  id: string;
  title: string;
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

export default function PackagesTab() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [errorPackages, setErrorPackages] = useState<string | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const totalPages = Math.max(1, Math.ceil(packages.length / itemsPerPage));
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return packages.slice(start, start + itemsPerPage);
  }, [packages, currentPage, itemsPerPage]);
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePerPageChange = (perPage: number) => { setItemsPerPage(perPage); setCurrentPage(1); };

  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    billing_cycle: 'monthly',
    featuresInput: '',
    is_popular: false,
    service_id: '',
  });

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

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/super-admin/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (err: any) {
      console.error('Failed to load services for package mapping:', err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchServices();
  }, []);

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
        ? { id: editingPackage.id, name, price, billing_cycle, features, is_popular, service_id: service_id || null }
        : { name, price, billing_cycle, features, is_popular, service_id: service_id || null };

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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" /> Global Platform Console
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Pricing Packages Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage pricing tiers, subscription features, billing terms, and connect packages to services.
          </p>
        </div>
        <button
          onClick={openPackageCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
        >
          <Plus className="h-4 w-4" /> Create Package
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h2 className="text-lg font-bold text-white font-sans">Package Tiers</h2>
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
          <>
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
                {paginatedPackages.map((pkg) => (
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={packages.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePerPageChange}
            itemLabel="packages"
          />
          </>
        )}
      </div>

      {/* Package Add/Edit Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price ($) *</label>
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
