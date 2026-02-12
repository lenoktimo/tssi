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

// Настройки Email
$toEmail = 'info.csm77@yandex.ru';
$subject = 'Новая заявка с сайта ООО «ЦСИ» - ' . ($data['formType'] ?? 'Общая');

// Формируем HTML письмо
$htmlMessage = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin: 20px 0; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #2E7D32; display: inline-block; width: 150px; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Новая заявка с сайта ООО «ЦСИ»</h2>
    </div>
    <div class="content">
        <div class="field">
            <span class="label">Имя:</span> ' . htmlspecialchars($data['name']) . '
        </div>';
        
if (!empty($data['company'])) {
    $htmlMessage .= '<div class="field">
            <span class="label">Организация:</span> ' . htmlspecialchars($data['company']) . '
        </div>';
}

if (!empty($data['service'])) {
    $htmlMessage .= '<div class="field">
            <span class="label">Услуга:</span> ' . htmlspecialchars($data['service']) . '
        </div>';
}

if (!empty($data['email'])) {
    $htmlMessage .= '<div class="field">
            <span class="label">Email:</span> ' . htmlspecialchars($data['email']) . '
        </div>';
}

if (!empty($data['phone'])) {
    $htmlMessage .= '<div class="field">
            <span class="label">Телефон:</span> ' . htmlspecialchars($data['phone']) . '
        </div>';
}

if (!empty($data['message'])) {
    $htmlMessage .= '<div class="field">
            <span class="label">Сообщение:</span><br>
            ' . nl2br(htmlspecialchars($data['message'])) . '
        </div>';
}

$htmlMessage .= '
        <div class="field">
            <span class="label">Тип формы:</span> ' . ($data['formType'] ?? 'Общая') . '
        </div>
        <div class="field">
            <span class="label">Время:</span> ' . date('d.m.Y H:i:s') . '
        </div>
        <div class="field">
            <span class="label">IP-адрес:</span> ' . $_SERVER['REMOTE_ADDR'] . '
        </div>
    </div>
    <div class="footer">
        Это письмо отправлено автоматически с сайта ООО «ЦСИ».
    </div>
</body>
</html>';

// Текстовый вариант (для почтовых клиентов без HTML)
$textMessage = "Новая заявка с сайта ООО «ЦСИ»\n\n";
$textMessage .= "Имя: " . $data['name'] . "\n";
if (!empty($data['company'])) $textMessage .= "Организация: " . $data['company'] . "\n";
if (!empty($data['service'])) $textMessage .= "Услуга: " . $data['service'] . "\n";
if (!empty($data['email'])) $textMessage .= "Email: " . $data['email'] . "\n";
if (!empty($data['phone'])) $textMessage .= "Телефон: " . $data['phone'] . "\n";
if (!empty($data['message'])) $textMessage .= "Сообщение:\n" . $data['message'] . "\n";
$textMessage .= "\nВремя: " . date('d.m.Y H:i:s') . "\n";
$textMessage .= "IP: " . $_SERVER['REMOTE_ADDR'];

// Заголовки письма
$headers = [
    'From' => 'noreply@' . $_SERVER['HTTP_HOST'],
    'Reply-To' => !empty($data['email']) ? $data['email'] : $toEmail,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/html; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'PHP/' . phpversion()
];

// Формируем строку заголовков
$headersString = '';
foreach ($headers as $key => $value) {
    $headersString .= "$key: $value\r\n";
}

// Добавляем альтернативное текстовое содержание
$boundary = uniqid('np');
$headersString = "MIME-Version: 1.0\r\n";
$headersString .= "From: noreply@" . $_SERVER['HTTP_HOST'] . "\r\n";
$headersString .= "Reply-To: " . (!empty($data['email']) ? $data['email'] : $toEmail) . "\r\n";
$headersString .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";

// Тело письма с альтернативным текстовым содержанием
$emailBody = "--$boundary\r\n";
$emailBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$emailBody .= $textMessage . "\r\n\r\n";

$emailBody .= "--$boundary\r\n";
$emailBody .= "Content-Type: text/html; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$emailBody .= $htmlMessage . "\r\n\r\n";

$emailBody .= "--$boundary--";

// Отправляем письмо
$mailSent = mail($toEmail, $subject, $emailBody, $headersString);

if ($mailSent) {
    saveToLog($data, 'email', true);
    echo json_encode(['success' => true, 'message' => 'Заявка отправлена на Email']);
} else {
    saveToLog($data, 'email', false, 'Ошибка отправки email');
    echo json_encode(['success' => false, 'message' => 'Ошибка отправки email']);
}

function saveToLog($data, $type, $success, $error = null) {
    $logDir = __DIR__ . '/logs';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
        file_put_contents($logDir . '/.htaccess', "Deny from all\n");
    }
    
    $logFile = $logDir . '/email_' . date('Y-m-d') . '.log';
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