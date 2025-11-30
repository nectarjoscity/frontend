'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMenuItemsQuery,
  useLazyGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetInventoryItemsQuery,
  useGetMenuItemIngredientsQuery,
  useAddMenuItemIngredientMutation,
  useRemoveMenuItemIngredientMutation,
} from '../../../services/api';
import { IoAdd, IoCreateOutline, IoTrashOutline, IoSearchOutline, IoCloudUploadOutline, IoCloudDownloadOutline, IoSwapVerticalOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoEllipsisVerticalOutline, IoImageOutline, IoReloadOutline, IoWarningOutline } from 'react-icons/io5';

export default function CatalogManagementPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const { data: categories = [] } = useGetCategoriesQuery({ active: true });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const activeCategory = useMemo(() => categories.find(c => c._id === selectedCategoryId) || null, [categories, selectedCategoryId]);
  const { data: items = [] } = useGetMenuItemsQuery({ category: selectedCategoryId, active: true });

  // Auto-select first category on mount
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0]._id);
    }
  }, [categories, selectedCategoryId]);

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [triggerGetMenuItems] = useLazyGetMenuItemsQuery();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();

  const [catModal, setCatModal] = useState({ open: false, editing: null });
  const [itemModal, setItemModal] = useState({ open: false, editing: null });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [itemImagePreview, setItemImagePreview] = useState(null);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [imageColors, setImageColors] = useState({}); // Store dominant colors for each item
  const [showIngredients, setShowIngredients] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ inventoryItemId: '', quantity: '', unit: '' });
  
  // Inventory and ingredients queries
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();
  const { data: menuItemIngredients = [], refetch: refetchIngredients } = useGetMenuItemIngredientsQuery(
    itemModal.editing?._id || null,
    { skip: !itemModal.editing?._id }
  );
  const [addIngredient] = useAddMenuItemIngredientMutation();
  const [removeIngredient] = useRemoveMenuItemIngredientMutation();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  // Reset image preview when modal opens/closes
  useEffect(() => {
    if (!itemModal.open) {
      setItemImagePreview(null);
      setItemImageFile(null);
    } else if (itemModal.editing?.imageUrl && !itemImagePreview) {
      // Set preview to existing image when editing
      setItemImagePreview(itemModal.editing.imageUrl);
    }
  }, [itemModal.open, itemModal.editing]);

  // Category form submit
  const saveCategory = async (e) => {
    e.preventDefault();
    if (isSavingCategory) return; // Prevent double submission
    
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name')?.toString().trim(),
      description: form.get('description')?.toString().trim(),
      emoji: form.get('emoji')?.toString().trim() || '🥗',
      isActive: true,
    };
    if (!payload.name) return;
    
    setIsSavingCategory(true);
    try {
      if (catModal.editing) {
        await updateCategory({ id: catModal.editing._id, ...payload }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      setCatModal({ open: false, editing: null });
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error?.data?.message || 'Failed to save category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Item form submit
  const saveItem = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId || isSavingItem) return; // Prevent double submission
    
    const form = new FormData(e.currentTarget);
    
    // Create FormData for file upload if image is selected
    const formData = new FormData();
    formData.append('name', form.get('name')?.toString().trim() || '');
    formData.append('description', form.get('description')?.toString().trim() || '');
    formData.append('emoji', form.get('emoji')?.toString().trim() || '🍲');
    formData.append('price', parseFloat(form.get('price')) || 0);
    formData.append('category', selectedCategoryId);
    formData.append('isActive', 'true');
    formData.append('isAvailable', form.get('isAvailable') === 'on' || form.get('isAvailable') === 'true' ? 'true' : 'false');
    
    // Add image file if selected
    if (itemImageFile) {
      formData.append('image', itemImageFile);
    } else if (itemModal.editing?.imageUrl && !itemImagePreview) {
      // Keep existing image if no new file selected
      formData.append('imageUrl', itemModal.editing.imageUrl);
    }
    
    const name = formData.get('name');
    const price = parseFloat(formData.get('price'));
    if (!name || Number.isNaN(price)) return;
    
    setIsSavingItem(true);
    try {
      if (itemModal.editing) {
        await updateMenuItem({ id: itemModal.editing._id, body: formData }).unwrap();
      } else {
        await createMenuItem(formData).unwrap();
      }
      setItemModal({ open: false, editing: null });
      setItemImagePreview(null);
      setItemImageFile(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert(error?.data?.message || 'Failed to save item');
    } finally {
      setIsSavingItem(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => (i.name || '').toLowerCase().includes(q));
  }, [items, search]);

  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    if (sortBy === 'price-asc') arr.sort((a,b)=> Number(a.price||0) - Number(b.price||0));
    else if (sortBy === 'price-desc') arr.sort((a,b)=> Number(b.price||0) - Number(a.price||0));
    else if (sortBy === 'name') arr.sort((a,b)=> String(a.name||'').localeCompare(String(b.name||'')));
    else arr.sort((a,b)=> new Date(b.updatedAt||b.createdAt||0) - new Date(a.updatedAt||a.createdAt||0));
    return arr;
  }, [filteredItems, sortBy]);

  // Extract dominant color from image
  const extractDominantColor = (imageUrl, itemId) => {
    if (!imageUrl || imageColors[itemId]) return; // Skip if already processed
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Sample pixels from the image (sample every 10th pixel for performance)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const colorCounts = {};
        
        // Sample pixels to get dominant color
        for (let i = 0; i < pixels.length; i += 40) { // Sample every 10th pixel (RGBA = 4 bytes)
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Quantize colors to reduce variations
          const quantizedR = Math.floor(r / 32) * 32;
          const quantizedG = Math.floor(g / 32) * 32;
          const quantizedB = Math.floor(b / 32) * 32;
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
        
        // Find the most common color
        let maxCount = 0;
        let dominantColor = null;
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = color;
          }
        }
        
        if (dominantColor) {
          const [r, g, b] = dominantColor.split(',').map(Number);
          // Lighten the color slightly for better contrast
          const lightenedR = Math.min(255, r + 20);
          const lightenedG = Math.min(255, g + 20);
          const lightenedB = Math.min(255, b + 20);
          const color = `rgb(${lightenedR}, ${lightenedG}, ${lightenedB})`;
          
          setImageColors(prev => ({ ...prev, [itemId]: color }));
        }
      } catch (error) {
        console.error('Error extracting color:', error);
      }
    };
    img.onerror = () => {
      console.error('Error loading image:', imageUrl);
    };
    img.src = imageUrl;
  };

  // Extract colors when items change
  useEffect(() => {
    sortedItems.forEach(item => {
      if (item.imageUrl && !imageColors[item._id]) {
        extractDominantColor(item.imageUrl, item._id);
      }
    });
  }, [sortedItems]);

  return (
    <AdminLayout title="Catalog" active="catalog" requiredPermission="catalog">
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Categories</div>
            <div className="text-4xl font-extrabold" style={{ color: '#fff' }}>{categories.length}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Items in View</div>
            <div className="text-4xl font-extrabold" style={{ color: colors.text }}>{selectedCategoryId ? sortedItems.length : 0}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Quick Actions</div>
            <div className="flex gap-2 mt-2">
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }}>
                <IoCloudUploadOutline className="h-5 w-5" /> Import
              </button>
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: colors.green500, color: '#fff' }}>
                <IoCloudDownloadOutline className="h-5 w-5" /> Export
              </button>
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Sort By</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <IoSwapVerticalOutline className="h-5 w-5" style={{ color: colors.mutedText }} />
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}>
                <option value="newest">Newest</option>
                <option value="name">Name</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>
          {/* Categories */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold" style={{ color: colors.text }}>Categories</div>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-base font-semibold transition-transform hover:scale-105" style={{ background: colors.green500, color: '#fff' }} onClick={()=> setCatModal({ open: true, editing: null })}>
                  <IoAdd className="h-5 w-5" /> New
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {categories.map((c)=> (
                  <button key={c._id} onClick={()=> setSelectedCategoryId(c._id)} className={`w-full p-3 rounded-xl flex items-center justify-between transition-all hover:scale-[1.02] ${selectedCategoryId===c._id ? 'ring-2' : ''}`} style={{ background: selectedCategoryId===c._id ? (theme==='light'?'#FFF7ED':'#3A2A1A') : colors.background, border: `1px solid ${selectedCategoryId===c._id ? colors.amber500 : colors.cardBorder}`, boxShadow: selectedCategoryId===c._id ? (theme==='light' ? '0 4px 12px rgba(251,146,60,0.2)' : '0 4px 12px rgba(251,146,60,0.3)') : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl" style={{ background: selectedCategoryId===c._id ? (theme==='light'?'#FFEDD5':'#3A2A1A') : (theme==='light'?'#F3F4F6':'#1F2937') }}>{c.emoji}</div>
                      <div>
                        <div className="font-semibold text-base" style={{ color: colors.text }}>{c.name}</div>
                        <div className="text-sm" style={{ color: colors.mutedText }}>{c.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg transition-transform hover:scale-110" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }} onClick={(e)=>{e.stopPropagation(); setCatModal({ open:true, editing: c });}}><IoCreateOutline className="h-4 w-4" /></button>
                      <button className="p-2 rounded-lg transition-transform hover:scale-110" style={{ background: theme==='light'?'#FEF2F2':'#3A2020', color: '#DC2626' }} onClick={async (e)=>{
                        e.stopPropagation();
                        
                        // Check if category has items
                        try {
                          const { data: categoryItems } = await triggerGetMenuItems({ category: c._id, active: true });
                          
                          if (categoryItems && categoryItems.length > 0) {
                            alert(`Cannot delete "${c.name}" because it contains ${categoryItems.length} item(s).\n\nPlease delete all items in this category first.`);
                            return;
                          }
                          
                          if (window.confirm(`Delete category "${c.name}"?`)) {
                            try {
                              await deleteCategory({ id: c._id }).unwrap();
                            } catch (error) {
                              console.error('Failed to delete category:', error);
                              alert(`Failed to delete: ${error?.data?.message || error.message}`);
                            }
                          }
                        } catch (error) {
                          console.error('Failed to check category items:', error);
                          alert('Failed to verify if category can be deleted. Please try again.');
                        }
                      }}><IoTrashOutline className="h-4 w-4" /></button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold" style={{ color: colors.text }}>Menu Items {activeCategory ? <span className="text-base font-medium ml-2 px-2 py-1 rounded-full" style={{ background: theme==='light'?'#FFF7ED':'#3A2A1A', color: colors.amber500 }}>({activeCategory.name})</span> : ''}</div>
                <button disabled={!selectedCategoryId} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-base font-semibold disabled:opacity-50 transition-transform hover:scale-105" style={{ background: colors.green500, color: '#fff' }} onClick={()=> setItemModal({ open: true, editing: null })}>
                  <IoAdd className="h-5 w-5" /> New Item
                </button>
              </div>
              {!selectedCategoryId ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4" style={{ background: theme==='light'?'#F3F4F6':'#1F2937' }}>
                    <IoImageOutline className="h-10 w-10" style={{ color: colors.mutedText }} />
                  </div>
                  <div className="text-base font-medium mb-1" style={{ color: colors.text }}>No Category Selected</div>
                  <div className="text-sm" style={{ color: colors.mutedText }}>Select a category from the left to view and manage items.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedItems.map((i)=> (
                    <div key={i._id} className="p-0 rounded-2xl overflow-hidden transition-all hover:scale-[1.02]" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 2px 8px rgba(16,24,40,0.04)' : '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <div className="h-32 flex items-center justify-center text-5xl relative overflow-hidden" style={{ background: theme==='light'?'#F9FAFB':'#0B1220', borderBottom: `1px solid ${colors.cardBorder}`, opacity: i.isAvailable === false ? 0.6 : 1 }}>
                        {i.imageUrl ? (
                          <img src={i.imageUrl} alt={i.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{i.emoji || '🍽️'}</span>
                        )}
                        {i.isAvailable === false && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="px-3 py-1 rounded-lg text-sm font-bold text-white bg-red-600">Out of Stock</span>
                          </div>
                        )}
                        <button className="absolute top-2 right-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}><IoEllipsisVerticalOutline className="h-4 w-4" /></button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-bold text-base" style={{ color: colors.text }}>{i.name}</div>
                          <span className="text-sm px-2 py-1 rounded-full font-semibold" style={{ background: theme==='light'?'#ECFDF5':'#052e21', color: colors.green700 || '#047857' }}>₦{Number(i.price).toFixed(2)}</span>
                        </div>
                        <div className="text-sm mb-3 line-clamp-2" style={{ color: colors.mutedText }}>{i.description}</div>
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const formData = new FormData();
                                  formData.append('isAvailable', (!i.isAvailable).toString());
                                  await updateMenuItem({ id: i._id, body: formData }).unwrap();
                                } catch (error) {
                                  alert('Failed to update availability: ' + (error?.data?.message || error.message));
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                i.isAvailable !== false
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {i.isAvailable !== false ? (
                                <>
                                  <IoCheckmarkCircleOutline className="h-3 w-3 inline mr-1" />
                                  Available
                                </>
                              ) : (
                                <>
                                  <IoCloseCircleOutline className="h-3 w-3 inline mr-1" />
                                  Out of Stock
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg transition-transform hover:scale-110" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setItemModal({ open:true, editing: i })}><IoCreateOutline className="h-4 w-4" /></button>
                            <button className="p-2 rounded-lg transition-transform hover:scale-110" style={{ background: theme==='light'?'#FEF2F2':'#3A2020', color: '#DC2626' }} onClick={async ()=> {
                              if (window.confirm(`Delete "${i.name}"?`)) {
                                try {
                                  console.log('Deleting item:', i._id, 'from category:', selectedCategoryId);
                                  const result = await deleteMenuItem({ id: i._id, category: selectedCategoryId }).unwrap();
                                  console.log('Menu item deleted successfully:', result);
                                } catch (error) {
                                  console.error('Failed to delete menu item:', error);
                                  alert(`Failed to delete: ${error?.data?.message || error.message || 'Unknown error'}`);
                                }
                              }
                            }}><IoTrashOutline className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Category Modal */}
        {catModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={()=> setCatModal({ open:false, editing:null })}>
            <div className="w-full max-w-md mx-3 rounded-2xl shadow-2xl animate-in" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }} onClick={(e)=> e.stopPropagation()}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                <div className="text-xl font-bold" style={{ color: colors.text }}>{catModal.editing ? 'Edit Category' : 'New Category'}</div>
                <button className="p-2 rounded-lg" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setCatModal({ open:false, editing:null })}><IoCloseCircleOutline className="h-6 w-6" /></button>
              </div>
              <form onSubmit={saveCategory} className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Category Name</label>
                  <input name="name" defaultValue={catModal.editing?.name || ''} placeholder="e.g., Appetizers" className="w-full rounded-lg px-4 py-3 text-base font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Emoji Icon</label>
                  <input name="emoji" defaultValue={catModal.editing?.emoji || '🥗'} placeholder="🥗" className="w-full rounded-lg px-4 py-3 text-base font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Description</label>
                  <textarea name="description" defaultValue={catModal.editing?.description || ''} placeholder="Brief description..." rows={3} className="w-full rounded-lg px-4 py-3 text-base" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg font-medium" 
                    style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} 
                    onClick={()=> setCatModal({ open:false, editing:null })}
                    disabled={isSavingCategory}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ background: colors.green500, color: '#fff' }}
                    disabled={isSavingCategory}
                  >
                    {isSavingCategory ? (
                      <>
                        <IoReloadOutline className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Category'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {itemModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={()=> {
            setItemModal({ open:false, editing:null });
            setItemImagePreview(null);
            setItemImageFile(null);
          }}>
            <div className="w-full max-w-md mx-3 rounded-2xl shadow-2xl animate-in max-h-[90vh] overflow-y-auto" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }} onClick={(e)=> e.stopPropagation()}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                <div className="text-xl font-bold" style={{ color: colors.text }}>{itemModal.editing ? 'Edit Menu Item' : 'New Menu Item'}</div>
                <button className="p-2 rounded-lg" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> {
                  setItemModal({ open:false, editing:null });
                  setItemImagePreview(null);
                  setItemImageFile(null);
                }}><IoCloseCircleOutline className="h-6 w-6" /></button>
              </div>
              <form onSubmit={saveItem} className="p-5 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Item Image</label>
                  <div className="space-y-2">
                    {(itemImagePreview || itemModal.editing?.imageUrl) && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.cardBorder}` }}>
                        <img 
                          src={itemImagePreview || itemModal.editing?.imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setItemImagePreview(null);
                            setItemImageFile(null);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                        >
                          <IoCloseCircleOutline className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}>
                      <IoImageOutline className="h-6 w-6" />
                      <span className="text-base font-medium">{(itemImagePreview || itemModal.editing?.imageUrl) ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm" style={{ color: colors.mutedText }}>Max size: 5MB. JPG, PNG, or GIF.</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Item Name</label>
                  <input name="name" defaultValue={itemModal.editing?.name || ''} placeholder="e.g., Caesar Salad" className="w-full rounded-lg px-4 py-3 text-base font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Emoji Icon</label>
                    <input name="emoji" defaultValue={itemModal.editing?.emoji || '🍲'} placeholder="🍲" className="w-full rounded-lg px-4 py-3 text-base font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Price (₦)</label>
                    <input name="price" type="number" step="0.01" defaultValue={itemModal.editing?.price || ''} placeholder="0.00" className="w-full rounded-lg px-4 py-3 text-base font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors.mutedText }}>Description</label>
                  <textarea name="description" defaultValue={itemModal.editing?.description || ''} placeholder="Brief description..." rows={3} className="w-full rounded-lg px-4 py-3 text-base" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                
                {/* Availability Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937', border: `1px solid ${colors.cardBorder}` }}>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    id="isAvailable"
                    defaultChecked={itemModal.editing?.isAvailable !== false}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: colors.green500 }}
                  />
                  <label htmlFor="isAvailable" className="text-base font-medium cursor-pointer" style={{ color: colors.text }}>
                    Item is Available
                  </label>
                  <span className="text-sm ml-auto" style={{ color: colors.mutedText }}>
                    {itemModal.editing?.isAvailable === false ? 'Currently Out of Stock' : 'In Stock'}
                  </span>
                </div>
                
                {/* Ingredients Section - Only show when editing existing item */}
                {itemModal.editing?._id && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold" style={{ color: colors.mutedText }}>Ingredients</label>
                      <button
                        type="button"
                        onClick={() => setShowIngredients(!showIngredients)}
                        className="text-sm font-medium px-3 py-1 rounded-lg"
                        style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                      >
                        {showIngredients ? 'Hide' : 'Manage'}
                      </button>
                    </div>
                    
                    {showIngredients && (
                      <div className="space-y-3 p-3 rounded-lg" style={{ background: theme === 'light' ? '#F9FAFB' : '#1F2937', border: `1px solid ${colors.cardBorder}` }}>
                        {/* Existing Ingredients */}
                        <div className="space-y-2">
                          {menuItemIngredients.map((ing) => {
                            const invItem = inventoryItems.find(i => i._id === ing.inventoryItem?._id || i._id === ing.inventoryItem);
                            const isLowStock = invItem && invItem.currentStock <= invItem.minStock;
                            return (
                              <div key={ing._id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium" style={{ color: colors.text }}>
                                      {invItem?.name || 'Unknown Item'}
                                    </span>
                                    {isLowStock && (
                                      <IoWarningOutline className="h-4 w-4" style={{ color: colors.amber600 }} />
                                    )}
                                  </div>
                                  <span className="text-sm" style={{ color: colors.mutedText }}>
                                    {ing.quantity} {ing.unit}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Remove this ingredient?')) {
                                      try {
                                        await removeIngredient(ing._id).unwrap();
                                        refetchIngredients();
                                      } catch (error) {
                                        alert('Error removing ingredient: ' + (error.data?.message || error.message));
                                      }
                                    }
                                  }}
                                  className="p-1 rounded"
                                  style={{ color: colors.red600 }}
                                >
                                  <IoTrashOutline className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Add New Ingredient */}
                        <div className="pt-2 border-t" style={{ borderColor: colors.cardBorder }}>
                          <div className="space-y-2">
                            <select
                              value={newIngredient.inventoryItemId}
                              onChange={(e) => {
                                const selected = inventoryItems.find(i => i._id === e.target.value);
                                setNewIngredient({
                                  ...newIngredient,
                                  inventoryItemId: e.target.value,
                                  unit: selected?.unit || ''
                                });
                              }}
                              className="w-full rounded-lg px-3 py-2 text-sm"
                              style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                            >
                              <option value="">Select inventory item...</option>
                              {inventoryItems.filter(i => i.isActive).map(item => (
                                <option key={item._id} value={item._id}>
                                  {item.name} ({item.unit})
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Quantity"
                                value={newIngredient.quantity}
                                onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                              />
                              <input
                                type="text"
                                placeholder="Unit"
                                value={newIngredient.unit}
                                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newIngredient.inventoryItemId || !newIngredient.quantity) {
                                  alert('Please select an item and enter quantity');
                                  return;
                                }
                                try {
                                  await addIngredient({
                                    menuItemId: itemModal.editing._id,
                                    inventoryItemId: newIngredient.inventoryItemId,
                                    quantity: parseFloat(newIngredient.quantity),
                                    unit: newIngredient.unit
                                  }).unwrap();
                                  setNewIngredient({ inventoryItemId: '', quantity: '', unit: '' });
                                  refetchIngredients();
                                } catch (error) {
                                  alert('Error adding ingredient: ' + (error.data?.message || error.message));
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-white"
                              style={{ background: colors.blue600 }}
                            >
                              <IoAdd className="h-4 w-4 inline mr-1" />
                              Add Ingredient
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg font-medium" 
                    style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} 
                    onClick={()=> {
                      setItemModal({ open:false, editing:null });
                      setItemImagePreview(null);
                      setItemImageFile(null);
                    }}
                    disabled={isSavingItem}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ background: colors.green500, color: '#fff' }}
                    disabled={isSavingItem}
                  >
                    {isSavingItem ? (
                      <>
                        <IoReloadOutline className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Item'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}

