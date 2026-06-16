import React from 'react';
import { Search, Plus, Minus } from 'lucide-react';

interface POSMenuGridProps {
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: any[];
  getItemQty: (itemId: string) => number;
  addToCart: (item: any) => void;
  updateQuantity: (id: string, quantity: number) => void;
  cart: any[];
}

export function POSMenuGrid({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  searchQuery,
  setSearchQuery,
  filteredItems,
  getItemQty,
  addToCart,
  updateQuantity,
  cart,
}: POSMenuGridProps) {
  const handleItemClick = (item: any) => {
    const qty = getItemQty(item.id);
    if (qty === 0) {
      addToCart({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
      });
    }
  };

  const handleQtyDecrement = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const qty = getItemQty(item.id);
    const cartItem = cart.find((i) => i.menuItemId === item.id);
    if (cartItem) {
      updateQuantity(cartItem.id, qty - 1);
    }
  };

  const handleQtyIncrement = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const qty = getItemQty(item.id);
    const cartItem = cart.find((i) => i.menuItemId === item.id);
    if (cartItem) {
      updateQuantity(cartItem.id, qty + 1);
    } else {
      addToCart({
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
      });
    }
  };

  return (
    <div className="xl:col-span-7 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex flex-col h-[385px] justify-between shadow-xl">
      {/* Category tabs & Search bar row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3.5">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedCategoryId === 'all'
                ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-[#f59e0b]/15'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCategoryId === cat.id
                  ? 'bg-[#f59e0b] text-slate-950 shadow-md shadow-[#f59e0b]/15'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* mini Search input */}
        <div className="relative w-full sm:w-44 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1e293b] bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-[#f59e0b] transition"
          />
        </div>
      </div>

      {/* Grid lists */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const qtyInCart = getItemQty(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#1e293b]/60 bg-[#0f1524] p-2.5 transition duration-150 hover:border-[#f59e0b]/40 hover:-translate-y-0.5 cursor-pointer shadow-md"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-16 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-full items-center justify-center rounded-lg bg-slate-800 text-[10px] text-slate-600 font-bold">
                  No Image
                </div>
              )}

              <div className="mt-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11.5px] font-bold text-white group-hover:text-[#f59e0b] transition leading-tight truncate">
                    {item.name}
                  </h4>
                  <p className="text-[10px] font-black text-[#f59e0b] mt-1">${parseFloat(item.price).toFixed(2)}</p>
                </div>

                {qtyInCart === 0 ? (
                  <div className="flex items-center justify-between mt-2.5 bg-slate-950/40 p-1 rounded-md border border-slate-900">
                    <button
                      disabled
                      className="p-0.5 text-slate-600 cursor-not-allowed"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] font-extrabold text-slate-600">0</span>
                    <button
                      onClick={(e) => handleQtyIncrement(e, item)}
                      className="p-0.5 text-[#f59e0b] hover:text-white transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2.5 bg-[#f59e0b]/10 p-1 rounded-md border border-[#f59e0b]/30">
                    <button
                      onClick={(e) => handleQtyDecrement(e, item)}
                      className="p-0.5 text-[#f59e0b] hover:text-white transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] font-extrabold text-white">{qtyInCart}</span>
                    <button
                      onClick={(e) => handleQtyIncrement(e, item)}
                      className="p-0.5 text-[#f59e0b] hover:text-white transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
