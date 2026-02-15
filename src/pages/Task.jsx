import React, { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { 
  Search, Filter, Plus, Calendar, CheckCircle, Circle, 
  Trash2, ChevronDown, X, Clock, AlertCircle 
} from 'lucide-react';
import api from '../services/api';

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [filter, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      let filteredTasks = response.data;
      
      if (filter === 'today') {
        filteredTasks = filteredTasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
      } else if (filter === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredTasks = filteredTasks.filter(t => t.date === tomorrow.toISOString().split('T')[0]);
      } else if (filter === 'week') {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        filteredTasks = filteredTasks.filter(t => new Date(t.date) <= weekEnd);
      }
      
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => 
          t.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await api.post('/tasks', {
        title: newTask,
        date: selectedDate,
        priority,
        completed: false
      });
      setTasks([...tasks, response.data]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      await api.patch(`/tasks/${id}`, { completed: !completed });
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityStyles = (priority) => {
    const styles = {
      high: 'bg-red-500/10 text-red-500 border-red-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20'
    };
    return styles[priority] || styles.medium;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      high: <AlertCircle className="h-3.5 w-3.5" />,
      medium: <Clock className="h-3.5 w-3.5" />,
      low: <CheckCircle className="h-3.5 w-3.5" />
    };
    return icons[priority] || icons.medium;
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM dd, yyyy');
  };

  const groupedTasks = tasks.reduce((groups, task) => {
    const dateLabel = getDateLabel(task.date);
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(task);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2A2A2A] border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Main Content */}
      <div className="pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#EDEDED]">Tasks</h1>
              <p className="text-sm text-[#6A6A6A] mt-1">Organize your daily tasks and priorities</p>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#0F0F0F] border border-[#2A2A2A] text-[#9A9A9A] rounded-lg hover:text-[#EDEDED] hover:border-[#3A3A3A] transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6A6A6A]" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] placeholder-[#6A6A6A] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="all">All Tasks</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">This Week</option>
                </select>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6A6A6A]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-[#EDEDED] focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Add Task Form */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg mb-6">
            <form onSubmit={addTask} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <Circle className="h-5 w-5 text-[#6A6A6A]" />
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Write a task..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-[#EDEDED] placeholder-[#6A6A6A]"
                  />
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium ${getPriorityStyles(priority)}`}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([dateLabel, dateTasks]) => (
              <div key={dateLabel} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#0A0A0A] border-b border-[#2A2A2A]">
                  <h3 className="text-sm font-medium text-[#9A9A9A]">{dateLabel}</h3>
                </div>
                <div className="divide-y divide-[#2A2A2A]">
                  {dateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#1A1A1A] transition-colors group"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleTask(task.id, task.completed)}
                          className="focus:outline-none"
                        >
                          {task.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#6A6A6A] group-hover:text-[#9A9A9A]" />
                          )}
                        </button>
                        <span className={`text-sm flex-1 ${task.completed ? 'line-through text-[#6A6A6A]' : 'text-[#EDEDED]'}`}>
                          {task.title}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getPriorityStyles(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[#6A6A6A] hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-10 text-center">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-[#6A6A6A]" />
                </div>
                <h3 className="text-base font-medium text-[#EDEDED] mb-2">No tasks yet</h3>
                <p className="text-sm text-[#6A6A6A]">Create your first task to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task;