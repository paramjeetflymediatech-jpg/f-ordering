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
      <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-6 flex flex-col min-h-[calc(100vh-180px)] justify-between shadow-xl animate-fade-in">
        {/* Category tabs & Search bar row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap gap-2 max-w-full pb-1.5">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 shrink-0 ${
                selectedCategoryId === 'all'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/20 border border-orange-500/20'
                  : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 shrink-0 ${
                  selectedCategoryId === cat.id
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/20 border border-orange-500/20'
                    : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* mini Search input */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 shadow-inner placeholder:text-slate-605"
            />
          </div>
        </div>

        {/* Grid lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const qtyInCart = getItemQtyAggregated(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/30 to-slate-955/80 p-4 transition-all duration-300 hover:border-orange-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 cursor-pointer h-[350px]"
              >
                {/* Image / Icon container */}
                <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800/40">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900/60 to-slate-950 text-slate-500">
                      <div className="p-3 rounded-full bg-slate-950/60 border border-slate-850/50 text-orange-500/60 group-hover:text-orange-400/80 group-hover:scale-105 transition-all duration-300">
                        <Utensils className="h-6 w-6" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 mt-2">
                        {item.categoryName || 'Dishes'}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay on Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-955/50 via-transparent to-transparent opacity-60 pointer-events-none" />
                                    {/* Overlay badges (Category + Customization indicator) */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center gap-2 pointer-events-none select-none">
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/60 text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[60%] shadow-md">
                      {item.categoryName || 'Menu'}
                    </div>
                    {hasCustomization(item) && (
                      <div className="px-2.5 py-0.5 rounded-full bg-orange-600/90 border border-orange-500/30 text-[9px] font-black uppercase tracking-wider shadow-lg shadow-orange-600/10 text-white shrink-0">
                        Custom
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="mt-3.5 flex-1 flex flex-col justify-between min-h-0">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors leading-snug truncate">
                      {item.name}
                    </h4>
                    {item.description ? (
                      <p className="text-xs text-slate-400/90 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        Delicious signature dish.
                      </p>
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-extrabold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-[9.5px] font-bold text-slate-400 bg-slate-900 border border-slate-800/60 px-2.5 py-0.5 rounded-full">
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
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-orange-600/20 active:scale-[0.98] transition-all duration-300 font-bold text-xs text-slate-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-950/60 border border-orange-500/20 p-0.5 rounded-xl shadow-inner shadow-black/10">
                          <button
                            type="button"
                            onClick={(e) => handleQtyDecrement(e, item)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-orange-400 active:scale-95 transition-all"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-black text-white px-2">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQtyIncrement(e, item)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-orange-400 active:scale-95 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 p-4 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Customize {customizingItem.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Base Price: ${parseFloat(customizingItem.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-5 overflow-y-auto pr-2">
              
              {/* Optional image display if any */}
              {customizingItem.image_url && (
                <img
                  src={customizingItem.image_url}
                  alt={customizingItem.name}
                  className="h-28 w-full rounded-xl object-cover border border-slate-800/80"
                />
              )}

              {/* Sizes / Variants Selection */}
              {customizingItem.variants && customizingItem.variants.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Choose Size / Variant
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {customizingItem.variants.map((v: any) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all duration-155 ${
                            isSelected
                              ? 'border-orange-500 bg-gradient-to-br from-orange-600/10 to-amber-500/10 text-white shadow-lg shadow-orange-550/5'
                              : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{v.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-orange-500" />}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customizingItem.addons.map((addon: any) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all duration-155 ${
                            isSelected
                              ? 'border-orange-500 bg-gradient-to-br from-orange-600/5 to-amber-500/5 text-white shadow-sm'
                              : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-400' : 'text-slate-550'}`}>
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
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-955 px-3.5 py-2.5 text-xs text-slate-200 h-16 outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition placeholder:text-slate-650"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                    className="rounded-lg bg-slate-955 hover:bg-slate-900 text-slate-300 font-bold px-3 py-1 text-sm border border-slate-800 transition"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-white min-w-[20px] text-center">
                    {customQuantity}
                  </span>
                  <button
                    onClick={() => setCustomQuantity(customQuantity + 1)}
                    className="rounded-lg bg-slate-955 hover:bg-slate-900 text-slate-300 font-bold px-3 py-1 text-sm border border-slate-800 transition"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3">
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-1/3 rounded-xl bg-slate-955 border border-slate-800 py-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomToCart}
                className="w-2/3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 py-3 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-1"
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
