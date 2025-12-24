'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    IoAddOutline,
    IoTextOutline,
    IoImageOutline,
    IoCartOutline,
    IoLinkOutline,
    IoGridOutline,
    IoRemoveOutline,
    IoReorderThreeOutline,
    IoTrashOutline,
    IoChevronUpOutline,
    IoChevronDownOutline,
    IoClose,
    IoCheckmarkOutline,
} from 'react-icons/io5';

// Block types
const BLOCK_TYPES = {
    HEADER: 'header',
    TEXT: 'text',
    IMAGE: 'image',
    PRODUCTS: 'products',
    BUTTON: 'button',
    FEATURES: 'features',
    DIVIDER: 'divider',
};

// Default blocks for new email
const DEFAULT_BLOCKS = [
    {
        id: 'header-1',
        type: BLOCK_TYPES.HEADER,
        data: {
            brandName: 'NECTARV',
            tagline: 'Premium Nigerian Cuisine',
            primaryColor: '#10b981',
            headerColor: '#059669',
        },
    },
    {
        id: 'text-1',
        type: BLOCK_TYPES.TEXT,
        data: {
            content: 'Hello {customerName},\n\nWe have something special for you!',
        },
    },
    {
        id: 'button-1',
        type: BLOCK_TYPES.BUTTON,
        data: {
            text: 'ORDER NOW',
            url: 'https://nectar.ng',
            color: '#10b981',
        },
    },
    {
        id: 'features-1',
        type: BLOCK_TYPES.FEATURES,
        data: {
            items: [
                { icon: '🚀', label: 'Fast Delivery' },
                { icon: '🍳', label: 'Fresh Meals' },
                { icon: '⭐', label: 'Premium Quality' },
            ],
            backgroundColor: '#10b981',
        },
    },
];

// Generate unique ID
const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sortable Block Wrapper
const SortableBlock = ({ id, children, onRemove, colors }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group mb-2"
        >
            <div
                className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <IoReorderThreeOutline className="h-6 w-6" style={{ color: colors.mutedText }} />
            </div>
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRemove(id)}
                    className="p-1 rounded-lg hover:bg-red-100"
                    style={{ color: '#DC2626' }}
                >
                    <IoTrashOutline className="h-5 w-5" />
                </button>
            </div>
            {children}
        </div>
    );
};

// Block Components
const HeaderBlock = ({ data, onChange, colors, isPreview }) => {
    if (isPreview) {
        return (
            <div style={{
                background: `linear-gradient(135deg, ${data.headerColor} 0%, ${data.primaryColor} 50%, #34d399 100%)`,
                padding: '30px 20px',
                textAlign: 'center',
                borderRadius: '12px 12px 0 0',
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '14px',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                }}>🍽️</div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                    {data.brandName}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {data.tagline}
                </p>
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>📌 HEADER</div>
            <div className="space-y-2">
                <input
                    value={data.brandName}
                    onChange={(e) => onChange({ ...data, brandName: e.target.value })}
                    className="w-full px-2 py-1 rounded text-sm"
                    placeholder="Brand Name"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                />
                <input
                    value={data.tagline}
                    onChange={(e) => onChange({ ...data, tagline: e.target.value })}
                    className="w-full px-2 py-1 rounded text-sm"
                    placeholder="Tagline"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                />
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs" style={{ color: colors.mutedText }}>Primary</label>
                        <input type="color" value={data.primaryColor} onChange={(e) => onChange({ ...data, primaryColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs" style={{ color: colors.mutedText }}>Header</label>
                        <input type="color" value={data.headerColor} onChange={(e) => onChange({ ...data, headerColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TextBlock = ({ data, onChange, colors, isPreview }) => {
    if (isPreview) {
        return (
            <div style={{ padding: '16px 20px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}>
                    {data.content}
                </p>
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>📝 TEXT</div>
            <textarea
                value={data.content}
                onChange={(e) => onChange({ ...data, content: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm resize-none"
                rows={3}
                placeholder="Enter text... Use {customerName} for personalization"
                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
            />
        </div>
    );
};

const ImageBlock = ({ data, onChange, colors, isPreview }) => {
    if (isPreview) {
        return data.url ? (
            <div style={{ padding: '16px 20px', textAlign: 'center' }}>
                <img src={data.url} alt={data.alt || ''} style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
        ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
                No image selected
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>🖼️ IMAGE</div>
            <input
                value={data.url || ''}
                onChange={(e) => onChange({ ...data, url: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm mb-2"
                placeholder="Image URL (paste from Cloudinary or web)"
                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
            />
            <input
                value={data.alt || ''}
                onChange={(e) => onChange({ ...data, alt: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm"
                placeholder="Alt text (optional)"
                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
            />
            {data.url && (
                <img src={data.url} alt={data.alt || ''} className="mt-2 rounded max-h-32 object-cover" />
            )}
        </div>
    );
};

const ProductsBlock = ({ data, onChange, colors, isPreview, menuItems = [] }) => {
    const [showPicker, setShowPicker] = useState(false);
    const selectedProducts = data.products || [];

    const toggleProduct = (product) => {
        const exists = selectedProducts.find(p => p._id === product._id);
        if (exists) {
            onChange({ ...data, products: selectedProducts.filter(p => p._id !== product._id) });
        } else {
            onChange({ ...data, products: [...selectedProducts, product] });
        }
    };

    if (isPreview) {
        if (!selectedProducts.length) {
            return (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
                    No products selected
                </div>
            );
        }
        return (
            <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {selectedProducts.map((product) => (
                        <div key={product._id} style={{ background: '#f9fafb', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            {product.imageUrl && (
                                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                            )}
                            <div style={{ padding: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{product.name}</div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>₦{product.price?.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold" style={{ color: colors.mutedText }}>🛒 PRODUCTS ({selectedProducts.length})</div>
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: colors.amber500, color: '#fff' }}
                >
                    {showPicker ? 'Done' : 'Select Products'}
                </button>
            </div>

            {showPicker && (
                <div className="max-h-48 overflow-y-auto space-y-1 mb-2 p-2 rounded" style={{ background: colors.cardBg }}>
                    {menuItems.map((item) => {
                        const isSelected = selectedProducts.find(p => p._id === item._id);
                        return (
                            <div
                                key={item._id}
                                onClick={() => toggleProduct(item)}
                                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:opacity-80"
                                style={{ background: isSelected ? '#D1FAE5' : 'transparent', border: `1px solid ${isSelected ? '#10b981' : colors.cardBorder}` }}
                            >
                                {item.imageUrl && <img src={item.imageUrl} className="w-8 h-8 rounded object-cover" />}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate" style={{ color: colors.text }}>{item.name}</div>
                                    <div className="text-xs" style={{ color: colors.green600 }}>₦{item.price?.toLocaleString()}</div>
                                </div>
                                {isSelected && <IoCheckmarkOutline className="h-4 w-4" style={{ color: '#10b981' }} />}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedProducts.length > 0 && !showPicker && (
                <div className="flex flex-wrap gap-1">
                    {selectedProducts.map((p) => (
                        <span key={p._id} className="text-xs px-2 py-1 rounded-full" style={{ background: '#D1FAE5', color: '#059669' }}>
                            {p.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

const ButtonBlock = ({ data, onChange, colors, isPreview }) => {
    if (isPreview) {
        return (
            <div style={{ padding: '16px 20px', textAlign: 'center' }}>
                <span style={{
                    display: 'inline-block',
                    background: `linear-gradient(135deg, ${data.color} 0%, ${data.color}cc 100%)`,
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '10px 28px',
                    borderRadius: '50px',
                }}>
                    {data.text}
                </span>
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>🔘 BUTTON</div>
            <div className="space-y-2">
                <input
                    value={data.text}
                    onChange={(e) => onChange({ ...data, text: e.target.value })}
                    className="w-full px-2 py-1 rounded text-sm"
                    placeholder="Button Text"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                />
                <input
                    value={data.url}
                    onChange={(e) => onChange({ ...data, url: e.target.value })}
                    className="w-full px-2 py-1 rounded text-sm"
                    placeholder="Button URL"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                />
                <div>
                    <label className="text-xs" style={{ color: colors.mutedText }}>Color</label>
                    <input type="color" value={data.color} onChange={(e) => onChange({ ...data, color: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                </div>
            </div>
        </div>
    );
};

const FeaturesBlock = ({ data, onChange, colors, isPreview }) => {
    const updateFeature = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange({ ...data, items: newItems });
    };

    if (isPreview) {
        return (
            <div style={{ backgroundColor: data.backgroundColor, display: 'flex' }}>
                {data.items.map((item, i) => (
                    <div key={i} style={{
                        flex: 1,
                        padding: '12px 8px',
                        textAlign: 'center',
                        borderRight: i < data.items.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    }}>
                        <div style={{ fontSize: '16px', marginBottom: '2px' }}>{item.icon}</div>
                        <div style={{ fontSize: '8px', fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>{item.label}</div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: colors.mutedText }}>✨ FEATURES</div>
            <div className="space-y-2">
                {data.items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={item.icon}
                            onChange={(e) => updateFeature(i, 'icon', e.target.value)}
                            className="w-12 px-2 py-1 rounded text-sm text-center"
                            placeholder="🚀"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                        <input
                            value={item.label}
                            onChange={(e) => updateFeature(i, 'label', e.target.value)}
                            className="flex-1 px-2 py-1 rounded text-sm"
                            placeholder="Feature label"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                ))}
                <div>
                    <label className="text-xs" style={{ color: colors.mutedText }}>Background</label>
                    <input type="color" value={data.backgroundColor} onChange={(e) => onChange({ ...data, backgroundColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                </div>
            </div>
        </div>
    );
};

const DividerBlock = ({ data, onChange, colors, isPreview }) => {
    if (isPreview) {
        return (
            <div style={{ padding: `${data.spacing || 16}px 20px` }}>
                <div style={{ height: data.height || 1, background: data.color || '#e5e7eb' }} />
            </div>
        );
    }

    return (
        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
            <div className="text-xs font-semibold" style={{ color: colors.mutedText }}>➖ DIVIDER</div>
            <input type="color" value={data.color || '#e5e7eb'} onChange={(e) => onChange({ ...data, color: e.target.value })} className="w-8 h-6 rounded cursor-pointer" />
        </div>
    );
};

// Block renderer
const renderBlock = (block, onChange, colors, isPreview, menuItems) => {
    const props = { data: block.data, onChange: (newData) => onChange(block.id, newData), colors, isPreview, menuItems };

    switch (block.type) {
        case BLOCK_TYPES.HEADER: return <HeaderBlock {...props} />;
        case BLOCK_TYPES.TEXT: return <TextBlock {...props} />;
        case BLOCK_TYPES.IMAGE: return <ImageBlock {...props} />;
        case BLOCK_TYPES.PRODUCTS: return <ProductsBlock {...props} />;
        case BLOCK_TYPES.BUTTON: return <ButtonBlock {...props} />;
        case BLOCK_TYPES.FEATURES: return <FeaturesBlock {...props} />;
        case BLOCK_TYPES.DIVIDER: return <DividerBlock {...props} />;
        default: return null;
    }
};

// Add Block Menu
const AddBlockMenu = ({ onAdd, colors }) => {
    const blockOptions = [
        { type: BLOCK_TYPES.TEXT, icon: IoTextOutline, label: 'Text', defaultData: { content: '' } },
        { type: BLOCK_TYPES.IMAGE, icon: IoImageOutline, label: 'Image', defaultData: { url: '', alt: '' } },
        { type: BLOCK_TYPES.PRODUCTS, icon: IoCartOutline, label: 'Products', defaultData: { products: [] } },
        { type: BLOCK_TYPES.BUTTON, icon: IoLinkOutline, label: 'Button', defaultData: { text: 'Click Here', url: '#', color: '#10b981' } },
        { type: BLOCK_TYPES.FEATURES, icon: IoGridOutline, label: 'Features', defaultData: { items: [{ icon: '✨', label: 'Feature' }], backgroundColor: '#10b981' } },
        { type: BLOCK_TYPES.DIVIDER, icon: IoRemoveOutline, label: 'Divider', defaultData: { color: '#e5e7eb', height: 1, spacing: 16 } },
    ];

    return (
        <div className="flex flex-wrap gap-1 p-2 rounded-lg" style={{ background: colors.background, border: `1px dashed ${colors.cardBorder}` }}>
            <span className="text-xs w-full mb-1" style={{ color: colors.mutedText }}>Add block:</span>
            {blockOptions.map(({ type, icon: Icon, label, defaultData }) => (
                <button
                    key={type}
                    onClick={() => onAdd({ id: generateId(), type, data: defaultData })}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:scale-105 transition-transform"
                    style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                >
                    <Icon className="h-3 w-3" /> {label}
                </button>
            ))}
        </div>
    );
};

// Main Email Builder Component
export default function EmailBuilder({
    blocks: initialBlocks = DEFAULT_BLOCKS,
    onBlocksChange,
    colors,
    theme,
    menuItems = [],
    subject = '',
    customerName = 'Customer',
}) {
    const [blocks, setBlocks] = useState(initialBlocks);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newBlocks = arrayMove(items, oldIndex, newIndex);
                onBlocksChange?.(newBlocks);
                return newBlocks;
            });
        }
    }, [onBlocksChange]);

    const updateBlockData = useCallback((blockId, newData) => {
        setBlocks((prev) => {
            const newBlocks = prev.map((b) => b.id === blockId ? { ...b, data: newData } : b);
            onBlocksChange?.(newBlocks);
            return newBlocks;
        });
    }, [onBlocksChange]);

    const removeBlock = useCallback((blockId) => {
        setBlocks((prev) => {
            const newBlocks = prev.filter((b) => b.id !== blockId);
            onBlocksChange?.(newBlocks);
            return newBlocks;
        });
    }, [onBlocksChange]);

    const addBlock = useCallback((block) => {
        setBlocks((prev) => {
            const newBlocks = [...prev, block];
            onBlocksChange?.(newBlocks);
            return newBlocks;
        });
    }, [onBlocksChange]);

    return (
        <div className="flex gap-4" style={{ height: '100%' }}>
            {/* Editor */}
            <div className="w-1/2 overflow-y-auto p-4 pl-12">
                <div className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                    📧 Email Blocks (drag to reorder)
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks.map((block) => (
                            <SortableBlock key={block.id} id={block.id} onRemove={removeBlock} colors={colors}>
                                {renderBlock(block, updateBlockData, colors, false, menuItems)}
                            </SortableBlock>
                        ))}
                    </SortableContext>
                </DndContext>

                <AddBlockMenu onAdd={addBlock} colors={colors} />
            </div>

            {/* Preview */}
            <div className="w-1/2 overflow-y-auto p-4" style={{ background: theme === 'light' ? '#e5e7eb' : '#1f2937' }}>
                <div className="text-sm font-semibold mb-3" style={{ color: colors.mutedText }}>
                    👁️ Live Preview
                </div>
                <div style={{
                    background: '#f3f4f6',
                    padding: '20px',
                    borderRadius: '12px',
                }}>
                    <div style={{
                        maxWidth: '100%',
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    }}>
                        {/* Subject Banner */}
                        {subject && (
                            <div style={{ backgroundColor: '#065f46', padding: '12px 20px', textAlign: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{subject}</h2>
                            </div>
                        )}

                        {/* Render blocks in preview mode */}
                        {blocks.map((block) => (
                            <div key={block.id}>
                                {renderBlock(block, () => { }, colors, true, menuItems)}
                            </div>
                        ))}

                        {/* Footer */}
                        <div style={{ backgroundColor: '#065f46', padding: '20px', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                                © {new Date().getFullYear()} NectarV. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { BLOCK_TYPES, DEFAULT_BLOCKS, generateId };
