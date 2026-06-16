'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  ArrowLeft,
  Edit,
  Save,
  X,
  Award,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  ChevronRight,
  User,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Receipt,
  Truck
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search Filters
  const [searchName, setSearchName] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Active Detail Customer
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'detail' | 'orders' | 'ledger' | 'loyalty' | 'communication'>('detail');

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    loyalty_points: '0',
    first_name: '',
    last_name: '',
    company_name: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
  });

  // Edit Mode states (internal to the detail tab view)
  const [editBasicMode, setEditBasicMode] = useState(false);
  const [editBillingMode, setEditBillingMode] = useState(false);

  const [basicForm, setBasicForm] = useState({
    name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    date_of_birth: '',
  });

  const [billingForm, setBillingForm] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
  });

  // Edit Mode states for shipping
  const [editShippingMode, setEditShippingMode] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_country: '',
    shipping_zip_code: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || 'Failed to retrieve customer profiles.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Sync edit forms when customer selection changes
  useEffect(() => {
    if (selectedCustomer) {
      setBasicForm({
        name: selectedCustomer.name || '',
        first_name: selectedCustomer.first_name || selectedCustomer.name || '',
        last_name: selectedCustomer.last_name || '-',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        company_name: selectedCustomer.company_name || '-',
        date_of_birth: selectedCustomer.date_of_birth || '-',
      });
      setBillingForm({
        address: selectedCustomer.address || '-',
        city: selectedCustomer.city || '-',
        state: selectedCustomer.state || '-',
        country: selectedCustomer.country || '-',
        zip_code: selectedCustomer.zip_code || '-',
      });
      setShippingForm({
        shipping_address: selectedCustomer.shipping_address || '-',
        shipping_city: selectedCustomer.shipping_city || '-',
        shipping_state: selectedCustomer.shipping_state || '-',
        shipping_country: selectedCustomer.shipping_country || '-',
        shipping_zip_code: selectedCustomer.shipping_zip_code || '-',
      });
      setEditBasicMode(false);
      setEditBillingMode(false);
      setEditShippingMode(false);
    }
  }, [selectedCustomer]);

  // Form field helpers
  const handleNewCustChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBasicForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBillingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const copyBillingToShipping = () => {
    setShippingForm({
      shipping_address: billingForm.address,
      shipping_city: billingForm.city,
      shipping_state: billingForm.state,
      shipping_country: billingForm.country,
      shipping_zip_code: billingForm.zip_code,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      alert('Name and Phone are required.');
      return;
    }
    try {
      const res = await fetch('/api/dashboard/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Customer added successfully!');
        setShowAddModal(false);
        setNewCustomerForm({
          name: '',
          phone: '',
          email: '',
          loyalty_points: '0',
          first_name: '',
          last_name: '',
          company_name: '',
          date_of_birth: '',
          address: '',
          city: '',
          state: '',
          country: '',
          zip_code: '',
        });
        await fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to add customer.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while adding customer.');
    }
  };

  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dashboard/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          name: basicForm.name,
          first_name: basicForm.first_name,
          last_name: basicForm.last_name,
          email: basicForm.email,
          phone: basicForm.phone,
          company_name: basicForm.company_name,
          date_of_birth: basicForm.date_of_birth,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Basic info updated successfully!');
        setSelectedCustomer(data.customer);
        setEditBasicMode(false);
        await fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to update basic info.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving basic info.');
    }
  };

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dashboard/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          address: billingForm.address,
          city: billingForm.city,
          state: billingForm.state,
          country: billingForm.country,
          zip_code: billingForm.zip_code,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Billing info updated successfully!');
        setSelectedCustomer(data.customer);
        setEditBillingMode(false);
        await fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to update billing info.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving billing info.');
    }
  };

  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/dashboard/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          shipping_address: shippingForm.shipping_address,
          shipping_city: shippingForm.shipping_city,
          shipping_state: shippingForm.shipping_state,
          shipping_country: shippingForm.shipping_country,
          shipping_zip_code: shippingForm.shipping_zip_code,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Shipping info updated successfully!');
        setSelectedCustomer(data.customer);
        setEditShippingMode(false);
        await fetchCustomers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to update shipping info.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving shipping info.');
    }
  };

  // Calculations for list view columns
  const getCustomerStats = (cust: any) => {
    const orders = cust.Orders || [];
    const orderCount = orders.length;
    const totalAmount = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0);
    const totalPaid = orders
      .flatMap((o: any) => o.payments || [])
      .filter((p: any) => p.transaction_status === 'success')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const paymentDue = Math.max(0, totalAmount - totalPaid);

    return { orderCount, totalAmount, paymentDue };
  };

  // Initials circular avatar helper
  const getInitials = (name: string) => {
    if (!name) return '??';
    const cleanName = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '');
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Avatar bg-colors based on name
  const getAvatarBg = (name: string) => {
    const index = name.charCodeAt(0) % 5;
    const bgs = [
      'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30',
      'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
      'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
      'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30',
      'bg-[#ea580c]/20 text-[#ea580c] border-[#ea580c]/30',
    ];
    return bgs[index];
  };

  // Filter logic
  const filteredCustomers = customers.filter(cust => {
    const nameStr = (cust.name || '').toLowerCase() + ' ' + (cust.company_name || '').toLowerCase();
    const contactStr = (cust.email || '').toLowerCase() + ' ' + (cust.phone || '').toLowerCase();
    const addressStr = (cust.address || '').toLowerCase() + ' ' + (cust.city || '').toLowerCase() + ' ' + (cust.state || '').toLowerCase() + ' ' + (cust.zip_code || '').toLowerCase();

    return (
      nameStr.includes(searchName.toLowerCase()) &&
      contactStr.includes(searchContact.toLowerCase()) &&
      addressStr.includes(searchAddress.toLowerCase())
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full min-h-screen bg-[#080b11] text-slate-100 font-sans">
      
      {success && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-900/60 text-emerald-400 flex items-center gap-2 shadow-2xl backdrop-blur-sm animate-fadeIn">
          <CheckCircle className="h-4.5 w-4.5" />
          <span className="text-xs font-bold">{success}</span>
        </div>
      )}

      {!selectedCustomer ? (
        // --- CUSTOMER LIST DIRECTORY VIEW ---
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b]/60 pb-5">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hover:text-white cursor-pointer transition text-xs font-bold flex items-center gap-1">
                &lt; Back
              </span>
              <h1 className="text-xl font-black text-white ml-2 tracking-wide">
                Manage Customers
              </h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#d97706] hover:to-[#dd571c] text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition duration-150 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>

          {/* Sub Header (Sort, Count, Exports) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0c101b] border border-[#1e293b]/60 p-4 rounded-2xl">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span>Sort By :</span>
              <select className="bg-[#080b11] border border-[#1e293b] text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-[#f59e0b] cursor-pointer">
                <option>Total Row Count : {filteredCustomers.length}</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert('Exporting to XLS format...')}
                className="flex items-center gap-1 bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                <Download className="h-3.5 w-3.5" />
                .XLS
              </button>
              <button
                onClick={() => alert('Exporting to CSV format...')}
                className="flex items-center gap-1 bg-slate-900 border border-[#1e293b] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                <Download className="h-3.5 w-3.5" />
                .CSV
              </button>
            </div>
          </div>

          {/* Directory Table Area */}
          <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b]/60 bg-[#0f1524] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-12 text-center">Seq</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Address</th>
                    <th className="p-4 text-center">Order Count</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Payment due</th>
                    <th className="p-4 text-center">Edit</th>
                  </tr>
                  
                  {/* Inline Column Searches */}
                  <tr className="bg-slate-950/20 border-b border-[#1e293b]/40">
                    <td className="p-2"></td>
                    <td className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                        <input
                          type="text"
                          placeholder="search by name or company name"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          className="w-full bg-[#080b11] border border-[#1e293b]/60 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white outline-none focus:border-[#f59e0b] placeholder:text-slate-600 font-medium"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                        <input
                          type="text"
                          placeholder="search by contact details"
                          value={searchContact}
                          onChange={(e) => setSearchContact(e.target.value)}
                          className="w-full bg-[#080b11] border border-[#1e293b]/60 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white outline-none focus:border-[#f59e0b] placeholder:text-slate-600 font-medium"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-600" />
                        <input
                          type="text"
                          placeholder="search by address"
                          value={searchAddress}
                          onChange={(e) => setSearchAddress(e.target.value)}
                          className="w-full bg-[#080b11] border border-[#1e293b]/60 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white outline-none focus:border-[#f59e0b] placeholder:text-slate-600 font-medium"
                        />
                      </div>
                    </td>
                    <td className="p-2" colSpan={4}></td>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-[#1e293b]/40">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 font-semibold">
                        <div className="h-7 w-7 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto mb-2"></div>
                        Loading Customer Profiles...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 font-semibold">
                        No customer profiles match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => {
                      const { orderCount, totalAmount, paymentDue } = getCustomerStats(cust);
                      return (
                        <tr key={cust.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* circular initials avatar */}
                              <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarBg(cust.name)}`}>
                                {getInitials(cust.name)}
                              </div>
                              <span className="font-extrabold text-white">{cust.name}</span>
                            </div>
                          </td>
                          <td className="p-4 space-y-0.5 font-medium">
                            <p className="text-slate-200">{cust.email !== '-' ? cust.email : ''}</p>
                            <p className="text-slate-500">{cust.phone}</p>
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs truncate leading-relaxed">
                            {cust.address !== '-' ? `${cust.address}, ${cust.city}, ${cust.state}, ${cust.zip_code}` : '-'}
                          </td>
                          <td className="p-4 text-center font-bold text-white">{orderCount}</td>
                          <td className="p-4 text-right font-extrabold text-white">${totalAmount.toFixed(2)}</td>
                          <td className="p-4 text-right font-extrabold text-red-400">${paymentDue.toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setDetailTab('detail');
                              }}
                              className="bg-[#1d4ed8] hover:bg-blue-600 text-white font-bold px-3.5 py-1 rounded-lg text-xs transition"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // --- CUSTOMER DETAIL TABS VIEW (SCREENSHOT 2) ---
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[#1e293b]/60 pb-5">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="bg-slate-900 border border-[#1e293b] text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <h1 className="text-lg font-black text-white ml-2 tracking-wide uppercase">
              Customer : <span className="text-[#f59e0b]">{selectedCustomer.name}</span>
            </h1>
          </div>

          {/* Detailed Navigation Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#0c101b] border border-[#1e293b]/60 p-1 rounded-xl shrink-0 max-w-3xl">
            {[
              { id: 'detail', name: 'Customer Detail', icon: User },
              { id: 'orders', name: 'Order History', icon: Receipt },
              { id: 'ledger', name: 'Cust. Ledger', icon: BookOpen },
              { id: 'loyalty', name: 'Loyalty Points', icon: Award },
              { id: 'communication', name: 'Communication', icon: MessageSquare },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
                    detailTab === tab.id
                      ? 'bg-[#1d4ed8] text-white shadow'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* --- TAB CONTENT AREA --- */}
          <div className="w-full">
            
            {/* 1. CUSTOMER DETAIL TAB (Avatar + Basic Info + Billing Info) */}
            {detailTab === 'detail' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Side: Large Silhouette Avatar Card */}
                <div className="w-full lg:w-80 shrink-0 bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="h-64 w-full rounded-xl bg-blue-600 border border-blue-500/30 flex items-end justify-center overflow-hidden">
                    {/* Silhouette SVG drawing representing user */}
                    <svg viewBox="0 0 100 100" className="w-44 h-44 text-white opacity-90 translate-y-2.5">
                      <path
                        fill="currentColor"
                        d="M50 50c11 0 20-9 20-20s-9-20-20-20-20 9-20 20 9 20 20 20zm0 6c-13.3 0-40 6.7-40 20v6h80v-6c0-13.3-26.7-20-40-20z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="font-extrabold text-white text-base">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-bold">VIP Customer Level</p>
                  </div>
                </div>

                {/* Right Side: Basic Info & Billing Info cards */}
                <div className="flex-1 w-full space-y-6">
                  {/* Basic Info Card */}
                  <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-slate-950/20 border-b border-[#1e293b]/60 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">Basic Info</h3>
                      {!editBasicMode ? (
                        <button
                          onClick={() => setEditBasicMode(true)}
                          className="bg-[#1d4ed8] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateBasic}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setBasicForm({
                                name: selectedCustomer.name || '',
                                first_name: selectedCustomer.first_name || selectedCustomer.name || '',
                                last_name: selectedCustomer.last_name || '-',
                                email: selectedCustomer.email || '',
                                phone: selectedCustomer.phone || '',
                                company_name: selectedCustomer.company_name || '-',
                                date_of_birth: selectedCustomer.date_of_birth || '-',
                              });
                              setEditBasicMode(false);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 text-xs space-y-4">
                      {editBasicMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Display Name</label>
                            <input
                              type="text"
                              name="name"
                              value={basicForm.name}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">First Name</label>
                            <input
                              type="text"
                              name="first_name"
                              value={basicForm.first_name}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Last Name</label>
                            <input
                              type="text"
                              name="last_name"
                              value={basicForm.last_name}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Email Id</label>
                            <input
                              type="email"
                              name="email"
                              value={basicForm.email}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                            <input
                              type="text"
                              name="phone"
                              value={basicForm.phone}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Company Name</label>
                            <input
                              type="text"
                              name="company_name"
                              value={basicForm.company_name}
                              onChange={handleBasicChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Date of Birth</label>
                            <input
                              type="text"
                              name="date_of_birth"
                              value={basicForm.date_of_birth}
                              onChange={handleBasicChange}
                              placeholder="e.g. 1990-12-05"
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 font-semibold text-slate-300">
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Profile Name</span>
                            <span className="text-white">{selectedCustomer.name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">First Name</span>
                            <span className="text-white">{selectedCustomer.first_name || selectedCustomer.name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Last Name</span>
                            <span className="text-white">{selectedCustomer.last_name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Email Id</span>
                            <span className="text-white">{selectedCustomer.email && selectedCustomer.email !== '-' ? selectedCustomer.email : '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Phone Number</span>
                            <span className="text-white">{selectedCustomer.phone || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Company Name</span>
                            <span className="text-white">{selectedCustomer.company_name || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Date of Birth</span>
                            <span className="text-white">{selectedCustomer.date_of_birth || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Billing Info Card */}
                  <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-slate-950/20 border-b border-[#1e293b]/60 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">Billing Info</h3>
                      {!editBillingMode ? (
                        <button
                          onClick={() => setEditBillingMode(true)}
                          className="bg-[#1d4ed8] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateBilling}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setBillingForm({
                                address: selectedCustomer.address || '-',
                                city: selectedCustomer.city || '-',
                                state: selectedCustomer.state || '-',
                                country: selectedCustomer.country || '-',
                                zip_code: selectedCustomer.zip_code || '-',
                              });
                              setEditBillingMode(false);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 text-xs space-y-4">
                      {editBillingMode ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Street Address</label>
                            <input
                              type="text"
                              name="address"
                              value={billingForm.address}
                              onChange={handleBillingChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">City</label>
                            <input
                              type="text"
                              name="city"
                              value={billingForm.city}
                              onChange={handleBillingChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">State</label>
                            <input
                              type="text"
                              name="state"
                              value={billingForm.state}
                              onChange={handleBillingChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Country</label>
                            <input
                              type="text"
                              name="country"
                              value={billingForm.country}
                              onChange={handleBillingChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Zipcode</label>
                            <input
                              type="text"
                              name="zip_code"
                              value={billingForm.zip_code}
                              onChange={handleBillingChange}
                              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 font-semibold text-slate-300">
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2 md:col-span-2">
                            <span className="text-slate-400 font-bold">Address</span>
                            <span className="text-white">{selectedCustomer.address || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">City</span>
                            <span className="text-white">{selectedCustomer.city || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">State</span>
                            <span className="text-white">{selectedCustomer.state || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Country</span>
                            <span className="text-white">{selectedCustomer.country || '-'}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Zipcode</span>
                            <span className="text-white">{selectedCustomer.zip_code || '-'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Info Card */}
                  <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl overflow-hidden shadow-xl">
                    <div className="bg-slate-950/20 border-b border-[#1e293b]/60 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-[#f59e0b]" />
                        Shipping Info
                      </h3>
                      {!editShippingMode ? (
                        <button
                          onClick={() => setEditShippingMode(true)}
                          className="bg-[#1d4ed8] hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateShipping}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShippingForm({
                                shipping_address: selectedCustomer.shipping_address || '-',
                                shipping_city: selectedCustomer.shipping_city || '-',
                                shipping_state: selectedCustomer.shipping_state || '-',
                                shipping_country: selectedCustomer.shipping_country || '-',
                                shipping_zip_code: selectedCustomer.shipping_zip_code || '-',
                              });
                              setEditShippingMode(false);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold px-3 py-1 rounded text-[10px] uppercase transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 text-xs space-y-4">
                      {editShippingMode ? (
                        <div className="space-y-4">
                          {/* Same as Billing shortcut */}
                          <button
                            type="button"
                            onClick={copyBillingToShipping}
                            className="flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition"
                          >
                            <Truck className="h-3 w-3" />
                            Same as Billing Address
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">Shipping Street Address</label>
                              <input
                                type="text"
                                name="shipping_address"
                                value={shippingForm.shipping_address}
                                onChange={handleShippingChange}
                                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">City</label>
                              <input
                                type="text"
                                name="shipping_city"
                                value={shippingForm.shipping_city}
                                onChange={handleShippingChange}
                                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">State</label>
                              <input
                                type="text"
                                name="shipping_state"
                                value={shippingForm.shipping_state}
                                onChange={handleShippingChange}
                                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">Country</label>
                              <input
                                type="text"
                                name="shipping_country"
                                value={shippingForm.shipping_country}
                                onChange={handleShippingChange}
                                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">Zipcode</label>
                              <input
                                type="text"
                                name="shipping_zip_code"
                                value={shippingForm.shipping_zip_code}
                                onChange={handleShippingChange}
                                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 font-semibold text-slate-300">
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2 md:col-span-2">
                            <span className="text-slate-400 font-bold">Shipping Address</span>
                            <span className="text-white">{selectedCustomer.shipping_address && selectedCustomer.shipping_address !== '-' ? selectedCustomer.shipping_address : <span className="text-slate-600 italic">Not set</span>}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">City</span>
                            <span className="text-white">{selectedCustomer.shipping_city && selectedCustomer.shipping_city !== '-' ? selectedCustomer.shipping_city : <span className="text-slate-600 italic">Not set</span>}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">State</span>
                            <span className="text-white">{selectedCustomer.shipping_state && selectedCustomer.shipping_state !== '-' ? selectedCustomer.shipping_state : <span className="text-slate-600 italic">Not set</span>}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Country</span>
                            <span className="text-white">{selectedCustomer.shipping_country && selectedCustomer.shipping_country !== '-' ? selectedCustomer.shipping_country : <span className="text-slate-600 italic">Not set</span>}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#1e293b]/40 pb-2">
                            <span className="text-slate-400 font-bold">Zipcode</span>
                            <span className="text-white">{selectedCustomer.shipping_zip_code && selectedCustomer.shipping_zip_code !== '-' ? selectedCustomer.shipping_zip_code : <span className="text-slate-600 italic">Not set</span>}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. ORDER HISTORY TAB */}
            {detailTab === 'orders' && (
              <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Customer Order Log</h3>
                {!selectedCustomer.Orders || selectedCustomer.Orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 font-semibold border border-dashed border-[#1e293b]/40 rounded-xl">
                    No orders recorded for this customer.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.Orders.map((order: any) => {
                      let statusColor = 'bg-slate-900 border-slate-800 text-slate-400';
                      if (order.status === 'completed') statusColor = 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400';
                      else if (order.status === 'pending') statusColor = 'bg-[#ea580c]/20 border-[#ea580c]/30 text-[#ea580c]';

                      return (
                        <div key={order.id} className="bg-slate-950/20 border border-[#1e293b]/60 rounded-xl p-4 flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs">{order.order_number}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {new Date(order.createdAt).toLocaleString()} • <span className="uppercase">{order.order_type.replace('_', ' ')}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Amount</p>
                            <p className="font-black text-[#f59e0b] text-sm">${parseFloat(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. CUSTOMER LEDGER TAB */}
            {detailTab === 'ledger' && (
              <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Transaction Ledger</h3>
                {!selectedCustomer.Orders || selectedCustomer.Orders.flatMap((o: any) => o.payments || []).length === 0 ? (
                  <div className="text-center py-12 text-slate-600 font-semibold border border-dashed border-[#1e293b]/40 rounded-xl">
                    No ledger transactions recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.Orders.flatMap((order: any) => 
                      (order.payments || []).map((pay: any) => ({ ...pay, orderNumber: order.order_number }))
                    ).map((payment: any) => (
                      <div key={payment.id} className="bg-slate-950/20 border border-[#1e293b]/60 rounded-xl p-4 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase flex items-center gap-0.5">
                              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                              {payment.payment_method}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase ${
                              payment.transaction_status === 'success'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                : 'bg-red-950/60 text-red-400 border border-red-800/40'
                            }`}>
                              {payment.transaction_status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Reference: <span className="font-bold text-slate-300">{payment.transaction_reference || 'N/A'}</span> • Order: {payment.orderNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Paid</p>
                          <p className="font-black text-emerald-400">${parseFloat(payment.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. LOYALTY POINTS TAB */}
            {detailTab === 'loyalty' && (
              <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Loyalty Points & Rewards</h3>
                  <p className="text-xs text-slate-500 mt-1">Configure loyalty rewards points and review point allocation history.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#080b11]/80 border border-[#1e293b] p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Accrued Points Balance</span>
                    <h3 className="text-3xl font-black text-[#f59e0b] mt-2 flex items-center gap-1.5">
                      <Award className="h-7 w-7 text-[#f59e0b]" />
                      {selectedCustomer.loyalty_points} pts
                    </h3>
                  </div>
                  <div className="bg-[#080b11]/80 border border-[#1e293b] p-5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated Value</span>
                    <h3 className="text-3xl font-black text-white mt-2">${(selectedCustomer.loyalty_points * 0.1).toFixed(2)}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">Allocated as dine-in discounts.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COMMUNICATION TAB */}
            {detailTab === 'communication' && (
              <div className="bg-[#0c101b] border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Communication Logs</h3>
                  <p className="text-xs text-slate-500 mt-1">Review SMS alerts and email promotion delivery status.</p>
                </div>
                <div className="border border-dashed border-[#1e293b]/60 p-10 text-center text-slate-500 rounded-xl text-xs font-semibold">
                  <Mail className="h-8 w-8 mx-auto text-slate-700 stroke-[1.5] mb-2" />
                  No contact notifications sent to this profile recently.
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- ADD CUSTOMER MODAL DIALOG --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-4 shrink-0">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#f59e0b]" />
                Add New Customer Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-[#1e293b] bg-slate-900 p-1 text-slate-400 hover:text-white transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Display Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={newCustomerForm.name}
                    onChange={handleNewCustChange}
                    placeholder="e.g. Warrick Jordan"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={newCustomerForm.phone}
                    onChange={handleNewCustChange}
                    placeholder="e.g. 0451633197"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Email Id</label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomerForm.email}
                    onChange={handleNewCustChange}
                    placeholder="e.g. email@gmail.com"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={newCustomerForm.first_name}
                    onChange={handleNewCustChange}
                    placeholder="Warrick"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={newCustomerForm.last_name}
                    onChange={handleNewCustChange}
                    placeholder="Jordan"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={newCustomerForm.company_name}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Date of Birth</label>
                  <input
                    type="text"
                    name="date_of_birth"
                    value={newCustomerForm.date_of_birth}
                    onChange={handleNewCustChange}
                    placeholder="1990-12-05"
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Loyalty Points Balance</label>
                  <input
                    type="number"
                    name="loyalty_points"
                    value={newCustomerForm.loyalty_points}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={newCustomerForm.address}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={newCustomerForm.city}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={newCustomerForm.state}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={newCustomerForm.country}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Zip / Postal Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={newCustomerForm.zip_code}
                    onChange={handleNewCustChange}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-white outline-none focus:border-[#f59e0b]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e293b] flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-slate-900 border border-[#1e293b] px-5 py-2.5 font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#d97706] hover:to-[#dd571c] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
