import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, BookOpen, 
  ArrowRight, PlusCircle 
} from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState({
    pendingTasks: 0,
    todayExpenses: 0,
    studyNotes: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    weeklyTasks: [],
    categoryBreakdown: [],
    recentTransactions: [],
    upcomingTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from Supabase
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
      const { data: financeData, error: financeError } = await supabase.from('finance').select('*');
      const { data: notesData, error: notesError } = await supabase.from('notes').select('*');

      if (tasksError || financeError || notesError) {
        throw new Error('Error fetching data');
      }

      // Use the fetched data
      const tasks = tasksData || [];
      const finance = financeData || [];
      const notes = notesData || [];

      const pendingTasks = tasks.filter(t => !t.completed);
      const today = new Date().toISOString().split('T')[0];
      
      const todayExpenses = finance
        .filter(f => f.date === today && f.type === 'expense')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const weekDays = eachDayOfInterval({
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      });
      
      const weeklyTasks = weekDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasks.filter(t => t.date === dayStr);
        return {
          day: format(day, 'EEE'),
          completed: dayTasks.filter(t => t.completed).length,
          pending: dayTasks.filter(t => !t.completed).length
        };
      });

      const totalIncome = finance.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = finance.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

      const categoryMap = new Map();
      finance.filter(t => t.type === 'expense').forEach(t => {
        if (t.category) {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + (t.amount || 0));
        }
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : 0
      })).sort((a, b) => b.value - a.value);

      const recentTransactions = [...finance]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingTasks = tasks
        .filter(t => !t.completed && t.date && new Date(t.date) <= nextWeek && new Date(t.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

      setStats({
        pendingTasks: pendingTasks.length,
        todayExpenses,
        studyNotes: notes.length,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        weeklyTasks,
        categoryBreakdown,
        recentTransactions,
        upcomingTasks
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (index) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600'
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-[#EDEDED] text-xs font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-[#9A9A9A] text-xs">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A2A2A] border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#EDEDED]">Dashboard</h1>
              <p className="text-sm text-[#6A6A6A] mt-0.5">Track your productivity at a glance</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Quick Add</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6A6A6A]">Pending Tasks</span>
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </div>
              <span className="text-xl font-semibold text-[#EDEDED]">{stats.pendingTasks}</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6A6A6A]">Today's Expenses</span>
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                </div>
              </div>
              <span className="text-xl font-semibold text-[#EDEDED]">{formatCurrency(stats.todayExpenses)}</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6A6A6A]">Study Notes</span>
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                </div>
              </div>
              <span className="text-xl font-semibold text-[#EDEDED]">{stats.studyNotes}</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6A6A6A]">Balance</span>
                <div className="p-1.5 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-3.5 w-3.5 text-green-500" />
                </div>
              </div>
              <div>
                <span className="text-xl font-semibold text-[#EDEDED]">{formatCurrency(stats.balance)}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-blue-500">{formatCurrency(stats.totalIncome)}</span>
                  <span className="text-[10px] text-[#3A3A3A]">/</span>
                  <span className="text-[10px] text-red-500">{formatCurrency(stats.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
            {/* Weekly Tasks Chart */}
            <div className="lg:col-span-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <h2 className="text-xs font-medium text-[#9A9A9A] mb-3">Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.weeklyTasks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="day" stroke="#6A6A6A" tick={{ fill: '#9A9A9A', fontSize: 10 }} />
                  <YAxis stroke="#6A6A6A" tick={{ fill: '#9A9A9A', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" fill="#10B981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expenses by Category - Modern Version */}
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <h2 className="text-xs font-medium text-[#9A9A9A] mb-3">Expenses by Category</h2>
              {stats.categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {stats.categoryBreakdown.slice(0, 5).map((category, index) => (
                    <div key={category.name} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#9A9A9A]">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#EDEDED]">
                            {formatCurrency(category.value)}
                          </span>
                          <span className="text-[10px] text-[#6A6A6A] bg-[#1A1A1A] px-1.5 py-0.5 rounded">
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getCategoryColor(index)}`}
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Mini pie chart alternative - shows total */}
                  <div className="mt-4 pt-3 border-t border-[#2A2A2A]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9A9A9A]">Total Expenses</span>
                      <span className="font-medium text-[#EDEDED]">{formatCurrency(stats.totalExpenses)}</span>
                    </div>
                    {/* Color indicators */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {stats.categoryBreakdown.slice(0, 3).map((category, index) => (
                        <div key={category.name} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(index)}`} />
                          <span className="text-[9px] text-[#6A6A6A]">{category.name}</span>
                        </div>
                      ))}
                      {stats.categoryBreakdown.length > 3 && (
                        <span className="text-[9px] text-[#6A6A6A]">
                          +{stats.categoryBreakdown.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-[#6A6A6A]">
                  No expenses yet
                </div>
              )}
            </div>
          </div>

          {/* Activity Trend */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5 mb-6">
            <h2 className="text-xs font-medium text-[#9A9A9A] mb-3">Weekly Trend</h2>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={stats.weeklyTasks}>
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-[#9A9A9A]">Upcoming Tasks</h2>
                <Link to="/task" className="text-[10px] text-blue-500 hover:text-blue-400">
                  View all →
                </Link>
              </div>
              {stats.upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {stats.upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-xs text-[#EDEDED]">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-[#6A6A6A]">{format(new Date(task.date), 'MMM dd')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-[#6A6A6A] py-4">No upcoming tasks</p>
              )}
            </div>

            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-[#9A9A9A]">Recent Transactions</h2>
                <Link to="/finance" className="text-[10px] text-blue-500 hover:text-blue-400">
                  View all →
                </Link>
              </div>
              {stats.recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${
                          t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {t.type === 'income' ? 
                            <TrendingUp className="h-2.5 w-2.5 text-green-500" /> : 
                            <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                          }
                        </div>
                        <div>
                          <p className="text-xs text-[#EDEDED]">{t.description || t.title || 'Transaction'}</p>
                          <p className="text-[8px] text-[#6A6A6A]">{t.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          t.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-[8px] text-[#6A6A6A]">{t.date ? format(new Date(t.date), 'MMM dd') : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-[#6A6A6A] py-4">No transactions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;