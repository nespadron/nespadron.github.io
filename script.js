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

// Animaciones al hacer scroll (controladas)
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.35 });

document.querySelectorAll('.hidden').forEach(el => observer.observe(el));
