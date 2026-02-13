<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (empty($data) || empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Пожалуйста, заполните имя']);
    exit;
}

if (empty($data['consent']) || $data['consent'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Необходимо согласие на обработку данных']);
    exit;
}

$results = [
    'telegram' => false,
    'email' => false,
    'log' => false
];

$results['telegram'] = sendToTelegram($data)['success'];
$results['email'] = sendToEmail($data)['success'];
$results['log'] = saveToGeneralLog($data, $results);

$successCount = ($results['telegram'] ? 1 : 0) + ($results['email'] ? 1 : 0);

if ($successCount > 0 || $results['log']) {
    $message = "✅ Заявка получена! ";
    if ($results['telegram'] && $results['email']) $message .= "Отправлено в Telegram и на Email.";
    elseif ($results['telegram']) $message .= "Отправлено в Telegram.";
    elseif ($results['email']) $message .= "Отправлено на Email.";
    else $message .= "Сохранено в лог-файл.";
    $message .= " Мы свяжемся с вами в течение 15 минут.";
    
    echo json_encode(['success' => true, 'message' => $message, 'results' => $results]);
} else {
    echo json_encode([
        'success' => false,
        'message' => '❌ Ошибка при отправке. Пожалуйста, позвоните нам: +7 (916) 089-31-33',
        'results' => $results
    ]);
}

function sendToTelegram($data) {
    $botToken = '8204614017:AAFQ6T5xwLt0G5G24-dGiuFu3EDhcLNPIGE';
    $chatId = '1055960460';
    
    $message = "📋 <b>НОВАЯ ЗАЯВКА</b>\n\n";
    $message .= "<b>👤 Имя:</b> " . htmlspecialchars($data['name']) . "\n";
    if (!empty($data['company'])) $message .= "<b>🏢 Организация:</b> " . htmlspecialchars($data['company']) . "\n";
    if (!empty($data['service'])) $message .= "<b>📋 Услуга:</b> " . htmlspecialchars($data['service']) . "\n";
    if (!empty($data['email'])) $message .= "<b>📧 Email:</b> " . htmlspecialchars($data['email']) . "\n";
    if (!empty($data['phone'])) $message .= "<b>📞 Телефон:</b> " . htmlspecialchars($data['phone']) . "\n";
    if (!empty($data['message'])) $message .= "<b>📝 Сообщение:</b>\n" . htmlspecialchars($data['message']) . "\n";
    $message .= "\n<b>🕒 Время:</b> " . date('H:i:s d.m.Y');
    
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
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['success' => ($httpCode == 200)];
}

function sendToEmail($data) {
    $to = 'info.csm77@yandex.ru';
    $subject = 'Заявка с сайта: ' . htmlspecialchars($data['name']);
    
    $message = "Имя: " . $data['name'] . "\n";
    if (!empty($data['company'])) $message .= "Организация: " . $data['company'] . "\n";
    if (!empty($data['service'])) $message .= "Услуга: " . $data['service'] . "\n";
    if (!empty($data['email'])) $message .= "Email: " . $data['email'] . "\n";
    if (!empty($data['phone'])) $message .= "Телефон: " . $data['phone'] . "\n";
    if (!empty($data['message'])) $message .= "Сообщение:\n" . $data['message'] . "\n";
    $message .= "\nВремя: " . date('d.m.Y H:i:s') . "\nIP: " . $_SERVER['REMOTE_ADDR'];
    
    $headers = "From: noreply@" . $_SERVER['HTTP_HOST'] . "\r\n";
    $headers .= "Reply-To: " . (!empty($data['email']) ? $data['email'] : $to) . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    return ['success' => mail($to, $subject, $message, $headers)];
}

function saveToGeneralLog($data, $results) {
    $logDir = __DIR__ . '/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
        file_put_contents($logDir . '/.htaccess', "Deny from all\n");
    }
    
    $logFile = $logDir . '/applications_' . date('Y-m-d') . '.log';
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'data' => $data,
        'results' => $results
    ];
    
    return file_put_contents($logFile, json_encode($logEntry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
}
?>