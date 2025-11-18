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
} from '../../../services/api';
import { IoAdd, IoCreateOutline, IoTrashOutline, IoSearchOutline, IoCloudUploadOutline, IoCloudDownloadOutline, IoSwapVerticalOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoEllipsisVerticalOutline, IoImageOutline } from 'react-icons/io5';

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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  // Category form submit
  const saveCategory = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name')?.toString().trim(),
      description: form.get('description')?.toString().trim(),
      emoji: form.get('emoji')?.toString().trim() || '🥗',
      isActive: true,
    };
    if (!payload.name) return;
    if (catModal.editing) await updateCategory({ id: catModal.editing._id, ...payload }).unwrap();
    else await createCategory(payload).unwrap();
    setCatModal({ open: false, editing: null });
  };

  // Item form submit
  const saveItem = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name')?.toString().trim(),
      description: form.get('description')?.toString().trim(),
      emoji: form.get('emoji')?.toString().trim() || '🍲',
      price: parseFloat(form.get('price')), 
      category: selectedCategoryId,
      isActive: true,
      isAvailable: true,
    };
    if (!payload.name || Number.isNaN(payload.price)) return;
    if (itemModal.editing) await updateMenuItem({ id: itemModal.editing._id, ...payload }).unwrap();
    else await createMenuItem(payload).unwrap();
    setItemModal({ open: false, editing: null });
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

  return (
    <AdminLayout title="Catalog" active="catalog">
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick stats */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Categories</div>
            <div className="text-3xl font-extrabold" style={{ color: '#fff' }}>{categories.length}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Items in View</div>
            <div className="text-3xl font-extrabold" style={{ color: colors.text }}>{selectedCategoryId ? sortedItems.length : 0}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Quick Actions</div>
            <div className="flex gap-2 mt-2">
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }}>
                <IoCloudUploadOutline className="h-4 w-4" /> Import
              </button>
              <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: colors.green500, color: '#fff' }}>
                <IoCloudDownloadOutline className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>Sort By</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <IoSwapVerticalOutline className="h-4 w-4" style={{ color: colors.mutedText }} />
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}>
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
                <div className="text-base font-bold" style={{ color: colors.text }}>Categories</div>
                <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-105" style={{ background: colors.green500, color: '#fff' }} onClick={()=> setCatModal({ open: true, editing: null })}>
                  <IoAdd className="h-4 w-4" /> New
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {categories.map((c)=> (
                  <button key={c._id} onClick={()=> setSelectedCategoryId(c._id)} className={`w-full p-3 rounded-xl flex items-center justify-between transition-all hover:scale-[1.02] ${selectedCategoryId===c._id ? 'ring-2' : ''}`} style={{ background: selectedCategoryId===c._id ? (theme==='light'?'#FFF7ED':'#3A2A1A') : colors.background, border: `1px solid ${selectedCategoryId===c._id ? colors.amber500 : colors.cardBorder}`, boxShadow: selectedCategoryId===c._id ? (theme==='light' ? '0 4px 12px rgba(251,146,60,0.2)' : '0 4px 12px rgba(251,146,60,0.3)') : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl" style={{ background: selectedCategoryId===c._id ? (theme==='light'?'#FFEDD5':'#3A2A1A') : (theme==='light'?'#F3F4F6':'#1F2937') }}>{c.emoji}</div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: colors.text }}>{c.name}</div>
                        <div className="text-xs" style={{ color: colors.mutedText }}>{c.description}</div>
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
                <div className="text-base font-bold" style={{ color: colors.text }}>Menu Items {activeCategory ? <span className="text-sm font-medium ml-2 px-2 py-1 rounded-full" style={{ background: theme==='light'?'#FFF7ED':'#3A2A1A', color: colors.amber500 }}>({activeCategory.name})</span> : ''}</div>
                <button disabled={!selectedCategoryId} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-transform hover:scale-105" style={{ background: colors.green500, color: '#fff' }} onClick={()=> setItemModal({ open: true, editing: null })}>
                  <IoAdd className="h-4 w-4" /> New Item
                </button>
              </div>
              {!selectedCategoryId ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-20 w-20 rounded-full flex items-center justify-center mb-4" style={{ background: theme==='light'?'#F3F4F6':'#1F2937' }}>
                    <IoImageOutline className="h-10 w-10" style={{ color: colors.mutedText }} />
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>No Category Selected</div>
                  <div className="text-xs" style={{ color: colors.mutedText }}>Select a category from the left to view and manage items.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedItems.map((i)=> (
                    <div key={i._id} className="p-0 rounded-2xl overflow-hidden transition-all hover:scale-[1.02]" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme==='light' ? '0 2px 8px rgba(16,24,40,0.04)' : '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <div className="h-32 flex items-center justify-center text-5xl relative" style={{ background: theme==='light'?'#F9FAFB':'#0B1220', borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <span>{i.emoji || '🍽️'}</span>
                        <button className="absolute top-2 right-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}><IoEllipsisVerticalOutline className="h-4 w-4" /></button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-bold text-sm" style={{ color: colors.text }}>{i.name}</div>
                          <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: theme==='light'?'#ECFDF5':'#052e21', color: colors.green700 || '#047857' }}>₦{Number(i.price).toFixed(2)}</span>
                        </div>
                        <div className="text-xs mb-3 line-clamp-2" style={{ color: colors.mutedText }}>{i.description}</div>
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: colors.green600 }}><IoCheckmarkCircleOutline className="h-3 w-3" /> Available</span>
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
                <div className="text-lg font-bold" style={{ color: colors.text }}>{catModal.editing ? 'Edit Category' : 'New Category'}</div>
                <button className="p-2 rounded-lg" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setCatModal({ open:false, editing:null })}><IoCloseCircleOutline className="h-5 w-5" /></button>
              </div>
              <form onSubmit={saveCategory} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Category Name</label>
                  <input name="name" defaultValue={catModal.editing?.name || ''} placeholder="e.g., Appetizers" className="w-full rounded-lg px-4 py-3 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Emoji Icon</label>
                  <input name="emoji" defaultValue={catModal.editing?.emoji || '🥗'} placeholder="🥗" className="w-full rounded-lg px-4 py-3 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Description</label>
                  <textarea name="description" defaultValue={catModal.editing?.description || ''} placeholder="Brief description..." rows={3} className="w-full rounded-lg px-4 py-3 text-sm" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" className="px-4 py-2 rounded-lg font-medium" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setCatModal({ open:false, editing:null })}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-semibold" style={{ background: colors.green500, color: '#fff' }}>Save Category</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {itemModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={()=> setItemModal({ open:false, editing:null })}>
            <div className="w-full max-w-md mx-3 rounded-2xl shadow-2xl animate-in" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }} onClick={(e)=> e.stopPropagation()}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                <div className="text-lg font-bold" style={{ color: colors.text }}>{itemModal.editing ? 'Edit Menu Item' : 'New Menu Item'}</div>
                <button className="p-2 rounded-lg" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setItemModal({ open:false, editing:null })}><IoCloseCircleOutline className="h-5 w-5" /></button>
              </div>
              <form onSubmit={saveItem} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Item Name</label>
                  <input name="name" defaultValue={itemModal.editing?.name || ''} placeholder="e.g., Caesar Salad" className="w-full rounded-lg px-4 py-3 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Emoji Icon</label>
                    <input name="emoji" defaultValue={itemModal.editing?.emoji || '🍲'} placeholder="🍲" className="w-full rounded-lg px-4 py-3 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Price (₦)</label>
                    <input name="price" type="number" step="0.01" defaultValue={itemModal.editing?.price || ''} placeholder="0.00" className="w-full rounded-lg px-4 py-3 text-sm font-medium" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: colors.mutedText }}>Description</label>
                  <textarea name="description" defaultValue={itemModal.editing?.description || ''} placeholder="Brief description..." rows={3} className="w-full rounded-lg px-4 py-3 text-sm" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }} />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" className="px-4 py-2 rounded-lg font-medium" style={{ background: theme==='light'?'#F3F4F6':'#1F2937', color: colors.text }} onClick={()=> setItemModal({ open:false, editing:null })}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-semibold" style={{ background: colors.green500, color: '#fff' }}>Save Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}

