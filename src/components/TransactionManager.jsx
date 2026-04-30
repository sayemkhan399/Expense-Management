import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Search, Filter, Download, Calendar, X, Upload, Loader2,
  AlertCircle, Building2, Tag, Wallet, CreditCard, ArrowUpRight,
  ArrowDownRight, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, MoreHorizontal,
  Edit2, Trash2, Eye
} from 'lucide-react';
import axios from 'axios';

const BRAND_COLOR = '#30c2b7';
const BRAND_DARK = '#26a39a';

const TransactionManager = () => {
  // State Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const itemsPerPage = 8;
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  // Form State - NO STATUS
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    category: '',
    type: 'expense',
    amount: '',
    method: 'card',
    reference: '',
    notes: '',
    receipt: null
  });
  const [errors, setErrors] = useState({});

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5001/transactions/${user.email}`
      );
      // Ensure all transactions have required fields
      const normalizedTransactions = (res.data || []).map(tx => ({
        ...tx,
        type: tx.type || 'expense',
        method: tx.method || 'card',
        reference: tx.reference || '',
        category: tx.category || 'Other'
      }));
      setTransactions(normalizedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    if (user?.email) fetchTransactions();
  }, []);

  // Modal Handlers
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsViewModalOpen(false);
      }
    };
    const handleBackdrop = (e) => {
      if (e.target === modalRef.current) setIsModalOpen(false);
      if (e.target === viewModalRef.current) setIsViewModalOpen(false);
    };
    if (isModalOpen || isViewModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
      window.addEventListener('mousedown', handleBackdrop);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleBackdrop);
    };
  }, [isModalOpen, isViewModalOpen]);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor required';
    if (!formData.category.trim()) newErrors.category = 'Category required';
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount required';
    if (!formData.date) newErrors.date = 'Date required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      if (editingId) {
        // UPDATE TRANSACTION
        await axios.put(`http://localhost:5001/transactions/${editingId}`, {
          date: formData.date,
          vendor: formData.vendor,
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          method: formData.method,
          reference: formData.reference,
        });
      } else {
        // CREATE TRANSACTION
        await axios.post("http://localhost:5001/transactions", {
          userEmail: user.email,
          date: formData.date,
          vendor: formData.vendor,
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          method: formData.method,
          reference: formData.reference,
        });
      }

      await fetchTransactions();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:5001/transactions/${id}`);
        setIsViewModalOpen(false);
        await fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const openEditForm = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      date: transaction.date || new Date().toISOString().split('T')[0],
      vendor: transaction.vendor || '',
      category: transaction.category || '',
      type: transaction.type || 'expense',
      amount: (transaction.amount || 0).toString(),
      method: transaction.method || 'card',
      reference: transaction.reference || '',
      notes: transaction.notes || '',
      receipt: null
    });
    setIsModalOpen(true);
  };

  const openViewModal = (transaction) => {
    setViewingTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      category: '',
      type: 'expense',
      amount: '',
      method: 'card',
      reference: '',
      notes: '',
      receipt: null
    });
    setErrors({});
    setEditingId(null);
  };

  // Filtering & Pagination
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = (tx.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (tx.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // UI Helpers
  const getTypeLabel = (type) => {
    const safeType = type || 'expense';
    return safeType.charAt(0).toUpperCase() + safeType.slice(1);
  };

  const getTypeIcon = (type) => {
    const safeType = type || 'expense';
    return safeType === 'income' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <style>{`
        .text-brand { color: ${BRAND_COLOR}; }
        .bg-brand { background-color: ${BRAND_COLOR}; }
        .border-brand { border-color: ${BRAND_COLOR}; }
        .hover-brand:hover { background-color: ${BRAND_DARK}; }
        .focus-ring-brand:focus-within { ring-color: ${BRAND_COLOR}; }
        
        .card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
            <p className="text-slate-500 mt-1">Manage, track and reconcile all financial activity</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by vendor "
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover-brand shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus size={18} /> Add Transaction
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4 hidden md:table-cell">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Method</th>
                  <th className="px-6 py-4 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">{tx.id || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{tx.date || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{tx.vendor || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          <Tag size={12} /> {tx.category || 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${(tx.type || 'expense') === 'income' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {getTypeIcon(tx.type)}
                          {getTypeLabel(tx.type)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${(tx.type || 'expense') === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {(tx.type || 'expense') === 'income' ? '+' : '-'}${(tx.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell capitalize text-slate-600">{tx.method || 'card'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openViewModal(tx)}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-teal-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditForm(tx)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-full">
                          <Search size={24} className="text-slate-400" />
                        </div>
                        <p className="font-semibold text-slate-900">No transactions found</p>
                        <p className="text-sm">Try adjusting your search or add a new transaction</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && viewingTransaction && (
        <div ref={viewModalRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 card">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Transaction Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ID & Date Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transaction ID</p>
                  <p className="font-mono text-sm text-slate-900">{viewingTransaction.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm text-slate-900">{viewingTransaction.date || 'N/A'}</p>
                </div>
              </div>

              {/* Vendor & Category Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendor</p>
                  <p className="text-sm font-semibold text-slate-900">{viewingTransaction.vendor || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-sm text-slate-900">{viewingTransaction.category || 'Other'}</p>
                </div>
              </div>

              {/* Amount Row */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                <p className={`text-lg font-bold ${(viewingTransaction.type || 'expense') === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {(viewingTransaction.type || 'expense') === 'income' ? '+' : '-'}${(viewingTransaction.amount || 0).toFixed(2)}
                </p>
              </div>

              {/* Type & Method Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${(viewingTransaction.type || 'expense') === 'income' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                    {getTypeIcon(viewingTransaction.type)}
                    {getTypeLabel(viewingTransaction.type)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Method</p>
                  <p className="text-sm capitalize text-slate-900">{viewingTransaction.method || 'card'}</p>
                </div>
              </div>

              {/* Reference Row */}
              {viewingTransaction.reference && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reference / Invoice #</p>
                  <p className="text-sm text-slate-900">{viewingTransaction.reference}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditForm(viewingTransaction);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => {
                    handleDeleteTransaction(viewingTransaction.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div ref={modalRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 card">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 id="modal-title" className="text-xl font-bold text-slate-900">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 mt-0.5" />
                  <p className="text-sm font-medium text-red-900">{errors.submit}</p>
                </div>
              )}

              {/* Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-48">
                {['expense', 'income'].map((type) => (
                  <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === type ? (type === 'income' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange}
                      className={`w-full pl-7 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.amount ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} placeholder="0.00" />
                  </div>
                  {errors.amount && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                  {errors.date && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.date}</p>}
                </div>
              </div>

              {/* Vendor & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" name="vendor" value={formData.vendor} onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.vendor ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} placeholder="Company or individual" />
                  </div>
                  {errors.vendor && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.vendor}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select name="category" value={formData.category} onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white ${errors.category ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                      <option value="">Select category</option>
                      <option value="Software">Software & Tools</option>
                      <option value="Travel">Travel & Transport</option>
                      <option value="Revenue">Revenue / Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Contractor">Contractor / Freelancer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.category && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.category}</p>}
                </div>
              </div>

              {/* Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select name="method" value={formData.method} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white">
                      <option value="card">Credit / Debit Card</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reference / Invoice #</label>
                  <input type="text" name="reference" value={formData.reference} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="INV-001, TX-884" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }} className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover-brand shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {isSubmitting ? 'Processing...' : (editingId ? 'Update Transaction' : 'Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;