'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function MenuManagerPage() {
  const { data: session } = useSession();

  // Categories & Items state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // UI state
  const [newCatName, setNewCatName] = useState('');
  const [activeModal, setActiveModal] = useState<'addItem' | 'editItem' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states for new/edit items
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', name: newCatName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to create category.');
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        clearItemForm();
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to add item.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditItemClick = (item: any) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemDesc(item.description || '');
    setItemImage(item.image_url || '');
    setItemAvailable(item.is_available);
    setActiveModal('editItem');
  };

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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        clearItemForm();
        setEditingItem(null);
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const res = await fetch(`/api/dashboard/menu?id=${id}&type=item`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to delete item.');
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
    setItemAvailable(true);
  };

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const activeItems = activeCategory?.MenuItems || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Utensils className="h-6 w-6 text-orange-500" />
            Menu Catalog Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your store's digital menu: create categories, upload dishes, set prices, and configure customizations.
          </p>
        </div>
      </div>

      {/* CORE WORKSPACE: CATEGORIES & ITEMS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: CATEGORIES LIST */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-white">Categories</h2>
            
            {/* Add Cat form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="New Category..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-orange-600 p-2 text-white hover:bg-orange-500 transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            {/* List categories */}
            <div className="space-y-1 overflow-y-auto max-h-[50vh]">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition group ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer'
                    }`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    <span>{cat.name} ({cat.MenuItems?.length || 0})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className="text-red-400 hover:text-white opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISHES (MENU ITEMS) LIST */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">
                  {activeCategory ? activeCategory.name : 'Select a Category'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Dishes linked to this category</p>
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

            {/* Dishes Grid */}
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
                    className={`rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4 flex flex-col justify-between ${
                      !item.is_available ? 'opacity-60 border-slate-900' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-32 w-full rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-700">
                          No Image
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-sm text-white line-clamp-1">{item.name}</h3>
                          <span className="text-xs font-black text-white">${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                          {item.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-900 text-xs font-bold">
                      <span className={`flex items-center gap-1 ${item.is_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {item.is_available ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {item.is_available ? 'Available' : 'Hidden'}
                      </span>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditItemClick(item)}
                          className="rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white border border-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* 4. MODALS (ADD / EDIT DISH) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {activeModal === 'addItem' ? 'Add New Dish' : 'Edit Menu Dish'}
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

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Availability</label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setItemAvailable(true)}
                      className={`flex-1 py-2 rounded-xl border text-[10px] uppercase font-bold transition ${
                        itemAvailable
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemAvailable(false)}
                      className={`flex-1 py-2 rounded-xl border text-[10px] uppercase font-bold transition ${
                        !itemAvailable
                          ? 'border-red-500 bg-red-950/20 text-red-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      Hidden
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Describe ingredients, cooking preparation..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none focus:border-orange-500 transition"
                />
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
