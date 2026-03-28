"use client";
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SprintPlanning() {
  const router = useRouter();
  
  // Lists
  const [backlog, setBacklog] = useState([]);
  const [sprintItems, setSprintItems] = useState([]);
  
  // Sprint Setup Data
  const [sprintName, setSprintName] = useState("");
  const [sprintCapacity, setSprintCapacity] = useState(40); // Default 40 hours
  const [sprintDuration, setSprintDuration] = useState(2); // Default 2 weeks
  const [loading, setLoading] = useState(true);

  // DYNAMIC CALCULATIONS (Matches your 'Capacity Limit' test cases)
  const totalEffort = sprintItems.reduce((acc, curr) => acc + curr.originalEffort, 0);
  const isOverCapacity = totalEffort > sprintCapacity;

  // 1. Fetch available Backlog Items on load
  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/backlog');
      const data = await res.json();
      // Only show items that are still in the product backlog
      setBacklog(data.filter(item => item.status === 'product_backlog'));
      setLoading(false);
    }
    fetchData();
  }, []);

  // 2. Auto-Propose Algorithm (Matches your 'generate_sprint_proposal' test case)
  const handleAutoPropose = () => {
    let currentLoad = 0;
    const proposed = [];
    const remaining = [];

    // Sort by Priority (High -> Medium -> Low)
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    const sorted = [...backlog].sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

    sorted.forEach(item => {
      if (currentLoad + item.originalEffort <= sprintCapacity) {
        proposed.push(item);
        currentLoad += item.originalEffort;
      } else {
        remaining.push(item);
      }
    });

    setSprintItems(proposed);
    setBacklog(remaining);
  };

  // 3. Start & Lock Sprint
  const handleStartSprint = async () => {
    if (isOverCapacity) return alert("Cannot start: Sprint capacity exceeded!");
    if (!sprintName) return alert("Please enter a Sprint Name.");
    if (sprintItems.length === 0) return alert("Sprint is empty.");

    const itemIds = sprintItems.map(item => item.id);

    // Call the API we just made in Step 1
    const response = await fetch('/api/sprint/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: sprintName, 
        capacity: sprintCapacity, 
        duration: sprintDuration,
        itemIds: itemIds 
      })
    });

    if (response.ok) {
      router.push('/active'); // Redirect to Active Sprint board
    } else {
      alert("Failed to start sprint.");
    }
  };

  // Move items manually between lists
  const moveToSprint = (item) => {
    setSprintItems([...sprintItems, item]);
    setBacklog(backlog.filter(i => i.id !== item.id));
  };

  const moveToBacklog = (item) => {
    setBacklog([...backlog, item]);
    setSprintItems(sprintItems.filter(i => i.id !== item.id));
  };

  if (loading) return <div className="p-10 text-center">Loading Data...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sprint Planning</h2>
          <p className="text-slate-500 text-sm">Define your capacity and build your sprint.</p>
        </div>
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          + Edit Product Backlog
        </Link>
      </div>

      {/* SPRINT SETTINGS FORM */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-grow">
          <label className="block text-sm font-bold text-slate-700 mb-1">Sprint Name</label>
          <input type="text" placeholder="e.g., Sprint 1" value={sprintName} onChange={(e) => setSprintName(e.target.value)} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Duration (Wks)</label>
          <input type="number" min="1" value={sprintDuration} onChange={(e) => setSprintDuration(Number(e.target.value))} className="border p-2 rounded w-24" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Capacity (Hrs)</label>
          <input type="number" min="1" value={sprintCapacity} onChange={(e) => setSprintCapacity(Number(e.target.value))} className="border p-2 rounded w-28" />
        </div>
        <button onClick={handleAutoPropose} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium h-[42px]">
          Auto-Propose Load
        </button>
      </div>

      {/* DRAG & DROP COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
        
        {/* LEFT: Product Backlog */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 overflow-y-auto">
          <h3 className="font-bold text-slate-700 mb-4 sticky top-0 bg-slate-100 pb-2 border-b">
            Product Backlog ({backlog.length})
          </h3>
          {backlog.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center group">
              <div>
                <p className="font-medium text-slate-800">{item.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] uppercase font-bold px-1 py-0.5 rounded ${item.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>{item.priority}</span>
                  <span className="text-xs text-slate-500 font-mono">{item.originalEffort}h</span>
                </div>
              </div>
              <button onClick={() => moveToSprint(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full opacity-0 group-hover:opacity-100">
                <ArrowRight size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT: Sprint Candidate */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col">
          <h3 className="font-bold text-blue-800 mb-4 sticky top-0 bg-blue-50 pb-2 border-b border-blue-200">
            Sprint Candidate
          </h3>
          
          <div className="flex-grow overflow-y-auto mb-4">
            {sprintItems.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center border-l-4 border-blue-500 group">
                <button onClick={() => moveToBacklog(item)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full opacity-0 group-hover:opacity-100">
                  <ArrowLeft size={20} />
                </button>
                <div className="text-right">
                  <p className="font-medium text-slate-800">{item.description}</p>
                  <span className="text-xs font-mono text-slate-500">{item.originalEffort}h</span>
                </div>
              </div>
            ))}
          </div>

          {/* SPRINT CAPACITY CHECK & BUTTON */}
          <div className="pt-4 border-t border-blue-200 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-1 text-sm font-bold">
              <span className="text-slate-600">Total Load:</span>
              <span className={isOverCapacity ? "text-red-600" : "text-green-600"}>
                {totalEffort} / {sprintCapacity} hrs
              </span>
            </div>
            
            {isOverCapacity && (
              <div className="mb-4 mt-2 text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded">
                <AlertTriangle size={14} /> Warning: Capacity exceeded! Remove items.
              </div>
            )}

            <button 
              onClick={handleStartSprint}
              disabled={isOverCapacity || !sprintName || sprintItems.length === 0}
              className={`w-full py-3 mt-2 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition ${
                isOverCapacity || !sprintName || sprintItems.length === 0 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Lock size={18} /> Activate Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}