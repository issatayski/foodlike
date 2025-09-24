(function(){
  const $ = (s, r=document)=>r.querySelector(s);

  // ===== EmailJS настройки (вставьте свои значения!) =====
  const EMAILJS = {
    SERVICE_ID:  "service_sny2sav",
    TEMPLATE_ID: "template_ncglb1r",
    PUBLIC_KEY:  "5Z6mho52RiNy1HLcO"
  };

  // Инициализация EmailJS (CDN-скрипт уже подключён в index.html)
  if (window.emailjs && EMAILJS.PUBLIC_KEY) {
    emailjs.init(EMAILJS.PUBLIC_KEY);
  }

  // ==== Header/Footer fallback (как прежде) ====
  const FALLBACK_HEADER = `
    <div class="wrap">
      <a class="brand" href="#">
        <img class="brand-logo" src="logo.svg" alt="Логотип">
        <span class="brand-name"><strong>Distribut.kz</strong></span>
      </a>
      <button class="burger" aria-label="Открыть меню" aria-expanded="false">☰</button>
      <nav class="nav" aria-hidden="true">
        <button class="nav-close" aria-label="Закрыть меню">✕</button>
        <a href="#about">О компании</a>
        <a href="#categories">Продукция</a>
        <a href="#partners">Партнёры</a>
        <a href="#contacts">Контакты</a>
      </nav>
    </div>`;
  const FALLBACK_FOOTER = `
    <div class="wrap">
      <p>© 2025 Food Line Distribution — Все права защищены</p>
      <p>Телефон: +7 (700) 000-00-00 • Email: info@distribut.kz</p>
      <p><a href="#">Instagram</a> | <a href="#">Facebook</a> | <a href="#">Telegram</a></p>
    </div>`;

  async function mountPart(placeholderId, filePath, storageKey, fallbackHTML){
    const host = document.getElementById(placeholderId);
    if(!host) return;
    const saved = localStorage.getItem(storageKey);
    if(saved){ host.innerHTML = saved; afterMount(placeholderId); return; }
    try{
      const res = await fetch(filePath, { cache: 'no-store' });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      host.innerHTML = await res.text();
    }catch(e){
      host.innerHTML = fallbackHTML || '';
    }
    afterMount(placeholderId);
  }

  function afterMount(id){
    if(id === 'header-placeholder'){
      const root   = document.getElementById('header-placeholder');
      const burger = root.querySelector('.burger');
      const nav    = root.querySelector('.nav');
      const close  = root.querySelector('.nav-close');
      const links  = root.querySelectorAll('.nav a');

      function openMenu(){
        if(!nav || !burger) return;
        nav.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        nav.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';
      }
      function closeMenu(){
        if(!nav || !burger) return;
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
      }
      if (burger) burger.addEventListener('click', openMenu);
      if (close)  close.addEventListener('click', closeMenu);
      links.forEach(a => a.addEventListener('click', closeMenu));
      window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

      const mq = window.matchMedia('(min-width: 901px)');
      if(mq && mq.addEventListener){ mq.addEventListener('change', (ev)=>{ if(ev.matches) closeMenu(); }); }
    }
  }

  // Count-up для «Факты о нас»
  function initFactsCountUp(){
    try{
      const nums = document.querySelectorAll('.stats--creative .stat-num[data-target]');
      if(!nums.length) return;
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      nums.forEach(n => io.observe(n));

      function animate(el){
        const target = Number(el.getAttribute('data-target')) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1200;
        const start = performance.now();
        function tick(t){
          const p = Math.min(1, (t - start)/duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(target * eased);
          el.textContent = val.toLocaleString('ru-RU') + suffix;
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }catch(e){ console.warn('Facts count-up skipped:', e); }
  }

  // === Отправка формы через EmailJS ===
  function initContactForm(){
    const form = $('#contact-form');
    const status = $('#form-status');
    if(!form) return;

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      status.textContent = '';
      status.className = 'form-status';
      if(btn) btn.classList.add('is-loading');

      try{
        // Honeypot (не отправляем, если заполнено)
        const hp = form.querySelector('input[name="website"]');
        if(hp && hp.value){ throw new Error('Подозрение на спам.'); }

        // Собираем данные формы под шаблон EmailJS
        const data = Object.fromEntries(new FormData(form).entries());
        const templateParams = {
          name:    data.name || '',
          phone:   data.phone || '',
          email:   data.email || '',
          company: data.company || '',
          city:    data.city || '',
          message: data.message || '',
          page:    location.href
        };

        // Проверим конфиг
        if(!window.emailjs){ throw new Error('EmailJS SDK не найден.'); }
        if(!(EMAILJS.SERVICE_ID && EMAILJS.TEMPLATE_ID && EMAILJS.PUBLIC_KEY)){
          throw new Error('Не задан SERVICE_ID / TEMPLATE_ID / PUBLIC_KEY в app.js');
        }

        // Отправка
        const res = await emailjs.send(EMAILJS.SERVICE_ID, EMAILJS.TEMPLATE_ID, templateParams);
        // Успех
        form.reset();
        status.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.';
        status.classList.add('ok');
      }catch(err){
        status.textContent = (err && err.message) ? err.message : 'Ошибка отправки. Попробуйте ещё раз.';
        status.classList.add('err');
      }finally{
        if(btn) btn.classList.remove('is-loading');
      }
    });
  }

  (async function(){
    await mountPart('header-placeholder', 'header.html', 'customHeader', FALLBACK_HEADER);
    await mountPart('footer-placeholder', 'footer.html', 'customFooter', FALLBACK_FOOTER);
    initFactsCountUp();
    initContactForm();
  })();
})();
