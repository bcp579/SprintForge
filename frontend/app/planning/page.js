"use client";
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SprintPlanning() {
  const router = useRouter();
  
  // State for the two columns
  const [backlog, setBacklog] = useState([]);
  const [sprint, setSprint] = useState([]);
  
  // Inputs
  const [capacity, setCapacity] = useState(10);
  const [loading, setLoading] = useState(true);

  // 1. INITIAL LOAD: Get all Product Backlog items from DB
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/backlog'); // Fetches all items
        const data = await res.json();
        
        // Only show items that are NOT already in a sprint or done
        const availableItems = data.filter(item => item.status === 'product_backlog');
        setBacklog(availableItems);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load backlog", e);
      }
    }
    fetchData();
  }, []);

  // 2. AUTO-PROPOSE: Call the Algorithm API
  const handleAutoPropose = async () => {
    if (backlog.length === 0) return;

    // Call Backend
    const response = await fetch('/api/planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity: capacity })
    });
    
    if (response.ok) {
      const proposedItems = await response.json();
      
      // Update Right Column (Sprint Candidate)
      setSprint(proposedItems);
      
      // Update Left Column (Remove proposed items from Backlog view)
      const proposedIds = proposedItems.map(i => i.id);
      setBacklog(prev => prev.filter(item => !proposedIds.includes(item.id)));
    }
  };

  // 3. START SPRINT: Lock the items
  const handleStartSprint = async () => {
    if (sprint.length === 0) return;

    const idsToLock = sprint.map(item => item.id);

    const response = await fetch('/api/sprint/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToLock })
    });

    if (response.ok) {
      // Redirect to the Active Workspace
      router.push('/active');
    } else {
      alert("Failed to start sprint.");
    }
  };

  // Manual Movement: Backlog -> Sprint
  const moveToSprint = (item) => {
    setSprint([...sprint, item]);
    setBacklog(backlog.filter(i => i.id !== item.id));
  };

  // Manual Movement: Sprint -> Backlog
  const moveToBacklog = (item) => {
    setBacklog([...backlog, item]);
    setSprint(sprint.filter(i => i.id !== item.id));
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Backlog...</div>;

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sprint Planning</h2>
          <p className="text-slate-500 text-sm">Filter items for the next iteration.</p>
        </div>
        
        <div className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <span className="text-sm font-bold text-slate-600">Capacity (Hrs):</span>
          <input 
            type="number" 
            value={capacity} 
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="border p-1.5 rounded w-20 text-center font-mono bg-slate-50"
          />
          <button 
            onClick={handleAutoPropose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition"
          >
            Auto-Propose
          </button>
        </div>
      </div>

      {/* The Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
        
        {/* LEFT: Product Backlog */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 overflow-y-auto">
          <h3 className="font-bold text-slate-700 mb-4 sticky top-0 bg-slate-100 pb-2 border-b">
            Product Backlog ({backlog.length})
          </h3>
          {backlog.length === 0 && <p className="text-sm text-slate-400 italic text-center mt-10">No items available.</p>}
          
          {backlog.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center group hover:shadow-md transition">
              <div>
                <p className="font-medium text-slate-800">{item.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    item.priority === 'High' ? 'bg-red-100 text-red-700' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {item.priority}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 rounded">{item.effort} hrs</span>
                </div>
              </div>
              <button 
                onClick={() => moveToSprint(item)}
                className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                title="Move to Sprint"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT: Proposed Sprint */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col">
          <h3 className="font-bold text-blue-800 mb-4 sticky top-0 bg-blue-50 pb-2 border-b border-blue-200">
            Sprint Candidate ({sprint.length})
          </h3>
          
          <div className="flex-grow overflow-y-auto mb-4">
            {sprint.length === 0 && <div className="h-full flex flex-col items-center justify-center text-blue-300 border-2 border-dashed border-blue-200 rounded-lg">
              <p>Drag items here or use Auto-Propose</p>
            </div>}

            {sprint.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center border-l-4 border-blue-500 group">
                <button 
                  onClick={() => moveToBacklog(item)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                  title="Remove from Sprint"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="text-right flex-grow">
                  <p className="font-medium text-slate-800">{item.description}</p>
                  <span className="text-xs font-mono text-slate-500">{item.effort} hrs</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: Start Button */}
          {sprint.length > 0 && (
            <div className="pt-4 border-t border-blue-200">
              <div className="flex justify-between items-center mb-3 text-sm font-bold text-blue-900">
                <span>Total Load:</span>
                <span>{sprint.reduce((acc, curr) => acc + curr.effort, 0)} hrs</span>
              </div>
              <button 
                onClick={handleStartSprint}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 transition transform hover:scale-[1.02]"
              >
                <Lock size={18} /> Confirm & Start Sprint
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}