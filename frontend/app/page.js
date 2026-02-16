"use client";
import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

export default function ProductBacklog() {
  const [items, setItems] = useState([]); // Start empty
  const [newItem, setNewItem] = useState({ desc: "", priority: "Medium", effort: "" });

  // FETCH DATA ON LOAD
  useEffect(() => {
    fetch('/api/backlog')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  // ADD ITEM TO DATABASE
  const addItem = async () => {
    if (!newItem.desc) return;
    
    const response = await fetch('/api/backlog', {
      method: 'POST',
      body: JSON.stringify({
        description: newItem.desc,
        priority: newItem.priority,
        effort: newItem.effort
      })
    });

    const savedItem = await response.json();
    setItems([...items, savedItem]); // Update UI with real data
    setNewItem({ desc: "", priority: "Medium", effort: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Product Backlog</h2>

      {/* Input Form */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-3 mb-8">
        <input 
          className="border p-2 rounded-lg flex-grow outline-blue-500"
          placeholder="New Requirement..."
          value={newItem.desc}
          onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
        />
        <select 
          className="border p-2 rounded-lg bg-slate-50"
          value={newItem.priority}
          onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input 
          type="number"
          className="border p-2 rounded-lg w-24"
          placeholder="Hrs"
          value={newItem.effort}
          onChange={(e) => setNewItem({ ...newItem, effort: e.target.value })}
        />
        <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-4">Description</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Effort</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50 transition">
                <td className="p-4">{item.desc}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.priority === 'High' ? 'bg-red-100 text-red-700' : 
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {item.priority}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{item.effort} hrs</td>
                <td className="p-4 text-right">
                  <button className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}