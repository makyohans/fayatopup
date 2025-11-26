document.addEventListener('DOMContentLoaded', function() {

    // -------------------------------------------------------------------
    // --- KONFIGURASI TELEGRAM & ADMIN FEE (WAJIB GANTI BOT TOKEN & CHAT ID!) ---
    // -------------------------------------------------------------------
    // GANTI DENGAN BOT TOKEN DAN CHAT ID ANDA YANG ASLI
    const BOT_TOKEN = '8366211169:AAF6gMoG5WnoGTwx9whACwg3GIi2iznBIkI';
    const CHAT_ID = '7729097393';
    const ADMIN_FEE = 500; // Biaya admin 500 Rupiah untuk QRIS

    // -------------------------------------------------------------------
    // --- ELEMEN HTML (Disinkronkan dengan HTML Anda) ---
    // -------------------------------------------------------------------
    const body = document.body;
    const casbonForm = document.getElementById('casbonForm');
    const kirimCasbonButton = document.getElementById('kirimCasbonTelegram');

    // Coin Selection
    const coinOptionGroup = document.getElementById('coinOptionGroup');
    const jumlahCoinInput = document.getElementById('jumlahCoinInput');
    const jumlahRupiahInput = document.getElementById('jumlahRupiahInput');
    const selectedCoinDisplay = document.querySelector('.selection-display span');
    const selectedQrisImageName = document.getElementById('selectedQrisImageName');

    // Payment Details
    const btnBankCasbon = document.getElementById('btnBankCasbon');
    const btnEwalletCasbon = document.getElementById('btnEwalletCasbon');
    const btnQrisCasbon = document.getElementById('btnQrisCasbon');
    const detailBankCasbon = document.getElementById('detailBankCasbon');
    const detailEwalletCasbon = document.getElementById('detailEwalletCasbon');
    const detailQrisCasbon = document.getElementById('detailQrisCasbon');
    const radioBankCasbon = document.getElementById('pilihBankCasbon');
    const radioEwalletCasbon = document.getElementById('pilihEwalletCasbon');
    const radioQrisCasbon = document.getElementById('pilihQrisCasbon');
    const qrisImage = document.getElementById('qrisImage');

    // Elemen Nomor Bank/E-Wallet & Salin
    const namaBankCasbon = document.getElementById('namaBankCasbon');
    const displayNomorBank = document.getElementById('displayNomorBank');
    const namaEwalletCasbon = document.getElementById('namaEwalletCasbon');
    const displayNomorEwallet = document.getElementById('displayNomorEwallet');
    const copyButtons = document.querySelectorAll('.copy-button');

    // Bukti Pembayaran
    const buktiPembayaranFile = document.getElementById('buktiPembayaranFile');

    // Bukti Pembayaran (Toggle)
    const btnProofId = document.getElementById('btnProofId');
    const btnProofFile = document.getElementById('btnProofFile');
    const sectionIdTransaksi = document.getElementById('sectionIdTransaksi');
    const sectionBuktiPembayaran = document.getElementById('sectionBuktiPembayaran');
    const idTransaksiInput = document.getElementById('idTransaksi');

    // ⭐ ELEMEN MODAL QRIS ⭐
    const qrisImageContainer = document.querySelector('.qris-image-container');
    const modal = document.getElementById("qrisModal");
    const modalImg = document.getElementById("img01");
    const closeModalBtn = document.querySelector(".close-modal-btn");

    // Elemen Navigasi & Dark Mode
    const casbonContent = document.getElementById('casbonContent');
    const dataTerjualContent = document.getElementById('dataTerjualContent');
    const allSidebarLinks = document.querySelectorAll('.sidebar a');
    const allNavItems = document.querySelectorAll('.bottom-navbar .nav-item');


    // -------------------------------------------------------------------
    // 1. FUNGSI UTILITY (FORMATTING & COPY)
    // -------------------------------------------------------------------

    function formatRupiah(number) {
        return Number(number).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    }

    // Fungsi untuk menyalin teks ke clipboard
    function copyToClipboard(textElementId) {
        const textElement = document.getElementById(textElementId);
        if (!textElement || textElement.textContent === 'Pilih Bank' || textElement.textContent === 'Pilih E-Wallet') {
            alert('❌ Belum ada nomor yang dipilih untuk disalin.');
            return;
        }

        const textToCopy = textElement.textContent.trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('✅ Nomor berhasil disalin: ' + textToCopy);
            // Feedback visual: Ganti ikon sebentar
            const button = document.querySelector(`.copy-button[data-target="${textElementId}"]`);
            if (button) {
                const icon = button.querySelector('i');
                const originalIcon = 'fas fa-copy';
                icon.className = 'fas fa-check-circle';
                setTimeout(() => { icon.className = originalIcon; }, 1500);
            }
        }).catch(err => {
            console.error('Gagal menyalin:', err);
            alert('❌ Gagal menyalin nomor. Perangkat tidak mendukung fitur salin otomatis.');
        });
    }

    // Event Listener untuk Tombol Salin
    if (copyButtons) {
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                copyToClipboard(targetId);
            });
        });
    }

    /**
     * LOGIKA QRIS BARU: Menggunakan IMG QRIS yang tersimpan di tombol koin
     */
    function updateQrisImageFromSelection() {
        if (!qrisImage || !selectedQrisImageName || !selectedQrisImageName.value) {
            // Sembunyikan jika tidak ada file QRIS yang dipilih
            if (qrisImage) qrisImage.style.display = 'none';
            return;
        }

        // Ambil nama file QRIS dari input hidden
        qrisImage.src = selectedQrisImageName.value;
        qrisImage.style.display = 'block';
    }


    // -------------------------------------------------------------------
    // ⭐ 1.5. FUNGSI BARU: PERUBAHAN STATUS OTOMATIS (10 DETIK) ⭐
    // -------------------------------------------------------------------

    /**
     * Membuat ID Transaksi unik berbasis waktu.
     * @returns {string} ID unik (misalnya: TRX-1678886400000).
     */
    function generateTransactionId() {
        return 'TRX-' + Date.now();
    }

    /**
     * Memperbarui status transaksi di Local Storage dan memicu render ulang.
     * @param {string} transactionId - ID unik transaksi.
     * @param {string} newStatus - Status baru ('Diproses' atau 'Sukses').
     */
    function updateTransactionStatus(transactionId, newStatus) {
        const salesData = getSalesData();
        
        // Cari transaksi berdasarkan ID
        const txIndex = salesData.findIndex(tx => tx.id === transactionId);

        if (txIndex !== -1) {
            salesData[txIndex].status = newStatus; // Ubah status
            saveSalesData(salesData); // Simpan kembali ke Local Storage
            console.log(`[${transactionId}] Status diperbarui di LocalStorage menjadi: ${newStatus}`);
            
            // Panggil render ulang untuk memperbarui tampilan tabel
            renderSalesTable(); 
        }
    }

    /**
     * Memulai timer 10 detik untuk mengubah status transaksi dari 'Diproses' menjadi 'Sukses'.
     * @param {string} transactionId - ID unik transaksi.
     */
    function simulateProcessing(transactionId) {
        console.log(`[${transactionId}] Memulai timer 10 detik...`);

        // Timer: Ubah status menjadi 'Sukses' setelah 10000 milidetik (10 detik)
        setTimeout(() => {
            updateTransactionStatus(transactionId, 'Sukses');
        }, 10000); 
    }
    
    // -------------------------------------------------------------------
    // 2. FUNGSI TAMPIL NOMOR (BANK / E-WALLET)
    // -------------------------------------------------------------------

    function handleAccountSelection(selectElement, displayElement, defaultText) {
        if (!selectElement || !displayElement) return;

        selectElement.addEventListener('change', function() {
            const selectedValue = this.value;

            if (selectedValue) {
                // MEMISAHKAN NILAI DENGAN PEMBATAS '|'
                const parts = selectedValue.split('|');

                if (parts.length === 2) {
                    // parts[1] adalah Nomor Rekening/E-Wallet
                    displayElement.textContent = parts[1].trim();
                } else {
                    displayElement.textContent = defaultText;
                }
            } else {
                displayElement.textContent = defaultText;
            }
        });
    }

    // Panggil fungsi untuk Bank dan E-Wallet
    handleAccountSelection(namaBankCasbon, displayNomorBank, 'Pilih Bank');
    handleAccountSelection(namaEwalletCasbon, displayNomorEwallet, 'Pilih E-Wallet');


    // -------------------------------------------------------------------
    // 3. FUNGSI METODE PEMBAYARAN & ADMINISTRASI
    // -------------------------------------------------------------------

    function removeRequiredAttributes() {
        [detailBankCasbon, detailEwalletCasbon, detailQrisCasbon].forEach(detail => {
            if (detail) {
                detail.querySelectorAll('select, input:not([type="hidden"])').forEach(input => {
                    input.removeAttribute('required');
                });
            }
        });
    }

    function updateCasbonPaymentDetails(selectedType) {
        // Reset tampilan tombol dan detail
        [btnBankCasbon, btnEwalletCasbon, btnQrisCasbon].forEach(btn => btn.classList.remove('active'));
        [detailBankCasbon, detailEwalletCasbon, detailQrisCasbon].forEach(detail => {
            if (detail) detail.style.display = 'none';
        });
        removeRequiredAttributes();

        let targetRadio, targetButton, targetDetail;

        // Dapatkan nilai rupiah dari koin yang sedang aktif
        let selectedRupiah = parseInt(document.querySelector('.coin-button.active')?.getAttribute('data-rupiah')) || 0;

        if (selectedRupiah === 0 && selectedType !== 'qris' && !radioQrisCasbon.checked) {
            alert('❌ Harap pilih jumlah Koin terlebih dahulu.');
            return;
        }

        // Sembunyikan QRIS Image setiap kali berpindah mode (kecuali QRIS)
        if (qrisImage && selectedType !== 'qris') qrisImage.style.display = 'none';


        if (selectedType === 'bank') {
            targetRadio = radioBankCasbon;
            targetButton = btnBankCasbon;
            targetDetail = detailBankCasbon;

            if(document.getElementById('namaBankCasbon')) document.getElementById('namaBankCasbon').setAttribute('required', 'required');

            // Inisialisasi tampilan nomor saat Bank dipilih
            if (namaBankCasbon.value) {
                const parts = namaBankCasbon.value.split('|');
                if (parts.length === 2) {
                    displayNomorBank.textContent = parts[1].trim();
                }
            } else {
                displayNomorBank.textContent = 'Pilih Bank';
            }

        } else if (selectedType === 'ewallet') {
            targetRadio = radioEwalletCasbon;
            targetButton = btnEwalletCasbon;
            targetDetail = detailEwalletCasbon;

            if(document.getElementById('namaEwalletCasbon')) document.getElementById('namaEwalletCasbon').setAttribute('required', 'required');

            // Inisialisasi tampilan nomor saat E-Wallet dipilih
            if (namaEwalletCasbon.value) {
                const parts = namaEwalletCasbon.value.split('|');
                if (parts.length === 2) {
                    displayNomorEwallet.textContent = parts[1].trim();
                }
            } else {
                displayNomorEwallet.textContent = 'Pilih E-Wallet';
            }

        } else if (selectedType === 'qris') {
            targetRadio = radioQrisCasbon;
            targetButton = btnQrisCasbon;
            targetDetail = detailQrisCasbon;

            // Panggil fungsi baru untuk menampilkan QRIS berdasarkan pilihan koin
            updateQrisImageFromSelection();
        }

        // Update display harga (dengan atau tanpa fee)
        updateCoinDisplay(selectedRupiah, selectedType === 'qris');


        if (targetRadio) targetRadio.checked = true;
        if (targetButton) targetButton.classList.add('active');
        if (targetDetail) targetDetail.style.display = 'block';
    }

    if (btnBankCasbon && btnEwalletCasbon && btnQrisCasbon) {
        btnBankCasbon.addEventListener('click', () => updateCasbonPaymentDetails('bank'));
        btnEwalletCasbon.addEventListener('click', () => updateCasbonPaymentDetails('ewallet'));
        btnQrisCasbon.addEventListener('click', () => updateCasbonPaymentDetails('qris'));
    }


    // -------------------------------------------------------------------
    // 4. FUNGSI KOIN SELECTION (LOGIKA HARGA + ADMIN FEE)
    // -------------------------------------------------------------------

    function updateCoinDisplay(selectedRupiah, isQrisSelected) {
        let finalRupiahWithFee = selectedRupiah;

        if (isQrisSelected) {
            finalRupiahWithFee += ADMIN_FEE;
        }

        const selectedCoin = jumlahCoinInput.value;
        const formattedRupiahDisplay = formatRupiah(finalRupiahWithFee);

        let feeText = '( Pilih Koin Untuk Melihat Total Harga )'; // Default

        if (selectedRupiah > 0) {
            if (isQrisSelected) {
                feeText = ` (Total: ${formattedRupiahDisplay} [Termasuk Admin Fee ${formatRupiah(ADMIN_FEE)}])`;
            } else {
                feeText = ` (${formattedRupiahDisplay})`;
            }
            selectedCoinDisplay.innerHTML = `<span>${Number(selectedCoin).toLocaleString('id-ID')} Koin${feeText}</span>`;
        } else {
            selectedCoinDisplay.innerHTML = feeText;
        }


        // Simpan nilai final (dengan/tanpa fee) ke input tersembunyi
        jumlahRupiahInput.value = finalRupiahWithFee;
    }


    if (coinOptionGroup) {
        const coinButtons = coinOptionGroup.querySelectorAll('.coin-button');

        coinButtons.forEach(button => {
            button.addEventListener('click', function() {
                coinButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                const selectedCoin = this.getAttribute('data-coin');
                const selectedRupiah = parseInt(this.getAttribute('data-rupiah'));
                const selectedQrisFile = this.getAttribute('data-qris-img');

                jumlahCoinInput.value = selectedCoin;
                if (selectedQrisImageName) {
                    selectedQrisImageName.value = selectedQrisFile || '';
                }

                const selectedRadio = document.querySelector('input[name="jenis_pembayaran"]:checked');
                const isQrisSelected = selectedRadio && selectedRadio.value === 'qris';

                updateCoinDisplay(selectedRupiah, isQrisSelected);

                // Jika user sedang di tab QRIS, update gambar
                if (isQrisSelected) {
                    updateQrisImageFromSelection();
                } else {
                    if (qrisImage) qrisImage.style.display = 'none';
                }
            });
        });
    }

    // -------------------------------------------------------------------
    // ⭐ 5. FUNGSI MODAL QRIS ⭐
    // -------------------------------------------------------------------

    if (qrisImageContainer && modal && modalImg && closeModalBtn) {
        // 1. Buka Modal ketika Gambar QRIS di Form diklik
        qrisImageContainer.addEventListener('click', function() {
            // Pastikan pembayaran QRIS aktif dan gambar QRIS sudah punya source
            if (radioQrisCasbon.checked && qrisImage.style.display === 'block' && qrisImage.src) {
                modal.style.display = "block";
                modalImg.src = qrisImage.src; // Salin sumber gambar QRIS ke modal
            } else if (!radioQrisCasbon.checked) {
                // alert('Silahkan pilih metode pembayaran QRIS terlebih dahulu.');
            } else if (!qrisImage.src || qrisImage.style.display !== 'block') {
                // alert('Silahkan pilih jumlah Koin terlebih dahulu.');
            }
        });

        // 2. Tutup Modal ketika tombol X diklik
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = "none";
        });

        // 3. Tutup Modal ketika mengklik di luar gambar (background)
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

        // 4. Tutup Modal ketika tombol ESC (Escape) ditekan
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display === "block") {
                modal.style.display = "none";
            }
        });
    }

    // -------------------------------------------------------------------
    // ⭐ 6. FUNGSI TOGGLE BUKTI PEMBAYARAN BARU ⭐
    // -------------------------------------------------------------------
    function toggleProofSection(mode) {
        // Reset semua
        [btnProofId, btnProofFile].forEach(btn => btn.classList.remove('active'));
        [sectionIdTransaksi, sectionBuktiPembayaran].forEach(sec => sec.style.display = 'none');

        // Hapus required dari semua input bukti pembayaran
        if (idTransaksiInput) idTransaksiInput.removeAttribute('required');
        if (buktiPembayaranFile) buktiPembayaranFile.removeAttribute('required');

        if (mode === 'id') {
            if (btnProofId) btnProofId.classList.add('active');
            if (sectionIdTransaksi) sectionIdTransaksi.style.display = 'block';
            if (idTransaksiInput) idTransaksiInput.setAttribute('required', 'required');
        } else if (mode === 'file') {
            if (btnProofFile) btnProofFile.classList.add('active');
            if (sectionBuktiPembayaran) sectionBuktiPembayaran.style.display = 'block';
            if (buktiPembayaranFile) buktiPembayaranFile.setAttribute('required', 'required');
        }
    }

    if (btnProofId && btnProofFile) {
        btnProofId.addEventListener('click', () => toggleProofSection('id'));
        btnProofFile.addEventListener('click', () => toggleProofSection('file'));
    }


    // -------------------------------------------------------------------
    // 7. FUNGSI KIRIM DATA KE TELEGRAM (DIUPDATE UNTUK MENGIRIM FILE)
    // -------------------------------------------------------------------

    if (kirimCasbonButton) {
        kirimCasbonButton.addEventListener('click', async function(e) {
            e.preventDefault();

            const data = new FormData(casbonForm);
            const namaFaya = data.get('casbon_nama_faya');
            const idFaya = data.get('casbon_id_faya');
            const jumlahCoin = data.get('jumlah_coin');
            const jumlahRupiah = data.get('jumlah_rupiah');

            const selectedRadio = document.querySelector('input[name="jenis_pembayaran"]:checked');
            const jenisPembayaran = selectedRadio ? selectedRadio.value : null;

            // --- Validasi Dasar ---
            if (!namaFaya || !idFaya) {
                alert('❌ Harap lengkapi Nama Faya dan ID Faya.');
                return;
            }
            if (!jumlahCoin || Number(jumlahRupiah) === 0) {
                alert('❌ Harap pilih Jumlah Koin yang dibeli.');
                return;
            }
            if (!jenisPembayaran) {
                alert('❌ Harap pilih salah satu Metode Pembayaran (Bank, E-Wallet, atau QRIS).');
                return;
            }
            if (jenisPembayaran === 'qris' && !selectedQrisImageName.value) {
                alert('❌ Harap pilih jumlah Koin terlebih dahulu agar QRIS terpilih.');
                return;
            }

            // --- Validasi Bukti Pembayaran ---
            let isProofProvided = false;
            let proofMode = 'Belum Dipilih';
            const sentIdTransaksi = idTransaksiInput ? idTransaksiInput.value.trim() : '-';
            const fileBukti = buktiPembayaranFile.files[0]; // Ambil file yang diunggah
            const fileName = fileBukti ? fileBukti.name : "TIDAK ADA FILE";

            if (idTransaksiInput && idTransaksiInput.hasAttribute('required') && sentIdTransaksi !== '-') {
                isProofProvided = true;
                proofMode = 'ID Transaksi';
            } else if (buktiPembayaranFile && buktiPembayaranFile.hasAttribute('required') && fileBukti) {
                isProofProvided = true;
                proofMode = 'Unggah Gambar';
            }

            if (!isProofProvided) {
                alert('❌ Harap pilih dan lengkapi salah satu Bukti Pembayaran (ID Transaksi atau Unggah Gambar).');
                return;
            }

            // Tambahan Validasi: Batas ukuran file (Max 10MB untuk Telegram API)
            if (proofMode === 'Unggah Gambar' && fileBukti && fileBukti.size > 10 * 1024 * 1024) {
                alert('❌ Ukuran file bukti pembayaran terlalu besar (Maksimal 10MB). Harap perkecil ukuran gambar.');
                return;
            }


            // --- DETAIL PEMBAYARAN SPESIFIK ---
            let detailPembayaran = '';
            let atasNamaPenerima = 'WINORO HADI MUKTI';
            let nomorTujuan = '-';

            if (jenisPembayaran === 'bank') {
                const bankValue = data.get('casbon_nama_bank');
                if (!bankValue) { alert('❌ Harap pilih Bank Tujuan.'); return; }
                const parts = bankValue.split('|');
                detailPembayaran = `Bank Transfer: ${parts[0].trim()}`;
                nomorTujuan = parts[1].trim();
            } else if (jenisPembayaran === 'ewallet') {
                const ewalletValue = data.get('casbon_nama_ewallet');
                if (!ewalletValue) { alert('❌ Harap pilih E-Wallet Tujuan.'); return; }
                const parts = ewalletValue.split('|');
                detailPembayaran = `E-Wallet Transfer: ${parts[0].trim()}`;
                nomorTujuan = parts[1].trim();
            } else if (jenisPembayaran === 'qris') {
                detailPembayaran = `QRIS (RAKUNSHOP.ID)`;
                atasNamaPenerima = 'RAKUNSHOP.ID';
            }

            // --- PESAN TELEGRAM (Teks/Caption) ---
            const baseRupiah = jenisPembayaran === 'qris' ? (parseInt(jumlahRupiah) - ADMIN_FEE) : parseInt(jumlahRupiah);
            const formattedCoin = Number(jumlahCoin).toLocaleString('id-ID');
            const formattedRupiahFinal = formatRupiah(jumlahRupiah);
            const formattedRupiahBase = formatRupiah(baseRupiah);

            // Transaksi ID akan dimasukkan ke pesan Telegram agar admin tahu ID-nya
            const tempTransactionId = generateTransactionId();

            let messageCaption = `<b>🎉 KONFIRMASI ORDER COIN SELLER MASUK (ID: ${tempTransactionId})</b>\n\n`;
            messageCaption += "<b>--- DETAIL PEMBELI ---</b>\n";
            messageCaption += "Nama Faya: " + namaFaya + "\n";
            messageCaption += "ID Faya: " + idFaya + "\n\n";

            messageCaption += "<b>--- DETAIL ORDER ---</b>\n";
            messageCaption += "Koin Dipesan: <b>" + formattedCoin + " Koin</b>\n";
            messageCaption += "Harga Koin: " + formattedRupiahBase + "\n";
            messageCaption += "Total Bayar: <b>" + formattedRupiahFinal + "</b>\n";

            if (jenisPembayaran === 'qris') {
                messageCaption += `(Termasuk Biaya Admin: ${formatRupiah(ADMIN_FEE)})\n`;
            }

            messageCaption += "\n<b>--- METODE PEMBAYARAN ---</b>\n";
            messageCaption += "Metode: <b>" + jenisPembayaran.toUpperCase() + "</b>\n";

            if (jenisPembayaran !== 'qris') {
                messageCaption += "Nomor Tujuan: <b>" + nomorTujuan + "</b>\n";
            }

            messageCaption += "Penerima: <b>" + atasNamaPenerima + "</b>\n";
            messageCaption += "Detail: " + detailPembayaran + "\n\n";

            // Bagian Bukti Pembayaran
            messageCaption += "<b>--- BUKTI PEMBAYARAN ---</b>\n";
            messageCaption += "Mode Bukti: <b>" + proofMode + "</b>\n";
            messageCaption += "ID Transaksi: <b>" + sentIdTransaksi + "</b>\n";
            messageCaption += "Nama File Upload: <b>" + fileName + "</b>\n\n";

            if (proofMode !== 'Unggah Gambar') {
                messageCaption += "⚠️ <b>PERHATIAN!</b> ⚠️\n";
                messageCaption += "Konfirmasi dikirim TANPA file. Harap cek ID Transaksi secara manual.\n";
            } else {
                messageCaption += "✅ **FILE BUKTI PEMBAYARAN DIKIRIM SEBAGAI FOTO.**\n";
            }

            // --- PENGIRIMAN DATA KE TELEGRAM ---
            kirimCasbonButton.disabled = true;
            kirimCasbonButton.textContent = 'MENGIRIM KONFIRMASI...';

            let telegramURL;
            let fetchBody;
            let headers = {};

            if (proofMode === 'Unggah Gambar' && fileBukti) {
                // MODE 1: KIRIM FOTO MENGGUNAKAN sendPhoto
                telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

                // Buat FormData baru khusus untuk sendPhoto (menggunakan multipart/form-data)
                const photoData = new FormData();
                photoData.append('chat_id', CHAT_ID);
                photoData.append('photo', fileBukti); // File gambar
                photoData.append('caption', messageCaption); // Teks sebagai caption
                photoData.append('parse_mode', 'HTML');

                fetchBody = photoData;
                // Tidak perlu set Content-Type, browser akan set otomatis untuk FormData
            } else {
                // MODE 2: KIRIM PESAN TEXT BIASA (Jika mode ID Transaksi dipilih atau tidak ada file)
                telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                fetchBody = JSON.stringify({
                    chat_id: CHAT_ID,
                    text: messageCaption,
                    parse_mode: 'HTML'
                });
                headers['Content-Type'] = 'application/json';
            }

            try {
                const response = await fetch(telegramURL, {
                    method: 'POST',
                    headers: headers,
                    body: fetchBody
                });

                if (response.ok) {
                    alert('✅ Konfirmasi Order Berhasil Di Kirim! Silahkan tunggu proses selanjutnya.');

                    // ⭐ START: INTEGRASI SIMPAN KE DATA TERJUAL & SIMULASI STATUS ⭐
                    const newTransactionData = { 
                        tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        namaFaya: namaFaya,
                        idFaya: idFaya,
                        jumlahCoin: jumlahCoin,
                        jumlahRupiah: jumlahRupiah,
                        metodeBayar: jenisPembayaran.toUpperCase(),
                        // ID dan Status awal 'Diproses' ditambahkan di fungsi addTransaction
                    };
                    
                    // 1. Tambahkan ke Local Storage & dapatkan ID transaksi
                    const newTransactionId = addTransaction(newTransactionData, tempTransactionId);
                    
                    // 2. Mulai timer 10 detik!
                    simulateProcessing(newTransactionId);
                    
                    // 3. Render tabel (untuk menampilkan data baru dengan status Diproses)
                    renderSalesTable(); 
                    // ⭐ END: INTEGRASI SIMPAN KE DATA TERJUAL & SIMULASI STATUS ⭐

                    // Reset Form dan Tampilan
                    casbonForm.reset();
                    document.querySelectorAll('.coin-button.active').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.payment-button.active').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.payment-details').forEach(detail => detail.style.display = 'none');

                    selectedCoinDisplay.textContent = '( Pilih Koin Untuk Melihat Total Harga )';
                    jumlahRupiahInput.value = 0;
                    if (qrisImage) qrisImage.style.display = 'none';
                    if (selectedQrisImageName) selectedQrisImageName.value = '';
                    displayNomorBank.textContent = 'Pilih Bank';
                    displayNomorEwallet.textContent = 'Pilih E-Wallet';

                    // Reset Proof Section
                    toggleProofSection(null);

                } else {
                    const data = await response.json();
                    console.error('Telegram API Error:', data);

                    let errorMessage = `❌ Gagal mengirim Konfirmasi Order. Error: ${data.description}`;
                    if (proofMode === 'Unggah Gambar') {
                        errorMessage += "\n\nPastikan file gambar valid, tidak corrupt, dan ukuran maksimal 10MB.";
                    }
                    alert(errorMessage);
                }
            } catch (error) {
                alert('❌ Terjadi kesalahan jaringan saat mengirim Konfirmasi Order: ' + error.message);
            } finally {
                kirimCasbonButton.disabled = false;
                kirimCasbonButton.textContent = 'KONFIRMASI PEMBAYARAN & ORDER';
            }
        });
    }

    // -------------------------------------------------------------------
    // 8. FUNGSI DATA TERJUAL (LOCAL STORAGE)
    // -------------------------------------------------------------------

    const SALES_STORAGE_KEY = 'salesDataSKAgency'; // Kunci untuk localStorage
    const salesTableBody = document.querySelector('#salesTable tbody'); // Elemen <tbody>

    // 8A. Ambil data dari Local Storage
    function getSalesData() {
        try {
            const data = localStorage.getItem(SALES_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Gagal membaca data penjualan dari LocalStorage", e);
            return [];
        }
    }

    // 8B. Simpan data ke Local Storage
    function saveSalesData(salesArray) {
        try {
            localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesArray));
        } catch (e) {
            console.error("Gagal menyimpan data penjualan ke LocalStorage", e);
        }
    }

    // ⭐ 8C. Tambahkan Transaksi Baru (Diperbarui untuk ID & Status)
    function addTransaction(transactionData, customId) {
        const transactionId = customId || generateTransactionId(); // Gunakan ID dari Telegram atau buat baru
        const salesData = getSalesData();
        
        // Tambahkan ID dan status awal ke data
        const newTx = {
            ...transactionData,
            id: transactionId, 
            status: 'Diproses'
        };
        
        salesData.unshift(newTx); // Gunakan unshift agar data terbaru di atas
        saveSalesData(salesData);
        
        return transactionId; // Kembalikan ID untuk digunakan di simulasi
    }

    // ⭐ 8D. Render (Tampilkan) Data ke Tabel (Diperbarui untuk Status Dinamis & ID)
    function renderSalesTable() {
        const salesData = getSalesData();
        if (!salesTableBody) return;

        // Hitung Ringkasan
        let totalKoin = 0;
        const totalTransaksi = salesData.length;

        // Bersihkan isi tabel lama
        salesTableBody.innerHTML = '';

        salesData.forEach((tx, index) => {
            const row = salesTableBody.insertRow();
            totalKoin += Number(tx.jumlahCoin);
            
            // Tentukan class CSS berdasarkan status
            const statusClass = tx.status === 'Sukses' ? 'status-success' : 'status-pending';

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${tx.tanggal}</td>
                <td>${tx.namaFaya} / ${tx.idFaya}</td>
                <td data-coin="${tx.jumlahCoin}">${Number(tx.jumlahCoin).toLocaleString('id-ID')}</td>
                <td data-rupiah="${tx.jumlahRupiah}">${Number(tx.jumlahRupiah).toLocaleString('id-ID')}</td>
                <td>${tx.metodeBayar}</td>
                <td>
                    <span id="status-${tx.id}" class="status-badge ${statusClass}">${tx.status}</span>
                </td>
            `;
            
            // JIKA BELUM SUKSES, MULAI SIMULASI ULANG (penting untuk reload halaman)
            if (tx.status === 'Diproses') {
                 // Pastikan timer mulai jika transaksi ini masih 'Diproses' (misalnya setelah refresh)
                 simulateProcessing(tx.id);
            }
        });

        // Update Ringkasan Penjualan di atas tabel
        const totalTransaksiDisplay = document.getElementById('totalTransaksi');
        const totalKoinTerjualDisplay = document.getElementById('totalKoinTerjual');

        if (totalTransaksiDisplay) totalTransaksiDisplay.textContent = totalTransaksi.toLocaleString('id-ID');
        if (totalKoinTerjualDisplay) totalKoinTerjualDisplay.textContent = totalKoin.toLocaleString('id-ID');
    }


    // -------------------------------------------------------------------
    // 9. INISIALISASI & DARK MODE
    // -------------------------------------------------------------------

    // Fungsi Navigasi & Sidebar
    function showContent(contentType) {
        if (casbonContent) casbonContent.style.display = 'none';
        if (dataTerjualContent) dataTerjualContent.style.display = 'none';
        allSidebarLinks.forEach(link => link.classList.remove('active-sidebar-link'));
        allNavItems.forEach(item => item.classList.remove('active'));

        const linkId = contentType === 'casbon' ? 'casbonLink' : 'terjualLink';
        const navId = contentType === 'casbon' ? 'navCasbonBottom' : 'navTerjualBottom';

        if (contentType === 'casbon' && casbonContent) {
            casbonContent.style.display = 'block';
        } else if (contentType === 'terjual' && dataTerjualContent) {
            dataTerjualContent.style.display = 'block';
            // ⭐ TAMBAHAN: Panggil renderSalesTable saat tab Data Terjual dibuka
            renderSalesTable();
        }

        const activeSidebarLink = document.getElementById(linkId);
        const activeNavButton = document.getElementById(navId);

        if (activeSidebarLink) activeSidebarLink.classList.add('active-sidebar-link');
        if (activeNavButton) activeNavButton.classList.add('active');
    }

    const links = [
        { id: 'casbonLink', type: 'casbon' }, { id: 'terjualLink', type: 'terjual' },
        { id: 'navCasbonBottom', type: 'casbon' }, { id: 'navTerjualBottom', type: 'terjual' }
    ];

    links.forEach(link => {
        const element = document.getElementById(link.id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const sidebar = document.getElementById('sidebarMenu');
                if (sidebar) sidebar.style.width = '0';
                showContent(link.type);
            });
        }
    });

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebarMenu');
    if (menuToggle) menuToggle.addEventListener('click', function() { sidebar.style.width = '250px'; });
    if (document.getElementById('closeSidebar')) document.getElementById('closeSidebar').addEventListener('click', function(e) { e.preventDefault(); sidebar.style.width = '0'; });

    // Fungsi Dark Mode
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    function toggleDarkMode() {
        const isDarkMode = body.classList.toggle('dark-mode');

        if (isDarkMode) {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        }
    }

    if (themeToggle) themeToggle.addEventListener('click', toggleDarkMode);

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    // INISIALISASI
    showContent('casbon');
    jumlahRupiahInput.value = 0;

    // Sembunyikan elemen QRIS dan Proof Section secara default saat halaman dimuat
    if (qrisImage) qrisImage.style.display = 'none';
    if (detailQrisCasbon) detailQrisCasbon.style.display = 'none';
    if (selectedQrisImageName) selectedQrisImageName.value = '';

    toggleProofSection(null); // Pastikan mode bukti pembayaran direset
});