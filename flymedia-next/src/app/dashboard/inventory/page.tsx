'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Pagination from '@/components/super-admin/Pagination';
import {
  Layers,
  Plus,
  ArrowRight,
  ChevronLeft,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Barcode,
  Scale,
  BookOpen,
  PieChart,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Truck,
  ImageIcon,
} from 'lucide-react';

export default function ManageItemPage() {
  const { data: session } = useSession();

  // Sub-view: 'dashboard' | 'overview' | 'add' | 'import-export' | 'uncategorised' | 'transfer' | 'update' | 'barcode' | 'scale' | 'ingredients' | 'reports'
  const [activeSubView, setActiveSubView] = useState<
    'dashboard' | 'overview' | 'import-export' | 'uncategorised' | 'transfer' | 'update' | 'barcode' | 'scale' | 'ingredients' | 'reports'
  >('dashboard');

  // Categories & Items state
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Item Form states
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemStock, setItemStock] = useState('0');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [variants, setVariants] = useState<{ id?: string; name: string; additional_price: number }[]>([]);
  const [addons, setAddons] = useState<{ id?: string; name: string; price: number }[]>([]);
  const [bases, setBases] = useState<{ id?: string; name: string; extraPrice: number }[]>([]);

  // Transfer states
  const [transferItemId, setTransferItemId] = useState('');
  const [transferFrom, setTransferFrom] = useState('Main Warehouse');
  const [transferTo, setTransferTo] = useState('Warrick Bay Kitchen');
  const [transferQty, setTransferQty] = useState('10');
  const [transferHistory, setTransferHistory] = useState<any[]>([
    { id: 1, date: '2026-06-18', name: 'Truffle Parmesan Fries', qty: 50, unit: 'pcs', from: 'Main Depot', to: 'Warner Bay Kitchen', status: 'Completed' },
    { id: 2, date: '2026-06-19', name: 'Woodfired Margherita Pizza', qty: 15, unit: 'pcs', from: 'Warner Bay Storage', to: 'Kitchen Line', status: 'Completed' }
  ]);

  // CSV file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Image folder ref
  const imageFolderInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({ current: 0, total: 0 });

  // Recipe/Ingredient states
  const [selectedDishId, setSelectedDishId] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([
    { id: '1', name: 'Premium Beef Patty', qty: 1, unit: 'pcs' },
    { id: '2', name: 'Brioche Burger Bun', qty: 1, unit: 'pcs' },
    { id: '3', name: 'Sharp Cheddar Slice', qty: 1.5, unit: 'pcs' },
  ]);
  const [newIngName, setNewIngName] = useState('');
  const [newIngQty, setNewIngQty] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('pcs');

  // Barcode states
  const [barcodeItem, setBarcodeItem] = useState<any>(null);
  const [barcodeSize, setBarcodeSize] = useState('medium');

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        
        // Flatten items from all categories
        const itemsList: any[] = [];
        data.categories.forEach((cat: any) => {
          if (cat.MenuItems) {
            cat.MenuItems.forEach((item: any) => {
              itemsList.push({
                ...item,
                categoryName: cat.name,
              });
            });
          }
        });
        setAllItems(itemsList);
        if (itemsList.length > 0) {
          setBarcodeItem(itemsList[0]);
          setSelectedDishId(itemsList[0].id);
        }
      } else {
        setError(data.error || 'Failed to retrieve inventory items.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
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

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    try {
      const isEdit = !!editingItem;
      const url = '/api/dashboard/menu';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          id: isEdit ? editingItem.id : undefined,
          categoryId: itemCategoryId || undefined,
          name: itemName,
          price: itemPrice,
          description: itemDesc,
          imageUrl: itemImage,
          barcode: itemBarcode || null,
          sku: itemSku || null,
          stockCount: parseInt(itemStock) || 0,
          unit: itemUnit || 'pcs',
          isAvailable: isEdit ? editingItem.is_available : true,
          variants,
          addons,
          bases,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowItemModal(false);
        setEditingItem(null);
        clearForm();
        triggerAlert(isEdit ? 'Item updated successfully.' : 'Item added successfully.');
        await fetchMenuData();
      } else {
        triggerAlert(data.error || 'Operation failed.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      const res = await fetch(`/api/dashboard/menu?id=${id}&type=item`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Item deleted.');
        await fetchMenuData();
      } else {
        triggerAlert(data.error || 'Failed to delete.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearForm = () => {
    setItemName('');
    setItemPrice('');
    setItemCategoryId('');
    setItemDesc('');
    setItemImage('');
    setItemBarcode('');
    setItemSku('');
    setItemStock('0');
    setItemUnit('pcs');
    setVariants([]);
    setAddons([]);
    setBases([]);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (allItems.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'SKU', 'Barcode', 'Price', 'Stock Count', 'Unit', 'Available'];
    const rows = allItems.map((item) => [
      item.id,
      item.name,
      item.categoryName || 'Uncategorised',
      item.sku || '',
      item.barcode || '',
      item.price,
      item.stock_count,
      item.unit,
      item.is_available ? 'TRUE' : 'FALSE',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `f-ordering_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert('Inventory CSV downloaded.');
  };

  // CSV / Excel / JSON Importer
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    // Cache to lookup categories by name and avoid duplicate network requests
    const categoryCache: Record<string, string> = {};
    categories.forEach((cat) => {
      categoryCache[cat.name.toLowerCase()] = cat.id;
    });

    const resolveCategoryId = async (catInput: string, cache: Record<string, string>) => {
      if (!catInput) return null;
      const trimmed = catInput.trim();
      if (!trimmed) return null;

      // Check if it is a valid UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      if (isUUID) return trimmed;

      // Parse nested hierarchy separated by "/", ">", or "->"
      const parts = trimmed.split(/\s*[\/>]|\s+->\s*/).map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;

      let currentParentId: string | null = null;
      let pathAccumulator = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        pathAccumulator = pathAccumulator ? `${pathAccumulator} / ${part}` : part;
        const lowerPath = pathAccumulator.toLowerCase();

        if (cache[lowerPath]) {
          currentParentId = cache[lowerPath];
          continue;
        }

        // Check if category with matching name and parent exists in local categories state
        const existingCat = categories.find(
          (c) => c.name.toLowerCase() === part.toLowerCase() && 
                 (c.parent_id === currentParentId || (!c.parent_id && !currentParentId))
        );

        if (existingCat) {
          currentParentId = existingCat.id;
          cache[lowerPath] = existingCat.id;
        } else {
          // Create the category on the fly
          try {
            const catRes: any = await fetch('/api/dashboard/menu', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'category',
                name: part,
                parentId: currentParentId,
              }),
            });
            const catData: any = await catRes.json();
            if (catData.success && catData.category) {
              const catNewId: any = catData.category.id;
              cache[lowerPath] = catNewId;
              currentParentId = catNewId;

              // Append to local state list immediately
              setCategories((prev) => {
                if (prev.some((c) => c.id === catNewId)) return prev;
                return [...prev, catData.category];
              });
            } else {
              return null; // failed to create
            }
          } catch (err) {
            console.error('Failed to create subcategory on-the-fly:', err);
            return null;
          }
        }
      }

      return currentParentId;
    };

    if (fileType === 'json') {
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const items = JSON.parse(text);
          if (!Array.isArray(items)) {
            triggerAlert('JSON file must contain an array of items.', true);
            return;
          }

          let successCount = 0;
          for (const item of items) {
            if (!item.name || item.price === undefined) continue;

            const resolvedCatId = await resolveCategoryId(item.categoryId || item.category_id || '', categoryCache);

            try {
              const res = await fetch('/api/dashboard/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'item',
                  name: item.name,
                  categoryId: resolvedCatId,
                  price: parseFloat(item.price) || 0,
                  description: item.description || '',
                  imageUrl: item.imageUrl || item.image_url || null,
                  sku: item.sku || null,
                  barcode: item.barcode || null,
                  stockCount: parseInt(item.stockCount || item.stock_count) || 0,
                  unit: item.unit || 'pcs',
                  variants: item.variants || [],
                  addons: item.addons || [],
                  bases: item.bases || [],
                }),
              });
              const data = await res.json();
              if (data.success) successCount++;
            } catch (err) {
              console.error(err);
            }
          }
          triggerAlert(`Successfully imported ${successCount} items from JSON.`);
          await fetchMenuData();
        } catch (err) {
          triggerAlert('Failed to parse JSON file.', true);
        }
      };
      reader.readAsText(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          
          // Dynamically load SheetJS from CDN
          const XLSX = await (new Promise((resolve, reject) => {
            if ((window as any).XLSX) {
              resolve((window as any).XLSX);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = () => resolve((window as any).XLSX);
            script.onerror = () => reject(new Error('Failed to load Excel parser.'));
            document.head.appendChild(script);
          }) as Promise<any>);

          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (rows.length <= 1) {
            triggerAlert('Excel sheet is empty or invalid.', true);
            return;
          }

          let successCount = 0;
          // Row parser assuming headers: Name, CategoryId, Price, SKU, Barcode, StockCount, Unit, Variants, Addons
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            const name = row[0]?.toString().trim();
            const categoryInput = row[1]?.toString().trim() || '';
            const price = row[2];
            const sku = row[3]?.toString().trim();
            const barcode = row[4]?.toString().trim();
            const stock = row[5];
            const unit = row[6]?.toString().trim();
            const variantsStr = row[7]?.toString().trim() || '';
            const addonsStr = row[8]?.toString().trim() || '';

            if (!name || price === undefined) continue;

            const resolvedCatId = await resolveCategoryId(categoryInput, categoryCache);

            const itemVariants: any[] = [];
            if (variantsStr) {
              const varParts = variantsStr.split(';').map((v: string) => v.trim()).filter(Boolean);
              for (const vp of varParts) {
                if (vp.includes(':')) {
                  const [vName, vPrice] = vp.split(':');
                  itemVariants.push({
                    name: vName.trim(),
                    additional_price: parseFloat(vPrice.trim()) || 0
                  });
                } else {
                  itemVariants.push({
                    name: vp.trim(),
                    additional_price: 0
                  });
                }
              }
            }

            const itemAddons: any[] = [];
            if (addonsStr) {
              const addonParts = addonsStr.split(';').map((a: string) => a.trim()).filter(Boolean);
              for (const ap of addonParts) {
                if (ap.includes(':')) {
                  const [aName, aPrice] = ap.split(':');
                  itemAddons.push({
                    name: aName.trim(),
                    price: parseFloat(aPrice.trim()) || 0
                  });
                } else {
                  itemAddons.push({
                    name: ap.trim(),
                    price: 0
                  });
                }
              }
            }

            try {
              const res = await fetch('/api/dashboard/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'item',
                  name,
                  categoryId: resolvedCatId,
                  price: parseFloat(price.toString()) || 0,
                  sku: sku || null,
                  barcode: barcode || null,
                  stockCount: parseInt(stock?.toString()) || 0,
                  unit: unit || 'pcs',
                  variants: itemVariants,
                  addons: itemAddons,
                }),
              });
              const data = await res.json();
              if (data.success) successCount++;
            } catch (err) {
              console.error(err);
            }
          }
          triggerAlert(`Successfully imported ${successCount} items from Excel.`);
          await fetchMenuData();
        } catch (err) {
          triggerAlert('Failed to parse Excel file.', true);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Fallback/CSV loader
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim() !== '');
        if (lines.length <= 1) {
          triggerAlert('CSV file is empty or invalid.', true);
          return;
        }

        let successCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/"/g, '').trim());
          if (parts.length < 3) continue;

          const [name, categoryInput, price, sku, barcode, stock, unit, variantsStr, addonsStr] = parts;
          if (!name || !price) continue;

          const resolvedCatId = await resolveCategoryId(categoryInput || '', categoryCache);

          const itemVariants: any[] = [];
          if (variantsStr) {
            const varParts = variantsStr.split(';').map((v: string) => v.trim()).filter(Boolean);
            for (const vp of varParts) {
              if (vp.includes(':')) {
                const [vName, vPrice] = vp.split(':');
                itemVariants.push({
                  name: vName.trim(),
                  additional_price: parseFloat(vPrice.trim()) || 0
                });
              } else {
                itemVariants.push({
                  name: vp.trim(),
                  additional_price: 0
                });
              }
            }
          }

          const itemAddons: any[] = [];
          if (addonsStr) {
            const addonParts = addonsStr.split(';').map((a: string) => a.trim()).filter(Boolean);
            for (const ap of addonParts) {
              if (ap.includes(':')) {
                const [aName, aPrice] = ap.split(':');
                itemAddons.push({
                  name: aName.trim(),
                  price: parseFloat(aPrice.trim()) || 0
                });
              } else {
                itemAddons.push({
                  name: ap.trim(),
                  price: 0
                });
              }
            }
          }

          try {
            const res = await fetch('/api/dashboard/menu', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'item',
                name,
                categoryId: resolvedCatId,
                price: parseFloat(price) || 0,
                sku: sku || null,
                barcode: barcode || null,
                stockCount: parseInt(stock) || 0,
                unit: unit || 'pcs',
                variants: itemVariants,
                addons: itemAddons,
              }),
            });
            const data = await res.json();
            if (data.success) {
              successCount++;
            }
          } catch (err) {
            console.error(err);
          }
        }

        triggerAlert(`Successfully imported ${successCount} items from CSV.`);
        await fetchMenuData();
      };
      reader.readAsText(file);
    }
  };

  // Bulk Image Folder Uploader
  const handleUploadImageFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Filter image files
    const imageFiles = Array.from(files).filter(file => {
      const type = file.type.toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
    });

    if (imageFiles.length === 0) {
      triggerAlert('No image files found in the selected folder.', true);
      return;
    }

    setUploadingImages(true);
    setImageUploadProgress({ current: 0, total: imageFiles.length });

    let updatedCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setImageUploadProgress({ current: i + 1, total: imageFiles.length });

      // Get filename without extension to use as matching key
      const lastDotIndex = file.name.lastIndexOf('.');
      const keyName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const cleanKey = keyName.trim().toLowerCase();
      const cleanKeyNoUnderscore = cleanKey.replace(/_/g, ' ');

      // Find matching item in allItems by Name, SKU, or Barcode
      const matchedItem = allItems.find(item => {
        const itemNameClean = item.name?.trim().toLowerCase();
        const nameMatch = itemNameClean === cleanKey || itemNameClean === cleanKeyNoUnderscore;
        const skuMatch = item.sku?.trim().toLowerCase() === cleanKey;
        const barcodeMatch = item.barcode?.trim().toLowerCase() === cleanKey;
        return nameMatch || skuMatch || barcodeMatch;
      });

      if (!matchedItem) {
        console.log(`No matching menu item found for image: ${file.name}`);
        continue;
      }

      // Upload file to /api/dashboard/upload
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'menu');

        const uploadRes = await fetch('/api/dashboard/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          // Update matching menu item in the database
          const updateRes = await fetch('/api/dashboard/menu', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'item',
              id: matchedItem.id,
              name: matchedItem.name,
              price: matchedItem.price,
              description: matchedItem.description || '',
              imageUrl: uploadData.url, // update to uploaded relative URL
              isAvailable: matchedItem.is_available,
              sku: matchedItem.sku,
              barcode: matchedItem.barcode,
              stockCount: matchedItem.stock_count,
              unit: matchedItem.unit,
            }),
          });
          const updateData = await updateRes.json();
          if (updateData.success) {
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(`Failed to upload/link image ${file.name}:`, err);
      }
    }

    setUploadingImages(false);
    triggerAlert(`Successfully linked & updated ${updatedCount} menu item images.`);
    await fetchMenuData();
  };

  // Uncategorised quick category mapping
  const handleMapCategory = async (itemId: string, catId: string) => {
    if (!catId) return;
    try {
      const res = await fetch('/api/dashboard/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          id: itemId,
          categoryId: catId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('Item assigned to category.');
        await fetchMenuData();
      } else {
        triggerAlert(data.error || 'Failed to update category.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stock Transfer
  const handlePerformTransfer = () => {
    if (!transferItemId) {
      triggerAlert('Please select an item', true);
      return;
    }
    const item = allItems.find((i) => i.id === transferItemId);
    if (!item) return;

    const newTransfer = {
      id: transferHistory.length + 1,
      date: new Date().toISOString().split('T')[0],
      name: item.name,
      qty: parseInt(transferQty) || 1,
      unit: item.unit || 'pcs',
      from: transferFrom,
      to: transferTo,
      status: 'Completed',
    };

    setTransferHistory([newTransfer, ...transferHistory]);
    triggerAlert(`Successfully transferred ${transferQty} ${item.unit} of ${item.name}.`);
    setTransferItemId('');
  };

  // Recipe ingredients handlers
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim() || !newIngQty) return;

    const newIng = {
      id: Math.random().toString(),
      name: newIngName.trim(),
      qty: parseFloat(newIngQty) || 1,
      unit: newIngUnit,
    };

    setRecipeIngredients([...recipeIngredients, newIng]);
    setNewIngName('');
    setNewIngQty('');
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipeIngredients(recipeIngredients.filter((i) => i.id !== id));
  };

  // Filtering
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === '' || item.category_id === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryFilter]);

  const uncategorisedItems = allItems.filter(
    (item) => !item.category_id || item.category_id === 'uncategorized'
  );

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
            <Layers className="h-6 w-6 text-orange-500 animate-pulse" />
            Manage Item
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Integrate raw materials, finished catalog lines, warehouse allocations, ingredients mapping, and stock reports.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Card 1: Item Overview */}
            <div 
              onClick={() => setActiveSubView('overview')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-105 transition">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Item Overview
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-orange-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    View Your Item, get your changes done to your product and add more variants to expand your business.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Items tracked: {allItems.length}</span>
                <span className="text-orange-500">Manage →</span>
              </div>
            </div>

            {/* Card 2: Add Item */}
            <div 
              onClick={() => {
                clearForm();
                setEditingItem(null);
                setShowItemModal(true);
              }}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-105 transition">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Add Item
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-sky-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Use this option to add new Item to your Inventory which gives more options for customer to look at.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Fully mapped to categories</span>
                <span className="text-sky-500">Add →</span>
              </div>
            </div>

            {/* Card 3: Import Export Item */}
            <div 
              onClick={() => setActiveSubView('import-export')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Import Export Item
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-emerald-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Upload your Inventory in a blink and get your business started or download your current Inventory items from here.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>CSV Upload / Download</span>
                <span className="text-emerald-500">Sync →</span>
              </div>
            </div>

            {/* Card 4: Uncategorised Item */}
            <div 
              onClick={() => setActiveSubView('uncategorised')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-105 transition">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Uncategorised Item
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-red-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    This contains products which are not tagged to any of the catalogue. You can also tag containing product from here.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Pending items: {uncategorisedItems.length}</span>
                <span className="text-red-500">Tag →</span>
              </div>
            </div>

            {/* Card 5: Stock Transfer */}
            <div 
              onClick={() => setActiveSubView('transfer')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-105 transition">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Stock Transfer
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-purple-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Transfer Item stock here, from one location to another. Keep track of storage rooms, fridges, and bars.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Multi-Warehouse support</span>
                <span className="text-purple-500">Transfer →</span>
              </div>
            </div>

            {/* Card 6: Stock Update */}
            <div 
              onClick={() => setActiveSubView('update')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Stock Update
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-amber-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Update Item stock here, explore for more. Modify real-time counts, safety thresholds, and alerts.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Quick Stock Adjust</span>
                <span className="text-amber-500">Modify →</span>
              </div>
            </div>

            {/* Card 7: Print Items Barcode */}
            <div 
              onClick={() => setActiveSubView('barcode')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-500 group-hover:scale-105 transition">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Print Items Barcode
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-fuchsia-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Get Bar code or QR code, Print of your business Item. Label packaging or physical menus instantly.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Automatic Barcode Render</span>
                <span className="text-fuchsia-500">Print →</span>
              </div>
            </div>

            {/* Card 8: Weighing Scale Items */}
            <div 
              onClick={() => setActiveSubView('scale')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Weighing Scale Items
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-cyan-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Click/Tap to download weighing maching inventory format, to upload in weighing machine. Generates PLU files.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>PLU Config Exporter</span>
                <span className="text-cyan-500">Configure →</span>
              </div>
            </div>

            {/* Card 9: Items used as Ingredients */}
            <div 
              onClick={() => setActiveSubView('ingredients')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 group-hover:scale-105 transition">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Items used as Ingredients
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-teal-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Get the list of items which are tagged as Ingredients on an furnished product. Set up recipe costings.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Recipe Allocation</span>
                <span className="text-teal-500">Configure →</span>
              </div>
            </div>

            {/* Card 10: Download and View Inventory Reports */}
            <div 
              onClick={() => setActiveSubView('reports')}
              className="group rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/40 cursor-pointer shadow-lg transition duration-300"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-105 transition">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Download and View Inventory Reports
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition text-pink-500" />
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Get Inventory Reports such as sales channel order types. Monitor valuation, reorder lists, and warnings.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[9px] uppercase font-bold text-slate-500">
                <span>Interactive Stock Graphs</span>
                <span className="text-pink-500">Reports →</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. ITEM OVERVIEW VIEW */}
      {activeSubView === 'overview' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  clearForm();
                  setEditingItem(null);
                  setShowItemModal(true);
                }}
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 transition flex items-center gap-1 w-full md:w-auto justify-center"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Barcode</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-center">Stock Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-600 font-bold">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const isLow = item.stock_count <= 5;
                    const isOut = item.stock_count === 0;

                    return (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                        <td className="p-4 font-bold text-white flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="h-8 w-8 object-cover rounded" />
                          )}
                          {item.name}
                        </td>
                        <td className="p-4 text-slate-400">{item.categoryName || 'Uncategorised'}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">{item.sku || 'N/A'}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">{item.barcode || 'N/A'}</td>
                        <td className="p-4 text-right font-bold text-white">${parseFloat(item.price).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase ${
                            isOut
                              ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                              : isLow
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          }`}>
                            {item.stock_count} {item.unit}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemName(item.name);
                                setItemPrice(item.price);
                                setItemCategoryId(item.category_id);
                                setItemDesc(item.description || '');
                                setItemImage(item.image_url || '');
                                setItemBarcode(item.barcode || '');
                                setItemSku(item.sku || '');
                                setItemStock(item.stock_count?.toString() || '0');
                                setItemUnit(item.unit || 'pcs');
                                setVariants(item.variants || []);
                                setAddons(item.addons || []);
                                setBases(item.bases || []);
                                setShowItemModal(true);
                              }}
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemLabel="products"
          />
        </div>
      )}

      {/* 3. IMPORT EXPORT VIEW */}
      {activeSubView === 'import-export' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Export card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <Download className="h-10 w-10 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">Export Inventory Catalog</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export all active product registers, pricing points, SKU identifiers, barcodes, and current warehouse stock counts into a single comma-separated CSV format.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition w-full justify-center lg:w-auto"
              >
                <Download className="h-4 w-4" /> Download CSV Spreadsheet
              </button>
            </div>
          </div>

          {/* Import card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <Upload className="h-10 w-10 text-sky-400" />
              <h3 className="text-base font-extrabold text-white">Bulk Import Spreadsheet</h3>
              <p className="text-xs text-slate-400 leading-relaxed space-y-1">
                <span>Quickly seed or update your menus in bulk. Upload a CSV, Excel (.xlsx, .xls), or JSON file.</span>
                <br />
                <span className="font-bold text-slate-350 block mt-1 text-[11px]">Spreadsheet headers (CSV / Excel):</span>
                <code className="text-sky-400 font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 block mt-0.5 select-all">
                  Name, CategoryId, Price, SKU, Barcode, StockCount, Unit, Variants, Addons
                </code>
                <span className="text-[10px] text-slate-400 block mt-1">
                  * To import variants/options, use the format: <code className="text-amber-400">Mild;Medium;Hot</code> or <code className="text-amber-400">Mild:0;Medium:0;Hot:0</code> (separated by semicolons).
                  <br />
                  * To import add-ons (toppings), use the format: <code className="text-amber-400">Extra Cheese:1.50;Bacon:2.00;Egg:1.50</code> (separated by semicolons).
                </span>
                <span className="font-bold text-slate-350 block mt-2 text-[11px]">JSON array schema (with optional pricing options):</span>
                <code className="text-sky-400 font-mono text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 block mt-0.5 overflow-x-auto whitespace-pre select-all">
  {JSON.stringify([
    {
      name: "Smash Burger",
      price: 14.99,
      description: "Burgers with variant sizes",
      categoryId: "uuid-category-1",
      variants: [
        { name: "Regular", additional_price: 0 },
        { name: "Double Patty", additional_price: 3.50 }
      ]
    }
  ], null, 2)}
                </code>
              </p>
            </div>
            <div className="pt-2">
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition w-full justify-center lg:w-auto"
              >
                <Upload className="h-4 w-4" /> Choose Menu File
              </button>
            </div>
          </div>

          {/* Image Folder Import card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <ImageIcon className="h-10 w-10 text-orange-400" />
              <h3 className="text-base font-extrabold text-white">Bulk Upload Images</h3>
              <p className="text-xs text-slate-400 leading-relaxed space-y-1">
                <span>Upload an entire folder containing product images to update dish pictures in bulk.</span>
                <br />
                <span className="font-bold text-slate-350 block mt-1 text-[11px]">Filename Matching Rules:</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Images are automatically matched by their filename (without extension) to either the **Dish Name**, **SKU**, or **Barcode**.
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  * Example: <code className="text-amber-400">Classic Margherita Pizza.jpg</code> matches a dish named "Classic Margherita Pizza".
                  <br />
                  * Example: <code className="text-amber-400">PIZZA-MARG-01.png</code> matches a dish with SKU "PIZZA-MARG-01".
                </span>
              </p>
            </div>
            
            <div className="pt-2">
              <input
                type="file"
                {...({
                  webkitdirectory: "",
                  directory: "",
                  multiple: true
                } as any)}
                ref={imageFolderInputRef}
                onChange={handleUploadImageFolder}
                className="hidden"
                accept="image/*"
              />
              <button
                disabled={uploadingImages}
                onClick={() => imageFolderInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 disabled:bg-orange-850/50 disabled:text-orange-400/50 transition w-full justify-center lg:w-auto"
              >
                {uploadingImages ? (
                  <>Uploading ({imageUploadProgress.current}/{imageUploadProgress.total})...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload Images Folder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNCATEGORISED ITEM VIEW */}
      {activeSubView === 'uncategorised' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Uncategorised Products</h2>
            <p className="text-xs text-slate-500 mt-1">These items are in the catalog database but are not linked to any display categories. Map them below to show them on online lists.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uncategorisedItems.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-slate-500 font-bold border border-dashed border-slate-800 rounded-xl">
                ✨ Zero uncategorised items. Excellent! Everything is sorted.
              </div>
            ) : (
              uncategorisedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Price: ${parseFloat(item.price).toFixed(2)} | SKU: {item.sku || 'N/A'}</p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      onChange={(e) => handleMapCategory(item.id, e.target.value)}
                      defaultValue=""
                      className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-400 outline-none"
                    >
                      <option value="" disabled>-- Map Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. STOCK TRANSFER VIEW */}
      {activeSubView === 'transfer' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Stock Transfer Station</h2>
            <p className="text-xs text-slate-500 mt-1">Safely record materials and dish inventory moving between physical stores or kitchen depots.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Log Movement</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Select Item to Transfer</label>
                  <select
                    value={transferItemId}
                    onChange={(e) => setTransferItemId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="">-- Choose Item --</option>
                    {allItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.stock_count} {item.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">From Location</label>
                    <select
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Main Warehouse">Main Warehouse</option>
                      <option value="Warner Bay Storage">Warner Bay Storage</option>
                      <option value="Cardiff Apartments Desk">Cardiff Desk Depot</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-2">To Location</label>
                    <select
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Warrick Bay Kitchen">Warrick Bay Kitchen</option>
                      <option value="Front Bar Counters">Front Bar Counters</option>
                      <option value="Kitchen Line 1">Kitchen Line 1</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">Transfer Quantity</label>
                  <input
                    type="number"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <button
                  onClick={handlePerformTransfer}
                  className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition flex items-center justify-center gap-1.5"
                >
                  <Truck className="h-4 w-4" /> Transfer Stock
                </button>
              </div>
            </div>

            {/* Ledger list */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Transfer Records Ledger</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Item Details</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Route Path</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferHistory.map((h) => (
                      <tr key={h.id} className="border-b border-slate-900 text-slate-300">
                        <td className="py-3 font-mono text-[10px] text-slate-500">{h.date}</td>
                        <td className="py-3 font-bold text-white">{h.name}</td>
                        <td className="py-3">{h.qty} {h.unit}</td>
                        <td className="py-3 text-[10px] text-slate-400">
                          {h.from} → {h.to}
                        </td>
                        <td className="py-3 text-right text-emerald-400 font-bold">{h.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK STOCK UPDATE VIEW */}
      {activeSubView === 'update' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Stock Level Adjustments</h2>
            <p className="text-xs text-slate-500 mt-1">Audit counts, adjust variance numbers, or overwrite initial limits instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">SKU: {item.sku || 'N/A'}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">
                    Current: {item.stock_count} {item.unit}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="New Qty"
                    id={`stock-input-${item.id}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-white outline-none"
                  />
                  <button
                    onClick={async () => {
                      const inputEl = document.getElementById(`stock-input-${item.id}`) as HTMLInputElement;
                      const val = inputEl?.value;
                      if (!val) return;
                      try {
                        const res = await fetch('/api/dashboard/menu', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'item',
                            id: item.id,
                            stockCount: parseInt(val),
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          triggerAlert(`Updated ${item.name} stock level.`);
                          inputEl.value = '';
                          await fetchMenuData();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="rounded-lg bg-orange-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-orange-500 transition shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. PRINT ITEMS BARCODE VIEW */}
      {activeSubView === 'barcode' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Item Barcode generator</h2>
            <p className="text-xs text-slate-500 mt-1">Generate scan codes matching active products to stamp packaging envelopes or paper receipt lines.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Control panel */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Configure Tag</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-2">Choose Item</label>
                  <select
                    value={barcodeItem ? barcodeItem.id : ''}
                    onChange={(e) => {
                      const item = allItems.find((i) => i.id === e.target.value);
                      if (item) setBarcodeItem(item);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    {allItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-2">Tag Dimension Size</label>
                  <select
                    value={barcodeSize}
                    onChange={(e) => setBarcodeSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="small">Small Tag (25mm x 15mm)</option>
                    <option value="medium">Medium Tag (50mm x 30mm)</option>
                    <option value="large">Large Shipping Label</option>
                  </select>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition flex items-center justify-center gap-1.5"
                >
                  <Barcode className="h-4 w-4" /> Print Barcode Label
                </button>
              </div>
            </div>

            {/* Visualizer output */}
            <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-950/60 p-8 flex flex-col items-center justify-center min-h-[300px]">
              {barcodeItem ? (
                <div className="bg-white text-black p-6 rounded-xl shadow-2xl flex flex-col items-center border border-slate-200">
                  <p className="text-[10px] font-black tracking-widest uppercase font-sans text-slate-800">{barcodeItem.categoryName}</p>
                  <p className="text-xs font-bold text-black mt-1 font-sans">{barcodeItem.name}</p>
                  
                  {/* Visual mocked barcode stripes */}
                  <div className="mt-4 flex gap-[1.5px] items-center h-14 w-44 bg-white border-t border-b border-slate-100 py-1">
                    {[1,2,1,4,2,1,3,1,2,4,1,2,1,3,1,2,2,4,1,1,2,3,1,2,1,4,2,1,3,1,2].map((w, idx) => (
                      <div key={idx} className={`h-full ${idx % 2 === 0 ? 'bg-black' : 'bg-white'}`} style={{ width: `${w}px` }}></div>
                    ))}
                  </div>
                  
                  <p className="text-[9px] font-mono tracking-widest font-black mt-2 text-slate-800">
                    {barcodeItem.barcode || `*${barcodeItem.sku || 'F-ORD-ITEM'}*`}
                  </p>
                  <p className="text-xs font-black text-black mt-1">${parseFloat(barcodeItem.price).toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-slate-600 font-bold">Select an item to construct scan barcodes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. WEIGHING SCALE PLU CONFIG */}
      {activeSubView === 'scale' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Weighing Scale PLU Mapping</h2>
            <p className="text-xs text-slate-500 mt-1">Export weighable menu items in a CSV configuration compatible with CAS, Wedderburn, or Bizerba barcode scales.</p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/60 text-slate-500 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">PLU Code</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Unit Measure</th>
                  <th className="p-4 text-right">Price per Unit</th>
                  <th className="p-4 text-right">Mapping Status</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, idx) => {
                  const isWeighable = item.unit === 'kg' || item.unit === 'g';
                  return (
                    <tr key={item.id} className="border-b border-slate-900 text-slate-300">
                      <td className="p-4 font-mono text-orange-500 font-bold">{1000 + idx}</td>
                      <td className="p-4 font-bold text-white">{item.name}</td>
                      <td className="p-4 uppercase">{item.unit}</td>
                      <td className="p-4 text-right font-bold text-white">${parseFloat(item.price).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isWeighable 
                            ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400' 
                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}>
                          {isWeighable ? 'Scale Ready' : 'Discrete Piece'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => {
              const headers = ['PLU', 'Name', 'Price', 'Unit', 'ScaleType'];
              const rows = allItems.map((item, idx) => [
                1000 + idx,
                item.name,
                item.price,
                item.unit,
                item.unit === 'kg' ? 'WEIGHT' : 'PIECE'
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
              const link = document.createElement('a');
              link.setAttribute('href', encodeURI(csvContent));
              link.setAttribute('download', `weighing_scale_plu_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              triggerAlert('PLU setup CSV exported successfully.');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition"
          >
            <Download className="h-4 w-4" /> Export Weighing PLU Mapping
          </button>
        </div>
      )}

      {/* 9. INGREDIENTS MAPPING VIEW */}
      {activeSubView === 'ingredients' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Dish Recipe & Ingredients Mapping</h2>
            <p className="text-xs text-slate-500 mt-1">Tag finished menu dishes with their respective constituent ingredients. POS checkouts will auto-deduct constituent parts from storage stock.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dish selector */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Select Dish</h3>
              <select
                value={selectedDishId}
                onChange={(e) => {
                  setSelectedDishId(e.target.value);
                  // Mutate dummy list to simulate dish mapping loading
                  setRecipeIngredients([
                    { id: '1', name: 'Raw Material A', qty: 2, unit: 'pcs' },
                    { id: '2', name: 'Raw Material B', qty: 150, unit: 'g' },
                  ]);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
              >
                {allItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>

              <form onSubmit={handleAddIngredient} className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Add Constituent Ingredient</h4>
                
                <div>
                  <input
                    type="text"
                    placeholder="Ingredient Name (e.g. Patty)"
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={newIngQty}
                    onChange={(e) => setNewIngQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                    required
                  />

                  <select
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-white outline-none"
                  >
                    <option value="pcs">pcs</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition"
                >
                  Link Ingredient
                </button>
              </form>
            </div>

            {/* Ingredient list */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Constituents Breakdown List</h3>
              
              <div className="space-y-2">
                {recipeIngredients.map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center bg-slate-900 border border-slate-800/80 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-white">{ing.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Quantity deducted: {ing.qty} {ing.unit}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="text-red-400 hover:text-white p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. INVENTORY REPORTS VIEW */}
      {activeSubView === 'reports' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Stock Status & Valuation Reports</h2>
              <p className="text-xs text-slate-500 mt-1">Visual valuation matrices, warning boards, and critical reorder lists.</p>
            </div>
            <button
              onClick={() => {
                triggerAlert('PDF report download initialized.');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition"
            >
              <Download className="h-4 w-4" /> Download PDF report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1 */}
            <div className="border border-slate-800 bg-slate-950 p-5 rounded-xl flex flex-col justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Assets Value</p>
              <h3 className="text-2xl font-black text-white mt-2">
                ${allItems.reduce((sum, item) => sum + parseFloat(item.price) * item.stock_count, 0).toFixed(2)}
              </h3>
              <p className="text-[9px] text-slate-600 mt-2">Calculated from purchase values</p>
            </div>

            {/* Metric 2 */}
            <div className="border border-slate-800 bg-slate-950 p-5 rounded-xl flex flex-col justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Critical Low Stock Items</p>
              <h3 className="text-2xl font-black text-amber-500 mt-2">
                {allItems.filter(item => item.stock_count <= 5).length}
              </h3>
              <p className="text-[9px] text-amber-600 mt-2">Items with less than 5 units left</p>
            </div>

            {/* Metric 3 */}
            <div className="border border-slate-800 bg-slate-950 p-5 rounded-xl flex flex-col justify-between">
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Average Price Point</p>
              <h3 className="text-2xl font-black text-white mt-2">
                ${(allItems.reduce((sum, item) => sum + parseFloat(item.price), 0) / (allItems.length || 1)).toFixed(2)}
              </h3>
              <p className="text-[9px] text-slate-600 mt-2">Across all catalog lines</p>
            </div>
          </div>

          {/* Low stock table list */}
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Procurement Low-Stock Alert List</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-center">Remaining Quantity</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.filter(item => item.stock_count <= 5).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-600 font-semibold">
                        All items are adequately stocked. Zero warnings!
                      </td>
                    </tr>
                  ) : (
                    allItems.filter(item => item.stock_count <= 5).map((item) => (
                      <tr key={item.id} className="border-b border-slate-900 text-slate-300">
                        <td className="py-3 font-bold text-white">{item.name}</td>
                        <td className="py-3 font-mono text-slate-500">{item.sku || 'N/A'}</td>
                        <td className="py-3 text-slate-400">{item.categoryName}</td>
                        <td className="py-3 text-center font-bold text-red-400">
                          {item.stock_count} {item.unit}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            item.stock_count === 0 
                              ? 'bg-red-950 text-red-400 border border-red-900/40' 
                              : 'bg-amber-950 text-amber-400 border border-amber-900/40'
                          }`}>
                            {item.stock_count === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 11. ADD / EDIT ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {editingItem ? 'Edit Product Register' : 'Register New Inventory Line'}
              </h3>
              <button
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Item Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Tomatoes"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5.99"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Link Display Category</label>
                <select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">Uncategorised (Assign later)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Barcode Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 9312345678"
                    value={itemBarcode}
                    onChange={(e) => setItemBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">SKU identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. RAW-TOMATO-KG"
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-[11px] text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Stock Level Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Inventory Scale Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Description</label>
                <textarea
                  placeholder="Warehouse details, supplier links..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none"
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

              {/* BASES SECTION */}
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Bases (e.g. Patty, Crust)</label>
                  <button
                    type="button"
                    onClick={() => setBases([...bases, { name: '', extraPrice: 0 }])}
                    className="text-[10px] bg-slate-800 text-orange-400 hover:text-orange-300 px-2 py-1 rounded font-bold border border-slate-700/60 transition"
                  >
                    + Add Base
                  </button>
                </div>
                {bases.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No bases defined (defaults to standard base).</p>
                ) : (
                  <div className="space-y-2">
                    {bases.map((b, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Base Name (e.g. Gluten Free Crust)"
                          value={b.name}
                          onChange={(e) => {
                            const newBases = [...bases];
                            newBases[index].name = e.target.value;
                            setBases(newBases);
                          }}
                          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Price mod (+$)"
                          value={b.extraPrice}
                          onChange={(e) => {
                            const newBases = [...bases];
                            newBases[index].extraPrice = parseFloat(e.target.value) || 0;
                            setBases(newBases);
                          }}
                          className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setBases(bases.filter((_, i) => i !== index))}
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
                className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition font-sans"
              >
                {editingItem ? 'Save Item Changes' : 'Register Product'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
