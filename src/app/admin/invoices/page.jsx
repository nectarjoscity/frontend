'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useTheme } from '../../providers';
import { useGetCurrentUserQuery } from '../../../services/api';
import {
    useGetInvoicesQuery,
    useGetInvoiceStatsQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useSubmitInvoiceMutation,
    useApproveInvoiceMutation,
    useRejectInvoiceMutation,
    useDeleteInvoiceMutation
} from '../../../services/api';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaCheck,
    FaTimes,
    FaClock,
    FaFileInvoiceDollar,
    FaPaperPlane,
    FaEye,
    FaSpinner,
    FaExternalLinkAlt,
    FaReceipt
} from 'react-icons/fa';

export default function InvoicesPage() {
    const { colors, theme } = useTheme();
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingInvoiceId, setRejectingInvoiceId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [processingId, setProcessingId] = useState(null); // Track which invoice is being processed
    const [processingAction, setProcessingAction] = useState(null); // 'approve', 'reject', 'submit', 'delete'

    const { data: currentUser } = useGetCurrentUserQuery();
    const isAdmin = currentUser?.role === 'admin';

    // API Queries
    const { data: invoices = [], isLoading: invoicesLoading } = useGetInvoicesQuery({
        status: statusFilter || undefined,
        limit: 100
    });

    const { data: stats } = useGetInvoiceStatsQuery();

    // Mutations
    const [createInvoice] = useCreateInvoiceMutation();
    const [updateInvoice] = useUpdateInvoiceMutation();
    const [submitInvoice] = useSubmitInvoiceMutation();
    const [approveInvoice] = useApproveInvoiceMutation();
    const [rejectInvoice] = useRejectInvoiceMutation();
    const [deleteInvoice] = useDeleteInvoiceMutation();

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch = invoice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = !statusFilter || invoice.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const handleCreateInvoice = async (invoiceData) => {
        try {
            await createInvoice(invoiceData).unwrap();
            setShowInvoiceModal(false);
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        }
    };

    const handleUpdateInvoice = async (invoiceData) => {
        try {
            await updateInvoice({ id: editingInvoice._id, ...invoiceData }).unwrap();
            setEditingInvoice(null);
            setShowInvoiceModal(false);
        } catch (error) {
            console.error('Error updating invoice:', error);
            alert('Failed to update invoice');
        }
    };

    const handleSubmitInvoice = async (id) => {
        if (!window.confirm('Submit this invoice for approval?')) return;
        setProcessingId(id);
        setProcessingAction('submit');
        try {
            await submitInvoice(id).unwrap();
        } catch (error) {
            console.error('Error submitting invoice:', error);
            alert('Failed to submit invoice');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    const handleApproveInvoice = async (id) => {
        if (!window.confirm('Approve this invoice? This will create an expense record.')) return;
        setProcessingId(id);
        setProcessingAction('approve');
        try {
            await approveInvoice(id).unwrap();
        } catch (error) {
            console.error('Error approving invoice:', error);
            alert('Failed to approve invoice');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    const handleRejectInvoice = async () => {
        setProcessingId(rejectingInvoiceId);
        setProcessingAction('reject');
        try {
            await rejectInvoice({ id: rejectingInvoiceId, reason: rejectionReason }).unwrap();
            setShowRejectModal(false);
            setRejectingInvoiceId(null);
            setRejectionReason('');
        } catch (error) {
            console.error('Error rejecting invoice:', error);
            alert('Failed to reject invoice');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    const handleDeleteInvoice = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        setProcessingId(id);
        setProcessingAction('delete');
        try {
            await deleteInvoice(id).unwrap();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Failed to delete invoice');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: { bg: '#E5E7EB', text: '#374151', icon: FaEdit },
            pending: { bg: '#FEF3C7', text: '#B45309', icon: FaClock },
            approved: { bg: '#D1FAE5', text: '#065F46', icon: FaCheck },
            rejected: { bg: '#FEE2E2', text: '#991B1B', icon: FaTimes }
        };
        const style = styles[status] || styles.draft;
        const Icon = style.icon;
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: style.bg, color: style.text }}>
                <Icon className="w-3 h-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout title="Invoices" active="invoices" requiredPermission="invoices">
            <div className="space-y-6 p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                                <FaFileInvoiceDollar className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-blue-700">Total Invoices</p>
                                <p className="text-2xl font-bold text-blue-900">{stats?.totalInvoices || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-amber-500 rounded-xl shadow-sm">
                                <FaClock className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-amber-700">Pending Approval</p>
                                <p className="text-2xl font-bold text-amber-900">{stats?.pending || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                                <FaCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-green-700">Approved Amount</p>
                                <p className="text-lg font-bold text-green-900">{formatCurrency(stats?.approvedAmount)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                                <FaPaperPlane className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-purple-700">Pending Amount</p>
                                <p className="text-lg font-bold text-purple-900">{formatCurrency(stats?.pendingAmount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isAdmin ? 'All Invoices' : 'My Invoices'}
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingInvoice(null);
                                    setShowInvoiceModal(true);
                                }}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 flex items-center space-x-2 shadow-sm transition-all duration-200 transform hover:scale-105"
                            >
                                <FaPlus className="w-4 h-4" />
                                <span>New Invoice</span>
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mt-6 flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search invoices..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200"
                                    />
                                </div>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Invoice Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoicesLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            Loading invoices...
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <tr key={invoice._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                                                    <div className="text-sm text-gray-500">{invoice.title}</div>
                                                    {invoice.vendor && (
                                                        <div className="text-xs text-gray-400">Vendor: {invoice.vendor}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(invoice.status)}
                                                {invoice.status === 'approved' && invoice.expenseId && (
                                                    <a
                                                        href="/admin/accounting"
                                                        className="flex items-center gap-1 mt-1 text-xs text-green-600 hover:text-green-800 hover:underline"
                                                        title="View in Accounting"
                                                    >
                                                        <FaReceipt className="w-3 h-3" />
                                                        <span>Expense Created</span>
                                                        <FaExternalLinkAlt className="w-2 h-2" />
                                                    </a>
                                                )}
                                                {invoice.status === 'rejected' && invoice.rejectionReason && (
                                                    <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={invoice.rejectionReason}>
                                                        Reason: {invoice.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(invoice.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {invoice.createdBy?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* View button */}
                                                    <button
                                                        onClick={() => setViewingInvoice(invoice)}
                                                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                        title="View"
                                                    >
                                                        <FaEye className="w-4 h-4" />
                                                    </button>

                                                    {/* Edit for non-approved invoices */}
                                                    {invoice.status !== 'approved' && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingInvoice(invoice);
                                                                setShowInvoiceModal(true);
                                                            }}
                                                            disabled={processingId === invoice._id}
                                                            className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                            title="Edit"
                                                        >
                                                            <FaEdit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Submit for approval (drafts only) */}
                                                    {invoice.status === 'draft' && (
                                                        <button
                                                            onClick={() => handleSubmitInvoice(invoice._id)}
                                                            disabled={processingId === invoice._id}
                                                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                            title="Submit for approval"
                                                        >
                                                            {processingId === invoice._id && processingAction === 'submit' ? (
                                                                <FaSpinner className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <FaPaperPlane className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Approve/Reject for pending (admin only) */}
                                                    {invoice.status === 'pending' && isAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveInvoice(invoice._id)}
                                                                disabled={processingId === invoice._id}
                                                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                {processingId === invoice._id && processingAction === 'approve' ? (
                                                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <FaCheck className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectingInvoiceId(invoice._id);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                disabled={processingId === invoice._id}
                                                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <FaTimes className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Delete for non-approved invoices */}
                                                    {invoice.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleDeleteInvoice(invoice._id)}
                                                            disabled={processingId === invoice._id}
                                                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {processingId === invoice._id && processingAction === 'delete' ? (
                                                                <FaSpinner className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <FaTrash className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoice Modal */}
                {showInvoiceModal && (
                    <InvoiceModal
                        invoice={editingInvoice}
                        onSave={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
                        onClose={() => {
                            setShowInvoiceModal(false);
                            setEditingInvoice(null);
                        }}
                    />
                )}

                {/* View Invoice Modal */}
                {viewingInvoice && (
                    <ViewInvoiceModal
                        invoice={viewingInvoice}
                        onClose={() => setViewingInvoice(null)}
                        formatCurrency={formatCurrency}
                        getStatusBadge={getStatusBadge}
                    />
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Reject Invoice
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter reason..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectingInvoiceId(null);
                                        setRejectionReason('');
                                    }}
                                    disabled={processingAction === 'reject'}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectInvoice}
                                    disabled={processingAction === 'reject'}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {processingAction === 'reject' && <FaSpinner className="w-4 h-4 animate-spin" />}
                                    <span>{processingAction === 'reject' ? 'Rejecting...' : 'Reject'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// Invoice Modal Component
function InvoiceModal({ invoice, onSave, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: invoice?.title || '',
        vendor: invoice?.vendor || '',
        notes: invoice?.notes || '',
        items: invoice?.items || [{ name: '', description: '', quantity: 1, unit: 'piece', unitPrice: 0 }],
        submitForApproval: false
    });

    const units = ['kg', 'g', 'L', 'mL', 'piece', 'pack', 'bottle', 'box', 'carton'];

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', description: '', quantity: 1, unit: 'piece', unitPrice: 0 }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (Number(item.quantity) * Number(item.unitPrice));
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0 || !formData.items.some(i => i.name.trim())) {
            alert('Please add at least one item');
            return;
        }
        setIsLoading(true);
        try {
            await onSave({
                ...formData,
                items: formData.items.filter(i => i.name.trim()).map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.quantity) * Number(item.unitPrice)
                }))
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {invoice ? 'Edit Invoice' : 'Create New Invoice'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="e.g., Weekly Kitchen Supplies"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vendor/Supplier
                            </label>
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Supplier name"
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Items *
                            </label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {formData.items.map((item, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                placeholder="Item name"
                                                value={item.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                value={item.unit}
                                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                            >
                                                {units.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-center justify-end">
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 mt-1">
                                        Subtotal: ₦{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Total Amount:</span>
                                <span className="text-xl font-bold text-orange-600">₦{calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {!invoice && (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="submitForApproval"
                                checked={formData.submitForApproval}
                                onChange={(e) => setFormData(prev => ({ ...prev, submitForApproval: e.target.checked }))}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor="submitForApproval" className="ml-2 text-sm text-gray-700">
                                Submit for approval immediately
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {isLoading && <FaSpinner className="w-4 h-4 animate-spin" />}
                            <span>{isLoading ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// View Invoice Modal Component
function ViewInvoiceModal({ invoice, onClose, formatCurrency, getStatusBadge }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                        <p className="text-gray-600">{invoice.title}</p>
                    </div>
                    {getStatusBadge(invoice.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-500">Created By</p>
                        <p className="font-medium">{invoice.createdBy?.name || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                    </div>
                    {invoice.vendor && (
                        <div>
                            <p className="text-sm text-gray-500">Vendor</p>
                            <p className="font-medium">{invoice.vendor}</p>
                        </div>
                    )}
                    {invoice.approvedBy && (
                        <div>
                            <p className="text-sm text-gray-500">Approved By</p>
                            <p className="font-medium">{invoice.approvedBy.name}</p>
                            <p className="text-xs text-gray-400">{new Date(invoice.approvedAt).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{item.name}</td>
                                    <td className="px-4 py-2 text-sm text-right">{item.quantity} {item.unit}</td>
                                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan="3" className="px-4 py-2 text-sm font-bold text-right">Total:</td>
                                <td className="px-4 py-2 text-lg font-bold text-right text-orange-600">{formatCurrency(invoice.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {invoice.notes && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-1">Notes</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{invoice.notes}</p>
                    </div>
                )}

                {invoice.rejectionReason && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                        <p className="text-red-600">{invoice.rejectionReason}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
