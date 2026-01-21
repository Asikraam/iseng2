const { useState, useEffect, useMemo, useRef } = React;

// Komponen Icon yang jauh lebih stabil buat sistem modular
const Icon = ({ name, size = 20, className = "" }) => {
    // Ambil data ikon langsung dari window.lucide
    const iconData = window.lucide?.icons?.[name];
    if (!iconData || !Array.isArray(iconData)) return null;

    const [tag, attrs, children] = iconData;
    return (
        <svg 
            width={size} height={size} viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
            className={className}
        >
            {children.map((child, i) => React.createElement(child[0], { ...child[1], key: i }))}
        </svg>
    );
};

// Reusable UI Components
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

const Card = ({ children, className = "", darkMode }) => (
    <div className={`rounded-3xl border p-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} ${className}`}>
        {children}
    </div>
);

const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState({ 
        'MA1101': 'A', 'FI1101': 'AB', 'MA1201': 'B' // Contoh data biar gak 0.00
    });
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Halo Aswal! Ada yang bisa gue bantu soal Teknik Kelautan?' }]);

    // Ambil variabel global dari window.data.js
    const { GRADES, TARGET_SKS_LULUS, CURRICULUM_DB } = window;

    const stats = useMemo(() => {
        let totalSks = 0, totalPoints = 0;
        if (!CURRICULUM_DB || !GRADES) return { ipk: "0.00", sks: 0 };

        CURRICULUM_DB.forEach(c => {
            const g = history[c.code];
            if (g && GRADES[g] !== undefined) {
                totalSks += c.sks;
                totalPoints += (c.sks * GRADES[g]);
            }
        });
        return { ipk: totalSks > 0 ? (totalPoints/totalSks).toFixed(2) : "0.00", sks: totalSks };
    }, [history]);

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 p-5 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                    <Icon name="BookOpen" className="text-indigo-600" />
                    <h1 className="font-black text-2xl tracking-tight">Ocean<span className="text-indigo-600">Plan</span></h1>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600">
                    <Icon name={darkMode ? "Sun" : "Moon"} />
                </button>
            </header>

            {/* Navigation */}
            <nav className="max-w-5xl mx-auto p-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {['dashboard', 'input', 'assistant'].map(tab => (
                    <button 
                        key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-4 animate-in">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <Card darkMode={darkMode}>
                            <h2 className="text-3xl font-black mb-6">Dashboard Akademik</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-indigo-500/10 text-center">
                                    <p className="text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-widest">IPK Total</p>
                                    <p className="text-4xl font-black text-indigo-600">{stats.ipk}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-emerald-500/10 text-center">
                                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-1 tracking-widest">SKS Lulus</p>
                                    <p className="text-4xl font-black text-emerald-600">{stats.sks}</p>
                                </div>
                            </div>
                        </Card>
                        <Card darkMode={darkMode}>
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Icon name="PieChart" size={18}/> Progres Kelulusan</h3>
                            <ProgressBar label="Target SKS (144)" current={stats.sks} max={TARGET_SKS_LULUS} colorClass="bg-indigo-600" darkMode={darkMode} />
                        </Card>
                    </div>
                )}

                {activeTab === 'input' && (
                    <Card darkMode={darkMode}>
                        <h2 className="text-2xl font-black mb-4">Input Transkrip</h2>
                        <p className="opacity-60 text-sm">Pilih nilai untuk mata kuliah yang sudah lu ambil.</p>
                        {/* Logic input nilai bisa lu tambahin di sini */}
                    </Card>
                )}

                {activeTab === 'assistant' && (
                    <Card darkMode={darkMode} className="h-[500px] flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                className="flex-1 p-4 rounded-2xl border dark:border-slate-700 dark:bg-slate-800 outline-none"
                                placeholder="Tanya sesuatu..."
                            />
                            <button className="p-4 bg-indigo-600 text-white rounded-2xl"><Icon name="Send"/></button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
