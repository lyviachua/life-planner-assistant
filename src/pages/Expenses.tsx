import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import {
  getTransactions,
  getBudgets,
  saveTransaction,
  deleteTransaction,
  saveBudget,
  deleteBudget,
  subscribeToDataChanges,
} from '@/services/dataService';
import { getAppSettings } from '@/services/storageService';
import { formatCurrency, getMonthlyFinanceMetrics } from '@/utils/selectors';
import { Transaction, Budget } from '@/types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Plus,
  Download,
  Trash2,
  Edit3,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CATEGORY_OPTIONS = [
  'Food & Dining',
  'Housing & Utilities',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health & Fitness',
  'Salary',
  'Investments',
  'General',
];

const ExpensesPage: React.FC = () => {
  const [settings] = useState(getAppSettings());

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [isBgtModalOpen, setIsBgtModalOpen] = useState(false);
  const [bgtToEdit, setBgtToEdit] = useState<Budget | null>(null);

  // Transaction form states
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txDescription, setTxDescription] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState('Credit Card');
  const [txDate, setTxDate] = useState(now.toISOString().split('T')[0]);

  // Budget form states
  const [bgtCategory, setBgtCategory] = useState('Food & Dining');
  const [bgtLimit, setBgtLimit] = useState('');

  const refreshFinanceData = () => {
    setTransactions(getTransactions());
    setBudgets(getBudgets());
  };

  useEffect(() => {
    refreshFinanceData();
    const unsubscribe = subscribeToDataChanges(refreshFinanceData);
    return unsubscribe;
  }, []);

  const financeMetrics = getMonthlyFinanceMetrics(transactions, budgets, selectedMonth, selectedYear);

  // Filter transactions for current selected Month & Year
  const filteredTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  // CSV Export Action
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transaction data to export for this selected month.');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type.toUpperCase(),
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.paymentMethod || 'Credit Card').replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Financial_Ledger_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Transaction Modal
  const openTxModal = (tx?: Transaction) => {
    if (tx) {
      setTxToEdit(tx);
      setTxType(tx.type);
      setTxAmount(String(tx.amount));
      setTxCategory(tx.category);
      setTxDescription(tx.description);
      setTxPaymentMethod(tx.paymentMethod || 'Credit Card');
      setTxDate(tx.date);
    } else {
      setTxToEdit(null);
      setTxType('expense');
      setTxAmount('');
      setTxCategory('Food & Dining');
      setTxDescription('');
      setTxPaymentMethod('Credit Card');
      setTxDate(new Date().toISOString().split('T')[0]);
    }
    setIsTxModalOpen(true);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || isNaN(Number(txAmount))) return;

    saveTransaction({
      id: txToEdit?.id,
      type: txType,
      amount: parseFloat(txAmount),
      category: txCategory,
      description: txDescription.trim() || `${txType === 'expense' ? 'Expense' : 'Income'} record`,
      paymentMethod: txPaymentMethod,
      date: txDate,
    });

    setIsTxModalOpen(false);
  };

  const handleTxDelete = (id: string) => {
    if (window.confirm('Delete this transaction record?')) {
      deleteTransaction(id);
    }
  };

  // Open Budget Modal
  const openBgtModal = (bgt?: Budget) => {
    if (bgt) {
      setBgtToEdit(bgt);
      setBgtCategory(bgt.category);
      setBgtLimit(String(bgt.monthlyLimit));
    } else {
      setBgtToEdit(null);
      setBgtCategory('Food & Dining');
      setBgtLimit('');
    }
    setIsBgtModalOpen(true);
  };

  const handleBgtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgtLimit || isNaN(Number(bgtLimit))) return;

    saveBudget({
      id: bgtToEdit?.id,
      category: bgtCategory,
      monthlyLimit: parseFloat(bgtLimit),
      month: selectedMonth,
      year: selectedYear,
    });

    setIsBgtModalOpen(false);
  };

  const handleBgtDelete = (id: string) => {
    if (window.confirm('Delete this category budget limit?')) {
      deleteBudget(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="text-teal-400" size={22} />
            Finance & Category Budget Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Income logging, expense categorization, budget thresholds, and CSV export.
          </p>
        </div>

        {/* Toolbar: Month/Year Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-semibold"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-semibold font-mono"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportCSV}

          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => openTxModal()}
          >
            + Transaction
          </Button>
        </div>
      </div>

      {/* 1. Top 4 Finance KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Income */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Income</span>
              <h3 className="text-xl font-black text-emerald-400 font-mono">
                {formatCurrency(financeMetrics.totalIncome, settings.currency)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Inflow for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </Card>

        {/* KPI 2: Total Spending */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Spending</span>
              <h3 className="text-xl font-black text-rose-400 font-mono">
                {formatCurrency(financeMetrics.totalExpense, settings.currency)}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-950/80 text-rose-400 border border-rose-800/50 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Outflow for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
        </Card>

        {/* KPI 3: Net Balance */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Net Balance</span>
              <h3
                className={`text-xl font-black font-mono ${
                  financeMetrics.netBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(financeMetrics.netBalance, settings.currency)}
              </h3>
            </div>
            <div className="p-2.5 bg-sky-950/80 text-sky-400 border border-sky-800/50 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Net Surplus/Deficit
          </p>
        </Card>

        {/* KPI 4: Budget Used % */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Budget Used</span>
              <h3 className="text-xl font-black text-amber-400 font-mono">
                {financeMetrics.budgetUtilizationPercentage}%
              </h3>
            </div>
            <div className="p-2.5 bg-amber-950/80 text-amber-400 border border-amber-800/50 rounded-lg">
              <PieChart size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            Limit: {formatCurrency(financeMetrics.totalBudgetLimit, settings.currency)}
          </p>
        </Card>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Spans): Transaction Ledger Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={`Transaction Ledger (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})`}
            headerAction={
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openTxModal()}>
                + Record Entry
              </Button>
            }
          >
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 text-slate-300 font-mono whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge label={tx.category} variant="teal" size="sm" />
                        </td>
                        <td className="py-3 px-3 text-slate-200 font-semibold max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                          {tx.paymentMethod || 'Credit Card'}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openTxModal(tx)}
                              className="p-1 text-slate-400 hover:text-teal-400 rounded hover:bg-slate-800"
                              title="Edit transaction"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleTxDelete(tx.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                              title="Delete transaction"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Wallet size={24} />}
                title="No Transactions Logged"
                description={`No income or expenses recorded for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`}
                actionLabel="+ Record Entry"
                onAction={() => openTxModal()}
              />
            )}
          </Card>
        </div>

        {/* Right Column (1 Span): Category Budgets & Visual Progress */}
        <div className="space-y-6">
          <Card
            title="Category Budgets & Progress"
            headerAction={
              <Button
                variant="outline"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => openBgtModal()}
              >
                + Set Budget
              </Button>
            }
          >
            {financeMetrics.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {financeMetrics.categoryBreakdown.map((item) => {
                  const isDanger = item.percentage >= 100;
                  const isWarning = item.percentage >= 80 && !isDanger;

                  return (
                    <div key={item.category} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{item.category}</span>
                        <div className="flex items-center space-x-2">
                          {isDanger && (
                            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase flex items-center gap-0.5">
                              <AlertTriangle size={10} /> Over Limit
                            </span>
                          )}
                          {isWarning && (
                            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase flex items-center gap-0.5">
                              <AlertTriangle size={10} /> Warning 80%
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const targetBgt = budgets.find((b) => b.id === item.budgetId);
                              openBgtModal(targetBgt);
                            }}
                            className="text-slate-500 hover:text-teal-400 p-0.5"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleBgtDelete(item.budgetId)}
                            className="text-slate-500 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Spent: {formatCurrency(item.spent, settings.currency)}</span>
                        <span>Limit: {formatCurrency(item.limit, settings.currency)}</span>
                      </div>

                      {/* Visual Progress Bar with Threshold Warning/Danger */}
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all ${
                            isDanger
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-400'
                              : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-500">
                        {item.percentage}% used
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<PieChart size={22} />}
                title="No Budgets Set"
                description="Set category spending limits to display visual progress indicators."
                actionLabel="+ Set Budget"
                onAction={() => openBgtModal()}
              />
            )}
          </Card>
        </div>
      </div>

      {/* 1. Transaction Create / Edit Modal */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={txToEdit ? 'Edit Transaction' : 'Record Transaction'}
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entry Type" required>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income (Inflow)</option>
              </select>
            </FormField>

            <FormField label="Amount" required>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Payment Method">
              <select
                value={txPaymentMethod}
                onChange={(e) => setTxPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
              </select>
            </FormField>
          </div>

          <FormField label="Transaction Date" required>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none font-mono"
            />
          </FormField>

          <FormField label="Description">
            <input
              type="text"
              placeholder="e.g. Weekly Grocery Supplies or Salary Deposit"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsTxModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {txToEdit ? 'Save Changes' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Category Budget Limit Modal */}
      <Modal
        isOpen={isBgtModalOpen}
        onClose={() => setIsBgtModalOpen(false)}
        title={bgtToEdit ? 'Edit Category Budget Limit' : 'Set Category Budget Limit'}
      >
        <form onSubmit={handleBgtSubmit} className="space-y-4">
          <FormField label="Category" required>
            <select
              value={bgtCategory}
              onChange={(e) => setBgtCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            >
              {CATEGORY_OPTIONS.filter((c) => c !== 'Salary' && c !== 'Investments').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Monthly Limit Amount" required>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 1200"
              value={bgtLimit}
              onChange={(e) => setBgtLimit(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </FormField>

          <p className="text-[11px] text-slate-400">
            Setting budget for: <span className="font-bold text-slate-200">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          </p>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsBgtModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Budget Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;