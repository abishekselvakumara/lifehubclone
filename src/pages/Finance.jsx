import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Calendar, PieChart, 
  TrendingUp, TrendingDown, DollarSign, X, Edit2, Trash2,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import supabase from '../lib/supabase'; // Using Supabase directly

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'food', 'transport', 'shopping', 'entertainment', 'bills', 'salary', 'other'
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, filterType, selectedCategory, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      setTransactions(data || []);
      setFilteredTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    setFilteredTransactions(filtered);
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    try {
      const amount = parseFloat(newTransaction.amount);
      
      if (editingTransaction) {
        // Update existing transaction
        const { data, error } = await supabase
          .from('finance')
          .update({
            description: newTransaction.description,
            amount: amount,
            type: newTransaction.type,
            category: newTransaction.category,
            date: newTransaction.date
          })
          .eq('id', editingTransaction.id)
          .select();

        if (error) throw error;
        
        setTransactions(transactions.map(t => 
          t.id === editingTransaction.id ? data[0] : t
        ));
      } else {
        // Insert new transaction
        const { data, error } = await supabase
          .from('finance')
          .insert([{
            description: newTransaction.description,
            amount: amount,
            type: newTransaction.type,
            category: newTransaction.category,
            date: newTransaction.date
          }])
          .select();

        if (error) throw error;
        
        setTransactions([data[0], ...transactions]);
      }
      
      setShowAddModal(false);
      setEditingTransaction(null);
      resetNewTransaction();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    
    try {
      const { error } = await supabase
        .from('finance')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction. Please try again.');
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description || '',
      amount: transaction.amount?.toString() || '',
      type: transaction.type || 'expense',
      category: transaction.category || 'food',
      date: transaction.date || new Date().toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const resetNewTransaction = () => {
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      category: 'food',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Calculate totals with safe number handling
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const balance = totalIncome - totalExpenses;

  // Chart data with safe handling
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => format(date, 'yyyy-MM-dd'));

  const trendData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date === date);
    return {
      date: format(new Date(date), 'MMM dd'),
      income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
      expenses: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
    };
  });

  const categoryData = categories.map(category => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  })).filter(c => c.value > 0);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
      const csvData = transactions.map(t => [
        t.date || '', 
        t.description || '', 
        t.category || '', 
        t.type || '', 
        t.amount || 0
      ]);
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-14 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#EDEDED]">Finance</h1>
            <p className="text-sm text-[#6A6A6A] mt-1">Track your income and expenses</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setView(view === 'list' ? 'chart' : 'list')}
              className="px-4 py-2 bg-[#0F0F0F] border border-[#2A2A2A] text-[#9A9A9A] rounded-lg hover:text-[#EDEDED] hover:border-[#3A3A3A] transition-colors text-sm flex items-center"
            >
              <PieChart className="h-4 w-4 mr-2" />
              {view === 'list' ? 'Charts' : 'List'}
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-[#0F0F0F] border border-[#2A2A2A] text-[#9A9A9A] rounded-lg hover:text-[#EDEDED] hover:border-[#3A3A3A] transition-colors text-sm flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null);
                resetNewTransaction();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#6A6A6A]">Total Income</span>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <span className="text-2xl font-semibold text-green-500">
              ${totalIncome.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#6A6A6A]">Total Expenses</span>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <span className="text-2xl font-semibold text-red-500">
              ${totalExpenses.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#6A6A6A]">Balance</span>
              <div className={`p-2 ${balance >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'} rounded-lg`}>
                <DollarSign className={`h-4 w-4 ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
              </div>
            </div>
            <span className={`text-2xl font-semibold ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              ${balance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Charts View */}
        {view === 'chart' && (
          <div className="space-y-6 mb-8">
            {/* Trend Chart */}
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-sm font-medium text-[#9A9A9A] mb-4">7-Day Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="date" stroke="#6A6A6A" tick={{ fill: '#9A9A9A', fontSize: 12 }} />
                  <YAxis stroke="#6A6A6A" tick={{ fill: '#9A9A9A', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1A1A1A', 
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      color: '#EDEDED'
                    }} 
                  />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="expenses" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie Chart */}
            {categoryData.length > 0 && (
              <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-6">
                <h2 className="text-sm font-medium text-[#9A9A9A] mb-4">Expense Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1A1A1A', 
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                          color: '#EDEDED'
                        }} 
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {categoryData.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm text-[#9A9A9A]">{category.name}</span>
                        </div>
                        <span className="text-sm text-[#EDEDED]">${category.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-[#9A9A9A] hover:text-[#EDEDED] text-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            <ArrowDown className={`h-3 w-3 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-[#2A2A2A]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6A6A6A]" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A2A2A] border-t-blue-500"></div>
          </div>
        ) : (
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2A2A]">
                    <th className="text-left py-4 px-6 text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">Description</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">Category</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">Date</th>
                    <th className="text-right py-4 px-6 text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">Amount</th>
                    <th className="text-right py-4 px-6 text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2A]">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-[#1A1A1A] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded-md ${
                            transaction.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                            )}
                          </div>
                          <span className="text-sm text-[#EDEDED]">{transaction.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-[#9A9A9A] capitalize">{transaction.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-[#9A9A9A]">
                          {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy') : ''}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${(transaction.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="p-1 text-[#6A6A6A] hover:text-blue-500 rounded-md hover:bg-[#2A2A2A]"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-1 text-[#6A6A6A] hover:text-red-500 rounded-md hover:bg-[#2A2A2A]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-[#2A2A2A] mx-auto mb-3" />
                <p className="text-[#6A6A6A] text-sm">No transactions found</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
                <h2 className="font-medium text-[#EDEDED]">
                  {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                    resetNewTransaction();
                  }}
                  className="p-1 text-[#6A6A6A] hover:text-[#EDEDED] rounded-md hover:bg-[#1A1A1A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  required
                />

                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  min="0"
                  step="0.01"
                  required
                />

                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t border-[#2A2A2A]">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                    resetNewTransaction();
                  }}
                  className="px-4 py-2 text-sm text-[#9A9A9A] hover:text-[#EDEDED] rounded-lg hover:bg-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTransaction}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!newTransaction.description || !newTransaction.amount}
                >
                  {editingTransaction ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;