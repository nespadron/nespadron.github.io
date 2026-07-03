const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');

// Menú móvil
burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
});

// Cerrar menú al hacer click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav-active');
    });
});

// ===== Scroll animado: Lenis (scroll suave) + GSAP ScrollTrigger =====
if (window.Lenis && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ duration: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Anclas del menú con scroll suave (compensando navbar fija)
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -72 });
            }
        });
    });

    // Barra de progreso de lectura
    gsap.to('.scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });

    // Reveals con stagger (reemplaza al IntersectionObserver, misma clase CSS)
    ScrollTrigger.batch('.hidden', {
        start: 'top 85%',
        once: true,
        onEnter: batch => batch.forEach((el, i) =>
            gsap.delayedCall(i * 0.12, () => el.classList.add('show'))
        )
    });

    // Parallax sutil en el hero
    gsap.to('.hero-photo', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-content', {
        yPercent: -8,
        autoAlpha: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Contadores animados en los stats (4, 7, 326h)
    document.querySelectorAll('.stat-number').forEach(el => {
        const m = el.textContent.trim().match(/^(\d+)(.*)$/);
        if (!m) return;
        const end = parseInt(m[1], 10);
        const suffix = m[2];
        const obj = { v: 0 };
        gsap.to(obj, {
            v: end,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
        });
    });

} else {
    // Fallback sin librerías: reveals con IntersectionObserver
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
}
