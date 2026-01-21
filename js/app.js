// js/app.js
const { useState, useEffect, useMemo, useRef } = React;

// Komponen Icon yang jauh lebih aman dari error destructuring
const Icon = ({ icon, size = 20, className = "" }) => {
    // Cek apakah icon ada dan apakah strukturnya benar-benar array
    if (!icon || !Array.isArray(icon)) return null;

    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            {icon.map((item, index) => {
                // Cegah error destructuring dengan cek tipe data item
                if (!Array.isArray(item)) return null;
                const [tag, attrs] = item;
                return React.createElement(tag, { ...attrs, key: index });
            })}
        </svg>
    );
};

// ... (Gunakan komponen Card, ProgressBar, dll yang sebelumnya)

const App = () => {
    // Ambil data dari window (global scope)
    const { GRADES, TARGET_SKS_LULUS, CURRICULUM_DB, Icons } = window;
    
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState({});

    const semesterStats = useMemo(() => {
        let cs = 0, cp = 0;
        if (!CURRICULUM_DB || !GRADES) return { ipk: "0.00", totalSks: 0 };
        
        CURRICULUM_DB.forEach(c => {
            const g = history[c.code];
            if (g && GRADES[g] !== undefined) {
                cs += c.sks;
                cp += (c.sks * GRADES[g]);
            }
        });
        return { ipk: cs > 0 ? (cp/cs).toFixed(2) : "0.00", totalSks: cs };
    }, [history]);

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <header className={`p-5 flex justify-between items-center border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h1 className="font-black text-2xl tracking-tight">Ocean<span className="text-indigo-600">Plan</span></h1>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600">
                    {darkMode ? <Icon icon={Icons.Sun} /> : <Icon icon={Icons.Moon} />}
                </button>
            </header>
            
            <main className="max-w-5xl mx-auto p-6">
                <div className={`p-10 rounded-[2.5rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h2 className="text-4xl font-black mb-6">Analisis Akademik</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                            <p className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">IPK Total</p>
                            <p className="text-5xl font-black text-indigo-600">{semesterStats.ipk}</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                            <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">SKS Lulus</p>
                            <p className="text-5xl font-black text-emerald-600">{semesterStats.totalSks}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
