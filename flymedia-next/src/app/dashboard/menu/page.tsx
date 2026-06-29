'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ArrowRight,
  Printer,
  Grid,
  ListOrdered,
  Move,
  Save,
  CheckCircle,
  HelpCircle,
  Upload,
  Link,
  Loader2,
} from 'lucide-react';

export default function ManageMenuPage() {
  const { data: session } = useSession();

  // Active view: 'dashboard' | 'overview' | 'sorting' | 'printer'
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'overview' | 'sorting' | 'printer'>('dashboard');

  // Categories & Items state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // UI state
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [newCatPrinter, setNewCatPrinter] = useState('');
  const [activeModal, setActiveModal] = useState<'addItem' | 'editItem' | 'createMenu' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [variants, setVariants] = useState<{ id?: string; name: string; additional_price: number }[]>([]);
  const [addons, setAddons] = useState<{ id?: string; name: string; price: number }[]>([]);

  // Form states for new/edit items
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Max size is 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setItemImage(data.url);
      triggerAlert('Image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Something went wrong during upload.');
    } finally {
      setIsUploading(false);
    }
  };
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemStock, setItemStock] = useState('0');
  const [itemUnit, setItemUnit] = useState('pcs');

  // "Create Menu" Popup Form states
  const [popupMenuName, setPopupMenuName] = useState('');
  const [popupCategoryLevel1, setPopupCategoryLevel1] = useState('');
  const [popupSubCategoryLevel2, setPopupSubCategoryLevel2] = useState('');

  // Sorting state
  const [sortedCategoriesList, setSortedCategoriesList] = useState<any[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Printer assign state
  const [selectedPrinterCategoryId, setSelectedPrinterCategoryId] = useState('');
  const [printerCategoryName, setPrinterCategoryName] = useState('Kitchen Printer');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch menu
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setSortedCategoriesList(data.categories || []);
        if (data.categories?.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data.categories[0].id);
        }
      } else {
        setError(data.error || 'Failed to retrieve menu assets.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Add category handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'category', 
          name: newCatName, 
          parentId: newCatParentId || null,
          printerCategory: newCatPrinter || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatParentId('');
        setNewCatPrinter('');
        triggerAlert('Category added successfully.');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to create category.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create menu from popup (multi-level catalogue)
  const handleCreateMenuPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupMenuName.trim()) {
      triggerAlert('Menu Name is required', true);
      return;
    }

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          name: popupMenuName,
          categoryName: popupCategoryLevel1,
          subcategoryName: popupSubCategoryLevel2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPopupMenuName('');
        setPopupCategoryLevel1('');
        setPopupSubCategoryLevel2('');
        setActiveModal(null);
        triggerAlert('Catalogue structure created successfully!');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to create catalogue.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All menu items inside it will be deleted!')) return;

    try {
      const res = await fetch(`/api/dashboard/menu?id=${id}&type=category`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (selectedCategoryId === id) {
          setSelectedCategoryId('');
        }
        triggerAlert('Category deleted.');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to delete category.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !selectedCategoryId) return;

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          name: itemName,
          price: itemPrice,
          description: itemDesc,
          imageUrl: itemImage,
          categoryId: selectedCategoryId,
          barcode: itemBarcode || null,
          sku: itemSku || null,
          stockCount: parseInt(itemStock) || 0,
          unit: itemUnit || 'pcs',
          variants,
          addons,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        clearItemForm();
        triggerAlert('Dish added successfully.');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to add item.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Item Click
  const handleEditItemClick = (item: any) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemDesc(item.description || '');
    setItemImage(item.image_url || '');
    
    const isUploaded = item.image_url?.startsWith('/uploads/');
    setImageMode(isUploaded ? 'upload' : 'url');
    setUploadError(null);

    setItemAvailable(item.is_available);
    setItemBarcode(item.barcode || '');
    setItemSku(item.sku || '');
    setItemStock(item.stock_count?.toString() || '0');
    setItemUnit(item.unit || 'pcs');
    setVariants(item.variants || []);
    setAddons(item.addons || []);
    setActiveModal('editItem');
  };

  // Save Edit Item
  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !editingItem) return;

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          id: editingItem.id,
          name: itemName,
          price: itemPrice,
          description: itemDesc,
          imageUrl: itemImage,
          isAvailable: itemAvailable,
          barcode: itemBarcode || null,
          sku: itemSku || null,
          stockCount: parseInt(itemStock) || 0,
          unit: itemUnit || 'pcs',
          variants,
          addons,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        clearItemForm();
        setEditingItem(null);
        triggerAlert('Changes saved.');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to save changes.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const res = await fetch(`/api/dashboard/menu?id=${id}&type=item`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Item deleted.');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to delete item.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & drop handlers for sorting
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const listCopy = [...sortedCategoriesList];
    const draggedItem = listCopy[draggedIdx];
    listCopy.splice(draggedIdx, 1);
    listCopy.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setSortedCategoriesList(listCopy);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSaveSortOrder = async () => {
    try {
      const orders = sortedCategoriesList.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx + 1,
      }));

      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sort_categories', orders }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Sort order updated successfully.');
        await fetchMenu();
        setActiveSubView('dashboard');
      } else {
        triggerAlert(data.error || 'Failed to save sort order.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Printer Category Assignment Save
  const handleSavePrinterCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinterCategoryId) {
      triggerAlert('Please select a category', true);
      return;
    }

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          id: selectedPrinterCategoryId,
          printerCategory: printerCategoryName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Printer category assigned.');
        setSelectedPrinterCategoryId('');
        await fetchMenu();
      } else {
        triggerAlert(data.error || 'Failed to assign printer.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearItemForm = () => {
    setItemName('');
    setItemPrice('');
    setItemDesc('');
    setItemImage('');
    setImageMode('upload');
    setUploadError(null);
    setItemAvailable(true);
    setItemBarcode('');
    setItemSku('');
    setItemStock('0');
    setItemUnit('pcs');
    setVariants([]);
    setAddons([]);
  };

  // Helper to build hierarchy display string
  const getHierarchyString = (cat: any) => {
    const parent = categories.find((c) => c.id === cat.parent_id);
    if (parent) {
      const grandParent = categories.find((c) => c.id === parent.parent_id);
      if (grandParent) {
        return `${grandParent.name} → ${parent.name} → ${cat.name}`;
      }
      return `${parent.name} → ${cat.name}`;
    }
    return cat.name;
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const activeItems = activeCategory?.MenuItems || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full relative">
      
      {/* TOAST / ALERTS */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-3 shadow-xl transition-all duration-300 animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-red-500 text-white px-4 py-3 shadow-xl transition-all duration-300 animate-slide-in">
          <X className="h-5 w-5" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Utensils className="h-6 w-6 text-orange-500 animate-pulse" />
            Manage Menu
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build and optimize your customer's ordering experience. Organise layouts, category trees, and printer workflows.
          </p>
        </div>
        {activeSubView !== 'dashboard' && (
          <button
            onClick={() => setActiveSubView('dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        )}
      </div>

      {/* 1. OPERATIONS DASHBOARD VIEW */}
      {activeSubView === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Menu Overview */}
            <div 
              onClick={() => setActiveSubView('overview')}
              className="group rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg hover:shadow-orange-500/5 transition duration-300"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition duration-300">
                  <Grid className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    Menu Overview
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-300 text-orange-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    View Your Menu, get your changes done to your Menu and classify your business broadly. Manage dishes, prices, descriptions, and statuses.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 transition">
                <span>Active Categories: {categories.length}</span>
                <span className="text-orange-500">Manage →</span>
              </div>
            </div>

            {/* Card 2: Create Menu */}
            <div 
              onClick={() => setActiveModal('createMenu')}
              className="group rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg hover:shadow-orange-500/5 transition duration-300"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-110 transition duration-300">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    Create Menu
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-300 text-sky-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Use this option to add new Menu to your business which helps to classify your Inventory property. Set up multiple nested structural levels in one go.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 transition">
                <span>Supports 1, 2 or 3 Level Nesting</span>
                <span className="text-sky-500">Launch Form →</span>
              </div>
            </div>

            {/* Card 3: Menu Sorting */}
            <div 
              onClick={() => setActiveSubView('sorting')}
              className="group rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg hover:shadow-orange-500/5 transition duration-300"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition duration-300">
                  <ListOrdered className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    Menu Sorting
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-300 text-amber-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Use this option to sort Menu to your business which helps to order your catalog structure properly. Drag and drop menus to update POS and Online layouts.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 transition">
                <span>Drag & Drop Ordering</span>
                <span className="text-amber-500">Organise →</span>
              </div>
            </div>

            {/* Card 4: Assign Printer Category to Menu */}
            <div 
              onClick={() => setActiveSubView('printer')}
              className="group rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg hover:shadow-orange-500/5 transition duration-300"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition duration-300">
                  <Printer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    Assign Printer Category to Menu
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-300 text-emerald-500" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Use this option to assign printer category on Menu categories. Keep kitchen, bar, and packaging tickets routed correctly to designated hardware.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 transition">
                <span>Route Hardware Desks</span>
                <span className="text-emerald-500">Configure →</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. MENU OVERVIEW VIEW (DETAILED CATEGORY/ITEM EDITOR) */}
      {activeSubView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Side: Categories List */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h2 className="text-sm font-extrabold text-white">Category Listing</h2>
              
              {/* Inline category creator */}
              <form onSubmit={handleAddCategory} className="space-y-2">
                <input
                  type="text"
                  placeholder="New Category Name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
                  required
                />
                
                {/* Optional parent selection */}
                <select
                  value={newCatParentId}
                  onChange={(e) => setNewCatParentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-[11px] text-slate-400 outline-none focus:border-orange-500 transition"
                >
                  <option value="">No Parent (Root Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      Under: {getHierarchyString(c)}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500 transition flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Category
                </button>
              </form>

              {/* List categories */}
              <div className="space-y-1 overflow-y-auto max-h-[50vh] pr-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition group ${
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer'
                      }`}
                      onClick={() => setSelectedCategoryId(cat.id)}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{cat.name}</span>
                        {cat.parent_id && (
                          <span className={`text-[9px] truncate font-medium mt-0.5 ${isSelected ? 'text-slate-100' : 'text-slate-500'}`}>
                            Sub-level of: {categories.find(c => c.id === cat.parent_id)?.name || 'Unknown'}
                          </span>
                        )}
                        {cat.printer_category && (
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold mt-0.5 ${isSelected ? 'text-orange-200' : 'text-emerald-500'}`}>
                            🖨️ {cat.printer_category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <span className="text-[10px] opacity-75 mr-2">({cat.MenuItems?.length || 0})</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id);
                          }}
                          className="text-red-400 hover:text-white opacity-0 group-hover:opacity-100 p-1 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Dishes grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white">
                    {activeCategory ? getHierarchyString(activeCategory) : 'Select a Category'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Dishes linked to this category level</p>
                </div>

                {selectedCategoryId && (
                  <button
                    onClick={() => {
                      clearItemForm();
                      setActiveModal('addItem');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Dish
                  </button>
                )}
              </div>

              {/* Items Grid */}
              {activeItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
                  <Utensils className="h-10 w-10 mx-auto stroke-[1.5] text-slate-700 mb-2" />
                  No dishes in this category yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeItems.map((item: any) => (
                    <div
                      key={item.id}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0e1422]/90 to-[#070b13]/95 p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 ${
                        !item.is_available ? 'opacity-65 border-slate-900' : ''
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Image/Placeholder section */}
                        <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-900 shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600">
                              <Utensils className="h-7 w-7 opacity-40 mb-1" />
                              <span className="text-[10px] font-black uppercase tracking-wider opacity-40">
                                No Image Provided
                              </span>
                            </div>
                          )}

                          {/* Availability Badge */}
                          <div className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider shadow-sm backdrop-blur-sm ${
                            item.is_available 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-950/80 text-slate-400 border border-slate-800'
                          }`}>
                            {item.is_available ? 'Available' : 'Hidden'}
                          </div>
                        </div>

                        {/* Text and Details */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-black text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">{item.name}</h3>
                            <span className="text-sm sm:text-[15px] font-black text-amber-400 shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                          
                          <p className="text-xs sm:text-[13px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                            {item.description || 'No description provided.'}
                          </p>

                          <div className="flex gap-2 flex-wrap mt-3">
                            {item.sku && (
                              <span className="text-[10px] bg-slate-950 border border-slate-900 rounded-md px-2 py-0.5 text-slate-400 font-mono">
                                SKU: {item.sku}
                              </span>
                            )}
                            <span className={`text-[10px] border rounded-md px-2 py-0.5 font-bold ${
                              item.stock_count > 0 
                                ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' 
                                : 'bg-red-950/20 border-red-900/40 text-red-400'
                            }`}>
                              Stock: {item.stock_count} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-900 text-xs font-bold">
                        <span className={`flex items-center gap-1.5 ${item.is_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {item.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          {item.is_available ? 'Active' : 'Hidden'}
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItemClick(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white border border-slate-800 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/45 p-2 text-red-400 hover:bg-red-900/35 border border-red-950/50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 3. MENU SORTING VIEW */}
      {activeSubView === 'sorting' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Manage Menu Sorting</h2>
              <p className="text-xs text-slate-500 mt-1">Drag catalogs vertically to specify the order in which they appear online/POS.</p>
            </div>
            <button
              onClick={handleSaveSortOrder}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/20"
            >
              <Save className="h-4 w-4" />
              Save Order
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List to Drag */}
            <div className="lg:col-span-2 space-y-2">
              {sortedCategoriesList.map((cat, index) => {
                const isDragged = draggedIdx === index;
                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 cursor-grab active:cursor-grabbing transition duration-150 ${
                      isDragged ? 'border-orange-500 bg-slate-900 opacity-50' : 'hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Move className="h-4 w-4 text-slate-600 shrink-0 cursor-grab" />
                      <div>
                        <p className="text-xs font-bold text-white">{cat.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {cat.parent_id ? `Hierarchy: ${getHierarchyString(cat)}` : 'Root Level'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-slate-900 px-2 py-1 border border-slate-800 text-slate-400 rounded-lg">
                      Order: {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sorting Info Box */}
            <div className="lg:col-span-1 rounded-2xl border border-dashed border-slate-800 p-5 bg-slate-900/20 space-y-4 text-xs leading-relaxed text-slate-400">
              <h3 className="font-extrabold text-white flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-orange-500" />
                Sorting Instructions
              </h3>
              <p>
                1. Point your mouse or press and hold any item in the category list.
              </p>
              <p>
                2. Drag it vertically to position it higher or lower in the rendering stack.
              </p>
              <p>
                3. Once satisfied with the layout hierarchy, click the green <strong>Save Order</strong> button.
              </p>
              <p className="text-[10px] text-amber-500 font-bold bg-amber-950/20 border border-amber-900/30 rounded-xl p-3">
                ⚠️ Sorting orders affect the mobile dining website, ordering tablets, and POS checkout terminal displays immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRINTER ASSIGNMENT VIEW */}
      {activeSubView === 'printer' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Assign Printer Category to Menu</h2>
            <p className="text-xs text-slate-500 mt-1">Route customer receipts, mains, entrees, or drinks orders to dedicated hardware printer stations.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Configure Ticket Routing</h3>
              
              <form onSubmit={handleSavePrinterCategory} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Select Category *</label>
                  <select
                    value={selectedPrinterCategoryId}
                    onChange={(e) => setSelectedPrinterCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {getHierarchyString(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">Printer Terminal *</label>
                  <select
                    value={printerCategoryName}
                    onChange={(e) => setPrinterCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    required
                  >
                    <option value="Kitchen Printer">Kitchen Printer (Mains & Entree)</option>
                    <option value="Bar Desk Printer">Bar Desk Printer (Drinks & Cocktails)</option>
                    <option value="Dessert Station">Dessert Station Printer</option>
                    <option value="Billing Counter">Billing Counter (Receipts & Tax)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition"
                >
                  Save Printer Assignment
                </button>
              </form>
            </div>

            {/* Configured Table List */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Active Assignments</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="pb-3">Menu Category</th>
                      <th className="pb-3">Nesting Level</th>
                      <th className="pb-3">Printer Station</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.filter(c => c.printer_category).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-600 font-semibold">
                          No printer categories assigned yet. All orders route to default counter printer.
                        </td>
                      </tr>
                    ) : (
                      categories.filter(c => c.printer_category).map((cat) => (
                        <tr key={cat.id} className="border-b border-slate-900/60 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3 font-bold">{cat.name}</td>
                          <td className="py-3 text-slate-500">
                            {cat.parent_id ? 'Sub-Category' : 'Root Menu'}
                          </td>
                          <td className="py-3 font-mono text-emerald-400 font-bold">
                            {cat.printer_category}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={async () => {
                                await fetch('/api/dashboard/menu', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ type: 'category', id: cat.id, printerCategory: null }),
                                });
                                triggerAlert('Assignment removed.');
                                await fetchMenu();
                              }}
                              className="text-[10px] font-bold text-red-400 hover:text-white bg-red-950/30 px-2.5 py-1 border border-red-950/60 rounded-lg"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE MENU POPUP MODAL (CATALOGUE DETAILS) */}
      {activeModal === 'createMenu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Catalogue Details</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* DIAGRAMS ROW */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              
              {/* Level 1 Diagram */}
              <div className="border border-slate-800 bg-slate-950/50 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">One Level</span>
                <div className="flex flex-col gap-1 items-center w-full">
                  <div className="bg-orange-600 text-white rounded px-2 py-0.5 text-[8px] font-extrabold w-full text-center">Catalogue</div>
                  <div className="text-[8px] text-slate-600 font-bold">↓</div>
                  <div className="flex flex-col gap-0.5 w-full">
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded text-[7px] py-0.5 text-center">Item 1</div>
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded text-[7px] py-0.5 text-center">Item 2</div>
                  </div>
                </div>
              </div>

              {/* Level 2 Diagram */}
              <div className="border border-slate-800 bg-slate-950/50 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Two Levels</span>
                <div className="flex flex-col gap-1 items-center w-full">
                  <div className="bg-orange-600 text-white rounded px-2 py-0.5 text-[8px] font-extrabold w-full text-center">Catalogue</div>
                  <div className="text-[8px] text-slate-600 font-bold">↓</div>
                  <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded px-1 text-[7px] font-bold w-full text-center">Category</div>
                  <div className="text-[7px] text-slate-600 font-bold">↓</div>
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded text-[7px] py-0.5 text-center w-full">Item 1</div>
                </div>
              </div>

              {/* Level 3 Diagram */}
              <div className="border border-slate-800 bg-slate-950/50 rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">Three Levels</span>
                <div className="flex flex-col gap-1 items-center w-full">
                  <div className="bg-orange-600 text-white rounded px-2 py-0.5 text-[8px] font-extrabold w-full text-center">Catalogue</div>
                  <div className="text-[8px] text-slate-600 font-bold">↓</div>
                  <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded px-1 text-[7px] font-bold w-full text-center">Category (L1)</div>
                  <div className="text-[7px] text-slate-600 font-bold">↓</div>
                  <div className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded px-1 text-[7px] font-bold w-full text-center">Sub-Category (L2)</div>
                  <div className="text-[7px] text-slate-600 font-bold">↓</div>
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 rounded text-[7px] py-0.5 text-center w-full">Item 1</div>
                </div>
              </div>

            </div>

            {/* FORM */}
            <form onSubmit={handleCreateMenuPopup} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Menu Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chef's Special Banquet Deals"
                  value={popupMenuName}
                  onChange={(e) => setPopupMenuName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Category (Level 1) <span className="text-slate-600">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian Options"
                  value={popupCategoryLevel1}
                  onChange={(e) => setPopupCategoryLevel1(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Sub-Category (Level 2) <span className="text-slate-600">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Tandoori Mains"
                  value={popupSubCategoryLevel2}
                  disabled={!popupCategoryLevel1}
                  onChange={(e) => setPopupSubCategoryLevel2(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 py-3 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODALS: ADD / EDIT MENU ITEM */}
      {(activeModal === 'addItem' || activeModal === 'editItem') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {activeModal === 'addItem' ? 'Add New Menu Dish' : 'Edit Menu Dish'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={activeModal === 'addItem' ? handleAddItem : handleSaveEditItem}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classic Margherita Pizza"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 12.99"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* INVENTORY / SCALE CODES */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-3">
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Barcode (UPC/EAN)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9312345678901"
                    value={itemBarcode}
                    onChange={(e) => setItemBarcode(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">SKU / Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DISH-MARG-01"
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Stock Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Weight Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide block mb-2">Status</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setItemAvailable(true)}
                      className={`flex-1 py-2 rounded-xl border text-[9px] uppercase font-bold transition ${
                        itemAvailable
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      Show
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemAvailable(false)}
                      className={`flex-1 py-2 rounded-xl border text-[9px] uppercase font-bold transition ${
                        !itemAvailable
                          ? 'border-red-500 bg-red-950/20 text-red-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide block mb-2">Dish Image</label>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition border-b-2 -mb-[2px] ${
                      imageMode === 'upload'
                        ? 'border-orange-500 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition border-b-2 -mb-[2px] ${
                      imageMode === 'url'
                        ? 'border-orange-500 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Link className="h-3.5 w-3.5" />
                    Image Link
                  </button>
                </div>

                {/* Content */}
                {imageMode === 'upload' ? (
                  <div className="space-y-3">
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition cursor-pointer ${
                        isUploading
                          ? 'border-slate-800 bg-slate-950/20 pointer-events-none'
                          : 'border-slate-800 bg-slate-950 hover:border-orange-500/50 hover:bg-slate-900/10'
                      }`}
                      onClick={() => {
                        document.getElementById('image-file-input')?.click();
                      }}
                    >
                      <input
                        id="image-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      
                      {isUploading ? (
                        <div className="flex flex-col items-center py-4">
                          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-2" />
                          <p className="text-xs text-slate-400 font-medium">Uploading image...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-3 text-center animate-fade-in">
                          <Upload className="h-8 w-8 text-slate-600 mb-2 group-hover:text-orange-500 transition" />
                          <p className="text-xs text-slate-400 font-bold">
                            Click or drag to upload image
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            PNG, JPG, JPEG up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-[11px] font-semibold text-red-400">{uploadError}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={itemImage}
                      onChange={(e) => setItemImage(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                )}

                {/* Preview block if itemImage is set */}
                {itemImage && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/30 p-2 flex items-center gap-3 animate-fade-in">
                    <img
                      src={itemImage}
                      alt="Preview"
                      className="h-12 w-16 object-cover rounded-lg bg-slate-900 border border-slate-800 animate-pulse"
                      onError={(e) => {
                        (e.target as any).src = 'https://placehold.co/100x100?text=Invalid+Image';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).classList.remove('animate-pulse');
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Image Loaded</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{itemImage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemImage('')}
                      className="rounded-lg bg-red-950/40 p-1.5 text-red-400 hover:bg-red-900/40 border border-red-950/50 hover:text-white transition"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Describe ingredients, allergy alerts, kitchen instructions..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none focus:border-orange-500 transition"
                />
              </div>

              {/* VARIANTS SECTION */}
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Variants (e.g. Sizes)</label>
                  <button
                    type="button"
                    onClick={() => setVariants([...variants, { name: '', additional_price: 0 }])}
                    className="text-[10px] bg-slate-800 text-orange-400 hover:text-orange-300 px-2 py-1 rounded font-bold border border-slate-700/60 transition"
                  >
                    + Add Variant
                  </button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No variants defined (defaults to standard price).</p>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Variant Name (e.g. Medium)"
                          value={v.name}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].name = e.target.value;
                            setVariants(newVariants);
                          }}
                          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Price mod (+$)"
                          value={v.additional_price}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].additional_price = parseFloat(e.target.value) || 0;
                            setVariants(newVariants);
                          }}
                          className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADDONS SECTION */}
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Add-ons (e.g. Toppings)</label>
                  <button
                    type="button"
                    onClick={() => setAddons([...addons, { name: '', price: 0 }])}
                    className="text-[10px] bg-slate-800 text-orange-400 hover:text-orange-300 px-2 py-1 rounded font-bold border border-slate-700/60 transition"
                  >
                    + Add Add-on
                  </button>
                </div>
                {addons.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No add-ons defined.</p>
                ) : (
                  <div className="space-y-2">
                    {addons.map((a, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Add-on Name (e.g. Extra Cheese)"
                          value={a.name}
                          onChange={(e) => {
                            const newAddons = [...addons];
                            newAddons[index].name = e.target.value;
                            setAddons(newAddons);
                          }}
                          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Price ($)"
                          value={a.price}
                          onChange={(e) => {
                            const newAddons = [...addons];
                            newAddons[index].price = parseFloat(e.target.value) || 0;
                            setAddons(newAddons);
                          }}
                          className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setAddons(addons.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition"
              >
                {activeModal === 'addItem' ? 'Add Menu Dish' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
