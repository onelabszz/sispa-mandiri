  // ==========================================
  // 1. PILIH DARI DATABASE (SUPABASE)
  // ==========================================
  async pickFromDB() {
    Utils.modal('Pilih Sekolah dari Database', `
      <div style="text-align:center;padding:2rem;color:var(--slate-500)">
        <div class="skeleton" style="width:40px;height:40px;border-radius:50%;margin:0 auto 1rem"></div>
        Memuat data dari Supabase...
      </div>
    `, '<button class="btn btn-secondary" onclick="Utils.closeModal()">Tutup</button>', true);

    try {
      const allSchools = await Supabase.getAllSekolah();
      const localSchools = Store.get('sekolah');
      const localNpsns = new Set(localSchools.map(s => s.npsn));
      const myNip = Store.config().nip_pengawas;

      // Filter awal: Hanya tampilkan yang belum diambil atau milik sendiri
      const availableSchools = allSchools.filter(s => {
        if (localNpsns.has(s.npsn)) return false;
        if (s.pengawas_nip && s.pengawas_nip !== myNip) return false;
        return true;
      });

      if (availableSchools.length === 0) {
        Utils.closeModal();
        return Utils.toast('Tidak ada sekolah baru yang tersedia di database (atau semua sudah dibina PS lain).', 'info');
      }

      // --- STATE MANAGEMENT MODAL ---
      let filteredSchools = [...availableSchools];
      let currentPage = 1;
      const itemsPerPage = 10;
      const selectedNpsns = new Set();

      // --- FUNGSI RENDER UI MODAL ---
      const renderModalContent = () => {
        // 1. Hitung Pagination
        const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedData = filteredSchools.slice(startIdx, endIdx);

        // 2. Render List Data
        let listHtml = '';
        if (paginatedData.length === 0) {
          listHtml = `<div style="padding:2rem;text-align:center;color:var(--slate-400);font-size:.85rem">Sekolah tidak ditemukan.</div>`;
        } else {
          listHtml = paginatedData.map(s => {
            const isChecked = selectedNpsns.has(s.npsn) ? 'checked' : '';
            return `
              <label style="display:flex;align-items:center;gap:.75rem;padding:.75rem;border-bottom:1px solid var(--slate-100);cursor:pointer;background:${isChecked ? 'var(--brand-50)' : 'transparent'};">
                <input type="checkbox" class="db-checkbox" value="${s.npsn}" data-nama="${Utils.esc(s.nama_sekolah)}" ${isChecked} style="width:18px;height:18px;accent-color:var(--brand-600)">
                <div>
                  <div style="font-weight:600;font-size:.9rem">${Utils.esc(s.nama_sekolah)}</div>
                  <div style="font-size:.75rem;color:var(--slate-500);font-family:monospace">NPSN: ${s.npsn}</div>
                </div>
              </label>
            `;
          }).join('');
        }

        // 3. Render Pagination Controls
        let paginationHtml = '';
        if (totalPages > 1) {
          paginationHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--slate-200)">
              <button class="btn btn-secondary btn-sm" id="btnPrevPage" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
              <span style="font-size:.8rem;color:var(--slate-500)">Halaman ${currentPage} dari ${totalPages}</span>
              <button class="btn btn-secondary btn-sm" id="btnNextPage" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
          `;
        }

        // Render ke Modal
        Utils.modal('Pilih Sekolah dari Database', `
          <div style="margin-bottom:1rem;">
            <input type="text" id="searchDB" class="input" placeholder="Cari Nama Sekolah atau NPSN..." value="">
          </div>
          <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center">
            <span style="font-size:.85rem;color:var(--slate-500)">Ditemukan <strong>${filteredSchools.length}</strong> sekolah tersedia.</span>
            <button class="btn btn-secondary btn-sm" id="btnSelectAllPage">Pilih Semua di Halaman Ini</button>
          </div>
          <div style="max-height:45vh;overflow-y:auto;border:1px solid var(--slate-200);border-radius:8px">
            ${listHtml}
          </div>
          ${paginationHtml}
        `, `
          <button class="btn btn-secondary" onclick="Utils.closeModal()">Batal</button>
          <button class="btn btn-primary" id="btnSavePick">Klaim ${selectedNpsns.size > 0 ? `(${selectedNpsns.size})` : ''} Sekolah</button>
        `, true);

        // --- BIND EVENT PADA UI MODAL ---
        
        // 1. Event Pencarian
        const searchInput = Utils.el('searchDB');
        searchInput.value = searchInput.dataset.lastQuery || ''; // Pertahankan kata kunci
        searchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          searchInput.dataset.lastQuery = e.target.value; // Simpan untuk re-render
          
          filteredSchools = availableSchools.filter(s => 
            s.nama_sekolah.toLowerCase().includes(q) || 
            s.npsn.includes(q)
          );
          currentPage = 1; // Reset ke halaman 1 saat mencari
          renderModalContent();
          
          // Kembalikan fokus ke input pencarian setelah re-render
          const newInput = Utils.el('searchDB');
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        });

        // 2. Event Pagination
        Utils.el('btnPrevPage')?.addEventListener('click', () => { currentPage--; renderModalContent(); });
        Utils.el('btnNextPage')?.addEventListener('click', () => { currentPage++; renderModalContent(); });

        // 3. Event Checkbox
        document.querySelectorAll('.db-checkbox').forEach(cb => {
          cb.addEventListener('change', (e) => {
            if (e.target.checked) selectedNpsns.add(e.target.value);
            else selectedNpsns.delete(e.target.value);
            
            // Update label warna bg
            e.target.closest('label').style.background = e.target.checked ? 'var(--brand-50)' : 'transparent';
            
            // Update text tombol simpan
            const saveBtn = Utils.el('btnSavePick');
            saveBtn.innerHTML = `Klaim ${selectedNpsns.size > 0 ? `(${selectedNpsns.size})` : ''} Sekolah`;
          });
        });

        // 4. Select All di Halaman Ini
        Utils.el('btnSelectAllPage').addEventListener('click', () => {
          const allChecked = paginatedData.every(s => selectedNpsns.has(s.npsn));
          paginatedData.forEach(s => {
            if (allChecked) selectedNpsns.delete(s.npsn);
            else selectedNpsns.add(s.npsn);
          });
          renderModalContent();
        });

        // 5. Tombol Simpan
        Utils.el('btnSavePick').addEventListener('click', async () => {
          if (selectedNpsns.size === 0) return Utils.toast('Pilih minimal satu sekolah', 'warning');
          
          const btn = Utils.el('btnSavePick');
          btn.disabled = true;
          btn.innerHTML = 'Memproses...';

          try {
            const newSekolah = [];
            for (const npsn of selectedNpsns) {
              const schoolData = availableSchools.find(s => s.npsn === npsn);
              await Supabase.claimSekolah(npsn, myNip);
              newSekolah.push({
                id: Utils.uid(),
                npsn: npsn,
                nama_sekolah: schoolData.nama_sekolah,
                ks_nama: '', ks_nip: '',
                imported_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                guru: [], program: [], supervisi: [], akademik: [], coaching: []
              });
            }

            const updatedList = [...localSchools, ...newSekolah];
            await Store.set('sekolah', updatedList);
            
            Utils.closeModal();
            Utils.toast(`${selectedNpsns.size} sekolah berhasil diklaim dan ditambahkan.`, 'success');
            Router.navigate('sekolah');
          } catch (err) {
            btn.disabled = false;
            btn.innerHTML = 'Klaim Sekolah';
            Utils.toast('Gagal klaim: ' + err.message, 'error');
          }
        });
      };

      // Mulai render pertama kali
      renderModalContent();

    } catch (err) {
      Utils.closeModal();
      Utils.toast(err.message, 'error');
    }
  },
