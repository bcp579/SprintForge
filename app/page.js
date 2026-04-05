"use client";
import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, X, Check, Filter } from 'lucide-react';

export default function ProductBacklog() {
  const [items, setItems] = useState([]);
  
  // State for Adding new items
  const [newItem, setNewItem] = useState({ desc: "", priority: "Medium", effort: "", risk: "Low" });
  
  // State for Editing existing items (The Pencil Icon)
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // State for Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState([]); 
  const [maxEffort, setMaxEffort] = useState(50); 

  // 1. Fetch Data on Load
  useEffect(() => {
    fetch('/api/backlog')
      .then(res => res.json())
      .then(data => {
        setItems(data);
      }); 
  }, []);

  // 2. ADD Item (With Risk & Validation)
  const addItem = async () => {
    if (!newItem.desc) return alert("Title is required!"); // Validation
    if (newItem.effort === "" || newItem.effort < 0) return alert("Please enter a valid positive effort estimate.");

    const response = await fetch('/api/backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: newItem.desc,
        priority: newItem.priority,
        effort: newItem.effort,
        risk: newItem.risk
      })
    });
    
    if (response.ok) {
      const savedItem = await response.json();
      setItems([...items, savedItem]);
      setNewItem({ desc: "", priority: "Medium", effort: "", risk: "Low" }); // Reset form
    }
  };

  // 3. DELETE Item (The Trash Can)
  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this requirement?")) return; // Confirmation Warning
    
    const response = await fetch(`/api/backlog/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setItems(items.filter(item => item.id !== id));
    } else {
      alert("Failed to delete item.");
    }
  };

  // 4. SAVE Edited Item (The Green Checkmark)
  const saveEdit = async (id) => {
    if (editData.originalEffort < 0) return alert("Effort cannot be negative.");

    const response = await fetch(`/api/backlog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });

    if (response.ok) {
      const updatedItem = await response.json();
      setItems(items.map(item => (item.id === id ? updatedItem : item)));
      setEditingId(null); // Close the edit mode
    }
  };

  // 5. FILTER Logic
  const togglePriorityFilter = (priority) => {
    if (filterPriority.includes(priority)) {
      setFilterPriority(filterPriority.filter(p => p !== priority));
    } else {
      setFilterPriority([...filterPriority, priority]);
    }
  };

  // Apply filters instantly in memory
  const filteredItems = items.filter(item => {
    const passPriority = filterPriority.length === 0 || filterPriority.includes(item.priority);
    const passEffort = item.originalEffort <= maxEffort;
    return passPriority && passEffort;
  });

  const normalizedStatus = (status, remainingEffort, tasks = []) => {
    const normalized = status?.toLowerCase?.();
    if (normalized === 'completed') return 'completed';
    if (tasks.length > 0 && tasks.every(task => task.status === 'done')) return 'completed';
    if (normalized === 'sprint_locked' && remainingEffort === 0) return 'completed';
    return 'pending';
  };

  return (
    <div>
      {/* HEADER & FILTER BUTTON */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Product Backlog</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
        >
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-8 items-center">
          <div>
            <span className="font-bold text-sm text-slate-600 block mb-2">Priority:</span>
            <div className="flex gap-3">
              {['High', 'Medium', 'Low'].map(p => (
                <label key={p} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={filterPriority.includes(p)} onChange={() => togglePriorityFilter(p)} className="rounded" /> {p}
                </label>
              ))}
            </div>
          </div>
          <div className="flex-grow max-w-xs">
            <span className="font-bold text-sm text-slate-600 block mb-2">Max Effort: {maxEffort} hrs</span>
            <input 
              type="range" min="1" max="100" value={maxEffort} 
              onChange={(e) => setMaxEffort(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ADD ITEM FORM */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 mb-8 items-center">
        <input 
          className="border p-2 rounded-lg flex-grow min-w-[200px]" placeholder="New Requirement Title..."
          value={newItem.desc} onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
        />
        <select className="border p-2 rounded-lg bg-slate-50" value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        {/* NEW RISK DROPDOWN */}
        <select className="border p-2 rounded-lg bg-slate-50" value={newItem.risk} onChange={(e) => setNewItem({ ...newItem, risk: e.target.value })}>
          <option value="Low">Low Risk</option><option value="Medium">Med Risk</option><option value="High">High Risk</option>
        </select>
        <input 
          type="number" className="border p-2 rounded-lg w-24" placeholder="Hrs" min="0"
          value={newItem.effort} onChange={(e) => setNewItem({ ...newItem, effort: e.target.value })}
        />
        <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add
        </button>
      </div>

      {/* THE BACKLOG LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-4 w-1/2">Description</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Effort</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">No items found.</td></tr>
            ) : filteredItems.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50 transition group">
                
                {/* INLINE EDITING MODE */}
                {editingId === item.id ? (
                  <>
                    <td className="p-3"><input className="border p-1 w-full rounded" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} /></td>
                    <td className="p-3 text-sm text-slate-500">{normalizedStatus(item.status, item.remainingEffort, item.tasks)}</td>
                    <td className="p-3"><select className="border p-1 rounded" value={editData.priority} onChange={(e) => setEditData({...editData, priority: e.target.value})}><option>High</option><option>Medium</option><option>Low</option></select></td>
                    <td className="p-3"><select className="border p-1 rounded" value={editData.risk} onChange={(e) => setEditData({...editData, risk: e.target.value})}><option value="High">High Risk</option><option value="Medium">Med Risk</option><option value="Low">Low Risk</option></select></td>
                    <td className="p-3"><input type="number" className="border p-1 w-16 rounded" value={editData.originalEffort} onChange={(e) => setEditData({...editData, originalEffort: e.target.value})} /></td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button onClick={() => saveEdit(item.id)} className="text-green-600 bg-green-100 hover:bg-green-200 p-1.5 rounded" title="Save"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-slate-600 bg-slate-200 hover:bg-slate-300 p-1.5 rounded" title="Cancel"><X size={18} /></button>
                    </td>
                  </>
                ) : (
                  /* NORMAL VIEW MODE */
                  <>
                    <td className="p-4 font-medium">
                      {item.description}
                      {item.status === 'completed' && item.sprint?.name ? (
                        <span className="ml-2 text-xs text-slate-400">({item.sprint.name})</span>
                      ) : null}
                      {item.tasks?.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm text-slate-500">
                          {item.tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between gap-3">
                              <span>{task.description}</span>
                              {task.status === 'done' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                  done
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'High' ? 'bg-red-100 text-red-700' : item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${normalizedStatus(item.status, item.remainingEffort, item.tasks) === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {normalizedStatus(item.status, item.remainingEffort, item.tasks)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{item.risk || 'Low'}</td>
                    <td className="p-4 text-slate-600 font-mono">{item.originalEffort}h</td>
                    <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-3">
                      <button onClick={() => { setEditingId(item.id); setEditData(item); }} className="text-blue-500 hover:text-blue-700" title="Edit Item"><Edit2 size={18} /></button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600" title="Delete Item"><Trash2 size={18} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}