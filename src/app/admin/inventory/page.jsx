'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useTheme } from '../../providers';
import {
  useGetInventoryItemsQuery,
  useGetInventoryAnalyticsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useRestockInventoryItemMutation
} from '../../../services/api';
import {
  IoAdd,
  IoSearchOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoCubeOutline,
  IoBarChartOutline
} from 'react-icons/io5';

export default function InventoryPage() {
  const { colors, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(null);
  
  const { data: inventoryData = [], isLoading, refetch } = useGetInventoryItemsQuery({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    lowStock: showLowStock ? 'true' : undefined
  });
  
  const { data: analyticsData } = useGetInventoryAnalyticsQuery();
  const [createItem] = useCreateInventoryItemMutation();
  const [updateItem] = useUpdateInventoryItemMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();
  const [restockItem] = useRestockInventoryItemMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'piece',
    currentStock: 0,
    minStock: 0,
    maxStock: '',
    costPerUnit: 0,
    supplier: '',
    category: 'ingredient'
  });
  
  const filteredItems = useMemo(() => {
    if (!search) return inventoryData;
    const q = search.toLowerCase();
    return inventoryData.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  }, [inventoryData, search]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...formData }).unwrap();
      } else {
        await createItem(formData).unwrap();
      }
      setShowAddModal(false);
      setEditingItem(null);
      setFormData({
        name: '', description: '', unit: 'piece', currentStock: 0,
        minStock: 0, maxStock: '', costPerUnit: 0, supplier: '', category: 'ingredient'
      });
    } catch (error) {
      alert('Error saving item: ' + (error.data?.message || error.message));
    }
  };
  
  const handleRestock = async (quantity, costPerUnit, notes) => {
    try {
      await restockItem({
        id: showRestockModal._id,
        quantity: parseFloat(quantity),
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
        notes
      }).unwrap();
      setShowRestockModal(null);
    } catch (error) {
      alert('Error restocking: ' + (error.data?.message || error.message));
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="Inventory" active="inventory" requiredPermission="inventory">
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12" style={{ color: colors.text }}>Loading inventory...</div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Inventory" active="inventory" requiredPermission="inventory">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Analytics Cards */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Total Items</div>
              <div className="text-3xl font-bold" style={{ color: colors.text }}>{analyticsData.totalItems || 0}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Low Stock</div>
              <div className="text-3xl font-bold" style={{ color: colors.amber600 }}>{analyticsData.lowStockCount || 0}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>Total Value</div>
              <div className="text-3xl font-bold" style={{ color: colors.green600 }}>
                ₦{analyticsData.totalInventoryValue?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: colors.mutedText }}>This Month Purchases</div>
              <div className="text-3xl font-bold" style={{ color: colors.blue600 }}>
                ₦{analyticsData.purchaseTotal?.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.mutedText }} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg"
                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg"
              style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
            >
              <option value="all">All Categories</option>
              <option value="ingredient">Ingredients</option>
              <option value="beverage">Beverages</option>
              <option value="packaging">Packaging</option>
              <option value="cleaning">Cleaning</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showLowStock ? 'text-white' : ''
              }`}
              style={{
                background: showLowStock ? colors.amber600 : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                color: showLowStock ? '#fff' : colors.text
              }}
            >
              <IoWarningOutline className="h-5 w-5" />
              Low Stock
            </button>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '', description: '', unit: 'piece', currentStock: 0,
                minStock: 0, maxStock: '', costPerUnit: 0, supplier: '', category: 'ingredient'
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
            style={{ background: colors.green600 }}
          >
            <IoAdd className="h-5 w-5" />
            Add Item
          </button>
        </div>
        
        {/* Inventory Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
            <IoCubeOutline className="h-16 w-16 mx-auto mb-4" style={{ color: colors.mutedText }} />
            <p className="text-lg font-medium" style={{ color: colors.text }}>No inventory items found</p>
            <p className="text-sm mt-2" style={{ color: colors.mutedText }}>Add your first inventory item to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.currentStock <= item.minStock;
              return (
                <div
                  key={item._id}
                  className="rounded-2xl p-4"
                  style={{
                    background: colors.cardBg,
                    border: `2px solid ${isLowStock ? colors.amber600 : colors.cardBorder}`
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: colors.text }}>{item.name}</h3>
                      {item.description && (
                        <p className="text-sm mt-1" style={{ color: colors.mutedText }}>{item.description}</p>
                      )}
                    </div>
                    {isLowStock && (
                      <IoWarningOutline className="h-6 w-6" style={{ color: colors.amber600 }} />
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.mutedText }}>Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : ''}`} style={{ color: isLowStock ? colors.red600 : colors.text }}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.mutedText }}>Min Stock:</span>
                      <span className="font-semibold" style={{ color: colors.text }}>{item.minStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.mutedText }}>Cost/Unit:</span>
                      <span className="font-semibold" style={{ color: colors.text }}>₦{item.costPerUnit?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.mutedText }}>Total Value:</span>
                      <span className="font-bold" style={{ color: colors.green600 }}>
                        ₦{((item.currentStock || 0) * (item.costPerUnit || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowRestockModal(item)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: colors.blue600 }}
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          name: item.name,
                          description: item.description || '',
                          unit: item.unit,
                          currentStock: item.currentStock,
                          minStock: item.minStock,
                          maxStock: item.maxStock || '',
                          costPerUnit: item.costPerUnit,
                          supplier: item.supplier || '',
                          category: item.category
                        });
                        setShowAddModal(true);
                      }}
                      className="px-3 py-2 rounded-lg"
                      style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    >
                      <IoPencilOutline className="h-5 w-5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this inventory item?')) {
                          try {
                            await deleteItem(item._id).unwrap();
                          } catch (error) {
                            alert('Error deleting: ' + (error.data?.message || error.message));
                          }
                        }
                      }}
                      className="px-3 py-2 rounded-lg"
                      style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.red600 }}
                    >
                      <IoTrashOutline className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ background: colors.cardBg }} onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                {editingItem ? 'Edit Item' : 'Add Inventory Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                      <option value="piece">piece</option>
                      <option value="pack">pack</option>
                      <option value="bottle">bottle</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    >
                      <option value="ingredient">Ingredient</option>
                      <option value="beverage">Beverage</option>
                      <option value="packaging">Packaging</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Current Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Min Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Max Stock</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Cost Per Unit *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg"
                      style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white font-semibold"
                    style={{ background: colors.green600 }}
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Restock Modal */}
        {showRestockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowRestockModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4" style={{ background: colors.cardBg }} onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                Restock {showRestockModal.name}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                handleRestock(form.quantity.value, form.costPerUnit.value, form.notes.value);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Cost Per Unit (optional)</label>
                  <input
                    type="number"
                    name="costPerUnit"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Notes</label>
                  <textarea
                    name="notes"
                    className="w-full px-4 py-2 rounded-lg"
                    style={{ background: theme === 'light' ? '#fff' : '#1F2937', border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white font-semibold"
                    style={{ background: colors.blue600 }}
                  >
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(null)}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

