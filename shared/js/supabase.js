import { SUPABASE_CONFIG } from './config.js';

let _client = null;

const ensureClient = () => {
  if (_client) return _client;
  if (!window.supabase) throw new Error('Supabase SDK tidak ter-load.');
  _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return _client;
};

export const Supabase = {
  // ============================================
  // LOGIN
  // ============================================
  async findSekolah(npsn) {
    try {
      const { data, error } = await ensureClient()
        .from('sekolah')
        .select('npsn, nama_sekolah, is_active')
        .eq('npsn', String(npsn).trim())
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error(err);
      throw new Error('Gagal terhubung ke server.');
    }
  },

  async findPengawas(nip) {
    try {
      const { data, error } = await ensureClient()
        .from('pengawas')
        .select('nip, nama_pengawas, wilayah, is_active')
        .eq('nip', String(nip).trim())
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.error(err);
      throw new Error('Gagal terhubung ke server.');
    }
  },

  // ============================================
  // CRUD ADMIN: SEKOLAH
  // ============================================
  async getAllSekolah() {
    const { data, error } = await ensureClient().from('sekolah').select('*').order('nama_sekolah');
    if (error) throw error;
    return data;
  },
  async saveSekolah(payload) {
    const { error } = await ensureClient().from('sekolah').upsert(payload, { onConflict: 'npsn' });
    if (error) throw error;
  },
  async deleteSekolah(npsn) {
    const { error } = await ensureClient().from('sekolah').delete().eq('npsn', npsn);
    if (error) throw error;
  },
  async toggleSekolah(npsn, status) {
    const { error } = await ensureClient().from('sekolah').update({ is_active: status }).eq('npsn', npsn);
    if (error) throw error;
  },

  // ============================================
  // CRUD ADMIN: PENGAWAS
  // ============================================
  async getAllPengawas() {
    const { data, error } = await ensureClient().from('pengawas').select('*').order('nama_pengawas');
    if (error) throw error;
    return data;
  },
  async savePengawas(payload) {
    const { error } = await ensureClient().from('pengawas').upsert(payload, { onConflict: 'nip' });
    if (error) throw error;
  },
  async deletePengawas(nip) {
    const { error } = await ensureClient().from('pengawas').delete().eq('nip', nip);
    if (error) throw error;
  },
  async togglePengawas(nip, status) {
    const { error } = await ensureClient().from('pengawas').update({ is_active: status }).eq('nip', nip);
    if (error) throw error;
  },

  isReady() { return !!window.supabase; }
};
