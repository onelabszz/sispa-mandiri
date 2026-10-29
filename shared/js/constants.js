export const INSTRUMEN_AKADEMIK = [
  { kode:'A1', sec:'A. Perencanaan', t:'Tujuan pembelajaran dirumuskan jelas & selaras dengan media digital.' },
  { kode:'A2', sec:'A. Perencanaan', t:'Media/platform digital sesuai karakteristik materi & capaian.' },
  { kode:'A3', sec:'A. Perencanaan', t:'Guru menguasai teknis perangkat & aplikasi yang digunakan.' },
  { kode:'B1', sec:'B. Pemanfaatan Media', t:'Murid menggunakan fitur platform secara bermakna untuk konstruksi pemahaman.' },
  { kode:'B2', sec:'B. Pemanfaatan Media', t:'Konten digital relevan, akurat, mendukung pemahaman konsep.' },
  { kode:'B3', sec:'B. Pemanfaatan Media', t:'Guru mengatasi kendala teknis tanpa mengganggu alur belajar.' },
  { kode:'C1', sec:'C. Interaksi Murid', t:'Murid aktif berinteraksi dengan media, bukan sekadar menyimak pasif.' },
  { kode:'C2', sec:'C. Interaksi Murid', t:'Murid menerima umpan balik langsung atas progres kerjanya.' },
  { kode:'C3', sec:'C. Interaksi Murid', t:'Variasi aktivitas digital mendorong kolaborasi antar murid.' },
  { kode:'C4', sec:'C. Interaksi Murid', t:'Murid aktif bertanya & berpendapat melalui kanal digital.' },
  { kode:'D1', sec:'D. Literasi & Etika', t:'Murid menerapkan etika & tata tertib penggunaan perangkat.' },
  { kode:'D2', sec:'D. Literasi & Etika', t:'Murid memilah, menyaring & memverifikasi informasi digital.' },
  { kode:'D3', sec:'D. Literasi & Etika', t:'Murid berperilaku bijak, aman & bertanggung jawab dalam teknologi.' },
  { kode:'E1', sec:'E. Asesmen Digital', t:'Murid menyelesaikan instrumen asesmen digital secara mandiri.' },
  { kode:'E2', sec:'E. Asesmen Digital', t:'Hasil asesmen dimanfaatkan guru untuk umpan balik & strategi.' },
  { kode:'E3', sec:'E. Asesmen Digital', t:'Murid menyelesaikan asesmen digital lancar tanpa kendala teknis.' },
  { kode:'F1', sec:'F. Pengelolaan Kelas', t:'Guru mengelola perhatian murid agar fokus pada tujuan.' },
  { kode:'F2', sec:'F. Pengelolaan Kelas', t:'Keseimbangan aktivitas digital & non-digital sesuai alokasi.' },
  { kode:'F3', sec:'F. Pengelolaan Kelas', t:'Suasana kelas digital kondusif, tertib & mendukung belajar.' }
];

export const INSTRUMEN_COACHING = [
  { kode:'S1', tahap:'S', t:'Menggali konteks/latar belakang penerapan pembelajaran digital.' },
  { kode:'T1', tahap:'T', t:'Menggali tujuan & target penggunaan media/platform digital.' },
  { kode:'A1', tahap:'A', t:'Menggali langkah konkret integrasi teknologi dalam pembelajaran.' },
  { kode:'R1', tahap:'R', t:'Menggali dampak/hasil dari penerapan pembelajaran digital.' },
  { kode:'G1', tahap:'G', t:'Memfasilitasi guru merumuskan tujuan pengembangan diri.' },
  { kode:'R2', tahap:'R', t:'Membantu guru mengidentifikasi kondisi nyata & kendala.' },
  { kode:'O1', tahap:'O', t:'Mendorong guru menghasilkan alternatif strategi/solusi.' },
  { kode:'W1', tahap:'W', t:'Memastikan guru menetapkan tindak lanjut konkret & komitmen waktu.' }
];

// ============================================================
// SUPERVISI PM — Instrumen Telaah RPP & Observasi Implementasi
// ============================================================

export const INSTRUMEN_TELAAH_RPP = [
  { kode: 1, sec: 'Keselarasan', t: 'Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah mengarah pada pencapaian Dimensi Profil Lulusan' },
  { kode: 2, sec: 'Keselarasan', t: 'Tujuan pembelajaran, langkah pembelajaran, dan asesmen pembelajaran sudah selaras' },
  { kode: 3, sec: 'Kerangka Pembelajaran', t: 'Praktik pedagogis yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 4, sec: 'Kerangka Pembelajaran', t: 'Lingkungan belajar yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 5, sec: 'Kerangka Pembelajaran', t: 'Kemitraan pembelajaran yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 6, sec: 'Kerangka Pembelajaran', t: 'Pemanfaatan digital yang dituliskan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 7, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI (terlibat aktif mengonstruksi pengetahuan agar dapat memahami secara mendalam konsep atau materi dari berbagai sumber dan konteks).',
    sub: ['Menghubungkan pengetahuan baru dengan pengetahuan sebelumnya', 'Menstimulasi proses berpikir murid', 'Menghubungkan dengan konteks nyata dan/atau kehidupan sehari-hari', 'Memberikan kebebasan eksploratif dan kolaboratif', 'Menanamkan nilai-nilai moral dan etika dan nilai positif lainnya', 'Mengaitkan pembelajaran dengan pembentukan karakter murid'] },
  { kode: 8, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI (mengaplikasi pemahaman secara kontekstual dalam kehidupan nyata sebagai bagian dari pendalaman pengetahuan).',
    sub: ['Menghubungkan konsep baru dengan pengetahuan sebelumnya', 'Menerapkan pengetahuan ke dalam situasi nyata atau bidang lain', 'Mengembangkan pemahaman dengan eksplorasi lebih lanjut', 'Berpikir Kritis dan mencari solusi inovatif berdasarkan pengetahuan yang ada'] },
  { kode: 9, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran dapat memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI (mengevaluasi dan memaknai proses serta hasil dari tindakan atau praktik nyata yang telah mereka lakukan dan menentukan tindaklanjut ke depan; serta mengelola proses belajarnya secara mandiri).',
    sub: ['Memotivasi diri sendiri untuk terus belajar bagaimana cara belajar', 'Refleksi terhadap pencapaian tujuan pembelajaran (evaluasi diri)', 'Menerapkan strategi berpikir', 'Memiliki kemampuan metakognisi (meregulasi diri dalam pembelajaran)', 'Meregulasi emosi dalam pembelajaran'] },
  { kode: 10, sec: 'Langkah Pembelajaran', t: 'Langkah perencanaan pembelajaran dapat memfasilitasi tindakan saling MEMULIAKAN antara Guru-Murid, Murid-Guru, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal' },
  { kode: 11, sec: 'Langkah Pembelajaran', t: 'Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran' },
  { kode: 12, sec: 'Langkah Pembelajaran', t: 'Perencanaan pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik peserta didik' },
  { kode: 13, sec: 'Asesmen', t: 'Asesmen pada awal pembelajaran telah dilaksanakan untuk mendapatkan bukti kesiapan belajar secara emosional dan mental, pengetahuan awal, dan kebutuhan belajar murid' },
  { kode: 14, sec: 'Asesmen', t: 'Asesmen selama Proses Pembelajaran telah dilaksanakan sesuai perencanaan untuk memantau perkembangan belajar murid, memberikan umpan balik untuk perbaikan kontinyu (baik dari guru ke murid, maupun dari murid ke guru), melalui beragam teknik' },
  { kode: 15, sec: 'Asesmen', t: 'Asesmen hasil Pembelajaran direncanakan untuk mengukur pencapaian kompetensi sebagai bukti keberhasilan pembelajaran dengan beragam cara, antara lain: tes, portofolio, proyek, presentasi, dsb.' }
];

export const KUALITATIF_TELAAH = [
  { kode: 16, t: 'Tuliskan kelebihan Perencanaan Pembelajaran' },
  { kode: 17, t: 'Tuliskan hal yang perlu ditingkatkan dari Perencanaan Pembelajaran' },
  { kode: 18, t: 'Tuliskan rekomendasi dan lanjutkan dengan revisi Perencanaan Pembelajaran sesuai prinsip PM' }
];

export const INSTRUMEN_OBS_PM = [
  { kode: 1, sec: 'Keselarasan', t: 'Tindakan implementasi perencanaan selaras dengan perencanaan pembelajaran pada:',
    sub: ['Awal pembelajaran', 'Inti pembelajaran dalam proses memahami, mengaplikasi, dan merefleksi', 'Penutupan pembelajaran'] },
  { kode: 2, sec: 'Keselarasan', t: 'Upaya mencapai tujuan pembelajaran menuju pencapaian dimensi profil lulusan:',
    sub: ['Selaras dengan perencanaan pembelajaran, atau', 'Disesuaikan dengan konteks kebutuhan belajar siswa'] },
  { kode: 3, sec: 'Implementasi Kerangka Pembelajaran', t: 'Strategi pembelajaran yang diimplementasikan untuk mencapai tujuan:',
    sub: ['Sudah sesuai dengan perencanaan', 'Dimodifikasi agar sesuai dengan kebutuhan belajar dalam situasi kondisi yang ada', 'Tantangan yang dihadapi dalam menggunakan strategi terlewati untuk memfasilitasi tercapainya CP'] },
  { kode: 4, sec: 'Implementasi Kerangka Pembelajaran', t: 'Lingkungan belajar yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 5, sec: 'Implementasi Kerangka Pembelajaran', t: 'Kemitraan pembelajaran yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 6, sec: 'Implementasi Kerangka Pembelajaran', t: 'Pemanfaatan digital yang diimplementasikan sudah tergambar pada langkah pembelajaran dan/atau asesmen pembelajaran' },
  { kode: 7, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran yang dilakukan sesuai perencanaan dapat memfasilitasi tindakan saling MEMULIAKAN antara Guru-Murid, Murid-Guru, Murid-Murid yang tercermin dalam bahasa verbal dan nonverbal' },
  { kode: 8, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MEMAHAMI.',
    sub: ['Menghubungkan pengetahuan baru dengan pengetahuan sebelumnya', 'Menstimulasi proses berpikir peserta didik', 'Menghubungkan dengan konteks nyata dan/atau kehidupan sehari-hari', 'Memberikan kebebasan eksploratif dan kolaboratif', 'Menanamkan nilai-nilai moral dan etika dan nilai positif lainnya', 'Mengaitkan pembelajaran dengan pembentukan karakter peserta didik'] },
  { kode: 9, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MENGAPLIKASI.',
    sub: ['Menghubungkan konsep baru dengan pengetahuan sebelumnya', 'Menerapkan pengetahuan ke dalam situasi nyata atau bidang lain', 'Mengembangkan pemahaman dengan eksplorasi lebih lanjut', 'Berpikir Kritis dan mencari solusi inovatif berdasarkan pengetahuan yang ada'] },
  { kode: 10, sec: 'Langkah Pembelajaran', t: 'Langkah pembelajaran sudah memfasilitasi murid untuk merasakan pengalaman belajar MEREFLEKSI.',
    sub: ['Memotivasi diri sendiri untuk terus belajar bagaimana cara belajar', 'Refleksi terhadap pencapaian tujuan pembelajaran (evaluasi diri)', 'Menerapkan strategi berpikir', 'Memiliki kemampuan metakognisi (meregulasi diri dalam pembelajaran)', 'Meregulasi emosi dalam pembelajaran'] },
  { kode: 11, sec: 'Langkah Pembelajaran', t: 'Prinsip pembelajaran mendalam berupa berkesadaran, bermakna, dan/atau menggembirakan sudah tergambar pada setiap pengalaman belajar di langkah pembelajaran yang diimplementasikan.' },
  { kode: 12, sec: 'Langkah Pembelajaran', t: 'Praktik pembelajaran sudah mengakomodir pengalaman belajar yang sesuai dengan karakteristik peserta didik (umur, tingkat perkembangan, kemampuan, bakat dan minat, gaya belajar, dll.)' },
  { kode: 13, sec: 'Asesmen', t: 'Asesmen pada awal pembelajaran telah dilaksanakan untuk mendapatkan bukti kesiapan belajar secara emosional dan mental, pengetahuan awal, dan kebutuhan belajar murid' },
  { kode: 14, sec: 'Asesmen', t: 'Asesmen selama Proses Pembelajaran telah dilaksanakan sesuai perencanaan untuk memantau perkembangan belajar murid, memberikan umpan balik untuk perbaikan kontinyu (baik dari guru ke murid, maupun dari murid ke guru), melalui beragam teknik' },
  { kode: 15, sec: 'Asesmen', t: 'Asesmen hasil Pembelajaran direncanakan untuk mengukur pencapaian kompetensi sebagai bukti keberhasilan pembelajaran dengan beragam cara, antara lain: tes, portofolio, proyek, presentasi, dsb.' }
];

export const REFLEKSI_PM = [
  { kode: 16, t: 'Pelajaran apa yang telah diperoleh dari Implementasi Perencanaan Pembelajaran yang telah dilakukan beserta faktor-faktor pendukungnya?' },
  { kode: 17, t: 'Hal-hal apa saja yang pencapaiannya belum memuaskan dari Implementasi Perencanaan Pembelajaran yang telah dilakukan beserta faktor-faktor penghambatnya?' },
  { kode: 18, t: 'Rencana tindak lanjut apa yang akan dibuat untuk perbaikan ke depan?' }
];

export const DPL_LABELS = ['Keimanan','Kewargaan','Penalaran Kritis','Kreativitas','Kolaborasi','Kemandirian','Kesehatan','Komunikasi'];
export const PRINSIP_LIST = [{ key:'berkesadaran', label:'Berkesadaran' },{ key:'bermakna', label:'Bermakna' },{ key:'menggembirakan', label:'Menggembirakan' }];
export const PENGALAMAN_LIST = [{ key:'memahami', label:'Memahami' },{ key:'mengaplikasi', label:'Mengaplikasi' },{ key:'merefleksi', label:'Merefleksi' }];
export const MOMEN_LIST = [
  { key:'murid_aktif_konstruksi', label:'Murid aktif konstruksi' },
  { key:'murid_berkolaborasi', label:'Murid berkolaborasi' },
  { key:'murid_refleksi', label:'Murid refleksi' },
  { key:'guru_memuliakan', label:'Guru memuliakan murid' },
  { key:'guru_beri_tantangan', label:'Guru beri tantangan' },
  { key:'guru_fasilitasi', label:'Guru memfasilitasi' }
];
export const FOKUS_LABELS = {
  teknik_bertanya: 'Teknik Bertanya', memuliakan: 'Memuliakan Murid',
  kolaborasi: 'Kolaborasi', refleksi: 'Refleksi', integrasi_kka: 'Integrasi KKA'
};
export const KESIAPAN_LABELS = { siap: 'Siap', ragu: 'Ragu', belum_siap: 'Belum Siap' };
export const REFLEKSI_7 = [
  { key:'refleksi_ketercapaian_tujuan', q:'Apakah murid mencapai tujuan pembelajaran?' },
  { key:'refleksi_aspek_fokus', q:'Bagaimana hasil aspek fokus observasi yang disepakati?' },
  { key:'refleksi_keberhasilan', q:'Bagian mana yang berhasil?' },
  { key:'refleksi_tantangan', q:'Apa tantangan yang dihadapi?' },
  { key:'refleksi_solusi', q:'Apa solusi yang Anda usulkan?' },
  { key:'refleksi_tahapan', q:'Bagaimana tahapan penerapannya?' },
  { key:'refleksi_komitmen_waktu', q:'Kapan akan diterapkan?' }
];

export const NAV_KS = [
  { section: 'Utama' },
  { key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
  { section: 'Data' },
  { key: 'guru', icon: 'users', label: 'Data Guru' },
  { key: 'profil', icon: 'target', label: 'Profil Tipe Guru' },
  { key: 'program', icon: 'calendar-days', label: 'Program Supervisi' },
  { section: 'Supervisi' },
  { key: 'supervisi', icon: 'clipboard-list', label: 'Supervisi 3 Tahap' },
  { key: 'supervisi_pm', icon: 'book-open-check', label: 'Supervisi PM' },
  { key: 'akademik', icon: 'laptop', label: 'Obs. Akademik' },
  { key: 'coaching', icon: 'message-circle', label: 'Obs. Coaching' },
  { section: 'Analitik' },
  { key: 'analisis', icon: 'bar-chart-3', label: 'Analisis PM & KKA' },
  { key: 'laporan', icon: 'file-text', label: 'Laporan & Riwayat' },
  { section: 'Akun' },
  { key: 'pengaturan', icon: 'settings', label: 'Pengaturan' }
];

export const NAV_PS = [
  { section: 'Utama' },
  { key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard Agregat' },
  { section: 'Data' },
  { key: 'sekolah', icon: 'school', label: 'Sekolah Binaan' },
  { key: 'guru', icon: 'users', label: 'Data Guru' },
  { section: 'Supervisi' },
  { key: 'supervisi', icon: 'clipboard-list', label: 'Semua Supervisi' },
  { key: 'analisis', icon: 'bar-chart-3', label: 'Analisis & Benchmark' },
  { section: 'Evaluasi' },
  { key: 'evaluasi', icon: 'target', label: 'Evaluasi Kinerja KS' },
  { key: 'laporan', icon: 'file-text', label: 'Laporan Rekap' },
  { section: 'Akun' },
  { key: 'pengaturan', icon: 'settings', label: 'Pengaturan' }
];
