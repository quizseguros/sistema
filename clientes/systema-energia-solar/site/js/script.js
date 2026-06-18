document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Smooth scroll (Lenis) ---------- */
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', () => ScrollTrigger.update());

gsap.registerPlugin(ScrollTrigger);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      e.preventDefault();
      lenis.scrollTo(id, { offset: -70 });
    }
  });
});

/* ---------- Preloader: animação de entrada da logo ---------- */
window.addEventListener('load', () => {
  const tl = gsap.timeline({
    onComplete: () => {
      document.getElementById('preloader').style.display = 'none';
      animateHero();
    },
  });

  tl.to('#preloader-logo', { opacity: 1, scale: 1, duration: .7, ease: 'back.out(1.6)' })
    .to('#preloader-logo', { scale: 1.06, duration: .35, ease: 'power1.inOut' })
    .to('#preloader', { yPercent: -100, duration: .7, ease: 'power3.inOut', delay: .15 });
});

function animateHero() {
  gsap.to('.hero .reveal-up', {
    opacity: 1,
    y: 0,
    duration: .9,
    ease: 'power3.out',
    stagger: .12,
  });
}

/* ---------- Reveal nas demais seções ao rolar ---------- */
document.querySelectorAll('section:not(.hero) .reveal-up').forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: .8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
    },
  });
});

/* ---------- ShapeGrid nas seções de fundo escuro ---------- */
document.querySelectorAll('.shape-bg-section .shapegrid-canvas').forEach((canvas) => {
  createShapeGrid(canvas, {
    direction: 'diagonal',
    speed: 0.35,
    shape: 'square',
    squareSize: 42,
    borderColor: 'rgba(255,199,0,.3)',
    hoverFillColor: 'rgba(255,199,0,.18)',
    hoverTrailAmount: 6,
  });
});

/* ---------- Header: esconder/mostrar conforme o scroll ---------- */
let lastScroll = 0;
lenis.on('scroll', ({ scroll }) => {
  const header = document.getElementById('header');
  if (scroll > 120 && scroll > lastScroll) {
    header.style.transform = 'translateY(-100%)';
  } else {
    header.style.transform = 'translateY(0)';
  }
  lastScroll = scroll;
});

/* ---------- Menu mobile ---------- */
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.querySelector('.main-nav');
menuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
  menuToggle.classList.toggle('active');
});

/* ---------- Calculadora de economia ---------- */
const calcBillInput = document.getElementById('calc-bill');
const calcModal = document.getElementById('calc-modal');
const calcModalClose = document.getElementById('calc-modal-close');
const calcModalCta = document.getElementById('calc-modal-cta');
const calcSubmitBtn = document.getElementById('calc-submit');
const calcLoading = document.getElementById('calc-loading');
const calcProgressFill = document.getElementById('calc-progress-fill');
const currencyFmt = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

calcSubmitBtn.addEventListener('click', () => {
  const bill = parseFloat(calcBillInput.value);
  if (!bill || bill <= 0) {
    calcBillInput.focus();
    return;
  }

  calcSubmitBtn.disabled = true;
  calcLoading.classList.add('active');
  calcProgressFill.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { calcProgressFill.style.width = '100%'; });
  });

  setTimeout(() => {
    const monthlySavings = bill * 0.9;
    const newMonthlyCost = bill - monthlySavings;
    const yearlySavings = monthlySavings * 12;
    const savings5y = yearlySavings * 5;
    const savings10y = yearlySavings * 10;

    document.getElementById('calc-result-current').textContent = currencyFmt(bill);
    document.getElementById('calc-result-monthly').textContent = currencyFmt(monthlySavings);
    document.getElementById('calc-result-newcost').textContent = currencyFmt(newMonthlyCost);
    document.getElementById('calc-result-yearly').textContent = currencyFmt(yearlySavings);
    document.getElementById('calc-result-5y').textContent = currencyFmt(savings5y);
    document.getElementById('calc-result-10y').textContent = currencyFmt(savings10y);

    const msg = `Olá! Fiz a simulação no site: minha conta de luz é de ${currencyFmt(bill)} e eu economizaria cerca de ${currencyFmt(monthlySavings)} por mês com energia solar. Quero um orçamento.`;
    calcModalCta.href = `https://api.whatsapp.com/send?phone=5519971270736&text=${encodeURIComponent(msg)}`;

    calcModal.classList.add('open');
    calcLoading.classList.remove('active');
    calcProgressFill.style.width = '0%';
    calcSubmitBtn.disabled = false;

    const calcProgressResult = document.getElementById('calc-progress-result');
    calcProgressResult.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { calcProgressResult.style.width = '90%'; });
    });
  }, 3800);
});

calcModalClose.addEventListener('click', () => calcModal.classList.remove('open'));
calcModal.addEventListener('click', (e) => {
  if (e.target === calcModal) calcModal.classList.remove('open');
});

/* ---------- Formulário (placeholder de envio) ---------- */
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const nome = form.nome.value;
  const telefone = form.telefone.value;
  const msg = `Olá! Me chamo ${nome} e quero uma proposta de energia solar. WhatsApp: ${telefone}`;
  window.open(`https://api.whatsapp.com/send?phone=5519971270736&text=${encodeURIComponent(msg)}`, '_blank');
});
