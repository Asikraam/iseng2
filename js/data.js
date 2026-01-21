// js/data.js

// Konfigurasi Global
window.GRADES = { 'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'E': 0.0, 'T': 0.0 };
window.TARGET_SKS_LULUS = 144;
window.TARGET_SKS_WAJIB = 100;
window.TARGET_SKS_PILIHAN = 44;
window.MAX_SKS_ABSOLUTE = 24;

// Data Spesialisasi
window.SPECIALIZATIONS = [
    { id: 'offshore', name: 'Lepas Pantai', required: ['KL4101', 'KL4102'], desc: 'Desain anjungan minyak & gas.' },
    { id: 'coastal', name: 'Rekayasa Pantai', required: ['KL4201', 'KL3202'], desc: 'Penanganan abrasi & reklamasi.' },
    { id: 'port', name: 'Pelabuhan', required: ['KL4105', 'KL4205'], desc: 'Logistik Maritim & Dermaga.' },
    { id: 'ocean_modelling', name: 'Pemodelan', required: ['KL4202', 'KL2205'], desc: 'Simulasi arus & tsunami.' },
    { id: 'geotech', name: 'Geoteknik', required: ['KL3103', 'KL3204'], desc: 'Pondasi Dasar Laut.' },
    { id: 'environment', name: 'Lingkungan', required: ['KL4110'], desc: 'AMDAL & konservasi.' },
    { id: 'energy', name: 'Energi Laut', required: ['KL4108', 'KL4208'], desc: 'Energi terbarukan arus laut.' },
    { id: 'acoustics', name: 'Akustik', required: ['KL3104'], desc: 'Sonar & bawah air.' },
];

// Database Kurikulum Lengkap (S1-S8)
window.CURRICULUM_DB = [
    // Semester 1
    { code: 'MA1101', name: 'Matematika IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'FI1101', name: 'Fisika Dasar IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'KI1101', name: 'Kimia Dasar IA', sks: 3, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'KU1102', name: 'Pengenalan Komputasi', sks: 3, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'KU1011', name: 'Tata Tulis Karya Ilmiah', sks: 2, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'KU1001', name: 'Olahraga', sks: 2, semester: 1, type: 'Wajib', prereq: [] },
    // Semester 2
    { code: 'MA1201', name: 'Matematika IIA', sks: 4, semester: 2, type: 'Wajib', prereq: ['MA1101'] },
    { code: 'FI1201', name: 'Fisika Dasar IIA', sks: 4, semester: 2, type: 'Wajib', prereq: ['FI1101'] },
    { code: 'KI1201', name: 'Kimia Dasar IIA', sks: 3, semester: 2, type: 'Wajib', prereq: ['KI1101'] },
    { code: 'KU1202', name: 'Pengantar Rekayasa & Desain', sks: 2, semester: 2, type: 'Wajib', prereq: [] },
    { code: 'KU1024', name: 'Bahasa Inggris', sks: 2, semester: 2, type: 'Wajib', prereq: [] },
    { code: 'KU1101', name: 'Pendidikan Agama', sks: 2, semester: 2, type: 'Wajib', prereq: [] },
    // Semester 3
    { code: 'KL2101', name: 'Matematika Teknik I', sks: 3, semester: 3, type: 'Wajib', prereq: ['MA1201'] },
    { code: 'KL2102', name: 'Mekanika Fluida', sks: 4, semester: 3, type: 'Wajib', prereq: [] },
    { code: 'KL2103', name: 'Statika Struktur', sks: 3, semester: 3, type: 'Wajib', prereq: [] },
    { code: 'KL2104', name: 'Geologi Laut', sks: 2, semester: 3, type: 'Wajib', prereq: [] },
    { code: 'KL2105', name: 'Material Laut & Korosi', sks: 2, semester: 3, type: 'Wajib', prereq: [] },
    // Semester 4
    { code: 'KL2201', name: 'Matematika Teknik II', sks: 3, semester: 4, type: 'Wajib', prereq: ['KL2101'] },
    { code: 'KL2202', name: 'Hidrodinamika', sks: 3, semester: 4, type: 'Wajib', prereq: ['KL2102'] },
    { code: 'KL2203', name: 'Mekanika Material', sks: 3, semester: 4, type: 'Wajib', prereq: ['KL2103'] },
    { code: 'KL2204', name: 'Oseanografi Fisik', sks: 3, semester: 4, type: 'Wajib', prereq: [] },
    { code: 'KL2205', name: 'Metode Numerik Kelautan', sks: 2, semester: 4, type: 'Wajib', prereq: [] },
    // Semester 5
    { code: 'KL3101', name: 'Analisis Struktur Matriks', sks: 3, semester: 5, type: 'Wajib', prereq: ['KL2203'] },
    { code: 'KL3102', name: 'Gelombang Laut', sks: 3, semester: 5, type: 'Wajib', prereq: ['KL2202'] },
    { code: 'KL3103', name: 'Mekanika Tanah Laut', sks: 3, semester: 5, type: 'Wajib', prereq: [] },
    { code: 'KL3104', name: 'Akustik Bawah Air', sks: 3, semester: 5, type: 'Wajib', prereq: [] },
    { code: 'KL3001', name: 'Statistik Kelautan', sks: 2, semester: 5, type: 'Wajib', prereq: [] },
    // Semester 6
    { code: 'KL3201', name: 'Desain Struktur Baja', sks: 3, semester: 6, type: 'Wajib', prereq: ['KL3101'] },
    { code: 'KL3202', name: 'Bangunan Pantai', sks: 3, semester: 6, type: 'Wajib', prereq: ['KL3102'] },
    { code: 'KL3203', name: 'Desain Struktur Beton', sks: 3, semester: 6, type: 'Wajib', prereq: ['KL3101'] },
    { code: 'KL3204', name: 'Pondasi Laut', sks: 2, semester: 6, type: 'Wajib', prereq: ['KL3103'] },
    // Semester 7
    { code: 'KL4101', name: 'Dinamika Lepas Pantai', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4201', name: 'Manajemen Pesisir', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4105', name: 'Perencanaan Pelabuhan', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4110', name: 'Lingkungan Laut', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4108', name: 'Energi Arus', sks: 3, semester: 7, type: 'Pilihan', prereq: [] },
    { code: 'KL4090', name: 'Kerja Praktek', sks: 2, semester: 7, type: 'Wajib', prereq: [] },
    // Semester 8
    { code: 'KL4102', name: 'Desain Lepas Pantai II', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL4101'] },
    { code: 'KL4202', name: 'Model Numerik Pantai', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL3202'] },
    { code: 'KL4205', name: 'Operasional Pelabuhan', sks: 3, semester: 8, type: 'Pilihan', prereq: ['KL4105'] },
    { code: 'KL4208', name: 'Energi Gelombang', sks: 3, semester: 8, type: 'Pilihan', prereq: [] },
    { code: 'KL4099', name: 'Tugas Akhir', sks: 4, semester: 8, type: 'Wajib', prereq: [] },
];

// Mapping Lucide Icons (Pastikan library Lucide sudah diload di index.html)
if (typeof lucide !== 'undefined' && lucide.icons) {
    window.Icons = {
        BookOpen: lucide.icons.BookOpen, BarChart3: lucide.icons.BarChart3, Save: lucide.icons.Save,
        Target: lucide.icons.Target, Database: lucide.icons.Database, MessageSquare: lucide.icons.MessageSquare,
        Sun: lucide.icons.Sun, Moon: lucide.icons.Moon, Info: lucide.icons.Info, CheckCircle: lucide.icons.CheckCircle,
        Clock: lucide.icons.Clock, TrendingUp: lucide.icons.TrendingUp, PieChart: lucide.icons.PieChart,
        Award: lucide.icons.Award, Zap: lucide.icons.Zap, Plus: lucide.icons.Plus, X: lucide.icons.X,
        Move: lucide.icons.Move, Send: lucide.icons.Send, GraduationCap: lucide.icons.GraduationCap,
        Minus: lucide.icons.Minus
    };
}
