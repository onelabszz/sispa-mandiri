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
  // KLAIM PENGAWAS
  // ============================================
  async claimSekolah(npsn, nip) {
    const { error } = await ensureClient()
      .from('sekolah')
      .update({
        pengawas_nip: nip,
        pengawas_status: 'pending',
        pengawas_confirmed_at: null
      })
      .eq('npsn', npsn);
    if (error) throw error;
  },

  async unclaimSekolah(npsn) {
    const { error } = await ensureClient()
      .from('sekolah')
      .update({
        pengawas_nip: null,
        pengawas_status: null,
        pengawas_confirmed_at: null
      })
      .eq('npsn', npsn);
    if (error) throw error;
  },

  async getKlaimByNpsn(npsn) {
    const client = ensureClient();
    const { data: sk, error } = await client
      .from('sekolah')
      .select('npsn, nama_sekolah, pengawas_nip, pengawas_status, pengawas_confirmed_at')
      .eq('npsn', String(npsn).trim())
      .maybeSingle();

    if (error) throw error;
    if (!sk) return null;
    if (!sk.pengawas_nip) return { ...sk, pengawas_nama: null, pengawas_wilayah: null };

    const { data: pg, error: errPg } = await client
      .from('pengawas')
      .select('nip, nama_pengawas, wilayah')
      .eq('nip', sk.pengawas_nip)
      .maybeSingle();

    if (errPg) throw errPg;

    return {
      ...sk,
      pengawas_nama: pg?.nama_pengawas || null,
      pengawas_wilayah: pg?.wilayah || null
    };
  },

  async konfirmasiKlaim(npsn) {
    const { error } = await ensureClient()
      .from('sekolah')
      .update({
        pengawas_status: 'confirmed',
        pengawas_confirmed_at: new Date().toISOString()
      })
      .eq('npsn', npsn);
    if (error) throw error;
  },

  async tolakKlaim(npsn) {
    const { error } = await ensureClient()
      .from('sekolah')
      .update({
        pengawas_nip: null,
        pengawas_status: null,
        pengawas_confirmed_at: null
      })
      .eq('npsn', npsn);
    if (error) throw error;
  },

  async getPendingKlaimByNip(nip) {
    const { data, error } = await ensureClient()
      .from('sekolah')
      .select('npsn, nama_sekolah, pengawas_status')
      .eq('pengawas_nip', nip)
      .eq('pengawas_status', 'pending');
    if (error) throw error;
    return data || [];
  },

  async getAllKlaimByNip(nip) {
    const { data, error } = await ensureClient()
      .from('sekolah')
      .select('npsn, pengawas_status')
      .eq('pengawas_nip', nip);
    if (error) throw error;
    return data || [];
  },

  // ============================================
  // CRUD ADMIN
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
    const client = ensureClient();
    // 1) Unclaim semua sekolah binaannya (biar tidak orphan)
    const { error: e1 } = await client
      .from('sekolah')
      .update({
        pengawas_nip: null,
        pengawas_status: null,
        pengawas_confirmed_at: null
      })
      .eq('pengawas_nip', nip);
    if (e1) throw e1;

    // 2) Hapus baris pengawas
    const { error: e2 } = await client
      .from('pengawas')
      .delete()
      .eq('nip', nip);
    if (e2) throw e2;
  },
  async togglePengawas(nip, status) {
    const { error } = await ensureClient().from('pengawas').update({ is_active: status }).eq('nip', nip);
    if (error) throw error;
  },

  // ============================================
  // RESET TOTAL (DANGER ZONE)
  // ============================================
  async resetAllData() {
    const client = ensureClient();
    const { error: e1 } = await client.from('sekolah').delete().neq('npsn', '__never__');
    if (e1) throw e1;
    const { error: e2 } = await client.from('pengawas').delete().neq('nip', '__never__');
    if (e2) throw e2;
  },

  isReady() { return !!window.supabase; }
};
