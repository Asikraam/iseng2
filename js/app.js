const { useState, useEffect, useMemo, useRef } = React;

// --- COMPONENTS ---

// 1. Icon Component (Safe Lucide Wrapper)
const Icon = ({ name, size = 20, className = "" }) => {
    const iconData = window.lucide?.icons?.[name];
    if (!iconData || !Array.isArray(iconData)) return null;

    const [tag, attrs, children] = iconData;
    return (
        <svg 
            width={size} height={size} viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
            className={className} 
            {...attrs}
        >
            {children.map((child, i) => React.createElement(child[0], { ...child[1], key: i }))}
        </svg>
    );
};

// 2. Card Component
const Card = ({ children, className = "", darkMode }) => (
    <div className={`rounded-3xl border p-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} ${className}`}>
        {children}
    </div>
);

// 3. ProgressBar Component
const ProgressBar = ({ label, current, max, colorClass, darkMode }) => (
    <div className="mb-4">
        <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase tracking-widest opacity-80">
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
            <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{current} / {max} SKS</span>
        </div>
        <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min((current/max)*100, 100)}%` }}></div>
        </div>
    </div>
);

// 4. SimpleLineChart Component (Graph)
const SimpleLineChart = ({ data, darkMode }) => {
    if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-[10px] opacity-30 italic font-bold tracking-widest">DATA BELUM TERSEDIA</div>;
    const height = 100; const width = 300; const maxVal = 4.0;
    const points = data.map((d, i) => `${(i/(data.length-1 || 1))*width},${height - (d.nr/maxVal)*height}`).join(' ');
    const gridColor = darkMode ? "#1e293b" : "#f1f5f9"; 
    const lineColor = "#6366f1"; 
    return (
        <div className="w-full h-32 px-4 py-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {[0, 0.5, 1].map(v => <line key={v} x1="0" y1={height * v} x2={width} y2={height * v} stroke={gridColor} strokeWidth="1" strokeDasharray="4" />)}
                <polyline points={points} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = (i/(data.length-1 || 1))*width;
                    const y = height - (d.nr/maxVal)*height;
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={darkMode ? "#020617" : "white"} stroke={lineColor} strokeWidth="2" />
                            <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fontWeight="bold" fill={lineColor}>{d.nr.toFixed(2)}</text>
                            <text x={x} y={height + 15} textAnchor="middle" fontSize="8" fontWeight="bold" fill={darkMode ? "#64748b" : "#94a3b8"}>S{d.sem}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// 5. Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("UI Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-red-500 font-bold">Terjadi kesalahan sistem. Silakan refresh halaman.</div>;
    return this.props.children;
  }
}

// --- MAIN APP ---
const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState({ 'MA1101': 'B' }); // Dummy data awal
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Halo! Saya OceanAI. Ada yang bisa saya bantu?' }]);
    const chatEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    // Load Globals
    const GRADES = window.GRADES || {};
    const TARGET_SKS_LULUS = window.TARGET_SKS_LULUS || 144;
    const CURRICULUM_DB = window.CURRICULUM_DB || [];

    // Stats Calculation
    const stats = useMemo(() => {
        let totalSks = 0, totalPoints = 0;
        const graphData = [];
        
        // Group by Semester for Graph
        const semGroups = {};
        
        if (Array.isArray(CURRICULUM_DB)) {
            CURRICULUM_DB.forEach(c => {
                const g = history[c.code];
                if (g && GRADES[g] !== undefined) {
                    const points = c.sks * GRADES[g];
                    totalSks += c.sks;
                    totalPoints += points;
                    
                    // Graph Data Logic
                    if(!semGroups[c.semester]) semGroups[c.semester] = { sks: 0, pts: 0 };
                    semGroups[c.semester].sks += c.sks;
                    semGroups[c.semester].pts += points;
                }
            });
        }
        
        Object.keys(semGroups).sort((a,b)=>a-b).forEach(sem => {
            graphData.push({ sem: sem, nr: semGroups[sem].pts / semGroups[sem].sks });
        });

        return { 
            ipk: totalSks > 0 ? (totalPoints/totalSks).toFixed(2) : "0.00", 
            sks: totalSks,
            graphData 
        };
    }, [history, CURRICULUM_DB, GRADES]);

    // Markdown Renderer
    const renderMarkdown = (text) => {
        if (typeof marked !== 'undefined' && marked.parse) return { __html: marked.parse(text) };
        return { __html: text.replace(/\n/g, '<br/>') };
    };

    // Chat Handler
    const handleSend = async () => {
        if (!chatInput.trim()) return;
        const ut = chatInput;
        setMessages(prev => [...prev, { role: 'user', text: ut }]);
        setChatInput('');
        setIsTyping(true);

        const prompt = `OceanAI. Mahasiswa Teknik Kelautan. IPK: ${stats.ipk}, SKS: ${stats.sks}. Gunakan Markdown yang rapi.`;
        
        if (typeof window.askGemini === 'function') {
            const reply = await window.askGemini(ut, prompt, messages);
            setMessages(prev => [...prev, { role: 'ai', text: reply }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "Error: AI Service not loaded." }]);
        }
        setIsTyping(false);
    };
    
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    if (!CURRICULUM_DB.length) return <div className="p-10 text-center">Loading Database...</div>;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 p-5 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Icon name="BookOpen" size={20} /></div>
                    <h1 className="font-black text-2xl tracking-tight">Ocean<span className="text-indigo-600">Plan</span></h1>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600">
                    <Icon name={darkMode ? "Sun" : "Moon"} />
                </button>
            </header>

            {/* Nav */}
            <nav className="max-w-5xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {['dashboard', 'input', 'assistant'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-2xl font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50'}`}>
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Main */}
            <main className="max-w-5xl mx-auto p-4 animate-in">
                
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode} className="bg-indigo-600 dark:bg-indigo-700 text-white border-none relative overflow-hidden">
                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                <div>
                                    <h2 className="text-3xl font-black mb-2">Halo, Mahasiswa!</h2>
                                    <p className="opacity-80 text-sm mb-6">Pantau performa akademikmu secara real-time.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-md">
                                            <p className="text-[10px] font-black uppercase opacity-60">IPK</p>
                                            <p className="text-3xl font-black">{stats.ipk}</p>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-md">
                                            <p className="text-[10px] font-black uppercase opacity-60">SKS</p>
                                            <p className="text-3xl font-black">{stats.sks}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="TrendingUp" size={16}/> Grafik IP Semester</h3>
                                <SimpleLineChart data={stats.graphData} darkMode={darkMode} />
                            </Card>
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="PieChart" size={16}/> Progres Kelulusan</h3>
                                <ProgressBar label="Target Lulus (144 SKS)" current={stats.sks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'input' && (
                    <Card darkMode={darkMode}>
                        <h2 className="text-2xl font-black mb-2">Transkrip Nilai</h2>
                        <p className="opacity-60 text-sm mb-6">Input nilai mata kuliah yang telah kamu selesaikan.</p>
                        <div className="space-y-3">
                             {CURRICULUM_DB.map(c => (
                                 <div key={c.code} className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                                     <div>
                                         <div className="font-bold text-sm flex items-center gap-2">
                                             <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] opacity-60 font-mono">{c.code}</span>
                                             {c.name}
                                         </div>
                                         <div className="text-[10px] opacity-50 mt-1 uppercase font-bold tracking-wider">{c.sks} SKS • Sem {c.semester}</div>
                                     </div>
                                     <select 
                                        value={history[c.code] || ""} 
                                        onChange={(e) => setHistory({...history, [c.code]: e.target.value})}
                                        className={`bg-transparent border rounded-xl p-2 text-sm outline-none font-bold ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}
                                     >
                                         <option value="">-</option>
                                         {Object.keys(GRADES).map(g => <option key={g} value={g}>{g}</option>)}
                                     </select>
                                 </div>
                             ))}
                        </div>
                    </Card>
                )}

                {activeTab === 'assistant' && (
                    <Card darkMode={darkMode} className="h-[600px] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
                        <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-xl"><Icon name="Bot" size={24}/></div>
                            <div><h3 className="font-bold">OceanAI</h3><p className="text-xs opacity-70">Academic Assistant</p></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-md markdown-content ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}
                                        dangerouslySetInnerHTML={renderMarkdown(m.text)}
                                    />
                                </div>
                            ))}
                            {isTyping && <div className="text-xs opacity-50 p-2 animate-pulse">Mengetik...</div>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900">
                            <input 
                                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 p-3 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-medium"
                                placeholder="Ketik pesan..."
                            />
                            <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Icon name="Send" size={20}/></button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

// SAFE MOUNTING (Fixing "createRoot" duplicate warning)
const container = document.getElementById('root');
if (container) {
    if (!container._reactRoot) {
        container._reactRoot = ReactDOM.createRoot(container);
    }
    const root = container._reactRoot;
    
    root.render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
} else {
    console.error("Root element not found");
}
