(function(){
  const $ = (s, r=document)=>r.querySelector(s);

  // Фолбэки на случай, если файлы недоступны
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
      <p>© 2025 Distribut.kz — Все права защищены</p>
      <p>Телефон: +7 (700) 000-00-00 • Email: info@distribut.kz</p>
      <p><a href="#">Instagram</a> | <a href="#">Facebook</a> | <a href="#">Telegram</a></p>
    </div>`;

  // Подгрузка парциалов: localStorage -> файл -> fallback
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

  // Логика после монтирования
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
        document.documentElement.style.overflow = 'hidden'; // блок скролла фона
      }
      function closeMenu(){
        if(!nav || !burger) return;
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = ''; // вернуть скролл
      }

      if (burger) burger.addEventListener('click', openMenu);
      if (close)  close.addEventListener('click', closeMenu);
      links.forEach(a => a.addEventListener('click', closeMenu));
      window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

      // Если меню открыто и перешли на десктоп — закрыть
      const mq = window.matchMedia('(min-width: 901px)');
      if(mq && mq.addEventListener){
        mq.addEventListener('change', (ev)=>{ if(ev.matches) closeMenu(); });
      }
    }
  }

  // Инициализация count-up для блока фактов (изолировано, с безопасным try/catch)
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
    }catch(e){
      // не мешаем работе сайта, если что-то пойдет не так
      console.warn('Facts count-up init skipped:', e);
    }
  }

  (async function(){
    await mountPart('header-placeholder', 'header.html', 'customHeader', FALLBACK_HEADER);
    await mountPart('footer-placeholder', 'footer.html', 'customFooter', FALLBACK_FOOTER);
    initFactsCountUp();
  })();
})();
