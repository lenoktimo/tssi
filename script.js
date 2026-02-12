document.addEventListener('DOMContentLoaded', function() {
    // Мобильное меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            nav.classList.toggle('active');
            
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
        
        // Закрытие меню при клике вне меню
        document.addEventListener('click', function(event) {
            if (!nav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                nav.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Предотвращаем закрытие при клике внутри меню
        nav.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    // Вкладки нормативной документации
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
    }
    
    // Модальное окно обратной связи
    const modalOverlay = document.getElementById('consultationModal');
    const modalClose = document.querySelector('.modal-close');
    const openModalBtns = document.querySelectorAll('.open-consultation-modal');
    
    // Функция открытия модального окна
    window.openConsultationModal = function(service = '') {
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Автозаполнение услуги, если передана
            if (service) {
                const serviceSelect = document.getElementById('service');
                if (serviceSelect) {
                    serviceSelect.value = service;
                }
            }
        }
    };
    
    // Функция закрытия модального окна
    window.closeConsultationModal = function() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };
    
    // Закрытие по крестику
    if (modalClose) {
        modalClose.addEventListener('click', closeConsultationModal);
    }
    
    // Закрытие по клику вне модального окна
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeConsultationModal();
            }
        });
    }
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeConsultationModal();
        }
    });
    
    // Открытие модального окна по кнопкам
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const service = this.getAttribute('data-service') || '';
            openConsultationModal(service);
        });
    });
    
    // Обработка формы контактов
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(e, this, 'Контактная форма');
        });
    }
    
    // Обработка модальной формы
    const modalForm = document.getElementById('consultationForm');
    if (modalForm) {
        modalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(e, this, 'Консультация с сайта');
            closeConsultationModal();
        });
    }
    
    // Общая функция обработки формы
    function handleFormSubmit(e, formElement, formType = '') {
        // Проверяем согласие на обработку данных
        const agreementCheckbox = formElement.querySelector('input[name="agreement"]');
        if (agreementCheckbox && !agreementCheckbox.checked) {
            showMessage('Для отправки формы необходимо согласие на обработку персональных данных', 'error');
            agreementCheckbox.focus();
            return;
        }
        
        // Собираем данные из формы
        const formData = {
            name: formElement.querySelector('#name')?.value.trim() || '',
            company: formElement.querySelector('#company')?.value.trim() || '',
            service: formElement.querySelector('#service')?.value.trim() || '',
            email: formElement.querySelector('#email')?.value.trim() || '',
            phone: formElement.querySelector('#phone')?.value.trim() || '',
            message: formElement.querySelector('#message')?.value.trim() || '',
            formType: formType,
            consent: agreementCheckbox ? agreementCheckbox.checked : false,
            page: window.location.href
        };
        
        // Проверяем обязательные поля
        if (!formData.name) {
            showMessage('Пожалуйста, введите ваше имя', 'error');
            const nameInput = formElement.querySelector('#name');
            if (nameInput) nameInput.focus();
            return;
        }
        
        if (!formData.email && !formData.phone) {
            showMessage('Пожалуйста, введите email или телефон для связи', 'error');
            const emailInput = formElement.querySelector('#email');
            if (emailInput) emailInput.focus();
            return;
        }
        
        // Проверяем email, если он заполнен
        if (formData.email && !validateEmail(formData.email)) {
            showMessage('Пожалуйста, введите корректный email адрес', 'error');
            const emailInput = formElement.querySelector('#email');
            if (emailInput) emailInput.focus();
            return;
        }
        
        // Показываем индикатор загрузки
        const submitBtn = formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        // Отправляем данные (используем альтернативный вариант отправки в оба места)
        sendToBoth(formData, formType)
            .then(response => {
                if (response.success) {
                    showMessage(response.message || '✅ Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
                    formElement.reset();
                } else {
                    showMessage(response.message || '❌ Ошибка при отправке. Пожалуйста, попробуйте позже или позвоните нам.', 'error');
                }
            })
            .catch(error => {
                console.error('Form submit error:', error);
                showMessage('❌ Ошибка соединения. Пожалуйста, попробуйте позже или позвоните нам.', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    }
    
    // Функция отправки данных формы на сервер
    async function sendFormData(formData, formType = '') {
        try {
            const response = await fetch('form-handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    formType: formType,
                    page: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Fetch error:', error);
            return {
                success: false,
                message: 'Ошибка соединения с сервером'
            };
        }
    }
    
    // Альтернативный вариант: отправка в оба места параллельно
    async function sendToBoth(formData, formType = '') {
        try {
            // Отправляем параллельно в Telegram и на Email
            const [telegramResult, emailResult] = await Promise.allSettled([
                fetch('telegram-sender.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...formData, formType})
                }).then(r => r.json()),
                
                fetch('email-sender.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...formData, formType})
                }).then(r => r.json())
            ]);
            
            const results = {
                telegram: telegramResult.status === 'fulfilled' ? telegramResult.value : null,
                email: emailResult.status === 'fulfilled' ? emailResult.value : null
            };
            
            // Определяем успешность
            const telegramSuccess = results.telegram?.success || false;
            const emailSuccess = results.email?.success || false;
            
            if (telegramSuccess || emailSuccess) {
                let message = '✅ Заявка отправлена! ';
                if (telegramSuccess && emailSuccess) {
                    message += 'Получена в Telegram и на Email.';
                } else if (telegramSuccess) {
                    message += 'Получена в Telegram.';
                } else {
                    message += 'Отправлена на Email.';
                }
                
                return {
                    success: true,
                    message: message + ' Мы скоро свяжемся с вами.',
                    results: results
                };
            } else {
                return {
                    success: false,
                    message: '❌ Не удалось отправить заявку. Пожалуйста, позвоните нам.',
                    results: results
                };
            }
            
        } catch (error) {
            console.error('Error sending to both:', error);
            return {
                success: false,
                message: 'Ошибка отправки. Пожалуйста, позвоните нам.'
            };
        }
    }
    
    // Функция экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Функция валидации email
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    // Функция отображения сообщений
    function showMessage(text, type = 'success') {
        // Удаляем предыдущие сообщения
        const existingMessages = document.querySelectorAll('.message-notification');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-notification message-${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${type === 'success' ? '✅' : '❌'} ${text}
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
        
        // Возможность закрыть по клику
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        });
    }
    
    // Плавный скролл к якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href.length <= 1) return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Маска для телефона
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            
            if (value.startsWith('7') || value.startsWith('8')) {
                value = value.substring(1);
            }
            
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            let formatted = '';
            if (value.length > 0) {
                formatted = '+7 ';
                if (value.length > 3) {
                    formatted += '(' + value.substring(0, 3) + ') ';
                    if (value.length > 6) {
                        formatted += value.substring(3, 6) + '-' + value.substring(6, 8);
                        if (value.length > 8) {
                            formatted += '-' + value.substring(8, 10);
                        }
                    } else {
                        formatted += value.substring(3, value.length);
                    }
                } else {
                    formatted += value;
                }
            }
            
            this.value = formatted;
        });
        
        // Добавляем плейсхолдер, если его нет
        if (!input.placeholder) {
            input.placeholder = '+7 (999) 123-45-67';
        }
    });
    
    // Анимация элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Наблюдаем за элементами для анимации
    document.querySelectorAll('.expertise-card, .feature-card, .service-card, .goal-card, .country-column').forEach(el => {
        observer.observe(el);
    });
});