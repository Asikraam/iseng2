// js/app.js
const { useState, useEffect, useMemo, useRef } = React;

// Gunakan variabel dari window.data.js
const { GRADES, TARGET_SKS_LULUS, TARGET_SKS_WAJIB, TARGET_SKS_PILIHAN, SPECIALIZATIONS, CURRICULUM_DB, Icons } = window;

const Icon = ({ icon, size = 20, className = "" }) => {
    if (!icon) return null;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          {icon.map(([tag, attrs], index) => React.createElement(tag, { ...attrs, key: index }))}
        </svg>
    );
};

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

const SimpleLineChart = ({ data, darkMode }) => {
    if (!data || data.length === 0) return null;
    const height = 100; const width = 300; const maxVal = 4.0;
    const points = data.map((d, i) => `${(i/(data.length-1 || 1))*width},${height - (d.nr/maxVal)*height}`).join(' ');
    const gridColor = darkMode ? "#334155" : "#e2e8f0"; 
    const lineColor = "#6366f1"; 
    return (
        <div className="w-full h-44 relative px-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {[0, 0.25, 0.5, 0.75, 1].map(v => <line key={v} x1="0" y1={height * v} x2={width} y2={height * v} stroke={gridColor} strokeDasharray="4" />)}
                <polyline points={points} fill="none" stroke={lineColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => (
                    <g key={i}>
                        <circle cx={(i/(data.length-1 || 1))*width} cy={height - (d.nr/maxVal)*height} r="6" fill={darkMode ? "#0f172a" : "white"} stroke={lineColor} strokeWidth="3" />
                    </g>
                ))}
            </svg>
        </div>
    );
};

const Card = ({ children, className = "", darkMode }) => (
    <div className={`rounded-3xl border p-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} ${className}`}>
        {children}
    </div>
);

const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState({});
    const [profile, setProfile] = useState({ name: 'Aswal', currentSemester: 4, startYear: 2024, targetSpecializations: ['offshore'], sksPerSemesterAssumption: 20 });
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Halo Aswal! OceanAI Assistant siap membantu.' }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const semesterStats = useMemo(() => {
        let cs = 0, cp = 0, sw = 0, sp = 0;
        CURRICULUM_DB.forEach(c => {
            const g = history[c.code];
            if (g && GRADES[g] !== undefined) {
                cs += c.sks; cp += (c.sks * GRADES[g]);
                if (GRADES[g] >= 2.0) { if (c.type === 'Wajib') sw += c.sks; else sp += c.sks; }
            }
        });
        return { ipk: cs > 0 ? (cp/cs).toFixed(2) : "0.00", totalSks: cs, sksLulusWajib: sw, sksLulusPilihan: sp, graphData: [{sem: 1, nr: 3.5}, {sem: 2, nr: 3.7}] };
    }, [history]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const ut = chatInput;
        setMessages(prev => [...prev, { role: 'user', text: ut }]);
        setChatInput('');
        setIsTyping(true);
        const aiResponse = await window.askGemini(ut, "Kamu asisten Teknik Kelautan ITB.", messages);
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
        setIsTyping(false);
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <header className="p-5 border-b flex justify-between items-center bg-white dark:bg-slate-900">
                <h1 className="font-black text-2xl">Ocean<span className="text-indigo-600">Plan</span></h1>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    {darkMode ? <Icon icon={Icons.Sun} /> : <Icon icon={Icons.Moon} />}
                </button>
            </header>
            <main className="max-w-5xl mx-auto p-4">
                <Card darkMode={darkMode}>
                    <h2 className="text-3xl font-black mb-4">Halo, {profile.name}!</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">IPK</p>
                            <p className="text-2xl font-black">{semesterStats.ipk}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-2xl text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-500">SKS</p>
                            <p className="text-2xl font-black">{semesterStats.totalSks}</p>
                        </div>
                    </div>
                </Card>
                <div className="mt-8">
                   <h3 className="font-bold mb-4">Statistik SKS</h3>
                   <ProgressBar label="Total Target" current={semesterStats.totalSks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
