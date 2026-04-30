import React, { useEffect, useState } from "react";
import {
  Plus,
  X,
  Target,
  Calendar,
  DollarSign,
  Tag,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  PieChart,
  CreditCard,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react";

import axios from "axios";

const BRAND_COLOR = "#30c2b7";
const BRAND_DARK = "#26a39a";

const MonthlyBudgetGoal = () => {
  const [goals, setGoals] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [payingBillId, setPayingBillId] = useState(null);
  const [formError, setFormError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7),
    totalLimit: "",
    categories: [],
    notes: "",
  });

  const [errors, setErrors] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/goals/${user.email}`);
      setGoals(res.data.goals);
      setUpcomingBills(res.data.bills);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (user?.email) fetchData();
  }, []);

  // --- Helpers ---
  const getProgressColor = (percent) => {
    if (percent <= 70) return "bg-brand";
    if (percent <= 90) return "bg-amber-500";
    return "bg-red-500";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.month) newErrors.month = "Month is required";
    if (!formData.totalLimit || parseFloat(formData.totalLimit) <= 0)
      newErrors.totalLimit = "Valid total budget required";

    if (formData.categories.length === 0) {
      newErrors.categories = "Please add at least one category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...formData.categories];
    newCategories[index][field] = value;
    setFormData((prev) => ({ ...prev, categories: newCategories }));
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: null }));
  };

  const addCategory = () => {
    const newCat = {
      key: `custom-${Date.now()}`,
      label: "",
      icon: "",
      limit: "",
    };
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  };

  const removeCategory = (index) => {
    const newCategories = formData.categories.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, categories: newCategories }));
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        userEmail: user.email,
        month: formData.month,
        totalLimit: parseFloat(formData.totalLimit),
        categories: formData.categories.map((c) => ({
          label: c.label,
          limit: parseFloat(c.limit),
        })),
        goalId: editingId || undefined,
      };

      const res = await axios.post("http://localhost:5001/goals", payload);

      // Check if goal already exists for this month
      if (res.data.action === "edit" || res.status === 409) {
        setFormError({
          type: "exists",
          message: "A goal already exists for this month. Would you like to edit it instead?",
          goalId: res.data.existingGoalId,
        });
        return;
      }

      await fetchData();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setFormError({
          type: "exists",
          message: "A goal already exists for this month. Would you like to edit it instead?",
          goalId: error.response.data.existingGoalId,
        });
      } else {
        setFormError({
          type: "error",
          message: error.response?.data?.message || "Error saving goal",
        });
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      month: new Date().toISOString().slice(0, 7),
      totalLimit: "",
      categories: [],
      notes: "",
    });
    setErrors({});
    setFormError(null);
    setEditingId(null);
  };

  const openEdit = (goal) => {
    setEditingId(goal.id);
    setFormData({
      month: goal.month,
      totalLimit: goal.totalLimit.toString(),
      categories: goal.categories.map((c) => ({
        ...c,
        limit: c.limit.toString(),
      })),
      notes: goal.notes || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenNewGoal = () => {
    // Check if a goal already exists for the default month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingGoal = goals.find((g) => g.month === currentMonth);

    if (existingGoal) {
      // Auto-open edit form for existing goal
      openEdit(existingGoal);
    } else {
      resetForm();
      setEditingId(null);
      setIsFormOpen(true);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Are you sure you want to delete this goal and all associated bills?")) {
      try {
        await axios.delete(`http://localhost:5001/goals/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
    }
  };

  const handlePayBill = async (id) => {
    try {
      setPayingBillId(id);
      await axios.put(`http://localhost:5001/bills/pay/${id}`);

      // Remove the bill from state immediately
      setUpcomingBills((prev) => prev.filter((bill) => bill.id !== id));

      // Refresh all data to update spent amounts
      await fetchData();
    } catch (error) {
      console.error("Error paying bill:", error);
    } finally {
      setPayingBillId(null);
    }
  };

  // --- Derived Data ---
  const pendingBillsCount = upcomingBills.length;
  const pendingBillsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <style>{`
        .text-brand { color: ${BRAND_COLOR}; }
        .bg-brand { background-color: ${BRAND_COLOR}; }
        .border-brand { border-color: ${BRAND_COLOR}; }
        .hover-brand:hover { background-color: ${BRAND_DARK}; }
        .card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        .pay-btn-transition {
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        
        .bill-exit {
          animation: slideOut 0.3s ease-out forwards;
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Section: Header & Pending Bills Summary */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Monthly Budget Goals
            </h1>
            <p className="text-slate-500 mt-1">
              Set limits for specific sectors within your monthly budget (one per month)
            </p>
          </div>

          <button
            onClick={handleOpenNewGoal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover-brand shadow-lg shadow-teal-500/20 transition-all w-full lg:w-auto"
          >
            <Plus size={18} /> Set New Goal
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Goals List */}
          <div className="lg:col-span-2 space-y-6">
            {goals.length === 0 ? (
              <div className="card p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <Target size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No budget goals set yet
                </h3>
                <p className="text-slate-500 mt-1 max-w-md">
                  Create your first monthly budget to start tracking your spending.
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                  }}
                  className="mt-6 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover-brand transition-all"
                >
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => {
                  const monthName = new Date(
                    goal.month + "-01",
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  });

                  const totalSpent = Object.values(goal.spent).reduce((a, b) => a + b, 0);
                  const overallPercent = Math.min(
                    (totalSpent / goal.totalLimit) * 100,
                    100,
                  );

                  return (
                    <div
                      key={goal.id}
                      className="card p-6 border-l-4 border-brand flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <Calendar size={14} /> {monthName}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">
                            ${goal.totalLimit.toLocaleString()} Budget
                          </h3>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(goal)}
                            className="p-1.5 text-slate-400 hover:text-brand hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit Goal"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Goal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Overall Progress */}
                      <div className="mb-5">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 font-medium">
                            Total Spent
                          </span>
                          <span
                            className={`font-bold ${
                              totalSpent > 0 && overallPercent <= 70
                                ? "text-brand"
                                : overallPercent > 90
                                  ? "text-red-600"
                                  : overallPercent > 70
                                    ? "text-amber-600"
                                    : "text-slate-600"
                            }`}
                          >
                            ${totalSpent.toLocaleString()} / $
                            {goal.totalLimit.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(overallPercent)}`}
                            style={{ width: `${overallPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      <div className="space-y-3 flex-1">
                        {goal.categories.map((cat) => {
                          const limit = cat.limit || 0;
                          const spent = goal.spent[cat.key] || 0;
                          const percent =
                            limit > 0
                              ? Math.min((spent / limit) * 100, 100)
                              : 0;

                          return (
                            <div key={cat.key} className="group">
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                                  <span className="text-base">{cat.icon}</span>{" "}
                                  {cat.label}
                                </span>
                                <span className="text-slate-500">
                                  ${spent} / ${limit}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {goal.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 italic">
                          "{goal.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Upcoming Bills List */}
          <div className="space-y-6">
            <div className="card p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-brand" size={20} />
                  Upcoming Bills
                </h2>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {upcomingBills.length} Pending
                </span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                {upcomingBills.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No pending bills.</p>
                    <p className="text-xs mt-1">
                      Bills appear here when you set goals.
                    </p>
                  </div>
                ) : (
                  upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className={`group relative flex items-center p-4 rounded-xl border border-slate-100 hover:border-brand hover:bg-slate-50 transition-all duration-200 ${
                        payingBillId === bill.id ? "bill-exit" : ""
                      }`}
                    >
                      {/* Icon Box */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center mr-4">
                        <CreditCard size={18} />
                      </div>

                      {/* Bill Info */}
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-bold text-slate-900 truncate">
                          {bill.name}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={10} /> Due:{" "}
                          {new Date(bill.dueDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>

                      {/* Amount & Action */}
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-brand">${bill.amount}</p>

                        {/* Pay Button */}
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          disabled={payingBillId === bill.id}
                          className="pay-btn-transition opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-teal-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {payingBillId === bill.id ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Check size={12} />
                          )}
                          {payingBillId === bill.id ? "Paying..." : "Pay Now"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar card">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="text-brand" size={20} />
                {editingId ? "Edit Budget Goal" : "Set Monthly Budget Goal"}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Alert */}
              {formError && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    formError.type === "exists"
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <AlertCircle
                    size={18}
                    className={formError.type === "exists" ? "text-blue-600 mt-0.5" : "text-red-600 mt-0.5"}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        formError.type === "exists" ? "text-blue-900" : "text-red-900"
                      }`}
                    >
                      {formError.message}
                    </p>
                    {formError.type === "exists" && (
                      <button
                        type="button"
                        onClick={() => {
                          const existingGoal = goals.find(
                            (g) => g.id === formError.goalId
                          );
                          if (existingGoal) {
                            openEdit(existingGoal);
                          }
                        }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Edit Existing Goal →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Month & Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    disabled={editingId}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      editingId ? "bg-slate-50 cursor-not-allowed" : ""
                    } ${errors.month ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                  />
                  {errors.month && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.month}
                    </p>
                  )}
                  {editingId && (
                    <p className="mt-1 text-xs text-slate-500">
                      Cannot change month while editing
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Monthly Budget <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="number"
                      step="0.01"
                      name="totalLimit"
                      value={formData.totalLimit}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.totalLimit ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Your total income or spending limit for the month.
                  </p>
                  {errors.totalLimit && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.totalLimit}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Category Limits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <PieChart size={16} className="text-brand" /> Sector
                    Allocations
                  </label>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="text-xs font-semibold text-brand hover:text-teal-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Sector
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {formData.categories.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-md border border-slate-200 text-lg">
                        {cat.icon}
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) =>
                            handleCategoryChange(index, "label", e.target.value)
                          }
                          placeholder="Sector Name (e.g. Rent)"
                          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={cat.limit}
                            onChange={(e) =>
                              handleCategoryChange(
                                index,
                                "limit",
                                e.target.value,
                              )
                            }
                            placeholder="Limit"
                            className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove Sector"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {formData.categories.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-slate-400 text-sm">
                        No sectors added yet.
                      </p>
                      <button
                        type="button"
                        onClick={addCategory}
                        className="mt-2 text-brand text-sm font-semibold hover:underline"
                      >
                        Add your first sector
                      </button>
                    </div>
                  )}
                </div>
                {errors.categories && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.categories}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover-brand shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={16} />{" "}
                      {editingId ? "Update Goal" : "Save Goal"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyBudgetGoal;