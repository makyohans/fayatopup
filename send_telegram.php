<?php
// send_telegram.php

// -------------------------------------------------------------------
// --- KONFIGURASI TELEGRAM (AMAN, Karena di Sisi Server) ---
// -------------------------------------------------------------------
// GANTI DENGAN BOT TOKEN DAN CHAT ID ANDA YANG ASLI
define('BOT_TOKEN', '8366211169:AAF6gMoG5WnoGTwx9whACwg3GI2iznBIkI');
define('CHAT_ID', '7729097393');
// -------------------------------------------------------------------

header('Content-Type: application/json');

// Pastikan hanya menerima permintaan POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Hanya menerima permintaan POST']);
    exit;
}

// Ambil data JSON dari body request
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Pastikan data yang diterima valid
if (empty($data) || !isset($data['message_caption'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Data atau pesan Telegram tidak valid']);
    exit;
}

$messageCaption = $data['message_caption'];
// $telegramURL = $data['telegram_url']; // Variabel ini diterima tapi tidak digunakan

// Jika ada file bukti pembayaran, kita akan ambil dan kirimkan
$fileContent = null;
$fileName = null;
$tmpFilePath = null; // Inisialisasi path sementara

if (isset($data['file_base64']) && $data['file_base64']) {
    $fileBase64 = $data['file_base64'];
    $fileType = $data['file_type']; // Contoh: image/jpeg
    
    // Hilangkan prefix data:image/jpeg;base64,
    $fileBase64 = preg_replace('/^data:image\/\w+;base64,/', "", $fileBase64);
    $fileContent = base64_decode($fileBase64);
    
    // Tentukan nama file sementara
    $extension = explode('/', $fileType)[1] ?? 'jpg';
    $fileName = 'bukti_pembayaran_' . time() . '.' . $extension;
    $tmpFilePath = sys_get_temp_dir() . '/' . $fileName; // Tetapkan path sementara
}


// --- FUNGSI KIRIM PESAN/FOTO ---

$ch = curl_init();
$url = 'https://api.telegram.org/bot' . BOT_TOKEN . '/';

if ($fileContent && $tmpFilePath) {
    // MODE 1: KIRIM FOTO MENGGUNAKAN sendPhoto
    $url .= 'sendPhoto';
    
    // 1. Simpan file sementara
    // Pastikan file berhasil ditulis sebelum mencoba menggunakannya
    if (file_put_contents($tmpFilePath, $fileContent) === false) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan file sementara di server']);
        exit;
    }

    $params = [
        'chat_id' => CHAT_ID,
        'caption' => $messageCaption,
        'parse_mode' => 'HTML',
        // Menggunakan CURLFile adalah cara modern untuk upload file via cURL
        'photo' => new CURLFile($tmpFilePath, $fileType, $fileName)
    ];

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    // Saat menggunakan CURLFile, cURL otomatis mengatur header 'Content-Type: multipart/form-data'
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
} else {
    // MODE 2: KIRIM PESAN TEXT BIASA (sendMessage)
    $url .= 'sendMessage';
    
    $params = [
        'chat_id' => CHAT_ID,
        'text' => $messageCaption,
        'parse_mode' => 'HTML'
    ];
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
}


// Jalankan cURL dan dapatkan respon
$response = curl_exec($ch);

// Periksa error cURL
if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    curl_close($ch);
    // Hapus file sementara jika ada (Penting!)
    if ($tmpFilePath && file_exists($tmpFilePath)) unlink($tmpFilePath);
    
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengirim ke Telegram (cURL Error): ' . $error_msg]);
    exit;
}

curl_close($ch);

// Hapus file sementara SETELAH cURL selesai dan berhasil
if ($tmpFilePath && file_exists($tmpFilePath)) unlink($tmpFilePath);

// Dekode respon dari Telegram
$result = json_decode($response, true);

if (isset($result['ok']) && $result['ok'] === true) {
    // Sukses
    echo json_encode(['status' => 'success', 'message' => 'Pesan Telegram berhasil terkirim']);
} else {
    // Gagal dari API Telegram
    $telegram_error = isset($result['description']) ? $result['description'] : 'Unknown Telegram Error';
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Telegram API Error: ' . $telegram_error]);
}

?>