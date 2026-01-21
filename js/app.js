const { useState, useEffect, useMemo, useRef } = React;
const { createRoot } = ReactDOM;

// --- COMPONENTS ---

// 1. Icon Component
const Icon = ({ name, size = 18, className = "" }) => {
    const iconData = window.lucide?.icons?.[name];
    if (!iconData || !Array.isArray(iconData)) return null;

    const [tag, attrs, children] = iconData;
    
    // Helper camelCase
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
            <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{current} / {max} SKS</span>
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
    
    // State Data
    const [history, setHistory] = useState({ 'MA1101': 'B' }); // { Code: Grade }
    const [retakePlan, setRetakePlan] = useState({}); // { Code: TargetSemester }
    const [plannerSelection, setPlannerSelection] = useState([]); // [Code1, Code2]
    const [plannerMode, setPlannerMode] = useState('ai'); // 'ai' | 'draft'
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
    const getCourseSemester = (course) => {
        // Cek apakah ada di retakePlan (Pindah Semester manual via Retake/Move)
        // Note: movedCourses dihapus, digabung ke logika umum
        return course.semester; 
    };

    // --- LOGIC UTAMA ---

    // 1. Kalkulasi Statistik & NR (Perbaikan Logika IPK)
    const stats = useMemo(() => {
        let cumulativeSks = 0;
        let cumulativePoints = 0;
        let sw = 0, sp = 0; // SKS Wajib & Pilihan
        const semesterData = {}; // { 1: { sks: 0, pts: 0, nr: 0 }, ... }
        const graphData = [];

        // Inisialisasi semester 1-8
        for(let i=1; i<=8; i++) semesterData[i] = { sks: 0, pts: 0, nr: 0, count: 0 };

        if (Array.isArray(CURRICULUM_DB)) {
            CURRICULUM_DB.forEach(c => {
                const grade = history[c.code];
                const originalSemester = c.semester;
                
                // Cek apakah matkul ini sedang di-retake (diulang)
                const isRetaking = retakePlan[c.code]; 
                
                // Jika ada nilai, hitung statistik
                if (grade && GRADES[grade] !== undefined) {
                    const bobot = GRADES[grade];
                    const points = c.sks * bobot;

                    // Logika IPK: Hanya hitung jika TIDAK sedang diulang
                    // Atau jika nilai sudah bagus (>= C) dianggap lulus sementara
                    // Tapi request user: matkul ngulang gak keitung lulus sampai input nilai baru
                    
                    if (!isRetaking) {
                        // Jika lulus (>= 2.0 / C)
                        if (bobot >= 2.0) {
                            cumulativeSks += c.sks;
                            cumulativePoints += points;
                            
                            if (c.type === 'Wajib') sw += c.sks; else sp += c.sks;
                        }
                        // Jika tidak lulus (D/E), tidak masuk hitungan SKS Lulus, tapi masuk hitungan pembagi IPK?
                        // Biasanya IPK = Total Mutu / Total SKS Diambil. 
                        // SKS Lulus = SKS yang nilainya >= C.
                        // Kita pisahkan:
                    }

                    // Masukkan data ke semester asal untuk NR Semester (History Nilai)
                    // NR Semester tetap mencatat nilai D/E
                    if (semesterData[originalSemester]) {
                        semesterData[originalSemester].sks += c.sks;
                        semesterData[originalSemester].pts += points;
                        semesterData[originalSemester].count += 1;
                    }
                }
            });
        }

        // Hitung NR per semester untuk grafik
        Object.keys(semesterData).sort((a,b)=>a-b).forEach(sem => {
            const d = semesterData[sem];
            if (d.sks > 0) {
                d.nr = d.pts / d.sks;
                graphData.push({ sem: parseInt(sem), nr: d.nr });
            }
        });

        // IPK Total (Total Mutu Seluruh Semester / Total SKS Seluruh Semester yang ada nilainya)
        // Revisi: Hitung ulang total points dan total sks dari semua history (termasuk E)
        let totalAllPoints = 0;
        let totalAllSks = 0;
        
        if (Array.isArray(CURRICULUM_DB)) {
             CURRICULUM_DB.forEach(c => {
                const grade = history[c.code];
                // Jangan hitung matkul yang sedang dalam rencana retake (karena dianggap akan diganti)
                // ATAU: Tetap hitung nilai lama sampai nilai baru keluar? 
                // Request user: "matkul ngulang gak keitung matkul selesai" -> Berarti sks lulus berkurang
                // Tapi IPK biasanya tetap menghitung nilai lama sampai diganti.
                // Mari kita ikuti: IPK mencerminkan nilai saat ini.
                
                if (grade && GRADES[grade] !== undefined) {
                    totalAllSks += c.sks;
                    totalAllPoints += (c.sks * GRADES[grade]);
                }
             });
        }

        const ipk = totalAllSks > 0 ? (totalAllPoints / totalAllSks).toFixed(2) : "0.00";

        return { 
            ipk, 
            sks: cumulativeSks, // SKS Lulus (C ke atas, tidak sedang retake)
            sw, sp,
            graphData,
            semesterData
        };
    }, [history, CURRICULUM_DB, GRADES, retakePlan]);


    // 2. Logic Rekomendasi (Planner)
    const plannerData = useMemo(() => {
        // Matkul yang belum lulus atau sedang diulang
        const candidates = CURRICULUM_DB.filter(c => {
            const g = history[c.code];
            const isPassed = g && GRADES[g] >= 2.0; // Anggap C lulus
            const isRetaking = retakePlan[c.code]; // Sedang direncanakan ulang
            return !isPassed || isRetaking;
        });

        // Mode AI: Urutkan berdasarkan prioritas (misal: prasyarat terpenuhi)
        const aiRecommendations = candidates.filter(c => {
            // Cek prasyarat
            const prereqMet = c.prereq.every(p => history[p] && GRADES[history[p]] >= 1.0); // Minimal D untuk prasyarat (contoh)
            return prereqMet;
        }).sort((a,b) => a.semester - b.semester); // Prioritas semester bawah

        // Mode Draft: Semua matkul tersedia (bebas pilih)
        const draftCatalog = candidates;

        return { aiRecommendations, draftCatalog };

    }, [history, retakePlan, CURRICULUM_DB]);

    // Prediction Logic
    const prediction = useMemo(() => {
        const rem = Math.max(0, TARGET_SKS_LULUS - stats.sks);
        const needed = Math.ceil(rem / profile.sksPerSemesterAssumption);
        return { rem, gradYear: profile.startYear + Math.floor((profile.currentSemester + needed - 1) / 2) };
    }, [stats.sks, profile]);

    // --- HANDLERS ---

    const handleRetake = (code, targetSem) => {
        setRetakePlan(prev => ({ ...prev, [code]: parseInt(targetSem) }));
        // Opsional: Reset nilai di history jika mau dianggap 'kosong' saat mengulang
        // setHistory(prev => { const n = {...prev}; delete n[code]; return n; });
    };

    const cancelRetake = (code) => {
        setRetakePlan(prev => { const n = {...prev}; delete n[code]; return n; });
    };

    const togglePlannerSelection = (code) => {
        setPlannerSelection(prev => 
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleSend = async () => {
        if (!chatInput.trim()) return;
        const ut = chatInput;
        setMessages(prev => [...prev, { role: 'user', text: ut }]);
        setChatInput('');
        setIsTyping(true);

        const prompt = `OceanAI. IPK: ${stats.ipk}, SKS Lulus: ${stats.sks}.`;
        
        if (typeof window.askGemini === 'function') {
            const reply = await window.askGemini(ut, prompt, messages);
            setMessages(prev => [...prev, { role: 'ai', text: reply }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "Error: AI Service not loaded." }]);
        }
        setIsTyping(false);
    };
    
    // Auto Fill
    const autoFillPreviousSemesters = () => {
        const nh = { ...history };
        CURRICULUM_DB.forEach(c => { 
            if (c.semester < profile.currentSemester && !nh[c.code]) nh[c.code] = 'B'; 
        });
        setHistory(nh);
    };

    // Markdown Renderer
    const renderMarkdown = (text) => {
        if (typeof marked !== 'undefined' && marked.parse) return { __html: marked.parse(text) };
        return { __html: text.replace(/\n/g, '<br/>') };
    };
    
    const toggleSpecialization = (id) => {
        const cur = profile.targetSpecializations;
        if (cur.includes(id)) {
            setProfile({...profile, targetSpecializations: cur.filter(x => x !== id)});
        } else if (cur.length < 3) {
            setProfile({...profile, targetSpecializations: [...cur, id]});
        }
    };

    // Auto-scroll chat
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);


    // --- RENDER ---
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
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-2xl font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 animate-in">
                
                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode}>
                            <h2 className="text-3xl font-black mb-6">Statistik Akademik</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-indigo-500/10 text-center border border-indigo-500/20">
                                    <p className="text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-widest">IPK Kumulatif</p>
                                    <p className="text-4xl font-black text-indigo-600">{stats.ipk}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-emerald-500/10 text-center border border-emerald-500/20">
                                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-1 tracking-widest">SKS Lulus</p>
                                    <p className="text-4xl font-black text-emerald-600">{stats.sks}</p>
                                </div>
                            </div>
                        </Card>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="TrendingUp" size={16}/> NR Per Semester</h3>
                                {stats.graphData.length > 0 ? (
                                     <SimpleLineChart data={stats.graphData} darkMode={darkMode} />
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-xs opacity-40">Belum ada data nilai semester</div>
                                )}
                            </Card>
                            <Card darkMode={darkMode}>
                                <h3 className="font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest opacity-60"><Icon name="PieChart" size={16}/> Progres Studi</h3>
                                <ProgressBar label="Total SKS (144)" current={stats.sks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                                <ProgressBar label="Wajib Dasar" current={stats.sw} max={window.TARGET_SKS_WAJIB} colorClass="bg-emerald-500" darkMode={darkMode} />
                                <ProgressBar label="Pilihan Bidang" current={stats.sp} max={window.TARGET_SKS_PILIHAN} colorClass="bg-orange-500" darkMode={darkMode} />
                            </Card>
                        </div>
                    </div>
                )}

                {/* INPUT TRANSKRIP & RETAKE */}
                {activeTab === 'input' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-black">Transkrip Nilai</h2>
                                <button onClick={autoFillPreviousSemesters} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">Auto-Fill TPB</button>
                            </div>

                            {/* List Semester */}
                            {[1,2,3,4,5,6,7,8].map(sem => {
                                const courses = CURRICULUM_DB.filter(c => c.semester === sem);
                                const semNr = stats.semesterData?.[sem]?.nr || 0;
                                
                                return (
                                    <div key={sem} className="mb-6 border rounded-2xl overflow-hidden dark:border-slate-800">
                                        <div className={`p-3 flex justify-between items-center ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                            <span className="font-bold text-xs uppercase tracking-wider">Semester {sem}</span>
                                            {semNr > 0 && <span className="text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded border dark:border-slate-700">NR: {semNr.toFixed(2)}</span>}
                                        </div>
                                        <div className="divide-y dark:divide-slate-800">
                                            {courses.map(c => {
                                                const g = history[c.code] || "";
                                                const isFailed = g && GRADES[g] < 2.0; // D, E, T
                                                const isRetaking = retakePlan[c.code];

                                                return (
                                                    <div key={c.code} className={`p-3 flex justify-between items-center ${isRetaking ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-[10px] opacity-50">{c.code}</span>
                                                                <span className="font-bold text-xs">{c.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] opacity-40 uppercase font-bold tracking-wider">{c.sks} SKS</span>
                                                                {isRetaking && <span className="text-[8px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold">RETAKE DI SEM {isRetaking}</span>}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            {/* Tombol Retake jika Gagal */}
                                                            {isFailed && !isRetaking && (
                                                                <div className="relative group">
                                                                    <button className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                        <Icon name="RotateCcw" size={14}/>
                                                                    </button>
                                                                    {/* Popup Pilih Semester Retake */}
                                                                    <div className="absolute right-0 top-full mt-1 hidden group-hover:flex bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-xl rounded-xl z-30 p-1 flex-wrap w-32 gap-1">
                                                                         {[1,2,3,4,5,6,7,8].map(rSem => (
                                                                             <button 
                                                                                key={rSem}
                                                                                onClick={() => handleRetake(c.code, rSem)}
                                                                                className="w-6 h-6 text-[10px] flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded"
                                                                             >{rSem}</button>
                                                                         ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {isRetaking && (
                                                                <button onClick={() => cancelRetake(c.code)} className="p-1.5 text-slate-400 hover:text-slate-600">
                                                                    <Icon name="X" size={14}/>
                                                                </button>
                                                            )}

                                                            <select 
                                                                value={g} 
                                                                onChange={(e) => setHistory({...history, [c.code]: e.target.value})}
                                                                className={`bg-transparent border rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}
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
                )}

                {/* PLANNER (DUA MODE: AI vs DRAFT) */}
                {activeTab === 'planner' && (
                    <div className="grid md:grid-cols-2 gap-4 h-[600px]">
                        {/* Kolom Kiri: Katalog / Rekomendasi */}
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

                        {/* Kolom Kanan: Draft Rencana User */}
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
                                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-md ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
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
