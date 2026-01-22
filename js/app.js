const { useState, useEffect, useMemo, useRef } = React;
const { createRoot } = ReactDOM;

// --- COMPONENTS ---

// 1. Icon Component (Safe Lucide Wrapper)
const Icon = ({ name, size = 18, className = "" }) => {
    // Ambil data ikon langsung dari window.lucide dengan safety check
    const iconData = window.lucide?.icons?.[name];
    if (!iconData || !Array.isArray(iconData)) return null;

    const [tag, attrs, children] = iconData;
    
    // Helper camelCase untuk React props (stroke-width -> strokeWidth)
    const toCamelCase = (s) => s.replace(/-./g, x => x[1].toUpperCase());
    const fixAttrs = (attrs) => {
        const newAttrs = {};
        for (const key in attrs) newAttrs[toCamelCase(key)] = attrs[key];
        return newAttrs;
    };

    return (
        <svg 
            width={size} height={size} viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
            className={className}
            {...fixAttrs(attrs)}
        >
            {children.map((child, i) => React.createElement(child[0], { ...fixAttrs(child[1]), key: i }))}
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
            <span className="font-bold">{current} / {max} SKS</span>
        </div>
        <div className={`w-full h-2.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min((current/max)*100, 100)}%` }}></div>
        </div>
    </div>
);

// 4. SimpleLineChart Component
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

// 5. Error Boundary Component
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
    
    // State Data
    const [history, setHistory] = useState({ 'MA1101': 'B' }); 
    const [retakePlan, setRetakePlan] = useState({}); 
    const [plannerSelection, setPlannerSelection] = useState([]); 
    const [plannerMode, setPlannerMode] = useState('ai'); 
    const [profile, setProfile] = useState({ name: 'Mahasiswa', currentSemester: 4, startYear: 2024, targetSpecializations: ['offshore'], sksPerSemesterAssumption: 20 });
    
    // Chat State
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Halo! Saya OceanAI. Siap membantu evaluasi akademikmu.' }]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // Globals
    const { CURRICULUM_DB, GRADES, TARGET_SKS_LULUS } = window;
    const TARGET_SKS_WAJIB = window.TARGET_SKS_WAJIB || 100;
    const TARGET_SKS_PILIHAN = window.TARGET_SKS_PILIHAN || 44;
    const SPECIALIZATIONS = window.SPECIALIZATIONS || [];

    // Helpers
    const getCourseSemester = (course) => course.semester; 
    const isSpecializationCourse = (code) => SPECIALIZATIONS.some(s => s.required.includes(code));
    const getSpecName = (code) => {
        const found = SPECIALIZATIONS.filter(s => s.required.includes(code));
        return found.length > 0 ? found.map(s => s.name).join(', ') : null;
    };
    const getSpecIntersections = (code) => SPECIALIZATIONS.filter(s => s.required.includes(code)).map(s => s.name);

    // Logic Functions
    const toggleSpecialization = (id) => {
        const cur = profile.targetSpecializations;
        if (cur.includes(id)) {
            setProfile({...profile, targetSpecializations: cur.filter(x => x !== id)});
        } else {
            if (cur.length < 3) {
                setProfile({...profile, targetSpecializations: [...cur, id]});
            }
        }
    };

    const stats = useMemo(() => {
        let cumulativeSks = 0, cumulativePoints = 0, sw = 0, sp = 0;
        const semesterData = {}; 
        const graphData = [];

        for(let i=1; i<=8; i++) semesterData[i] = { sks: 0, pts: 0, nr: 0, count: 0 };

        if (Array.isArray(CURRICULUM_DB)) {
            CURRICULUM_DB.forEach(c => {
                const grade = history[c.code];
                const originalSemester = c.semester;
                const isRetaking = retakePlan[c.code]; 
                
                if (grade && GRADES[grade] !== undefined) {
                    const bobot = GRADES[grade];
                    const points = c.sks * bobot;

                    if (!isRetaking) {
                        if (bobot >= 2.0) {
                            cumulativeSks += c.sks;
                            cumulativePoints += points;
                            if (c.type === 'Wajib') sw += c.sks; else sp += c.sks;
                        }
                    }

                    if (semesterData[originalSemester]) {
                        semesterData[originalSemester].sks += c.sks;
                        semesterData[originalSemester].pts += points;
                        semesterData[originalSemester].count += 1;
                    }
                }
            });
        }

        Object.keys(semesterData).sort((a,b)=>a-b).forEach(sem => {
            const d = semesterData[sem];
            if (d.sks > 0) {
                d.nr = d.pts / d.sks;
                graphData.push({ sem: parseInt(sem), nr: d.nr });
            }
        });

        // Hitung IPK Total
        let totalAllPoints = 0, totalAllSks = 0;
        if (Array.isArray(CURRICULUM_DB)) {
             CURRICULUM_DB.forEach(c => {
                const grade = history[c.code];
                if (grade && GRADES[grade] !== undefined) {
                    totalAllSks += c.sks;
                    totalAllPoints += (c.sks * GRADES[grade]);
                }
             });
        }
        const ipk = totalAllSks > 0 ? (totalAllPoints / totalAllSks).toFixed(2) : "0.00";

        return { ipk, sks: cumulativeSks, sw, sp, graphData, semesterData };
    }, [history, CURRICULUM_DB, GRADES, retakePlan]);


    const plannerData = useMemo(() => {
        const candidates = CURRICULUM_DB.filter(c => {
            const g = history[c.code];
            const isPassed = g && GRADES[g] >= 2.0; 
            const isRetaking = retakePlan[c.code]; 
            return !isPassed || isRetaking;
        });

        const aiRecommendations = candidates.filter(c => {
            const prereqMet = c.prereq.every(p => history[p] && GRADES[history[p]] >= 1.0); 
            return prereqMet;
        }).sort((a,b) => a.semester - b.semester);

        const draftCatalog = candidates;
        return { aiRecommendations, draftCatalog };

    }, [history, retakePlan, CURRICULUM_DB]);

    const prediction = useMemo(() => {
        const rem = Math.max(0, TARGET_SKS_LULUS - stats.sks);
        const needed = Math.ceil(rem / profile.sksPerSemesterAssumption);
        return { rem, gradYear: profile.startYear + Math.floor((profile.currentSemester + needed - 1) / 2) };
    }, [stats.sks, profile]);

    // Handlers
    const handleRetake = (code, targetSem) => {
        setRetakePlan(prev => ({ ...prev, [code]: parseInt(targetSem) }));
    };

    const cancelRetake = (code) => {
        setRetakePlan(prev => { const n = {...prev}; delete n[code]; return n; });
    };

    const togglePlannerSelection = (code) => {
        setPlannerSelection(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    };

    const handleSend = async () => {
        if (!chatInput.trim()) return;
        const ut = chatInput;
        setMessages(prev => [...prev, { role: 'user', text: ut }]);
        setChatInput('');
        setIsTyping(true);

        const prompt = `OceanAI. IPK: ${stats.ipk}, SKS Lulus: ${stats.sks}. Gunakan Markdown.`;
        
        if (typeof window.askGemini === 'function') {
            const reply = await window.askGemini(ut, prompt, messages);
            setMessages(prev => [...prev, { role: 'ai', text: reply }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "Error: AI Service not loaded." }]);
        }
        setIsTyping(false);
    };
    
    const autoFillPreviousSemesters = () => {
        const nh = { ...history };
        CURRICULUM_DB.forEach(c => { 
            if (c.semester < profile.currentSemester && !nh[c.code]) nh[c.code] = 'B'; 
        });
        setHistory(nh);
    };

    const renderMarkdown = (text) => {
        if (typeof marked !== 'undefined' && marked.parse) return { __html: marked.parse(text) };
        return { __html: text.replace(/\n/g, '<br/>') };
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    if (!CURRICULUM_DB.length) return <div className="p-10 text-center">Loading Database...</div>;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 p-5 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 text-white p-1 rounded-lg shadow-lg"><Icon name="BookOpen" size={20} /></div>
                    <h1 className="font-black text-2xl tracking-tight">Ocean<span className="text-indigo-600">Plan</span></h1>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 transition-colors">
                    <Icon name={darkMode ? "Sun" : "Moon"} />
                </button>
            </header>

            {/* Nav */}
            <nav className="max-w-5xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {['dashboard', 'input', 'planner', 'assistant'].map(tab => (
                    <button 
                        key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-2xl font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 animate-in">
                
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Top Card: Profile & Config */}
                        <Card darkMode={darkMode} className={`relative overflow-hidden shadow-2xl ${darkMode ? 'bg-indigo-900 border-none text-white' : 'bg-white text-slate-900 border-slate-200'}`}>
                            <div className="relative z-10 grid md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Halo, {profile.name}!</h2>
                                    <p className={`opacity-80 text-sm mb-6 ${darkMode ? 'text-indigo-200' : 'text-slate-500'}`}>Pusat Konfigurasi Akademik.</p>
                                    
                                    <div className={`p-5 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2 block">Semester Berjalan:</label>
                                        <select 
                                            value={profile.currentSemester} 
                                            onChange={(e)=>setProfile({...profile, currentSemester: parseInt(e.target.value)})} 
                                            className={`w-full p-3 rounded-xl font-black text-sm outline-none cursor-pointer ${darkMode ? 'bg-indigo-800 text-white' : 'bg-white text-indigo-700 border border-slate-200 shadow-sm'}`}
                                        >
                                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl text-center border ${darkMode ? 'bg-white/10 border-white/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                            <p className="text-[9px] font-black uppercase opacity-60">IPK</p>
                                            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-indigo-600'}`}>{stats.ipk}</p>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-center border ${darkMode ? 'bg-white/10 border-white/20' : 'bg-emerald-50 border-emerald-100'}`}>
                                            <p className="text-[9px] font-black uppercase opacity-60">SKS Lulus</p>
                                            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-emerald-600'}`}>{stats.sks}</p>
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border mt-4 ${darkMode ? 'bg-indigo-950/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Prediksi Wisuda</span>
                                            <span className="text-2xl font-black text-amber-500">{prediction.gradYear}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-bold">Asumsi {profile.sksPerSemesterAssumption} SKS/Sem</span>
                                            <input 
                                                type="range" min="12" max="24" 
                                                value={profile.sksPerSemesterAssumption} 
                                                onChange={(e)=>setProfile({...profile, sksPerSemesterAssumption: parseInt(e.target.value)})} 
                                                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="TrendingUp" size={16}/> Grafik Performa</h3>
                                <SimpleLineChart data={stats.graphData} darkMode={darkMode} />
                            </Card>
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="PieChart" size={16}/> Progres Kelulusan</h3>
                                <ProgressBar label="Total SKS (144)" current={stats.sks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                                <ProgressBar label="Wajib Dasar" current={stats.sw} max={TARGET_SKS_WAJIB} colorClass="bg-emerald-500" darkMode={darkMode} />
                                <ProgressBar label="Pilihan Bidang" current={stats.sp} max={TARGET_SKS_PILIHAN} colorClass="bg-orange-500" darkMode={darkMode} />
                            </Card>
                        </div>
                        
                        <Card darkMode={darkMode}>
                            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest opacity-60">
                                Spesialisasi Fokus (Pilih Max 3)
                                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{profile.targetSpecializations.length}/3</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {SPECIALIZATIONS.map(s => {
                                    const isSel = profile.targetSpecializations.includes(s.id);
                                    return (
                                        <button 
                                            key={s.id} onClick={()=>toggleSpecialization(s.id)}
                                            className={`p-4 rounded-2xl border text-left text-xs transition-all ${isSel ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'}`}
                                        >
                                            <span className="block font-bold mb-1 text-sm">{s.name}</span>
                                            <span className={`block text-[10px] opacity-60 ${isSel ? 'text-indigo-100' : ''}`}>{s.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}

                {/* INPUT TRANSKRIP */}
                {activeTab === 'input' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode}>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-black">Transkrip Nilai</h2>
                                    <p className="opacity-60 text-xs">Isi nilai mata kuliah yang telah diselesaikan.</p>
                                </div>
                                <button onClick={autoFillPreviousSemesters} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-colors">Auto-Fill TPB</button>
                            </div>
                            
                            <div className="space-y-8">
                                {[1,2,3,4,5,6,7,8].map(sem => {
                                    const courses = CURRICULUM_DB.filter(c => getCourseSemester(c) === sem);
                                    const semNr = stats.semesterData?.[sem]?.nr || 0;
                                    
                                    return (
                                        <div key={sem} className="mb-6 border rounded-2xl overflow-hidden dark:border-slate-800">
                                            <div className={`p-4 flex justify-between items-center ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                                <span className="font-bold text-xs uppercase tracking-wider">Semester {sem}</span>
                                                {semNr > 0 && <span className="text-[10px] font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border dark:border-slate-700">NR: {semNr.toFixed(2)}</span>}
                                            </div>
                                            <div className="divide-y dark:divide-slate-800">
                                                {courses.map(c => {
                                                    const g = history[c.code] || "";
                                                    const isFailed = g && GRADES[g] < 2.0; 
                                                    const isRetaking = retakePlan[c.code];

                                                    return (
                                                        <div key={c.code} className={`p-4 flex justify-between items-center ${isRetaking ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                                                            <div className="flex-1 pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono text-[10px] opacity-50 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{c.code}</span>
                                                                    <span className="font-bold text-xs">{c.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1 ml-1">
                                                                    <span className="text-[9px] opacity-40 uppercase font-bold tracking-wider">{c.sks} SKS</span>
                                                                    {isRetaking && <span className="text-[8px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold">RETAKE DI SEM {isRetaking}</span>}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                {isFailed && !isRetaking && (
                                                                    <div className="relative group">
                                                                        <button className="p-2 text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                                                                            <Icon name="RotateCcw" size={14}/>
                                                                        </button>
                                                                        <div className="absolute right-0 top-full mt-2 hidden group-hover:flex bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-xl z-30 p-2 flex-wrap w-40 gap-1">
                                                                            {[1,2,3,4,5,6,7,8].map(rSem => (
                                                                                <button 
                                                                                    key={rSem}
                                                                                    onClick={() => handleRetake(c.code, rSem)}
                                                                                    className="w-8 h-8 text-[10px] flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded font-bold"
                                                                                >{rSem}</button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {isRetaking && (
                                                                    <button onClick={() => cancelRetake(c.code)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                                        <Icon name="X" size={14}/>
                                                                    </button>
                                                                )}

                                                                <select 
                                                                    value={g} 
                                                                    onChange={(e) => setHistory({...history, [c.code]: e.target.value})}
                                                                    className={`bg-transparent border rounded-xl px-3 py-2 text-sm outline-none font-bold cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                                >
                                                                    <option value="">-</option>
                                                                    {Object.keys(GRADES).map(key => <option key={key} value={key}>{key}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}
                
                {/* PLANNER (AI vs Draft) */}
                {activeTab === 'planner' && (
                    <div className="grid md:grid-cols-2 gap-4 h-[600px]">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-sm">Katalog Matkul</h3>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setPlannerMode('ai')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${plannerMode === 'ai' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'opacity-50'}`}
                                    >
                                        Rekomendasi AI
                                    </button>
                                    <button 
                                        onClick={() => setPlannerMode('draft')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${plannerMode === 'draft' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'opacity-50'}`}
                                    >
                                        Semua (Draft)
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                {(plannerMode === 'ai' ? plannerData.aiRecommendations : plannerData.draftCatalog)
                                    .filter(c => !plannerSelection.includes(c.code))
                                    .map(c => (
                                    <div key={c.code} className="p-3 border dark:border-slate-800 rounded-xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-400 transition-colors">
                                        <div>
                                            <p className="font-bold text-[11px] leading-tight mb-0.5">{c.name}</p>
                                            <p className="text-[9px] opacity-40 uppercase font-bold tracking-wider">
                                                {c.code} • {c.sks} SKS • Sem {c.semester}
                                                {retakePlan[c.code] && <span className="text-amber-500 ml-1">(RETAKE)</span>}
                                            </p>
                                        </div>
                                        <button onClick={() => togglePlannerSelection(c.code)} className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-lg"><Icon name="Plus" size={14}/></button>
                                    </div>
                                ))}
                                {plannerMode === 'ai' && plannerData.aiRecommendations.length === 0 && (
                                    <div className="text-center p-4 opacity-50 text-xs">Semua rekomendasi sudah diambil atau tidak ada.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-sm">Draft Rencana Kamu</h3>
                                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg">
                                    Total: {plannerSelection.reduce((a,c) => a + (CURRICULUM_DB.find(x=>x.code===c)?.sks||0), 0)} SKS
                                </span>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-900/30 rounded-2xl p-3 overflow-y-auto space-y-2 border-2 border-dashed dark:border-slate-800">
                                {plannerSelection.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <Icon name="Target" size={32}/>
                                        <p className="text-xs mt-2 font-bold">Belum ada matkul dipilih</p>
                                    </div>
                                )}
                                {plannerSelection.map(cc => {
                                    const c = CURRICULUM_DB.find(x=>x.code===cc);
                                    return (
                                        <div key={cc} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex justify-between items-center animate-in shadow-sm">
                                            <div>
                                                <p className="font-bold text-[11px] leading-none mb-0.5">{c.name}</p>
                                                <p className="text-[9px] opacity-40 font-bold uppercase tracking-wider">{c.code} • {c.sks} SKS</p>
                                            </div>
                                            <button onClick={() => togglePlannerSelection(cc)} className="p-1 text-red-400 hover:text-red-600"><Icon name="X" size={14}/></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI ASSISTANT */}
                {activeTab === 'assistant' && (
                    <Card darkMode={darkMode} className="h-[600px] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
                        <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl"><Icon name="Bot" size={20}/></div>
                            <div><h3 className="font-bold text-sm">OceanAI</h3><p className="text-[10px] opacity-70">Academic Assistant</p></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div 
                                        className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-md ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border-slate-200 shadow-sm'}`}
                                        dangerouslySetInnerHTML={renderMarkdown(m.text)}
                                    />
                                </div>
                            ))}
                            {isTyping && <div className="text-xs opacity-50 p-2 animate-pulse">Mengetik...</div>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-3 border-t dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
                            <input 
                                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 p-2 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-xs font-medium"
                                placeholder="Tanya sesuatu..."
                            />
                            <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Icon name="Send" size={16}/></button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

// Safe Mounting Logic (React 18)
const container = document.getElementById('root');
if (container) {
    if (!container._reactRoot) {
        container._reactRoot = createRoot(container);
    }
    const root = container._reactRoot;
    
    try {
        root.render(
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        );
    } catch(e) {
        console.error("Render Error:", e);
        container.innerHTML = '<div class="p-10 text-red-500 font-bold text-center">Gagal memuat aplikasi. Coba refresh halaman.</div>';
    }
} else {
    console.error("Root element not found");
}
