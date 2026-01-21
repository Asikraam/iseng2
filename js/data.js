// js/data.js
window.GRADES = { 'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'E': 0.0, 'T': 0.0 };
window.TARGET_SKS_LULUS = 144;
window.TARGET_SKS_WAJIB = 100;
window.TARGET_SKS_PILIHAN = 44;

window.CURRICULUM_DB = [
    { code: 'MA1101', name: 'Matematika IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'FI1101', name: 'Fisika Dasar IA', sks: 4, semester: 1, type: 'Wajib', prereq: [] },
    { code: 'MA1201', name: 'Matematika IIA', sks: 4, semester: 2, type: 'Wajib', prereq: ['MA1101'] },
    { code: 'KL2102', name: 'Mekanika Fluida', sks: 4, semester: 3, type: 'Wajib', prereq: [] },
    { code: 'KL2202', name: 'Hidrodinamika', sks: 3, semester: 4, type: 'Wajib', prereq: ['KL2102'] },
    { code: 'KL3102', name: 'Gelombang Laut', sks: 3, semester: 5, type: 'Wajib', prereq: ['KL2202'] },
    { code: 'KL3202', name: 'Bangunan Pantai', sks: 3, semester: 6, type: 'Wajib', prereq: ['KL3102'] }
    // Tambahkan sisa matkul lu di sini nanti
];

// Pastikan lucide sudah dimuat sebelum ini dipanggil
window.Icons = {
    BookOpen: (window.lucide && lucide.icons.BookOpen) ? lucide.icons.BookOpen : null,
    TrendingUp: (window.lucide && lucide.icons.TrendingUp) ? lucide.icons.TrendingUp : null,
    PieChart: (window.lucide && lucide.icons.PieChart) ? lucide.icons.PieChart : null,
    Moon: (window.lucide && lucide.icons.Moon) ? lucide.icons.Moon : null,
    Sun: (window.lucide && lucide.icons.Sun) ? lucide.icons.Sun : null,
    Bot: (window.lucide && lucide.icons.Bot) ? lucide.icons.Bot : null,
    Send: (window.lucide && lucide.icons.Send) ? lucide.icons.Send : null
};
