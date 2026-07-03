const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');

// Menú móvil
burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav-active');
    });
});

/* ===== FONDO CAPA 1 — MALLA DE NODOS ===== */
(function () {
    const cv = document.getElementById('canvas-net');
    const cx = cv.getContext('2d');
    const DIST = 140;
    let W, H, pts, N;
    const mouse = { x: -9999, y: -9999 };

    function init() {
        W = cv.width = window.innerWidth;
        H = cv.height = window.innerHeight;
        N = W < 700 ? 45 : 85; // menos partículas en móvil
        pts = Array.from({ length: N }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            r: Math.random() * 1.8 + 0.8,
            warm: Math.random() < 0.25, // 25% nodos ámbar
        }));
    }
    init();
    window.addEventListener('resize', init, { passive: true });
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

    function frame() {
        cx.clearRect(0, 0, W, H);
        for (const p of pts) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 110 && d > 0) { p.vx += dx / d * 0.07; p.vy += dy / d * 0.07; }
            const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (spd > 1.1) { p.vx = p.vx / spd * 1.1; p.vy = p.vy / spd * 1.1; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < DIST) {
                    const a = (1 - dist / DIST) * 0.15;
                    const warm = pts[i].warm || pts[j].warm;
                    cx.strokeStyle = warm
                        ? `rgba(255,140,58,${a.toFixed(2)})`
                        : `rgba(0,212,255,${a.toFixed(2)})`;
                    cx.lineWidth = 0.6;
                    cx.beginPath(); cx.moveTo(pts[i].x, pts[i].y); cx.lineTo(pts[j].x, pts[j].y); cx.stroke();
                }
            }
        }
        for (const p of pts) {
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            cx.fillStyle = p.warm ? 'rgba(255,140,58,0.55)' : 'rgba(0,212,255,0.5)';
            cx.fill();
        }
        requestAnimationFrame(frame);
    }
    frame();
})();

/* ===== FONDO CAPA 2 — LLUVIA MATRIX ===== */
(function () {
    const cv = document.getElementById('canvas-rain');
    const cx = cv.getContext('2d');
    const chars = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789<>{}[]=/\\';
    const arr = chars.split('');
    const FS = 14;
    let W, H, streams;

    function rnd() { return arr[Math.floor(Math.random() * arr.length)]; }
    function mkS(col) {
        const len = Math.floor(Math.random() * 16) + 5;
        return {
            col, y: Math.random() * -H, len,
            chars: Array.from({ length: len }, rnd),
            spd: 0.9 + Math.random() * 0.9,
            warm: Math.random() < 0.2, // 20% columnas ámbar
        };
    }
    function init() {
        W = cv.width = window.innerWidth;
        H = cv.height = window.innerHeight;
        const cols = Math.floor(W / FS);
        streams = Array.from({ length: cols }, (_, i) => { const s = mkS(i); s.y = Math.random() * H * -1.2; return s; });
    }
    init();
    window.addEventListener('resize', init, { passive: true });

    function frame() {
        cx.fillStyle = 'rgba(7,8,15,0.12)';
        cx.fillRect(0, 0, W, H);
        cx.font = FS + "px 'Courier New', monospace";
        for (const s of streams) {
            const x = s.col * FS;
            for (let i = 0; i < s.len; i++) {
                const cy = s.y - i * FS;
                if (cy < -FS || cy > H) continue;
                if (i === 0) {
                    cx.fillStyle = 'rgba(255,255,255,0.82)';
                } else if (i === 1) {
                    cx.fillStyle = s.warm ? 'rgba(255,140,58,0.72)' : 'rgba(0,212,255,0.72)';
                } else {
                    const fade = (1 - i / s.len) * 0.38;
                    cx.fillStyle = s.warm
                        ? `rgba(255,140,58,${fade.toFixed(2)})`
                        : `rgba(0,212,255,${fade.toFixed(2)})`;
                }
                if (Math.random() < 0.03) s.chars[i] = rnd();
                cx.fillText(s.chars[i], x, cy);
            }
            s.y += s.spd;
            if (s.y - s.len * FS > H) { const ns = mkS(s.col); ns.y = -ns.len * FS; Object.assign(s, ns); }
        }
        requestAnimationFrame(frame);
    }
    frame();
})();

/* ===== TYPING: funcionan → escalan → venden ===== */
const words = ['funcionan.', 'escalan.', 'venden.'];
let wi = 0, ci = 0, del = false;
const typed = document.getElementById('typed');
function type() {
    const w = words[wi];
    if (!del) {
        typed.textContent = w.slice(0, ++ci);
        if (ci === w.length) { del = true; setTimeout(type, 1800); return; }
    } else {
        typed.textContent = w.slice(0, --ci);
        if (ci === 0) { del = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(type, del ? 55 : 90);
}
setTimeout(type, 1200);

/* ===== CONTADORES (4, 7, 326h) ===== */
function animCount(el, target, suffix, dur) {
    const t0 = performance.now();
    const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 4))) + (suffix || '');
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
const so = new IntersectionObserver(e => {
    if (e[0].isIntersecting) {
        animCount(document.getElementById('c1'), 4, '', 1100);
        animCount(document.getElementById('c2'), 7, '', 1100);
        animCount(document.getElementById('c3'), 326, 'h', 1400);
        so.disconnect();
    }
}, { threshold: 0.4 });
so.observe(document.querySelector('.stats'));

/* ===== SCROLL: Lenis (suave) + GSAP ScrollTrigger ===== */
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

    // Barra de progreso
    gsap.to('#scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });

    // Reveals en cascada
    ScrollTrigger.batch('.reveal', {
        start: 'top 85%',
        once: true,
        onEnter: batch => batch.forEach((el, i) =>
            gsap.delayedCall(i * 0.1, () => el.classList.add('visible'))
        )
    });

    // Parallax de la foto del hero (tras terminar su animación de entrada)
    const photo = document.querySelector('.hero-photo');
    if (photo) {
        setTimeout(() => {
            photo.style.animation = 'none';
            photo.style.opacity = '1';
            gsap.to(photo, {
                yPercent: 14,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
        }, 1600);
    }

} else {
    // Fallback sin librerías: reveals con IntersectionObserver + barra nativa
    const obs = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    const bar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const t = document.body.scrollHeight - window.innerHeight;
        if (t > 0) bar.style.transform = 'scaleX(' + (window.scrollY / t) + ')';
    }, { passive: true });
}
