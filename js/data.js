// js/data.js

// Pasang variabel ke objek window agar bisa diakses secara global oleh app.js
window.GRADES = { 'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'E': 0.0, 'T': 0.0 };
window.TARGET_SKS_LULUS = 144;
window.TARGET_SKS_WAJIB = 100;
window.TARGET_SKS_PILIHAN = 44;

window.SPECIALIZATIONS = [
    { id: 'offshore', name: 'Struktur Bangunan Lepas Pantai', required: ['KL4101', 'KL4102'], desc: 'Desain anjungan minyak & gas.' },
    { id: 'coastal', name: 'Rekayasa & Perlindungan Pantai', required: ['KL4201', 'KL3202'], desc: 'Penanganan abrasi & reklamasi.' },
    { id: 'port', name: 'Pelabuhan & Transportasi Laut', required: ['KL4105', 'KL4205'], desc: 'Logistik maritim.' },
    { id: 'ocean_modelling', name: 'Pemodelan & Hidrodinamika', required: ['KL4202', 'KL2205'], desc: 'Simulasi arus & tsunami.' },
    { id: 'geotech', name: 'Geoteknik Kelautan', required: ['KL3103', 'KL3204'], desc: 'Pondasi dasar laut.' },
    { id: 'environment', name: 'Lingkungan Laut', required: ['KL4110'], desc: 'AMDAL & konservasi.' },
    { id: 'energy', name: 'Energi Laut Terbarukan', required: ['KL4108', 'KL4208'], desc: 'Energi terbarukan arus/gelombang.' },
    { id: 'acoustics', name: 'Akustik Bawah Air', required: ['KL3104'], desc: 'Sonar & instrumentasi.' },
];

window.CURRICULUM_DB = [
    { code: 'MA1101', name: 'Matematika IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'FI1101', name: 'Fisika Dasar IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'MA1201', name: 'Matematika IIA', sks: 4, semester: 2, type: 'Wajib', prereq: ['MA1101'] },
    { code: 'KL2102', name: 'Mekanika Fluida', sks: 4, semester: 3, type: 'Wajib', prereq: [] },
    { code: 'KL2202', name: 'Hidrodinamika', sks: 3, semester: 4, type: 'Wajib', prereq: ['KL2102'] },
    { code: 'KL3102', name: 'Gelombang Laut', sks: 3, semester: 5, type: 'Wajib', prereq: ['KL2202'] },
    { code: 'KL3202', name: 'Bangunan Pantai', sks: 3, semester: 6, type: 'Wajib', prereq: ['KL3102'] },
    { code: 'KL4101', name: 'Dinamika Struktur Lepas Pantai', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4102', name: 'Desain Struktur Lepas Pantai II', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL4101'] },
    { code: 'KL4201', name: 'Manajemen Pesisir', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4202', name: 'Model Numerik Pantai', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL3202'] },
    { code: 'KL3103', name: 'Mekanika Tanah Laut', sks: 3, semester: 5, type: 'Wajib', prereq: [] },
    { code: 'KL3204', name: 'Pondasi Laut', sks: 2, semester: 6, type: 'Wajib', prereq: ['KL3103'] },
    { code: 'KL4110', name: 'Lingkungan Laut & Pengerukan', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL2205', name: 'Metode Numerik Kelautan', sks: 2, semester: 4, type: 'Wajib', prereq: [] },
    { code: 'KL3104', name: 'Akustik Bawah Air', sks: 3, semester: 5, type: 'Wajib', prereq: [] },
    { code: 'KL4108', name: 'Energi Arus', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4208', name: 'Energi Gelombang', sks: 3, semester: 8, type: 'Pilihan', prereq: [] },
    { code: 'KL4105', name: 'Perencanaan Pelabuhan', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4205', name: 'Operasional Pelabuhan', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL4105'] },
];

window.Icons = {
    BookOpen: lucide.icons.BookOpen, CheckCircle: lucide.icons.CheckCircle, AlertCircle: lucide.icons.AlertCircle,
    TrendingUp: lucide.icons.TrendingUp, Award: lucide.icons.Award, Brain: lucide.icons.Brain,
    Save: lucide.icons.Save, BarChart3: lucide.icons.BarChart3, ArrowRightLeft: lucide.icons.ArrowRightLeft,
    Info: lucide.icons.Info, X: lucide.icons.X, Database: lucide.icons.Database,
    MessageSquare: lucide.icons.MessageSquare, Send: lucide.icons.Send, RotateCcw: lucide.icons.RotateCcw,
    Target: lucide.icons.Target, Sparkles: lucide.icons.Sparkles, AlertTriangle: lucide.icons.AlertTriangle,
    Bot: lucide.icons.Bot, Plus: lucide.icons.Plus, Minus: lucide.icons.Minus,
    Moon: lucide.icons.Moon, Sun: lucide.icons.Sun, Mail: lucide.icons.Mail, 
    PieChart: lucide.icons.PieChart, Zap: lucide.icons.Zap, Calendar: lucide.icons.Calendar,
    Clock: lucide.icons.Clock, GraduationCap: lucide.icons.GraduationCap, ChevronRight: lucide.icons.ChevronRight
};
