// js/app.js
// Mengambil hooks dari window.React (karena pakai CDN)
const { useState, useEffect, useMemo, useRef } = window.React;

// --- COMPONENTS ---

// 1. Icon Component (Safe Lucide Wrapper)
const Icon = ({ name, size = 18, className = "" }) => {
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
    <div className={`rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} ${className}`}>
        {children}
    </div>
);

// 3. ProgressBar Component
const ProgressBar = ({ label, current, max, colorClass, darkMode }) => (
    <div className="mb-4">
        <div className="flex justify-between text-[9px] font-bold mb-1 uppercase tracking-widest leading-none">
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
            <span className="font-bold">{current}/{max}</span>
        </div>
        <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${Math.min((current/max)*100, 100)}%` }}></div>
        </div>
    </div>
);

// 4. SimpleLineChart Component
const SimpleLineChart = ({ data, darkMode }) => {
    if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-[10px] opacity-30 italic font-bold tracking-widest">NO DATA</div>;
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

// --- MAIN APP ---
const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState({});
    const [movedCourses, setMovedCourses] = useState({});
    const [profile, setProfile] = useState({ name: 'Mahasiswa', currentSemester: 4, startYear: 2024, targetSpecializations: ['offshore'], sksPerSemesterAssumption: 20 });
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Halo! Saya OceanAI. Bagaimana perkembangan studimu hari ini?' }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [plannerMode, setPlannerMode] = useState('recommendation');
    const [plannerSelection, setPlannerSelection] = useState([]);
    const chatEndRef = useRef(null);

    // Load Globals with Fallback
    const GRADES = window.GRADES || {};
    const TARGET_SKS_LULUS = window.TARGET_SKS_LULUS || 144;
    const TARGET_SKS_WAJIB = window.TARGET_SKS_WAJIB || 100;
    const TARGET_SKS_PILIHAN = window.TARGET_SKS_PILIHAN || 44;
    const CURRICULUM_DB = window.CURRICULUM_DB || [];
    const SPECIALIZATIONS = window.SPECIALIZATIONS || [];

    // Helper Functions
    const getCourseSemester = (course) => movedCourses[course.code] !== undefined ? movedCourses[course.code] : course.semester;
    const isSpecializationCourse = (code) => SPECIALIZATIONS.some(s => s.required.includes(code));
    const getSpecName = (code) => {
        const found = SPECIALIZATIONS.filter(s => s.required.includes(code));
        return found.length > 0 ? found.map(s => s.name).join(', ') : null;
    };
    const getSpecIntersections = (code) => SPECIALIZATIONS.filter(s => s.required.includes(code)).map(s => s.name);

    // Stats Calculation
    const semesterStats = useMemo(() => {
        let totalSks = 0, totalPoints = 0, sw = 0, sp = 0;
        const graphData = [];
        const semGroups = {};
        
        if (Array.isArray(CURRICULUM_DB)) {
            CURRICULUM_DB.forEach(c => {
                const es = getCourseSemester(c);
                const g = history[c.code];
                if (g && GRADES[g] >= 2.0) { if (c.type === 'Wajib') sw += c.sks; else sp += c.sks; }
                if (es >= 1 && es <= 8 && g && GRADES[g] !== undefined) {
                    const points = c.sks * GRADES[g];
                    totalSks += c.sks;
                    totalPoints += points;
                    
                    if(!semGroups[es]) semGroups[es] = { sks: 0, pts: 0 };
                    semGroups[es].sks += c.sks;
                    semGroups[es].pts += points;
                }
            });
        }
        
        Object.keys(semGroups).sort((a,b)=>a-b).forEach(sem => {
            graphData.push({ sem: sem, nr: semGroups[sem].pts / semGroups[sem].sks });
        });

        return { 
            ipk: totalSks > 0 ? (totalPoints/totalSks).toFixed(2) : "0.00", 
            sks: totalSks,
            sw, sp,
            graphData 
        };
    }, [history, CURRICULUM_DB, GRADES, movedCourses]);

    const prediction = useMemo(() => {
        const rem = Math.max(0, TARGET_SKS_LULUS - semesterStats.sks);
        const needed = Math.ceil(rem / profile.sksPerSemesterAssumption);
        return { rem, gradYear: profile.startYear + Math.floor((profile.currentSemester + needed - 1) / 2) };
    }, [semesterStats.sks, profile]);

    // Filtering Logic
    const recommendedCourses = useMemo(() => {
        return CURRICULUM_DB.filter(c => !history[c.code] || GRADES[history[c.code]] < 2.0)
            .filter(c => c.prereq.every(p => history[p] && GRADES[history[p]] >= 1.0))
            .sort((a,b) => b.sks - a.sks);
    }, [history, CURRICULUM_DB]);

    const notPassedCourses = useMemo(() => CURRICULUM_DB.filter(c => !history[c.code] || GRADES[history[c.code]] < 2.0), [history, CURRICULUM_DB]);

    // Handlers
    const handleSend = async () => {
        if (!chatInput.trim()) return;
        const ut = chatInput;
        setMessages(prev => [...prev, { role: 'user', text: ut }]);
        setChatInput('');
        setIsTyping(true);

        const prompt = `OceanAI. IPK: ${semesterStats.ipk}, SKS: ${semesterStats.sks}, Sisa SKS: ${prediction.rem}. Gunakan Markdown.`;
        
        if (typeof window.askGemini === 'function') {
            const reply = await window.askGemini(ut, prompt, messages);
            setMessages(prev => [...prev, { role: 'ai', text: reply }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "Error: AI Service not loaded." }]);
        }
        setIsTyping(false);
    };

    const toggleSpecialization = (id) => {
        const cur = profile.targetSpecializations;
        setProfile({...profile, targetSpecializations: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id].slice(-8)});
    };
    
    const autoFillPreviousSemesters = () => {
        const nh = { ...history };
        CURRICULUM_DB.forEach(c => { if (getCourseSemester(c) < profile.currentSemester && !nh[c.code]) nh[c.code] = 'B'; });
        setHistory(nh);
    };

    const moveCourse = (cc, ns) => setMovedCourses(p => ({...p, [cc]: parseInt(ns)}));

    // Markdown Renderer
    const renderMarkdown = (text) => {
        if (typeof marked !== 'undefined' && marked.parse) return { __html: marked.parse(text) };
        return { __html: text.replace(/\n/g, '<br/>') };
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    if (!CURRICULUM_DB.length) return <div className="p-10 text-center">Loading Database...</div>;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 p-5 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 text-white p-1 rounded-lg shadow-lg"><Icon name="BookOpen" size={16} /></div>
                    <h1 className="font-black text-2xl tracking-tight">Ocean<span className="text-indigo-600">Plan</span></h1>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600">
                    <Icon name={darkMode ? "Sun" : "Moon"} />
                </button>
            </header>

            {/* Nav */}
            <nav className="max-w-5xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {['dashboard', 'input', 'planner', 'library', 'assistant'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-2xl font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50'}`}>
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Main */}
            <main className="max-w-5xl mx-auto p-4 animate-in">
                
                {/* DASHBOARD (v14.3 Restored) */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode} className="bg-indigo-600 dark:bg-indigo-700 text-white border-none relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 grid md:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-3xl font-black mb-2">Halo, {profile.name}!</h2>
                                    <p className="opacity-80 text-sm mb-6">Pusat Konfigurasi Akademik.</p>
                                    
                                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2 block">Semester Berjalan:</label>
                                        <select 
                                            value={profile.currentSemester} 
                                            onChange={(e)=>setProfile({...profile, currentSemester: parseInt(e.target.value)})} 
                                            className="w-full bg-white text-indigo-700 p-3 rounded-xl font-black text-sm outline-none"
                                        >
                                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 p-4 rounded-2xl text-center">
                                            <p className="text-[9px] font-black uppercase opacity-60">IPK</p>
                                            <p className="text-3xl font-black">{semesterStats.ipk}</p>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-2xl text-center">
                                            <p className="text-[9px] font-black uppercase opacity-60">SKS Lulus</p>
                                            <p className="text-3xl font-black">{semesterStats.sks}</p>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-900/40 p-5 rounded-2xl border border-white/10 mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Prediksi Wisuda</span>
                                            <span className="text-2xl font-black text-amber-400">{prediction.gradYear}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-bold">Asumsi {profile.sksPerSemesterAssumption} SKS/Sem</span>
                                            <input 
                                                type="range" min="12" max="24" 
                                                value={profile.sksPerSemesterAssumption} 
                                                onChange={(e)=>setProfile({...profile, sksPerSemesterAssumption: parseInt(e.target.value)})} 
                                                className="flex-1 accent-white h-1.5 bg-white/20 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="TrendingUp" size={16}/> Grafik Performa</h3>
                                <SimpleLineChart data={semesterStats.graphData} darkMode={darkMode} />
                            </Card>
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="PieChart" size={16}/> Progres Kelulusan</h3>
                                <ProgressBar label="Total SKS (144)" current={semesterStats.sks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                                <ProgressBar label="Wajib Dasar" current={semesterStats.sw} max={TARGET_SKS_WAJIB} colorClass="bg-emerald-500" darkMode={darkMode} />
                                <ProgressBar label="Pilihan Bidang" current={semesterStats.sp} max={TARGET_SKS_PILIHAN} colorClass="bg-orange-500" darkMode={darkMode} />
                            </Card>
                        </div>
                        
                        <Card darkMode={darkMode}>
                            <h3 className="font-bold mb-4 text-sm uppercase tracking-widest opacity-60">Spesialisasi Fokus</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {SPECIALIZATIONS.map(s => {
                                    const isSel = profile.targetSpecializations.includes(s.id);
                                    return (
                                        <button 
                                            key={s.id} onClick={()=>toggleSpecialization(s.id)}
                                            className={`p-3 rounded-xl border text-left text-xs transition-all ${isSel ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'}`}
                                        >
                                            <span className="block font-bold mb-1">{s.name}</span>
                                            <span className={`block text-[10px] opacity-60 ${isSel ? 'text-indigo-100' : ''}`}>{s.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}

                {/* INPUT TRANSKRIP (Compact Rows) */}
                {activeTab === 'input' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">Input Transkrip</h2>
                                    <p className="opacity-60 text-xs">Isi nilai mata kuliah yang telah diselesaikan.</p>
                                </div>
                                <button onClick={autoFillPreviousSemesters} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700">Auto-Fill TPB</button>
                            </div>
                        </Card>

                        {[1,2,3,4,5,6,7,8].map(s => {
                            const courses = CURRICULUM_DB.filter(c => getCourseSemester(c) === s);
                            if (courses.length === 0) return null;

                            return (
                                <div key={s} className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Semester {s}</span>
                                        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
                                    </div>
                                    <div className="grid gap-2">
                                        {courses.map(c => {
                                            const g = history[c.code] || "";
                                            const isSpec = isSpecializationCourse(c.code);
                                            return (
                                                <div key={c.code} className={`flex items-center px-3 py-1.5 border rounded-xl dark:border-slate-800 transition-all ${g ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 opacity-60'}`}>
                                                    <div className="w-14 hidden sm:block opacity-30 font-mono text-[9px]">{c.code}</div>
                                                    <div className="flex-1 min-w-0 pr-3">
                                                        <p className="text-[11px] font-bold truncate leading-tight dark:text-slate-100 text-slate-800">{c.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[8px] font-black opacity-40 leading-none">{c.sks} SKS</span>
                                                            {isSpec && <span className="text-[8px] font-bold text-amber-500 border border-amber-500/20 px-1 rounded bg-amber-500/5 leading-none tracking-tighter uppercase">Bidang</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="relative group">
                                                            <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"><Icon name="Move" size={14}/></button>
                                                            <div className="absolute right-0 top-full mt-1 hidden group-hover:grid grid-cols-4 gap-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-xl z-30">
                                                                {[1,2,3,4,5,6,7,8].map(ns => <button key={ns} onClick={()=>moveCourse(c.code, ns)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold ${ns===s?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{ns}</button>)}
                                                            </div>
                                                        </div>
                                                        <select 
                                                            value={g} 
                                                            onChange={(e) => setHistory({...history, [c.code]: e.target.value})}
                                                            className={`text-[11px] font-black px-1 py-0.5 rounded-lg outline-none w-14 text-center border dark:border-slate-700 ${g ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 shadow-sm border-indigo-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                                        >
                                                            <option value="">-</option>
                                                            {Object.keys(GRADES).map(v => <option key={v} value={v}>{v}</option>)}
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
                )}

                {/* STRATEGI (PLANNER) */}
                {activeTab === 'planner' && (
                    <div className="grid md:grid-cols-2 gap-4 h-[600px]">
                        <div className="flex flex-col gap-2 overflow-hidden">
                            <div className="flex justify-between items-center px-2 py-1">
                                <h3 className="font-bold text-xs flex items-center gap-2 tracking-tight uppercase opacity-50">Saran Pengambilan</h3>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button onClick={()=>setPlannerMode('recommendation')} className={`text-[9px] px-2 py-1 rounded-md font-bold ${plannerMode==='recommendation'?'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300':'opacity-40'}`}>AI</button>
                                    <button onClick={()=>setPlannerMode('catalog')} className={`text-[9px] px-2 py-1 rounded-md font-bold ${plannerMode==='catalog'?'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300':'opacity-40'}`}>ALL</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-hide">
                                {(plannerMode === 'recommendation' ? recommendedCourses : notPassedCourses).filter(c => !plannerSelection.includes(c.code)).map(c => (
                                    <div key={c.code} className="p-3 border dark:border-slate-800 rounded-xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
                                        <div><p className="font-bold text-[10px] leading-tight mb-0.5">{c.name}</p><p className="text-[8px] opacity-40 uppercase font-bold tracking-wider">{c.code} • S{c.semester}</p></div>
                                        <button onClick={()=>setPlannerSelection([...plannerSelection, c.code])} className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-800"><Icon name="Plus" size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 overflow-hidden">
                            <div className="flex justify-between items-center px-2 py-1">
                                <h3 className="font-bold text-xs flex items-center gap-2 tracking-tight uppercase opacity-50">Draft Rencana</h3>
                                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg shadow-lg">{plannerSelection.reduce((a,c)=>a+(CURRICULUM_DB.find(x=>x.code===c)?.sks||0),0)} SKS</span>
                            </div>
                            <div className={`flex-1 bg-slate-100 dark:bg-slate-900/30 rounded-2xl p-3 overflow-y-auto space-y-1.5 border-2 border-dashed dark:border-slate-800`}>
                                {plannerSelection.map(cc => {
                                    const c = CURRICULUM_DB.find(x=>x.code===cc);
                                    return (
                                        <div key={cc} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex justify-between items-center animate-in shadow-sm">
                                            <div><p className="font-bold text-[10px] leading-none mb-0.5">{c.name}</p><p className="text-[8px] opacity-40 font-bold uppercase tracking-wider">{c.code}</p></div>
                                            <button onClick={()=>setPlannerSelection(plannerSelection.filter(x=>x!==cc))} className="p-1 text-rose-400 hover:text-rose-600"><Icon name="X" size={14}/></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* LIBRARY */}
                {activeTab === 'library' && (
                    <div className="space-y-3">
                         <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                            <div><h2 className="text-sm font-black uppercase tracking-widest leading-none">Katalog Kurikulum</h2><p className="text-[9px] opacity-50 mt-1.5 font-bold uppercase tracking-tighter leading-none">Highlight Amber menandakan syarat Wajib Bidang.</p></div>
                            <Icon name="Database" size={28} className="text-indigo-600 opacity-40" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[1,2,3,4,5,6,7,8].map(s => {
                                const courses = CURRICULUM_DB.filter(c => c.semester === s);
                                return (
                                    <Card key={s} darkMode={darkMode} className="overflow-hidden">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 font-black text-[10px] flex justify-between uppercase tracking-widest border-b dark:border-slate-700 leading-none"><span>SEM {s}</span><span className="opacity-40">{courses.reduce((a,b)=>a+b.sks, 0)} SKS</span></div>
                                        <div className="divide-y dark:divide-slate-800">
                                            {courses.map(c => {
                                                const spec = getSpecName(c.code);
                                                return (
                                                    <div key={c.code} className={`p-2 flex justify-between items-center text-[10px] ${spec ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}>
                                                        <div className="flex-1 pr-2 min-w-0">
                                                            <div className="flex items-center gap-1.5 mb-0.5 leading-none">
                                                                <span className={`font-mono text-[7px] px-1 rounded font-bold ${spec ? 'bg-amber-500 text-white' : 'opacity-40 bg-slate-100 dark:bg-slate-800'}`}>{c.code}</span>
                                                                <span className={`font-bold truncate ${spec ? 'text-amber-600 dark:text-amber-400' : 'opacity-80'}`}>{c.name}</span>
                                                            </div>
                                                            {spec && <p className="text-[7px] font-black text-amber-500 uppercase tracking-tighter flex items-center gap-1 leading-none mt-1"><Icon name="Zap" size={8}/> {spec}</p>}
                                                        </div>
                                                        <span className="font-bold opacity-30 text-[9px]">{c.sks}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
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
                                placeholder="Tanya sesuatu..."
                            />
                            <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Icon name="Send" size={20}/></button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

// Safe Mounting for React 18
const container = document.getElementById('root');
if (container) {
    if (!container._reactRoot) {
        container._reactRoot = ReactDOM.createRoot(container);
    }
    const root = container._reactRoot;
    
    // Gunakan try-catch di level root agar jika ada error tidak crash total
    try {
        root.render(<App />);
    } catch(e) {
        console.error("Render Error:", e);
        container.innerHTML = '<div class="p-10 text-red-500">Gagal memuat aplikasi. Coba refresh halaman.</div>';
    }
}
