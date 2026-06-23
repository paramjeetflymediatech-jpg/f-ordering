import React from 'react';
import { Search, Plus, Minus, X, Check, Utensils } from 'lucide-react';

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
  // Custom states for customization modal
  const [customizingItem, setCustomizingItem] = React.useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = React.useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = React.useState<any[]>([]);
  const [customQuantity, setCustomQuantity] = React.useState<number>(1);
  const [specialNotes, setSpecialNotes] = React.useState<string>('');

  const hasCustomization = (item: any) => {
    return (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0);
  };

  const handleItemClick = (item: any) => {
    if (hasCustomization(item)) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
      setSelectedAddons([]);
      setCustomQuantity(1);
      setSpecialNotes('');
    } else {
      const qty = getItemQty(item.id);
      if (qty === 0) {
        addToCart({
          menuItemId: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: 1,
        });
      }
    }
  };

  const handleQtyDecrement = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (hasCustomization(item)) {
      // Find the last added matching cart item of this menu item type
      const matchingItems = cart.filter((i) => i.menuItemId === item.id);
      if (matchingItems.length > 0) {
        const lastItem = matchingItems[matchingItems.length - 1];
        updateQuantity(lastItem.id, lastItem.quantity - 1);
      }
    } else {
      const qty = getItemQty(item.id);
      const cartItem = cart.find((i) => i.menuItemId === item.id);
      if (cartItem) {
        updateQuantity(cartItem.id, qty - 1);
      }
    }
  };

  const handleQtyIncrement = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (hasCustomization(item)) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
      setSelectedAddons([]);
      setCustomQuantity(1);
      setSpecialNotes('');
    } else {
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
    }
  };

  const handleToggleAddon = (addon: any) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddCustomToCart = () => {
    if (!customizingItem) return;

    let finalUnitPrice = parseFloat(customizingItem.price);
    if (selectedVariant) {
      finalUnitPrice += parseFloat(selectedVariant.additional_price || 0);
    }
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0);
    finalUnitPrice += addonPrice;

    // Suffix variant name to the cart item name for display if variant exists
    const cartName = selectedVariant 
      ? `${customizingItem.name} (${selectedVariant.name})` 
      : customizingItem.name;

    addToCart({
      menuItemId: customizingItem.id,
      name: cartName,
      price: finalUnitPrice,
      quantity: customQuantity,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        additional_price: parseFloat(selectedVariant.additional_price)
      } : undefined,
      addons: selectedAddons.map(a => ({
        id: a.id,
        name: a.name,
        price: parseFloat(a.price)
      })),
      notes: specialNotes || undefined,
    });

    setCustomizingItem(null);
  };

  const getCustomizingTotalPrice = () => {
    if (!customizingItem) return 0;
    let price = parseFloat(customizingItem.price);
    if (selectedVariant) {
      price += parseFloat(selectedVariant.additional_price || 0);
    }
    price += selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    return price * customQuantity;
  };

  const getItemQtyAggregated = (itemId: string) => {
    return cart
      .filter((item) => item.menuItemId === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <>
      <div className="w-full rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-6 flex flex-col min-h-[calc(100vh-180px)] justify-between shadow-xl">
        {/* Category tabs & Search bar row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3.5">
          <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap gap-1.5 max-w-full pb-1.5">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5 flex-1 overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const qtyInCart = getItemQtyAggregated(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-b from-[#0e1422]/90 to-[#070b13]/95 p-4.5 transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer h-[340px]"
              >
                {/* Image / Icon container */}
                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-650">
                      <Utensils className="h-8 w-8 opacity-45 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-45">
                        {item.categoryName || 'Dishes'}
                      </span>
                    </div>
                  )}
                  
                  {/* Category overlay */}
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-900/60 text-[9.5px] font-bold text-slate-400 shadow-sm">
                    {item.categoryName || 'Menu'}
                  </div>

                  {/* Customization label overlay if present */}
                  {hasCustomization(item) && (
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-[#f59e0b] text-slate-950 text-[9.5px] font-black uppercase tracking-wider shadow-sm">
                      Custom
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="mt-3 flex-1 flex flex-col justify-between min-h-0">
                  <div className="space-y-1">
                    <h4 className="text-[14px] sm:text-[15px] font-black text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-1">
                      {item.name}
                    </h4>
                    {item.description ? (
                      <p className="text-[11.5px] sm:text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-[11.5px] text-slate-650 italic">
                        Delicious signature dish.
                      </p>
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div className="space-y-2.5 mt-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm sm:text-[15px] font-black text-amber-400">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-[9.5px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          {item.variants.length} options
                        </span>
                      )}
                    </div>

                    {/* Add Button or Stepper */}
                    <div>
                      {qtyInCart === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-[#f59e0b] hover:text-slate-950 hover:border-transparent transition-all duration-300 font-extrabold text-[12px] text-slate-200 group-hover:border-amber-500/25"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 p-0.5 rounded-xl shadow-inner shadow-black/10">
                          <button
                            type="button"
                            onClick={(e) => handleQtyDecrement(e, item)}
                            className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[#f59e0b] active:scale-95 transition-all"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[12.5px] font-black text-white px-2">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQtyIncrement(e, item)}
                            className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[#f59e0b] active:scale-95 transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOMIZATION DIALOG MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0c101b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#1e293b] p-4 bg-slate-950/40">
              <div>
                <h3 className="text-base font-black text-white">
                  Customize {customizingItem.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Base Price: ${parseFloat(customizingItem.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto pr-2">
              
              {/* Optional image display if any */}
              {customizingItem.image_url && (
                <img
                  src={customizingItem.image_url}
                  alt={customizingItem.name}
                  className="h-28 w-full rounded-xl object-cover border border-[#1e293b]/60"
                />
              )}

              {/* Sizes / Variants Selection */}
              {customizingItem.variants && customizingItem.variants.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Choose Size / Variant
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {customizingItem.variants.map((v: any) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition duration-150 ${
                            isSelected
                              ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-white shadow-md shadow-[#f59e0b]/5'
                              : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{v.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#f59e0b]" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                            +{parseFloat(v.additional_price) === 0 ? 'Free' : `$${parseFloat(v.additional_price).toFixed(2)}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Addons Selection */}
              {customizingItem.addons && customizingItem.addons.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Select Add-ons (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customizingItem.addons.map((addon: any) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition duration-150 ${
                            isSelected
                              ? 'border-[#f59e0b] bg-[#f59e0b]/5 text-white shadow-sm'
                              : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900/50'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-[#f59e0b]' : 'text-slate-500'}`}>
                            +${parseFloat(addon.price).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Notes input */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Special Notes / Request
                </label>
                <textarea
                  placeholder="e.g. Extra spicy, sauce on the side, well-done..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white h-16 outline-none resize-none focus:border-[#f59e0b] transition"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-1 text-sm border border-[#1e293b]/60 transition"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-white min-w-[20px] text-center">
                    {customQuantity}
                  </span>
                  <button
                    onClick={() => setCustomQuantity(customQuantity + 1)}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-1 text-sm border border-[#1e293b]/60 transition"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1e293b] bg-slate-950/40 flex gap-3">
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-1/3 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomToCart}
                className="w-2/3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#f59e0b]/90 hover:to-[#ea580c]/90 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-[#f59e0b]/10 transition flex justify-center items-center gap-1"
              >
                Add to Order • ${getCustomizingTotalPrice().toFixed(2)}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
