document.addEventListener('DOMContentLoaded', function() {
    // === Мобильное меню ===
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        
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
        
        nav.addEventListener('click', function(event) { event.stopPropagation(); });
    }
    
    // === Вкладки нормативной документации ===
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                tabContents.forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(tabId);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }
    
    // === Модальное окно обратной связи ===
    const modalOverlay = document.getElementById('consultationModal');
    const modalClose = document.querySelector('.modal-close');
    const openModalBtns = document.querySelectorAll('.open-consultation-modal');
    
    window.openConsultationModal = function(service = '') {
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (service) {
                const serviceSelect = modalOverlay.querySelector('#modal-service');
                if (serviceSelect) serviceSelect.value = service;
            }
        }
    };
    
    window.closeConsultationModal = function() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };
    
    if (modalClose) modalClose.addEventListener('click', closeConsultationModal);
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) closeConsultationModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeConsultationModal();
        }
    });
    
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const service = this.getAttribute('data-service') || '';
            openConsultationModal(service);
        });
    });
    
    // === Обработка форм ===
    // Функция валидации email
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    // Функция отображения сообщений
    function showMessage(text, type = 'success') {
        const existingMessages = document.querySelectorAll('.message-notification');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-notification message-${type}`;
        messageDiv.innerHTML = `<div class="message-content">${type === 'success' ? '✅' : '❌'} ${text}</div>`;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
        
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        });
    }
    
    // Основная функция отправки формы
    async function sendFormData(formData) {
        try {
            const response = await fetch('form-handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    page: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { success: false, message: 'Ошибка соединения с сервером' };
        }
    }
    
    // Обработчик любой формы
    function handleFormSubmit(e, formElement, formType = '') {
        e.preventDefault();
        
        const agreementCheckbox = formElement.querySelector('input[name="agreement"]');
        if (agreementCheckbox && !agreementCheckbox.checked) {
            showMessage('Для отправки формы необходимо согласие на обработку персональных данных', 'error');
            agreementCheckbox.focus();
            return;
        }
        
        const formData = {
            name: formElement.querySelector('#name, #modal-name')?.value.trim() || '',
            company: formElement.querySelector('#company, #modal-company')?.value.trim() || '',
            service: formElement.querySelector('#service, #modal-service')?.value.trim() || '',
            email: formElement.querySelector('#email, #modal-email')?.value.trim() || '',
            phone: formElement.querySelector('#phone, #modal-phone')?.value.trim() || '',
            message: formElement.querySelector('#message, #modal-message')?.value.trim() || '',
            formType: formType,
            consent: agreementCheckbox ? agreementCheckbox.checked : false
        };
        
        if (!formData.name) {
            showMessage('Пожалуйста, введите ваше имя', 'error');
            const nameInput = formElement.querySelector('#name, #modal-name');
            if (nameInput) nameInput.focus();
            return;
        }
        
        if (!formData.email && !formData.phone) {
            showMessage('Пожалуйста, введите email или телефон для связи', 'error');
            const emailInput = formElement.querySelector('#email, #modal-email');
            if (emailInput) emailInput.focus();
            return;
        }
        
        if (formData.email && !validateEmail(formData.email)) {
            showMessage('Пожалуйста, введите корректный email адрес', 'error');
            const emailInput = formElement.querySelector('#email, #modal-email');
            if (emailInput) emailInput.focus();
            return;
        }
        
        const submitBtn = formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        sendFormData(formData)
            .then(response => {
                if (response.success) {
                    showMessage(response.message || '✅ Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
                    formElement.reset();
                    if (formElement.closest('.modal')) closeConsultationModal();
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
    
    // Привязка к модальной форме
    const modalForm = document.getElementById('consultationForm');
    if (modalForm) {
        modalForm.addEventListener('submit', function(e) {
            handleFormSubmit(e, this, 'Консультация с сайта');
        });
    }
    
    // Привязка к контактной форме
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            handleFormSubmit(e, this, 'Контактная форма');
        });
    }
    
    // === Маска для телефона ===
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('7') || value.startsWith('8')) value = value.substring(1);
            if (value.length > 10) value = value.substring(0, 10);
            let formatted = '';
            if (value.length > 0) {
                formatted = '+7 ';
                if (value.length > 3) {
                    formatted += '(' + value.substring(0, 3) + ') ';
                    if (value.length > 6) {
                        formatted += value.substring(3, 6) + '-' + value.substring(6, 8);
                        if (value.length > 8) formatted += '-' + value.substring(8, 10);
                    } else {
                        formatted += value.substring(3);
                    }
                } else {
                    formatted += value;
                }
            }
            this.value = formatted;
        });
        if (!input.placeholder) input.placeholder = '+7 (999) 123-45-67';
    });
    
    // === Плавный скролл к якорям ===
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
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
    
    // === Анимация элементов при скролле ===
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('animate-in');
        });
    }, observerOptions);
    
    document.querySelectorAll('.expertise-card, .feature-card, .service-card, .goal-card, .country-column').forEach(el => {
        observer.observe(el);
    });
});