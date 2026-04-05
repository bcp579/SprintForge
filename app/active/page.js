"use client";
import { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, TrendingDown, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Import Recharts for the Burndown visualization
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ActiveSprint() {
  const router = useRouter();
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [newTaskInput, setNewTaskInput] = useState({});
  const [logHoursInput, setLogHoursInput] = useState({});

  const fetchActiveSprint = async () => {
    const res = await fetch('/api/sprint/active');
    if (res.ok) {
      setSprint(await res.json());
    } else {
      setSprint(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveSprint();
  }, []);

  // --- ACTIONS ---
  const handleAddTask = async (itemId) => { /* Same as before */
    const desc = newTaskInput[itemId];
    if (!desc) return;
    await fetch('/api/tasks', { method: 'POST', body: JSON.stringify({ description: desc, backlogItemId: itemId }) });
    setNewTaskInput({ ...newTaskInput, [itemId]: "" });
    fetchActiveSprint(); 
  };

  const handleLogHours = async (taskId, itemId) => {
    const hours = parseInt(logHoursInput[taskId], 10);
    if (!hours || hours <= 0) return alert("Please enter valid hours.");

    const totalLogged = sprint.items.reduce((sum, item) => sum + item.tasks.reduce((taskSum, task) => taskSum + task.loggedHours, 0), 0);
    const remainingCapacity = sprint.capacity - totalLogged;
    if (hours > remainingCapacity) {
      return alert(`Cannot log ${hours}h. Only ${remainingCapacity}h remaining in this sprint.`);
    }

    const response = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, hours, backlogItemId: itemId })
    });

    if (!response.ok) {
      const error = await response.json();
      return alert(error?.error || "Failed to log hours.");
    }

    setLogHoursInput({ ...logHoursInput, [taskId]: "" });
    fetchActiveSprint(); 
  };

  const handleCompleteItem = async (itemId) => {
    const response = await fetch(`/api/backlog/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });

    if (!response.ok) {
      const error = await response.json();
      return alert(error?.error || "Failed to complete item.");
    }

    fetchActiveSprint();
  };

  // NEW: END SPRINT LOGIC
  const handleEndSprint = async () => {
    if (!window.confirm("Are you sure you want to end this sprint? Unfinished items will be returned to the backlog.")) return;

    const response = await fetch('/api/sprint/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId: sprint.id })
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Sprint Ended!\nVelocity: ${result.velocity} hrs\nUnfinished Items Returned: ${result.unfinishedReturned}`);
      router.push('/'); // Send them back to the Product Backlog to plan the next one!
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Active Workspace...</div>;
  if (!sprint) return <div className="p-10 text-center text-slate-500 mt-20 text-xl font-bold">No active sprint. Go to Planning!</div>;

  // --- BURNDOWN CHART DATA GENERATION ---
  // In a real app, this comes from the DailySprintLog table. 
  // Here, we calculate the current progress to build a dynamic chart.
  const totalOriginal = sprint.items.reduce((sum, item) => sum + item.originalEffort, 0);
  const totalLogged = sprint.items.reduce((sum, item) => sum + item.tasks.reduce((taskSum, task) => taskSum + task.loggedHours, 0), 0);
  const totalRemaining = Math.max(sprint.capacity - totalLogged, 0);
  const totalActualWork = sprint.capacity;
  
  const burndownData = [
    { day: 'Start', ideal: totalOriginal, actual: totalActualWork },
    { day: 'Mid-Sprint', ideal: totalOriginal / 2, actual: (totalActualWork + totalRemaining) / 2 },
    { day: 'Today', ideal: 0, actual: totalRemaining }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* SPRINT HEADER & END BUTTON */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex justify-between items-center border-l-8 border-l-blue-600">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{sprint.name}</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Status: <span className="font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1"><Clock size={16}/> Active</span>
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-3">
          <div>
            <p className="text-sm font-bold text-slate-600">Sprint Capacity: {sprint.capacity} hrs</p>
            <p className="text-sm text-slate-500">Remaining Hours: <span className="font-bold text-blue-600">{totalRemaining} hrs</span></p>
          </div>
          <button 
            onClick={handleEndSprint}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-md"
          >
            <CheckSquare size={18} /> End Sprint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: The Tasks (Takes up 2/3 of the screen) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Sprint Backlog Items</h3>
          {sprint.items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              
              {/* If item is explicitly completed, show a green overlay! */}
              {item.status === 'completed' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">COMPLETED</div>
              )}

              <div className={`p-4 border-b flex justify-between items-center ${item.status === 'completed' ? 'bg-green-50' : 'bg-slate-50'}`}>
                <div>
                  <h3 className={`font-bold text-lg ${item.status === 'completed' ? 'text-green-800 line-through' : 'text-slate-800'}`}>{item.description}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${item.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <div className="flex items-center gap-4 justify-end">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Original</p>
                      <p className="font-mono text-slate-500">{item.originalEffort}h</p>
                    </div>
                    <div className={`text-center px-3 py-1 rounded border ${item.status === 'completed' ? 'bg-green-100 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`text-[10px] uppercase font-bold ${item.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>Spent</p>
                      <p className={`font-mono font-bold text-lg ${item.status === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>{item.tasks.reduce((sum, task) => sum + task.loggedHours, 0)}h</p>
                    </div>
                  </div>
                  {item.status !== 'completed' && item.tasks.some(task => task.loggedHours > 0) && (
                    <button onClick={() => handleCompleteItem(item.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition">Complete Task</button>
                  )}
                </div>
              </div>

              {/* TASKS AREA */}
              <div className="p-4">
                {item.tasks.length === 0 && <p className="text-sm text-slate-400 italic mb-4">No tasks added yet.</p>}
                <div className="space-y-3 mb-4">
                  {item.tasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-slate-300" />
                        <span className="font-medium text-slate-700 text-sm">{task.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded border">Logged: {task.loggedHours}h</span>
                        {item.status !== 'completed' && (
                          <>
                            <input type="number" min="1" placeholder="hrs" className="border p-1 rounded w-16 text-center text-sm" value={logHoursInput[task.id] || ""} onChange={(e) => setLogHoursInput({...logHoursInput, [task.id]: e.target.value})} />
                            <button onClick={() => handleLogHours(task.id, item.id)} className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1 transition"><Clock size={14} /> Log</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Task Input (Hide if item is explicitly completed) */}
                {item.status !== 'completed' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                    <input type="text" placeholder="Add technical task..." className="border p-2 rounded text-sm flex-grow bg-slate-50 focus:bg-white" value={newTaskInput[item.id] || ""} onChange={(e) => setNewTaskInput({...newTaskInput, [item.id]: e.target.value})} />
                    <button onClick={() => handleAddTask(item.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-1"><Plus size={16} /> Add Task</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Analytics (Takes up 1/3 of the screen) */}
        <div>
          <div className="bg-slate-900 rounded-xl shadow-md border border-slate-800 p-5 sticky top-6 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingDown className="text-blue-400"/> Burndown Chart</h3>
            
            {/* The Recharts Graph */}
            <div className="h-64 w-full bg-slate-800 rounded-lg p-2 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12}} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                  <Legend wrapperStyle={{fontSize: '12px'}} />
                  <Line type="monotone" dataKey="ideal" name="Ideal Trend" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="actual" name="Remaining Hours" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Total Started:</span>
                <span className="font-mono font-bold">{totalOriginal} hrs</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Total Logged:</span>
                <span className="font-mono font-bold text-green-400">{totalLogged} hrs</span>
              </div>
               {/* <div className="flex justify-between pb-2">
                 <span className="text-slate-400">Current Velocity:</span>
                 <span className="font-mono font-bold text-blue-400">{sprint.items.filter(i => i.remainingEffort === 0).reduce((sum, i) => sum + i.originalEffort, 0)} hrs</span>
              </div> */}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
