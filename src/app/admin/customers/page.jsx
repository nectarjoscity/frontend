'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import { useGetOrderCustomersQuery, useSendEmailToCustomersMutation } from '../../../services/api';
import {
    IoSearchOutline,
    IoPersonOutline,
    IoCallOutline,
    IoMailOutline,
    IoCartOutline,
    IoWalletOutline,
    IoCalendarOutline,
    IoSendOutline,
    IoClose,
    IoCheckmarkCircleOutline,
    IoEyeOutline,
    IoCreateOutline,
    IoSettingsOutline,
    IoColorPaletteOutline,
} from 'react-icons/io5';

// Default template settings
const DEFAULT_TEMPLATE = {
    brandName: 'NECTARV',
    tagline: 'Premium Nigerian Cuisine',
    ctaText: 'ORDER NOW',
    ctaUrl: 'https://nectar.ng',
    primaryColor: '#10b981',
    headerColor: '#059669',
    footerColor: '#065f46',
    footerText: 'Thank you for choosing NectarV! 💚',
    footerSubtext: 'Delicious Nigerian meals, delivered fresh.',
    features: [
        { icon: '🚀', label: 'Fast Delivery' },
        { icon: '🍳', label: 'Fresh Meals' },
        { icon: '⭐', label: 'Premium Quality' },
    ],
};

// Email Template Preview Component
const EmailTemplatePreview = ({ subject, message, customerName, template }) => {
    const t = { ...DEFAULT_TEMPLATE, ...template };

    return (
        <div style={{
            background: '#f3f4f6',
            padding: '20px',
            borderRadius: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
        }}>
            {/* Email Container */}
            <div style={{
                maxWidth: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}>
                {/* Header - Green Gradient */}
                <div style={{
                    background: `linear-gradient(135deg, ${t.headerColor} 0%, ${t.primaryColor} 50%, #34d399 100%)`,
                    padding: '30px 20px',
                    textAlign: 'center',
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
                    }}>
                        🍽️
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '-0.5px',
                        textTransform: 'uppercase',
                    }}>
                        {t.brandName}
                    </h1>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.85)',
                        fontWeight: 500,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                    }}>
                        {t.tagline}
                    </p>
                </div>

                {/* Subject Banner */}
                <div style={{
                    backgroundColor: t.footerColor,
                    padding: '12px 20px',
                    textAlign: 'center',
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff',
                    }}>
                        {subject || 'Your Subject Line Here'}
                    </h2>
                </div>

                {/* Content */}
                <div style={{ padding: '24px 20px' }}>
                    <p style={{
                        margin: '0 0 16px 0',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1f2937',
                    }}>
                        Hey {customerName || 'Customer Name'},
                    </p>

                    {/* Message Box */}
                    <div style={{
                        backgroundColor: '#f0fdf4',
                        borderLeft: `3px solid ${t.primaryColor}`,
                        borderRadius: '0 8px 8px 0',
                        padding: '16px',
                        margin: '16px 0',
                    }}>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: 1.7,
                            color: '#374151',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {message || 'Your message will appear here...'}
                        </p>
                    </div>

                    {/* CTA Button */}
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <span style={{
                            display: 'inline-block',
                            background: `linear-gradient(135deg, ${t.headerColor} 0%, ${t.primaryColor} 100%)`,
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '10px 28px',
                            borderRadius: '50px',
                            letterSpacing: '0.5px',
                        }}>
                            {t.ctaText}
                        </span>
                    </div>
                </div>

                {/* Features Bar */}
                <div style={{
                    backgroundColor: t.primaryColor,
                    display: 'flex',
                }}>
                    {t.features.map((feature, i) => (
                        <div key={i} style={{
                            flex: 1,
                            padding: '12px 8px',
                            textAlign: 'center',
                            borderRight: i < t.features.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                        }}>
                            <div style={{ fontSize: '16px', marginBottom: '2px' }}>{feature.icon}</div>
                            <div style={{
                                fontSize: '8px',
                                fontWeight: 600,
                                color: '#ffffff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                            }}>
                                {feature.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    backgroundColor: t.footerColor,
                    padding: '20px',
                    textAlign: 'center',
                }}>
                    <p style={{
                        margin: '0 0 6px 0',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ffffff',
                    }}>
                        {t.footerText}
                    </p>
                    <p style={{
                        margin: 0,
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.8)',
                    }}>
                        {t.footerSubtext}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Template Settings Panel
const TemplateSettings = ({ template, setTemplate, colors }) => {
    const updateTemplate = (key, value) => {
        setTemplate(prev => ({ ...prev, [key]: value }));
    };

    const updateFeature = (index, field, value) => {
        setTemplate(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f),
        }));
    };

    return (
        <div className="space-y-4" style={{ fontSize: '13px' }}>
            {/* Brand Settings */}
            <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                <div className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.text }}>
                    <IoColorPaletteOutline className="h-4 w-4" />
                    Brand & Colors
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Brand Name</label>
                        <input
                            type="text"
                            value={template.brandName}
                            onChange={(e) => updateTemplate('brandName', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Tagline</label>
                        <input
                            type="text"
                            value={template.tagline}
                            onChange={(e) => updateTemplate('tagline', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Primary Color</label>
                        <div className="flex gap-1">
                            <input
                                type="color"
                                value={template.primaryColor}
                                onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={template.primaryColor}
                                onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded text-sm"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Header Color</label>
                        <div className="flex gap-1">
                            <input
                                type="color"
                                value={template.headerColor}
                                onChange={(e) => updateTemplate('headerColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={template.headerColor}
                                onChange={(e) => updateTemplate('headerColor', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded text-sm"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Settings */}
            <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                <div className="font-semibold mb-3" style={{ color: colors.text }}>Button</div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Button Text</label>
                        <input
                            type="text"
                            value={template.ctaText}
                            onChange={(e) => updateTemplate('ctaText', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Button URL</label>
                        <input
                            type="text"
                            value={template.ctaUrl}
                            onChange={(e) => updateTemplate('ctaUrl', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                </div>
            </div>

            {/* Features Settings */}
            <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                <div className="font-semibold mb-3" style={{ color: colors.text }}>Features Bar</div>
                <div className="space-y-2">
                    {template.features.map((feature, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={feature.icon}
                                onChange={(e) => updateFeature(i, 'icon', e.target.value)}
                                className="w-12 px-2 py-1.5 rounded text-sm text-center"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                                placeholder="🚀"
                            />
                            <input
                                type="text"
                                value={feature.label}
                                onChange={(e) => updateFeature(i, 'label', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded text-sm"
                                style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                                placeholder="Feature label"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Settings */}
            <div className="p-3 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                <div className="font-semibold mb-3" style={{ color: colors.text }}>Footer</div>
                <div className="space-y-2">
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Footer Text</label>
                        <input
                            type="text"
                            value={template.footerText}
                            onChange={(e) => updateTemplate('footerText', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: colors.mutedText }}>Footer Subtext</label>
                        <input
                            type="text"
                            value={template.footerSubtext}
                            onChange={(e) => updateTemplate('footerSubtext', e.target.value)}
                            className="w-full px-2 py-1.5 rounded text-sm"
                            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CustomersPage() {
    const { colors, theme } = useTheme();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'template'
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);

    const { data: customersData = [], isLoading } = useGetOrderCustomersQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const [sendEmail] = useSendEmailToCustomersMutation();

    const filteredCustomers = useMemo(() => {
        let filtered = customersData;

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(c =>
                c.customerName?.toLowerCase().includes(q) ||
                c.customerEmail?.toLowerCase().includes(q) ||
                c.customerPhone?.includes(q)
            );
        }

        return filtered;
    }, [customersData, search]);

    const customersWithEmail = useMemo(() => {
        return customersData.filter(c => c.customerEmail && c.customerEmail.includes('@'));
    }, [customersData]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
        if (!token) router.replace('/admin/login');
    }, [router]);

    const stats = useMemo(() => {
        const total = customersData.length;
        const totalOrders = customersData.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
        const totalRevenue = customersData.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        return { total, totalOrders, totalRevenue };
    }, [customersData]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const toggleCustomerSelection = (customer) => {
        if (!customer.customerEmail) return;
        setSelectedCustomers(prev => {
            const isSelected = prev.some(c => c._id === customer._id);
            if (isSelected) return prev.filter(c => c._id !== customer._id);
            return [...prev, customer];
        });
    };

    const selectAllWithEmail = () => setSelectedCustomers(customersWithEmail);
    const clearSelection = () => setSelectedCustomers([]);

    const openEmailModal = () => {
        if (selectedCustomers.length === 0) {
            alert('Please select at least one customer with a valid email address.');
            return;
        }
        setShowEmailModal(true);
    };

    const closeEmailModal = () => {
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailMessage('');
    };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) {
            alert('Please enter both subject and message.');
            return;
        }

        setSendingEmail(true);
        try {
            const recipients = selectedCustomers.map(c => ({ email: c.customerEmail, name: c.customerName }));
            const result = await sendEmail({
                recipients,
                subject: emailSubject,
                message: emailMessage,
                template, // Send template settings to backend
            }).unwrap();

            alert(result.message || `Email sent to ${result.totalSent} customers!`);
            closeEmailModal();
            setSelectedCustomers([]);
        } catch (error) {
            console.error('Error sending email:', error);
            alert(error?.data?.message || 'Failed to send emails. Please try again.');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <AdminLayout title="Customers" active="customers" requiredPermission="customers">
            <div className="max-w-7xl mx-auto p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)` }}>
                        <div className="text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Customers</div>
                        <div className="text-5xl font-extrabold" style={{ color: '#fff' }}>{stats.total}</div>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                        <div className="text-base font-medium mb-1" style={{ color: colors.mutedText }}>Total Orders</div>
                        <div className="text-5xl font-extrabold" style={{ color: colors.green600 }}>{stats.totalOrders}</div>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                        <div className="text-base font-medium mb-1" style={{ color: colors.mutedText }}>Total Revenue</div>
                        <div className="text-3xl font-extrabold" style={{ color: colors.blue600 || '#2563EB' }}>{formatCurrency(stats.totalRevenue)}</div>
                    </div>
                </div>

                {/* Search & Actions Bar */}
                <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6" style={{ color: colors.mutedText }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search customers..."
                                className="w-full rounded-lg pl-10 pr-4 py-3 text-lg font-medium"
                                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={selectAllWithEmail} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}>
                                Select All ({customersWithEmail.length})
                            </button>
                            {selectedCustomers.length > 0 && (
                                <>
                                    <button onClick={clearSelection} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: theme === 'light' ? '#FEE2E2' : '#3A2020', color: '#DC2626' }}>
                                        Clear
                                    </button>
                                    <button onClick={openEmailModal} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ background: colors.amber500, color: '#fff' }}>
                                        <IoMailOutline className="h-5 w-5" />
                                        Email ({selectedCustomers.length})
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customers List */}
                <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold" style={{ color: colors.text }}>Customer List</div>
                        <div className="text-lg" style={{ color: colors.mutedText }}>{filteredCustomers.length} customers</div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-lg" style={{ color: colors.mutedText }}>Loading...</div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <IoPersonOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
                            <div className="text-lg font-medium" style={{ color: colors.text }}>No customers found</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCustomers.map((customer) => {
                                const isSelected = selectedCustomers.some(c => c._id === customer._id);
                                const hasEmail = customer.customerEmail?.includes('@');

                                return (
                                    <div
                                        key={customer._id}
                                        onClick={() => hasEmail && toggleCustomerSelection(customer)}
                                        className={`rounded-xl p-4 transition-all ${hasEmail ? 'cursor-pointer hover:shadow-lg' : ''}`}
                                        style={{
                                            background: isSelected ? (theme === 'light' ? '#FEF3C7' : '#3A2A1A') : colors.background,
                                            border: `2px solid ${isSelected ? colors.amber500 : colors.cardBorder}`,
                                        }}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: colors.amber500, color: '#fff' }}>
                                                    {customer.customerName?.charAt(0).toUpperCase() || 'C'}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center" style={{ background: colors.green600 }}>
                                                        <IoCheckmarkCircleOutline className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-lg font-bold truncate" style={{ color: colors.text }}>{customer.customerName || 'Unknown'}</div>
                                                {customer.customerEmail ? (
                                                    <div className="flex items-center gap-1 text-sm truncate" style={{ color: colors.mutedText }}>
                                                        <IoMailOutline className="h-4 w-4" />
                                                        <span className="truncate">{customer.customerEmail}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm italic" style={{ color: '#DC2626' }}>No email</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {customer.customerPhone && (
                                                <div className="flex items-center gap-2 text-base" style={{ color: colors.mutedText }}>
                                                    <IoCallOutline className="h-5 w-5" />
                                                    <span>{customer.customerPhone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                                                <div className="flex items-center gap-1">
                                                    <IoCartOutline className="h-5 w-5" style={{ color: colors.mutedText }} />
                                                    <span className="font-semibold" style={{ color: colors.text }}>{customer.totalOrders}</span>
                                                    <span className="text-sm" style={{ color: colors.mutedText }}>orders</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <IoWalletOutline className="h-5 w-5" style={{ color: colors.green600 }} />
                                                    <span className="font-semibold" style={{ color: colors.green600 }}>{formatCurrency(customer.totalSpent)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Email Compose Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={closeEmailModal}>
                    <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl" style={{ background: colors.cardBg }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.cardBorder }}>
                            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.text }}>
                                <IoMailOutline className="h-6 w-6" />
                                Email {selectedCustomers.length} Customer{selectedCustomers.length > 1 ? 's' : ''}
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Tabs */}
                                <div className="flex rounded-lg overflow-hidden" style={{ background: colors.background }}>
                                    <button
                                        onClick={() => setActiveTab('compose')}
                                        className="px-4 py-2 text-sm font-semibold flex items-center gap-1"
                                        style={{ background: activeTab === 'compose' ? colors.amber500 : 'transparent', color: activeTab === 'compose' ? '#fff' : colors.text }}
                                    >
                                        <IoCreateOutline className="h-4 w-4" /> Compose
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('template')}
                                        className="px-4 py-2 text-sm font-semibold flex items-center gap-1"
                                        style={{ background: activeTab === 'template' ? colors.amber500 : 'transparent', color: activeTab === 'template' ? '#fff' : colors.text }}
                                    >
                                        <IoSettingsOutline className="h-4 w-4" /> Edit Template
                                    </button>
                                </div>
                                <button onClick={closeEmailModal} className="p-2 rounded-lg" style={{ background: colors.background, color: colors.text }}>
                                    <IoClose className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                            {/* Editor Panel */}
                            <div className="w-1/2 p-4 overflow-y-auto" style={{ borderRight: `1px solid ${colors.cardBorder}` }}>
                                {activeTab === 'compose' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>To:</label>
                                            <div className="flex flex-wrap gap-1 p-2 rounded-lg max-h-16 overflow-y-auto" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                                                {selectedCustomers.slice(0, 5).map(c => (
                                                    <span key={c._id} className="text-xs px-2 py-1 rounded-full" style={{ background: '#10b981', color: '#fff' }}>
                                                        {c.customerName || c.customerEmail}
                                                    </span>
                                                ))}
                                                {selectedCustomers.length > 5 && (
                                                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: colors.mutedText, color: '#fff' }}>+{selectedCustomers.length - 5} more</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>Subject *</label>
                                            <input
                                                type="text"
                                                value={emailSubject}
                                                onChange={(e) => setEmailSubject(e.target.value)}
                                                placeholder="e.g., 🎄 Merry Christmas from NectarV!"
                                                className="w-full rounded-lg px-4 py-3"
                                                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text }}>Message *</label>
                                            <textarea
                                                value={emailMessage}
                                                onChange={(e) => setEmailMessage(e.target.value)}
                                                placeholder="Write your message..."
                                                rows={12}
                                                className="w-full rounded-lg px-4 py-3 resize-none"
                                                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <TemplateSettings template={template} setTemplate={setTemplate} colors={colors} />
                                )}
                            </div>

                            {/* Preview Panel */}
                            <div className="w-1/2 p-4 overflow-y-auto" style={{ background: theme === 'light' ? '#e5e7eb' : '#1f2937' }}>
                                <div className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.mutedText }}>
                                    <IoEyeOutline className="h-4 w-4" /> Live Preview
                                </div>
                                <EmailTemplatePreview
                                    subject={emailSubject}
                                    message={emailMessage}
                                    customerName={selectedCustomers[0]?.customerName || 'Customer'}
                                    template={template}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: colors.cardBorder, background: colors.background }}>
                            <button onClick={closeEmailModal} disabled={sendingEmail} className="px-4 py-2 rounded-lg font-semibold" style={{ background: colors.cardBg, color: colors.text }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                                className="px-6 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff' }}
                            >
                                {sendingEmail ? 'Sending...' : <><IoSendOutline className="h-5 w-5" /> Send Email</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
