const API = '/api';

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

async function loadServices() {
  const grid = document.getElementById('servicesGrid');
  try {
    const res = await fetch(`${API}/services`);
    const services = await res.json();
    if (!res.ok) throw new Error('Ошибка');
    grid.innerHTML = services.map(s => `
      <div class="service-card reveal">
        <div class="service-icon" style="background:rgba(129,140,248,.12);color:#818cf8">${getIcon(s.icon)}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </div>
    `).join('');
    document.querySelectorAll('#servicesGrid .reveal').forEach(el => observer.observe(el));
  } catch {
    grid.innerHTML = '<p style="color:#94a3b8">Не удалось загрузить услуги</p>';
  }
}

async function loadPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  try {
    const res = await fetch(`${API}/portfolio`);
    const items = await res.json();
    if (!res.ok) throw new Error('Ошибка');
    if (!items.length) {
      grid.innerHTML = `
        <div class="portfolio-empty reveal">
          <div class="empty-icon">📭</div>
          <h3>Пока нет проектов</h3>
          <p>Заказов ещё не было, но вы можете это исправить!<br>Оставьте заявку, и мы создадим сайт вашей мечты.</p>
          <a href="#contact" class="btn btn-primary" style="margin-top:16px">Оставить заявку</a>
        </div>
      `;
      document.querySelectorAll('#portfolioGrid .reveal').forEach(el => observer.observe(el));
      return;
    }
    grid.innerHTML = items.map(p => `
      <div class="portfolio-card reveal">
        <div class="portfolio-image">📁</div>
        <div class="portfolio-body">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          ${p.link ? `<a href="${p.link}" class="portfolio-link" target="_blank" rel="noopener">Смотреть проект →</a>` : ''}
        </div>
      </div>
    `).join('');
    document.querySelectorAll('#portfolioGrid .reveal').forEach(el => observer.observe(el));
  } catch {
    grid.innerHTML = '<p style="color:#94a3b8">Не удалось загрузить портфолио</p>';
  }
}

function getIcon(name) {
  const icons = { landing: '🚀', globe: '🌐', building: '🏢', cart: '🛒', layout: '📋' };
  return icons[name] || '💻';
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
  const input = el.closest('.form-group')?.querySelector('input, textarea');
  if (input) input.classList.toggle('error', !!msg);
}

function showFormStatus(msg, type) {
  const el = document.getElementById('formStatus');
  el.textContent = msg;
  el.className = `form-status ${type}`;
  el.style.display = 'block';
}

function hideFormStatus() {
  const el = document.getElementById('formStatus');
  el.style.display = 'none';
  el.className = 'form-status';
}

function validateField(name, message) {
  let valid = true;
  if (!name || name.length < 2) {
    showFieldError('nameError', 'Имя должно быть от 2 символов');
    valid = false;
  } else {
    showFieldError('nameError', '');
  }
  if (!message || message.length < 5) {
    showFieldError('messageError', 'Напишите хотя бы пару слов о задаче');
    valid = false;
  } else {
    showFieldError('messageError', '');
  }
  return valid;
}

document.getElementById('contactForm').addEventListener('submit', async e => {
  e.preventDefault();
  hideFormStatus();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const telegram = document.getElementById('telegram').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!validateField(name, message)) return;

  const btn = document.getElementById('submitBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, telegram, message }),
    });
    const data = await res.json();
    if (data.success) {
      showFormStatus('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами.', 'success');
      document.getElementById('contactForm').reset();
    } else {
      showFormStatus(data.error || 'Ошибка отправки. Попробуйте позже.', 'error');
    }
  } catch {
    showFormStatus('Ошибка соединения. Проверьте подключение.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

loadServices();
loadPortfolio();
