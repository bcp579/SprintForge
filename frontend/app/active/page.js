"use client";
import { useState } from 'react';

export default function ActiveSprint() {
  const [items, setItems] = useState([
    { id: 1, desc: "User Login", priority: "High", effort: 5, tasks: [] }
  ]);

  const addTask = (id, task) => {
    if (!task) return;
    const newItems = items.map(i => 
      i.id === id ? { ...i, tasks: [...i.tasks, { desc: task, status: 'Todo' }] } : i
    );
    setItems(newItems);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Active Sprint Board</h2>
      
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl shadow border border-slate-200 mb-6 overflow-hidden">
          {/* Locked Header */}
          <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-slate-800">{item.desc}</h3>
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                {item.priority} Priority
              </span>
            </div>
            <span className="text-slate-500 font-mono text-sm">{item.effort}h Est</span>
          </div>

          {/* Task Expansion Area */}
          <div className="p-4">
            <div className="space-y-2 mb-4">
              {item.tasks.length === 0 && <p className="text-sm text-slate-400 italic">No engineering tasks yet.</p>}
              {item.tasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span>{task.desc}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                id={`input-${item.id}`}
                placeholder="Add technical task..." 
                className="border p-2 rounded text-sm flex-grow"
              />
              <button 
                onClick={() => {
                  const el = document.getElementById(`input-${item.id}`);
                  addTask(item.id, el.value);
                  el.value = '';
                }}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded text-sm font-medium hover:bg-blue-200"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}