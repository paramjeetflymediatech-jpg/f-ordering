'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Edit,
  Trash2,
  ListCollapse,
} from 'lucide-react';
import Pagination from './Pagination';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  highlights: string[];
}

export default function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [errorServices, setErrorServices] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const totalPages = Math.max(1, Math.ceil(services.length / itemsPerPage));
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return services.slice(start, start + itemsPerPage);
  }, [services, currentPage, itemsPerPage]);
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePerPageChange = (perPage: number) => { setItemsPerPage(perPage); setCurrentPage(1); };

  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    icon: 'Sparkles',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    highlightsInput: '',
  });

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

  useEffect(() => {
    fetchServices();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" /> Global Platform Console
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Core Services Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage agency-level service offerings that packages can bundle or associate with.
          </p>
        </div>
        <button
          onClick={openServiceCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 transition"
        >
          <Plus className="h-4 w-4" /> Create Service
        </button>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h2 className="text-lg font-bold text-white font-sans">Core Services</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {paginatedServices.map((srv) => (
              <div key={srv.id} className="bg-slate-950/40 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl border border-slate-800 text-xs font-bold uppercase text-orange-400 bg-orange-500/10">
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
        {!loadingServices && !errorServices && services.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={services.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePerPageChange}
            itemLabel="services"
          />
        )}
      </div>

      {/* Service Management Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
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
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Highlights (comma separated)</label>
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
    </div>
  );
}
