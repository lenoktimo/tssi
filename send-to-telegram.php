<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Получаем данные
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (empty($data) || empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Не заполнено имя']);
    exit;
}

// Настройки Telegram
$botToken = '8204614017:AAFQ6T5xwLt0G5G24-dGiuFu3EDhcLNPIGE';
$chatId = '1055960460';

// Формируем сообщение
$message = "📋 <b>НОВАЯ ЗАЯВКА С САЙТА ООО «ЦСИ»</b>\n\n";
$message .= "<b>👤 Имя:</b> " . htmlspecialchars($data['name']) . "\n";

if (!empty($data['company'])) {
    $message .= "<b>🏢 Организация:</b> " . htmlspecialchars($data['company']) . "\n";
}

if (!empty($data['service'])) {
    $message .= "<b>📋 Услуга:</b> " . htmlspecialchars($data['service']) . "\n";
}

if (!empty($data['email'])) {
    $message .= "<b>📧 Email:</b> " . htmlspecialchars($data['email']) . "\n";
}

if (!empty($data['phone'])) {
    $message .= "<b>📞 Телефон:</b> " . htmlspecialchars($data['phone']) . "\n";
}

if (!empty($data['message'])) {
    $message .= "<b>📝 Сообщение:</b>\n" . htmlspecialchars($data['message']) . "\n";
}

$message .= "\n<b>📄 Тип формы:</b> " . htmlspecialchars($data['formType'] ?? 'Общая') . "\n";
$message .= "<b>🕒 Время:</b> " . date('d.m.Y H:i:s') . "\n";
$message .= "<b>🌐 IP:</b> " . $_SERVER['REMOTE_ADDR'];

// Отправляем в Telegram
$url = "https://api.telegram.org/bot{$botToken}/sendMessage";
$postData = [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML'
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode == 200) {
    // Сохраняем в лог
    saveToLog($data, 'telegram', true);
    echo json_encode(['success' => true, 'message' => 'Заявка отправлена в Telegram']);
} else {
    saveToLog($data, 'telegram', false, $error);
    echo json_encode(['success' => false, 'message' => 'Ошибка Telegram: ' . $error]);
}

function saveToLog($data, $type, $success, $error = null) {
    $logDir = __DIR__ . '/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
        file_put_contents($logDir . '/.htaccess', "Deny from all\n");
    }
    
    $logFile = $logDir . '/telegram_' . date('Y-m-d') . '.log';
    $logData = [
        'date' => date('Y-m-d H:i:s'),
        'type' => $type,
        'success' => $success,
        'error' => $error,
        'ip' => $_SERVER['REMOTE_ADDR'],
        'data' => $data
    ];
    
    file_put_contents($logFile, json_encode($logData, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
}
?>