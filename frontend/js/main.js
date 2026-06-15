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
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = currentScroll;
});

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

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
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

async function loadServices() {
  const grid = document.getElementById('servicesGrid');
  try {
    const res = await fetch(`${API}/services`);
    const services = await res.json();
    grid.innerHTML = services.map(s => `
      <div class="service-card reveal">
        <div class="service-icon" style="background:rgba(129,140,248,.12);color:#818cf8">${getIcon(s.icon)}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <div class="service-price">${s.price}</div>
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
  const icons = {
    code: '💻',
    palette: '🎨',
    'trending-up': '📈',
    settings: '⚙️',
  };
  return icons[name] || '💻';
}

function showFieldError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.display = message ? 'block' : 'none';
  const input = el.closest('.form-group')?.querySelector('input, textarea');
  if (input) input.classList.toggle('error', !!message);
}

function showFormStatus(message, type) {
  const el = document.getElementById('formStatus');
  el.textContent = message;
  el.className = `form-status ${type}`;
  el.style.display = 'block';
}

function hideFormStatus() {
  const el = document.getElementById('formStatus');
  el.style.display = 'none';
  el.className = 'form-status';
}

function validateField(name, email, message) {
  let valid = true;
  if (!name || name.length < 2) {
    showFieldError('nameError', 'Имя должно содержать минимум 2 символа');
    valid = false;
  } else {
    showFieldError('nameError', '');
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    showFieldError('emailError', 'Введите корректный email');
    valid = false;
  } else {
    showFieldError('emailError', '');
  }
  if (!message || message.length < 10) {
    showFieldError('messageError', 'Сообщение должно содержать минимум 10 символов');
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
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!validateField(name, email, message)) return;

  const btn = document.getElementById('submitBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
    const data = await res.json();
    if (data.success) {
      showFormStatus('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
      document.getElementById('contactForm').reset();
    } else {
      showFormStatus(data.error || 'Ошибка отправки. Попробуйте позже.', 'error');

    }
  } catch {
    showFormStatus('Ошибка соединения. Проверьте подключение к интернету.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

loadServices();
loadPortfolio();
