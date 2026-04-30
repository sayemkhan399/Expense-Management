import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Filter, 
  ArrowRight,
  DollarSign,
  CreditCard,
  Loader2,
  Calendar,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowDown,
  Plus
} from 'lucide-react';
import axios from 'axios';

const BRAND_COLOR = '#30c2b7';
const BRAND_DARK = '#26a39a';

const ExpressDashboard = () => {
  const [state, setState] = useState({
    balance: 0,
    overallBalance: 0,
    originalBudget: 3200.00,
    monthlyBudget: 3200.00,
    totalIncome: 0,
    totalExpense: 0,
    paidBillsAmount: 0,
    totalExpenseWithBills: 0,
    extraExpense: 0,
    transactions: [],
    paidBills: [],
    budgetPercent: 0,
    netCashFlow: 0,
    budgetRemaining: 0,
    hasGoal: false,
    budgetBreakdown: {}
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [billsModalOpen, setBillsModalOpen] = useState(false);
  const [budgetBreakdownOpen, setBudgetBreakdownOpen] = useState(false);
  const [balanceBreakdownOpen, setBalanceBreakdownOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [displayMonth, setDisplayMonth] = useState(new Date().toISOString().slice(0, 7));

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchDashboardData = async (monthFilter = displayMonth) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/dashboard/${user.email}`, {
        params: { month: monthFilter }
      });
      setState(res.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (filter, monthFilter = displayMonth) => {
    try {
      const res = await axios.get(
        `http://localhost:5001/dashboard/chart/${user.email}/${filter}`,
        { params: { month: monthFilter } }
      );
      setChartData(res.data);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchDashboardData(displayMonth);
      fetchChartData('all', displayMonth);
    }
  }, [displayMonth]);

  useEffect(() => {
    if (user?.email) {
      const filterMap = {
        'all': 'all',
        'expense': 'expense',
        'income': 'income',
        'extra': 'extra'
      };
      fetchChartData(filterMap[activeFilter], displayMonth);
    }
  }, [activeFilter]);

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleMonthFilter = () => {
    setDisplayMonth(selectedMonth);
    setFilterModalOpen(false);
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    showToast(`Filtered dashboard for: ${monthName}`);
  };

  const handleResetFilter = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelectedMonth(currentMonth);
    setDisplayMonth(currentMonth);
    setActiveFilter('all');
    setFilterModalOpen(false);
    showToast("Filter reset to current month");
  };

  const getMonthYearDisplay = () => {
    return new Date(displayMonth + '-01').toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getBudgetStatus = () => {
    if (!state.hasGoal) {
      return { status: 'warning', message: 'No budget set for this month' };
    }
    if (state.budgetPercent >= 100) {
      return { status: 'danger', message: 'Bills budget exceeded!' };
    }
    if (state.budgetPercent >= 80) {
      return { status: 'warning', message: '80% of remaining budget used for bills' };
    }
    return { status: 'healthy', message: 'Budget on track' };
  };

  const budgetStatus = getBudgetStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand mx-auto mb-4" size={56} />
          <p className="text-slate-600 font-semibold mt-2">Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-800">
      <style>{`
        :root { 
          --brand-color: #30c2b7; 
          --brand-dark: #26a39a; 
        }
        
        .text-brand { 
          color: var(--brand-color); 
        }
        
        .bg-brand { 
          background-color: var(--brand-color); 
        }
        
        .border-brand { 
          border-color: var(--brand-color); 
        }
        
        .hover-brand:hover { 
          background-color: var(--brand-dark);
          color: white;
        }
        
        .card {
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        
        .card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }
        
        .card-active { 
          border: 2px solid var(--brand-color); 
          background: linear-gradient(135deg, rgba(48, 194, 183, 0.05) 0%, rgba(48, 194, 183, 0.02) 100%);
          box-shadow: 0 2px 8px rgba(48, 194, 183, 0.15);
        }
        
        .stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        
        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card { 
          animation: slideUp 0.4s ease-out; 
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-bounce backdrop-blur-sm border border-slate-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ==================== HEADER SECTION ==================== */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Financial Overview</h1>
              <p className="text-lg text-slate-600">
                Track your balance, budget, and cash flow for 
                <span className="font-bold text-brand ml-2">{getMonthYearDisplay()}</span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {state.hasGoal && (
                <button
                  onClick={() => setBudgetBreakdownOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <ArrowDown size={18} /> Budget Breakdown
                </button>
              )}
              {state.paidBills.length > 0 && (
                <button
                  onClick={() => setBillsModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <CheckCircle size={18} /> Bills ({state.paidBills.length})
                </button>
              )}
              <button
                onClick={() => setFilterModalOpen(true)}
                className="px-6 py-2.5 bg-brand text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
              >
                <Calendar size={18} /> Filter by Month
              </button>
            </div>
          </div>

          {/* ==================== ALERT BANNERS ==================== */}
          {!state.hasGoal && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg flex items-start gap-4 mb-6">
              <AlertTriangle size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg">No Budget Set</h3>
                <p className="text-sm text-amber-800 mt-1">
                  You haven't set a budget for {getMonthYearDisplay()}. Create a budget in the Goals section to track your expenses.
                </p>
              </div>
            </div>
          )}

          {state.hasGoal && budgetStatus.status === 'danger' && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start gap-4 mb-6">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg">Budget Exceeded!</h3>
                <p className="text-sm text-red-800 mt-1">
                  After deducting ${state.totalExpense.toFixed(2)} in transaction expenses from your ${state.budgetBreakdown.originalBudget?.toFixed(2)} budget, 
                  you have ${state.budgetBreakdown.afterDeduction?.toFixed(2)} remaining. Your paid bills of ${state.paidBillsAmount.toFixed(2)} exceed this by ${Math.abs(state.budgetRemaining).toFixed(2)}.
                </p>
              </div>
            </div>
          )}

          {state.hasGoal && budgetStatus.status === 'warning' && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg flex items-start gap-4 mb-6">
              <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 text-lg">{budgetStatus.message}</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Remaining: ${state.monthlyBudget.toFixed(2)} | Bills: ${state.paidBillsAmount.toFixed(2)} | Available: ${state.budgetRemaining.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ==================== STATS GRID ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          
          {/* CARD 1: TOTAL BALANCE */}
          <div 
            className="card p-6 border-l-4 border-l-blue-500 cursor-pointer group"
            onClick={() => setBalanceBreakdownOpen(true)}
          >
            <p className="stat-label text-slate-500 mb-3">Total Balance</p>
            <h3 className="stat-value text-slate-900 mb-4">
              ${state.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500 font-medium">Click for details</span>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Wallet size={20} />
              </div>
            </div>
          </div>
          
          {/* CARD 2: ORIGINAL BUDGET */}
          <div className="card p-6 border-l-4 border-l-purple-500">
            <p className="stat-label text-slate-500 mb-3">Budget Set</p>
            <h3 className="stat-value text-slate-900 mb-4">
              ${state.originalBudget.toLocaleString()}
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500 font-medium">Original</span>
              <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                <DollarSign size={20} />
              </div>
            </div>
          </div>

          {/* CARD 3: BUDGET AFTER DEDUCTION */}
          <div className="card p-6 border-l-4 border-l-brand">
            <p className="stat-label text-slate-500 mb-3">After Deduction</p>
            <h3 className="stat-value text-brand mb-4">
              ${state.monthlyBudget.toLocaleString()}
            </h3>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  state.budgetPercent >= 100 ? 'bg-red-500' :
                  state.budgetPercent >= 80 ? 'bg-yellow-500' :
                  'bg-brand'
                }`}
                style={{ width: `${Math.min(state.budgetPercent, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500 font-medium">{Math.round(state.budgetPercent)}% Used</span>
              <div className="p-2.5 bg-brand/10 rounded-lg text-brand">
                <ArrowDown size={20} />
              </div>
            </div>
          </div>

          {/* CARD 4: TRANSACTION EXPENSES */}
          <div 
            className="card p-6 border-l-4 border-l-red-500 cursor-pointer group hover:border-l-red-600"
            onClick={() => setActiveFilter('expense')}
          >
            <p className="stat-label text-slate-500 mb-3">Expenses</p>
            <h3 className="stat-value text-red-600 mb-4">
              ${state.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500 font-medium">Deducted</span>
              <div className="p-2.5 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-100 transition-colors">
                <TrendingDown size={20} />
              </div>
            </div>
          </div>

          {/* CARD 5: TOTAL INCOME */}
          <div 
            className="card p-6 border-l-4 border-l-emerald-500 cursor-pointer group hover:border-l-emerald-600"
            onClick={() => setActiveFilter('income')}
          >
            <p className="stat-label text-slate-500 mb-3">Income</p>
            <h3 className="stat-value text-emerald-600 mb-4">
              ${state.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-xs text-slate-500 font-medium">Added</span>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MAIN CONTENT GRID ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CHART SECTION */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeFilter === 'income' ? 'Income Breakdown' : 
                     activeFilter === 'extra' ? 'High-Value Expenses' : 
                     'Spending Breakdown'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Including paid bills from goals</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                  {activeFilter.toUpperCase()}
                </span>
              </div>
              <div className="h-96 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                          backgroundColor: '#1e293b',
                          color: '#f1f5f9',
                          padding: '12px 16px'
                        }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Filter size={56} className="mb-3 opacity-20" />
                    <p className="text-base font-medium">No data available</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QUICK SUMMARY SECTION */}
          <div>
            <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative h-full">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-1">Quick Summary</h2>
                <p className="text-slate-400 text-sm mb-8">Financial snapshot</p>
                
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-white/5 backdrop-blur border border-white/10">
                    <p className="text-slate-300 text-sm font-medium mb-1">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${
                      state.netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      ${state.netCashFlow.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 backdrop-blur border border-white/10">
                    <p className="text-slate-300 text-sm font-medium mb-1">Budget Remaining</p>
                    <p className={`text-2xl font-bold ${
                      state.budgetRemaining < 0 ? 'text-red-400' :
                      state.budgetRemaining < 200 ? 'text-yellow-400' :
                      'text-brand'
                    }`}>
                      ${state.budgetRemaining.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 backdrop-blur border border-white/10">
                    <p className="text-slate-300 text-sm font-medium mb-1">Paid Bills</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${state.paidBillsAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 backdrop-blur border border-white/10">
                    <p className="text-slate-300 text-sm font-medium mb-1">Transactions</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {state.transactions.length}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveFilter('all')}
                  className="w-full mt-8 py-3 bg-brand hover-brand text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Reset View <ArrowRight size={18} />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== BALANCE BREAKDOWN MODAL ==================== */}
      {balanceBreakdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Balance Breakdown</h2>
              <button 
                onClick={() => setBalanceBreakdownOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Overall Balance</h3>
                    <p className="text-sm text-slate-600 mt-1">All-time cumulative</p>
                  </div>
                  <span className="text-3xl font-bold text-blue-600">${state.overallBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <Plus className="text-slate-400" size={20} />
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Total Income</h3>
                    <p className="text-sm text-slate-600 mt-1">{getMonthYearDisplay()}</p>
                  </div>
                  <span className="text-3xl font-bold text-emerald-600">+ ${state.totalIncome.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <Plus className="text-slate-400" size={20} />
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Monthly Budget</h3>
                    <p className="text-sm text-slate-600 mt-1">After deduction</p>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">+ ${state.monthlyBudget.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="text-slate-400" size={20} />
              </div>

              {/* Result */}
              <div className="p-5 bg-gradient-to-r from-brand/10 to-brand/5 border-2 border-brand rounded-xl">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-lg">Total Balance</h3>
                  <span className="text-4xl font-bold text-brand">${state.balance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBalanceBreakdownOpen(false)}
              className="w-full mt-8 py-3 bg-brand text-white rounded-xl font-bold hover-brand transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ==================== BUDGET BREAKDOWN MODAL ==================== */}
      {budgetBreakdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Budget Breakdown</h2>
              <button 
                onClick={() => setBudgetBreakdownOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Original Budget</h3>
                    <p className="text-sm text-slate-600 mt-1">{getMonthYearDisplay()}</p>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">${state.budgetBreakdown.originalBudget?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="text-slate-400" size={20} />
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Transaction Expenses</h3>
                    <p className="text-sm text-slate-600 mt-1">Deducted from budget</p>
                  </div>
                  <span className="text-3xl font-bold text-red-600">- ${state.budgetBreakdown.transactionDeduction?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="text-slate-400" size={20} />
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-brand/10 border border-brand rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Budget Remaining</h3>
                    <p className="text-sm text-slate-600 mt-1">For bills</p>
                  </div>
                  <span className="text-3xl font-bold text-brand">${state.budgetBreakdown.afterDeduction?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="text-slate-400" size={20} />
              </div>

              {/* Step 4 */}
              <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Paid Bills</h3>
                    <p className="text-sm text-slate-600 mt-1">Deducted from remaining</p>
                  </div>
                  <span className="text-3xl font-bold text-green-600">- ${state.budgetBreakdown.billsAgainstRemaining?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowDown className="text-slate-400" size={20} />
              </div>

              {/* Final Result */}
              <div className={`p-5 rounded-xl border-2 ${
                state.budgetRemaining >= 0 
                  ? 'bg-emerald-50 border-emerald-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-lg">Final Remaining</h3>
                  <span className={`text-4xl font-bold ${
                    state.budgetRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    ${state.budgetRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBudgetBreakdownOpen(false)}
              className="w-full mt-8 py-3 bg-brand text-white rounded-xl font-bold hover-brand transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ==================== PAID BILLS MODAL ==================== */}
      {billsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Paid Bills</h2>
              <button 
                onClick={() => setBillsModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              {state.paidBills.length > 0 ? (
                state.paidBills.map((bill) => (
                  <div key={bill.id} className="p-4 bg-emerald-50 border-l-4 border-l-emerald-600 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">{bill.name}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Category: <span className="font-semibold">{bill.category}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-emerald-600">${bill.amount.toFixed(2)}</span>
                      <CheckCircle className="text-emerald-600" size={24} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-8 text-base">No paid bills for this month</p>
              )}
            </div>

            <div className="p-4 bg-slate-100 rounded-xl flex justify-between items-center mb-6">
              <span className="font-bold text-slate-900 text-lg">Total Paid Bills</span>
              <span className="text-3xl font-bold text-emerald-600">${state.paidBillsAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setBillsModalOpen(false)}
              className="w-full py-3 bg-brand text-white rounded-xl font-bold hover-brand transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ==================== MONTH FILTER MODAL ==================== */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-slate-900">Filter by Month</h2>
              <button 
                onClick={() => setFilterModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Select Month & Year</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-base font-medium outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Quick Select</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                    className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7))}
                    className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 7))}
                    className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    3 Months Ago
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 7))}
                    className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    6 Months Ago
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={handleResetFilter} 
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={handleMonthFilter} 
                  className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover-brand transition-all"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpressDashboard;