import { SUPABASE_CONFIG } from './config.js';

let _client = null;

const ensureClient = () => {
  if (_client) return _client;
  if (!window.supabase) {
    throw new Error('Supabase SDK tidak ter-load. Periksa koneksi internet Anda.');
  }
  _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return _client;
};

export const Supabase = {
  // ============================================
  // FUNGSI UNTUK LOGIN (KS & PS)
  // ============================================
  async findSekolah(npsn) {
    try {
      const client = ensureClient();
      const { data, error } = await client
        .from('sekolah')
        .select('npsn, nama_sekolah')
        .eq('npsn', String(npsn).trim())
        .maybeSingle();
        
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error("Detail Error Supabase:", err);
      throw new Error('Gagal terhubung ke server. Periksa internet atau hubungi admin.');
    }
  },

  async findPengawas(nip) {
    try {
      const client = ensureClient();
      const { data, error } = await client
        .from('pengawas')
        .select('nip, nama_pengawas, wilayah')
        .eq('nip', String(nip).trim())
        .maybeSingle();
        
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error("Detail Error Supabase:", err);
      throw new Error('Gagal terhubung ke server. Periksa internet atau hubungi admin.');
    }
  },

  // ============================================
  // FUNGSI CRUD UNTUK ADMIN PANEL (SEKOLAH)
  // ============================================
  async getAllSekolah() {
    const client = ensureClient();
    const { data, error } = await client.from('sekolah').select('*').order('nama_sekolah');
    if (error) throw error;
    return data;
  },

  async addSekolah(payload) {
    const client = ensureClient();
    const { error } = await client.from('sekolah').insert(payload);
    if (error) throw error;
  },

  async updateSekolah(npsn, payload) {
    const client = ensureClient();
    const { error } = await client.from('sekolah').update(payload).eq('npsn', npsn);
    if (error) throw error;
  },

  async deleteSekolah(npsn) {
    const client = ensureClient();
    const { error } = await client.from('sekolah').delete().eq('npsn', npsn);
    if (error) throw error;
  },

  // ============================================
  // FUNGSI CRUD UNTUK ADMIN PANEL (PENGAWAS)
  // ============================================
  async getAllPengawas() {
    const client = ensureClient();
    const { data, error } = await client.from('pengawas').select('*').order('nama_pengawas');
    if (error) throw error;
    return data;
  },

  async addPengawas(payload) {
    const client = ensureClient();
    const { error } = await client.from('pengawas').insert(payload);
    if (error) throw error;
  },

  async updatePengawas(nip, payload) {
    const client = ensureClient();
    const { error } = await client.from('pengawas').update(payload).eq('nip', nip);
    if (error) throw error;
  },

  async deletePengawas(nip) {
    const client = ensureClient();
    const { error } = await client.from('pengawas').delete().eq('nip', nip);
    if (error) throw error;
  },

  // ============================================
  // HELPER
  // ============================================
  isReady() {
    return !!window.supabase;
  }
};
