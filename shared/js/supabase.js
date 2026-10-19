import { SUPABASE_CONFIG } from './config.js';

let _client = null;

const ensureClient = () => {
  if (_client) return _client;
  if (!window.supabase) {
    throw new Error('Supabase SDK tidak ter-load. Cek koneksi internet.');
  }
  _client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return _client;
};

export const Supabase = {
  async findSekolah(npsn) {
    const client = ensureClient();
    const { data, error } = await client
      .from('sekolah')
      .select('id, npsn, nama_sekolah, ks_nama, ks_nip')
      .eq('npsn', String(npsn).trim())
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error('Koneksi database gagal: ' + error.message);
    return data;
  },

  async findPengawas(nip) {
    const client = ensureClient();
    const { data, error } = await client
      .from('pengawas')
      .select('id, nip, nama_pengawas, wilayah')
      .eq('nip', String(nip).trim())
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error('Koneksi database gagal: ' + error.message);
    return data;
  },

  isReady() {
    return !!window.supabase;
  }
};
