document.addEventListener('DOMContentLoaded', function() {

    // -------------------------------------------------------------------
    // --- KONFIGURASI ---
    // -------------------------------------------------------------------
    const ADMIN_FEE = 500; // Biaya admin 500 Rupiah untuk QRIS

    // ⭐ KONFIGURASI TELEGRAM (DIPINDAHKAN DARI send_telegram.php) ⭐
    // GANTI DENGAN BOT TOKEN DAN CHAT ID ANDA YANG ASLI
    const BOT_TOKEN = '8366211169:AAF6gMoG5WnoGTwx9whACwg3GIi2iznBIkI'; 
    const CHAT_ID = '7729097393'; 
    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
    // -------------------------------------------------------------------

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
    // --- FUNGSI PEMUATAN PRODUK KOIN ---
    // -------------------------------------------------------------------

    function initializeCoinButtonListeners() {
        const coinButtons = document.querySelectorAll('#coinProductsContainer .coin-button');

        coinButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Hapus kelas 'selected' dari semua tombol
                coinButtons.forEach(btn => btn.classList.remove('selected'));
                this.classList.add('selected');

                const coinAmount = this.getAttribute('data-coin');
                const rupiahAmount = parseInt(this.getAttribute('data-rupiah'));
                const qrisImgPath = this.getAttribute('data-qris-img');

                const selectedRadio = document.querySelector('input[name="jenis_pembayaran"]:checked');
                const isQrisSelected = selectedRadio && selectedRadio.value === 'qris';
                
                // Update display harga dan input
                updateCoinDisplay(rupiahAmount, isQrisSelected);

                // Perbarui input hidden
                jumlahCoinInput.value = coinAmount;
                selectedQrisImageName.value = qrisImgPath;

                // Jika QRIS sedang dipilih, update gambarnya
                if (isQrisSelected) {
                    updateQrisImageFromSelection();
                } else {
                    if (qrisImage) qrisImage.style.display = 'none';
                }

                // Kosongkan detail pembayaran saat koin baru dipilih
                document.querySelectorAll('.payment-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.payment-details').forEach(detail => detail.style.display = 'none');
                
                // Reset bukti pembayaran
                toggleProofSection(null);
            });
        });
    }

    async function loadCoinProducts() {
        const container = document.getElementById('coinProductsContainer');
        if (!container) return;

        try {
            const response = await fetch('coin_products.html');
            if (!response.ok) {
                throw new Error(`Gagal memuat coin_products.html: ${response.statusText}`);
            }
            const htmlContent = await response.text();
            container.innerHTML = htmlContent;
            initializeCoinButtonListeners();
        } catch (error) {
            console.error("Error saat memuat produk koin:", error);
            container.innerHTML = '<p style="color: red; text-align: center;">Gagal memuat produk koin.</p>';
        }
    }


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

    function updateQrisImageFromSelection() {
        if (!qrisImage || !selectedQrisImageName || !selectedQrisImageName.value) {
            if (qrisImage) qrisImage.style.display = 'none';
            return;
        }
        qrisImage.src = selectedQrisImageName.value;
        qrisImage.style.display = 'block';
    }


    // -------------------------------------------------------------------
    // ⭐ 1.5. FUNGSI BARU: PERUBAHAN STATUS OTOMATIS (10 DETIK) ⭐
    // -------------------------------------------------------------------

    function generateTransactionId() {
        return 'TRX-' + Date.now();
    }

    function updateTransactionStatus(transactionId, newStatus) {
        const salesData = getSalesData();
        const txIndex = salesData.findIndex(tx => tx.id === transactionId);

        if (txIndex !== -1) {
            salesData[txIndex].status = newStatus;
            saveSalesData(salesData);
            console.log(`[${transactionId}] Status diperbarui di LocalStorage menjadi: ${newStatus}`);
            renderSalesTable(); 
        }
    }

    function simulateProcessing(transactionId) {
        console.log(`[${transactionId}] Memulai timer 10 detik...`);
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
                const parts = selectedValue.split('|');
                if (parts.length === 2) {
                    displayElement.textContent = parts[1].trim();
                } else {
                    displayElement.textContent = defaultText;
                }
            } else {
                displayElement.textContent = defaultText;
            }
        });
    }

    if(namaBankCasbon) handleAccountSelection(namaBankCasbon, displayNomorBank, 'Pilih Bank');
    if(namaEwalletCasbon) handleAccountSelection(namaEwalletCasbon, displayNomorEwallet, 'Pilih E-Wallet');


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
        [btnBankCasbon, btnEwalletCasbon, btnQrisCasbon].forEach(btn => btn.classList.remove('active'));
        [detailBankCasbon, detailEwalletCasbon, detailQrisCasbon].forEach(detail => {
            if (detail) detail.style.display = 'none';
        });
        removeRequiredAttributes();

        let targetRadio, targetButton, targetDetail;

        const activeCoinButton = document.querySelector('.coin-button.selected');
        let selectedRupiah = activeCoinButton ? parseInt(activeCoinButton.getAttribute('data-rupiah')) : 0;

        if (selectedRupiah === 0 && selectedType !== 'qris' && !radioQrisCasbon.checked) {
            alert('❌ Harap pilih jumlah Koin terlebih dahulu.');
            return;
        }

        if (qrisImage && selectedType !== 'qris') qrisImage.style.display = 'none';


        if (selectedType === 'bank') {
            targetRadio = radioBankCasbon;
            targetButton = btnBankCasbon;
            targetDetail = detailBankCasbon;

            if(document.getElementById('namaBankCasbon')) document.getElementById('namaBankCasbon').setAttribute('required', 'required');

            if (namaBankCasbon && namaBankCasbon.value) {
                const parts = namaBankCasbon.value.split('|');
                if (parts.length === 2) {
                    displayNomorBank.textContent = parts[1].trim();
                }
            } else if (displayNomorBank) {
                displayNomorBank.textContent = 'Pilih Bank';
            }

        } else if (selectedType === 'ewallet') {
            targetRadio = radioEwalletCasbon;
            targetButton = btnEwalletCasbon;
            targetDetail = detailEwalletCasbon;

            if(document.getElementById('namaEwalletCasbon')) document.getElementById('namaEwalletCasbon').setAttribute('required', 'required');

            if (namaEwalletCasbon && namaEwalletCasbon.value) {
                const parts = namaEwalletCasbon.value.split('|');
                if (parts.length === 2) {
                    displayNomorEwallet.textContent = parts[1].trim();
                }
            } else if (displayNomorEwallet) {
                displayNomorEwallet.textContent = 'Pilih E-Wallet';
            }

        } else if (selectedType === 'qris') {
            targetRadio = radioQrisCasbon;
            targetButton = btnQrisCasbon;
            targetDetail = detailQrisCasbon;

            if (selectedRupiah > 0) {
                updateQrisImageFromSelection();
            } else {
                alert('❌ Harap pilih jumlah Koin terlebih dahulu sebelum memilih QRIS.');
                return;
            }
        }

        updateCoinDisplay(selectedRupiah, selectedType === 'qris');

        if (targetRadio) targetRadio.checked = true;
        if (targetButton) targetButton.classList.add('active');
        if (targetDetail) targetDetail.style.display = 'block';

        // Reset Proof Section
        toggleProofSection(null);
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

        let feeText = '( Pilih Koin Untuk Melihat Total Harga )';

        if (selectedRupiah > 0) {
            if (isQrisSelected) {
                feeText = ` (Total: ${formattedRupiahDisplay} [Termasuk Admin Fee ${formatRupiah(ADMIN_FEE)}])`;
            } else {
                feeText = ` (${formattedRupiahDisplay})`;
            }
            selectedCoinDisplay.innerHTML = `${Number(selectedCoin).toLocaleString('id-ID')} Koin${feeText}`;
        } else {
            selectedCoinDisplay.innerHTML = feeText;
        }

        jumlahRupiahInput.value = finalRupiahWithFee;
    }


    // -------------------------------------------------------------------
    // ⭐ 5. FUNGSI MODAL QRIS ⭐
    // -------------------------------------------------------------------

    if (qrisImageContainer && modal && modalImg && closeModalBtn) {
        qrisImageContainer.addEventListener('click', function() {
            if (radioQrisCasbon.checked && qrisImage.style.display === 'block' && qrisImage.src) {
                modal.style.display = "block";
                modalImg.src = qrisImage.src;
            } else if (!radioQrisCasbon.checked) {
                alert('❌ Silahkan pilih metode pembayaran QRIS terlebih dahulu.');
            } else if (!qrisImage.src || qrisImage.style.display !== 'block') {
                alert('❌ Silahkan pilih jumlah Koin terlebih dahulu.');
            }
        });

        closeModalBtn.addEventListener('click', function() {
            modal.style.display = "none";
        });

        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

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
        [btnProofId, btnProofFile].forEach(btn => btn.classList.remove('active'));
        [sectionIdTransaksi, sectionBuktiPembayaran].forEach(sec => sec.style.display = 'none');

        if (idTransaksiInput) {
            idTransaksiInput.removeAttribute('required');
            idTransaksiInput.value = ''; // Reset nilai
        }
        if (buktiPembayaranFile) {
            buktiPembayaranFile.removeAttribute('required');
            buktiPembayaranFile.value = ''; // Reset file input
        }

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

    // Fungsi utilitas untuk mengkonversi Base64 Data URL menjadi Blob (File)
    function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : '';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // -------------------------------------------------------------------
    // 7. FUNGSI KIRIM DATA KE TELEGRAM (SEKARANG MENGGUNAKAN JAVASCRIPT FETCH API)
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
            const fileBukti = buktiPembayaranFile ? buktiPembayaranFile.files[0] : null; 
            const fileName = fileBukti ? fileBukti.name : "TIDAK ADA FILE";

            const idRequired = idTransaksiInput && idTransaksiInput.hasAttribute('required');
            const fileRequired = buktiPembayaranFile && buktiPembayaranFile.hasAttribute('required');

            if (idRequired && sentIdTransaksi !== '-') {
                isProofProvided = true;
                proofMode = 'ID Transaksi';
            } else if (fileRequired && fileBukti) {
                isProofProvided = true;
                proofMode = 'Unggah Gambar';
            }

            if (!isProofProvided) {
                alert('❌ Harap pilih dan lengkapi salah satu Bukti Pembayaran (ID Transaksi atau Unggah Gambar).');
                return;
            }

            if (proofMode === 'Unggah Gambar' && fileBukti && fileBukti.size > 10 * 1024 * 1024) {
                alert('❌ Ukuran file bukti pembayaran terlalu besar (Maksimal 10MB). Harap perkecil ukuran gambar.');
                return;
            }

            // --- Persiapan File untuk Telegram ---
            let fileBase64 = null;
            
            if (proofMode === 'Unggah Gambar' && fileBukti) {
                kirimCasbonButton.disabled = true;
                kirimCasbonButton.textContent = 'MENGKONVERSI GAMBAR...';
                
                function fileToBase64(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = error => reject(error);
                    });
                }

                try {
                    fileBase64 = await fileToBase64(fileBukti);
                } catch (error) {
                    alert('❌ Gagal membaca file bukti pembayaran: ' + error.message);
                    kirimCasbonButton.disabled = false;
                    kirimCasbonButton.textContent = 'KONFIRMASI PEMBAYARAN & ORDER';
                    return;
                }
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

            // --- PENGIRIMAN DATA KE TELEGRAM (SISI CLIENT) ---
            kirimCasbonButton.disabled = true;
            kirimCasbonButton.textContent = 'MENGIRIM KONFIRMASI...';

            let finalApiUrl;
            let fetchOptions = {
                method: 'POST',
            };

            if (proofMode === 'Unggah Gambar') {
                // Menggunakan /sendPhoto dengan FormData
                const imageBlob = dataURLtoBlob(fileBase64);
                
                const formData = new FormData();
                formData.append('chat_id', CHAT_ID);
                formData.append('caption', messageCaption);
                formData.append('parse_mode', 'HTML');
                // Telegram API field name for file is 'photo'
                formData.append('photo', imageBlob, fileBukti.name); 

                finalApiUrl = `${TELEGRAM_API}/sendPhoto`;
                fetchOptions.body = formData;
                // JANGAN set header 'Content-Type' untuk FormData
            } else {
                // Menggunakan /sendMessage dengan JSON (untuk teks/ID Transaksi)
                finalApiUrl = `${TELEGRAM_API}/sendMessage`;
                const messagePayload = {
                    chat_id: CHAT_ID,
                    text: messageCaption,
                    parse_mode: 'HTML'
                };

                fetchOptions.headers = {
                    'Content-Type': 'application/json'
                };
                fetchOptions.body = JSON.stringify(messagePayload);
            }

            try {
                const response = await fetch(finalApiUrl, fetchOptions);
                const result = await response.json();

                if (response.ok && result.ok === true) { // Cek 'ok' dari Telegram API
                    alert('✅ Konfirmasi Order Berhasil Di Kirim! Silahkan tunggu proses selanjutnya.');

                    // ⭐ INTEGRASI SIMPAN KE DATA TERJUAL & SIMULASI STATUS ⭐
                    const newTransactionData = { 
                        tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        namaFaya: namaFaya,
                        idFaya: idFaya,
                        jumlahCoin: jumlahCoin,
                        jumlahRupiah: jumlahRupiah,
                        metodeBayar: jenisPembayaran.toUpperCase(),
                    };
                    
                    const newTransactionId = addTransaction(newTransactionData, tempTransactionId);
                    simulateProcessing(newTransactionId);
                    renderSalesTable(); 

                    // Reset Form dan Tampilan
                    casbonForm.reset();
                    document.querySelectorAll('#coinProductsContainer .coin-button').forEach(btn => btn.classList.remove('selected'));
                    document.querySelectorAll('.payment-button.active').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.payment-details').forEach(detail => detail.style.display = 'none');

                    selectedCoinDisplay.textContent = '( Pilih Koin Untuk Melihat Total Harga )';
                    jumlahRupiahInput.value = 0;
                    if (qrisImage) qrisImage.style.display = 'none';
                    if (selectedQrisImageName) selectedQrisImageName.value = '';
                    displayNomorBank.textContent = 'Pilih Bank';
                    displayNomorEwallet.textContent = 'Pilih E-Wallet';
                    toggleProofSection(null);

                } else {
                    console.error('Telegram API Error:', result);

                    let telegramError = result.description || 'Unknown Telegram Error';
                    let errorMessage = `❌ Gagal mengirim Konfirmasi Order. Error: ${telegramError}`;

                    if (proofMode === 'Unggah Gambar') {
                        errorMessage += "\n\nPastikan file gambar valid (JPG/PNG/GIF), tidak corrupt, dan ukuran maksimal 10MB.";
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

    const SALES_STORAGE_KEY = 'salesDataSKAgency';
    const salesTableBody = document.querySelector('#salesTable tbody');

    function getSalesData() {
        try {
            const data = localStorage.getItem(SALES_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Gagal membaca data penjualan dari LocalStorage", e);
            return [];
        }
    }

    function saveSalesData(salesArray) {
        try {
            localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesArray));
        } catch (e) {
            console.error("Gagal menyimpan data penjualan ke LocalStorage", e);
        }
    }

    function addTransaction(transactionData, customId) {
        const transactionId = customId || generateTransactionId();
        const salesData = getSalesData();
        
        const newTx = {
            ...transactionData,
            id: transactionId, 
            status: 'Diproses'
        };
        
        salesData.unshift(newTx);
        saveSalesData(salesData);
        
        return transactionId;
    }

    function renderSalesTable() {
        const salesData = getSalesData();
        if (!salesTableBody) return;

        let totalKoin = 0;
        const totalTransaksi = salesData.length;

        salesTableBody.innerHTML = '';

        if (salesData.length === 0) {
            salesTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data transaksi yang tercatat.</td></tr>';
        }

        salesData.forEach((tx, index) => {
            const row = salesTableBody.insertRow();
            totalKoin += Number(tx.jumlahCoin);
            
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
            
            if (tx.status === 'Diproses') {
                 simulateProcessing(tx.id);
            }
        });

        const totalTransaksiDisplay = document.getElementById('totalTransaksi');
        const totalKoinTerjualDisplay = document.getElementById('totalKoinTerjual');

        if (totalTransaksiDisplay) totalTransaksiDisplay.textContent = totalTransaksi.toLocaleString('id-ID');
        if (totalKoinTerjualDisplay) totalKoinTerjualDisplay.textContent = totalKoin.toLocaleString('id-ID');
    }


    // -------------------------------------------------------------------
    // 9. INISIALISASI & DARK MODE
    // -------------------------------------------------------------------

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
    loadCoinProducts();
    showContent('casbon');
    jumlahRupiahInput.value = 0;

    if (qrisImage) qrisImage.style.display = 'none';
    if (detailQrisCasbon) detailQrisCasbon.style.display = 'none';
    if (selectedQrisImageName) selectedQrisImageName.value = '';

    toggleProofSection(null);
});