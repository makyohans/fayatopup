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

    // Bukti Pembayaran (LAMA - HANYA UNTUK REFERENSI ID)
    const buktiPembayaranFile = document.getElementById('buktiPembayaranFile');
    
    // Bukti Pembayaran (BARU - Toggle)
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
                // Opsional: Beri tahu user untuk memilih metode QRIS
                 // alert('Silahkan pilih metode pembayaran QRIS terlebih dahulu.');
            } else if (!qrisImage.src || qrisImage.style.display !== 'block') {
                 // Opsional: Beri tahu user untuk memilih jumlah koin
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
// 7. FUNGSI KIRIM DATA KE TELEGRAM (SUDAH DIUPDATE)
// -------------------------------------------------------------------

    if (kirimCasbonButton) {
        kirimCasbonButton.addEventListener('click', function(e) {
            e.preventDefault(); 

            const data = new FormData(casbonForm);
            const namaFaya = data.get('casbon_nama_faya');
            const idFaya = data.get('casbon_id_faya');
            const jumlahCoin = data.get('jumlah_coin'); 
            const jumlahRupiah = data.get('jumlah_rupiah'); 
            
            const selectedRadio = document.querySelector('input[name="jenis_pembayaran"]:checked');
            const jenisPembayaran = selectedRadio ? selectedRadio.value : null;

            // --- Validasi ---
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
            
            // --- Validasi Bukti Pembayaran Baru ---
            let isProofProvided = false;
            let proofMode = 'Belum Dipilih';
            const sentIdTransaksi = idTransaksiInput ? idTransaksiInput.value.trim() : '-';
            const fileName = buktiPembayaranFile.files[0] ? buktiPembayaranFile.files[0].name : "TIDAK ADA FILE";

            if (idTransaksiInput && idTransaksiInput.hasAttribute('required') && sentIdTransaksi !== '-') {
                isProofProvided = true;
                proofMode = 'ID Transaksi';
            } else if (buktiPembayaranFile && buktiPembayaranFile.hasAttribute('required') && buktiPembayaranFile.files.length > 0) {
                isProofProvided = true;
                proofMode = 'Unggah Gambar';
            }

            if (!isProofProvided) {
                 alert('❌ Harap pilih dan lengkapi salah satu Bukti Pembayaran (ID Transaksi atau Unggah Gambar).');
                 return;
            }
            // --- End Validasi Bukti Pembayaran Baru ---


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

            // --- Pesan Telegram ---
            const baseRupiah = jenisPembayaran === 'qris' ? (parseInt(jumlahRupiah) - ADMIN_FEE) : parseInt(jumlahRupiah);
            const formattedCoin = Number(jumlahCoin).toLocaleString('id-ID');
            const formattedRupiahFinal = formatRupiah(jumlahRupiah);
            const formattedRupiahBase = formatRupiah(baseRupiah);

            let message = "<b>🎉 KONFIRMASI ORDER COIN SELLER MASUK</b>\n\n";
            message += "<b>--- DETAIL PEMBELI ---</b>\n";
            message += "Nama Faya: " + namaFaya + "\n";
            message += "ID Faya: " + idFaya + "\n\n";
            
            message += "<b>--- DETAIL ORDER ---</b>\n";
            message += "Koin Dipesan: <b>" + formattedCoin + " Koin</b>\n";
            message += "Harga Koin: " + formattedRupiahBase + "\n";
            message += "Total Bayar: <b>" + formattedRupiahFinal + "</b>\n"; 
            
            if (jenisPembayaran === 'qris') {
                message += `(Termasuk Biaya Admin: ${formatRupiah(ADMIN_FEE)})\n`;
            }

            message += "\n<b>--- METODE PEMBAYARAN ---</b>\n";
            message += "Metode: <b>" + jenisPembayaran.toUpperCase() + "</b>\n";
            
            if (jenisPembayaran !== 'qris') {
                message += "Nomor Tujuan: <b>" + nomorTujuan + "</b>\n"; 
            }
            
            message += "Penerima: <b>" + atasNamaPenerima + "</b>\n";
            message += "Detail: " + detailPembayaran + "\n\n";
            
            // PESAN BUKTI PEMBAYARAN YANG SUDAH DIUPDATE
            message += "<b>--- BUKTI PEMBAYARAN ---</b>\n";
            message += "Mode Bukti: <b>" + proofMode + "</b>\n";
            message += "ID Transaksi: <b>" + sentIdTransaksi + "</b>\n";
            message += "Nama File Upload: <b>" + fileName + "</b>\n\n";
            message += "⚠️ <b>PERHATIAN!</b> ⚠️\n";
            message += "Harap cek secara manual file <b>BUKTI PEMBAYARAN</b> yang dikirimkan member melalui Telegram/WhatsApp.\n";
            
            
            kirimCasbonButton.disabled = true;
            kirimCasbonButton.textContent = 'MENGIRIM KONFIRMASI...'; 

            const telegramURL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            fetch(telegramURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            })
            .then(response => {
                if (response.ok) {
                    alert('✅ Konfirmasi Order Berhasil Di Kirim! Silahkan kirim file bukti pembayaran Anda ke kontak Admin (Telegram/WA) dan tunggu proses selanjutnya.'); 
                    
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
                    toggleProofSection(null); // Panggil untuk mereset tampilan
                    
                } else {
                    response.json().then(data => {
                        console.error('Telegram API Error:', data);
                        alert(`❌ Gagal mengirim Konfirmasi Order. Error: ${data.description}`);
                    });
                }
            })
            .catch(error => {
                alert('❌ Terjadi kesalahan jaringan saat mengirim Konfirmasi Order: ' + error.message);
            })
            .finally(() => {
                kirimCasbonButton.disabled = false;
                kirimCasbonButton.textContent = 'KONFIRMASI PEMBAYARAN & ORDER'; 
            });
        });
    }

// -------------------------------------------------------------------
// 8. INISIALISASI & DARK MODE
// -------------------------------------------------------------------
    
    // Fungsi Navigasi & Sidebar
    const casbonContent = document.getElementById('casbonContent');
    const dataTerjualContent = document.getElementById('dataTerjualContent');
    const allSidebarLinks = document.querySelectorAll('.sidebar a');
    const allNavItems = document.querySelectorAll('.bottom-navbar .nav-item'); 

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
