/*Animacion de secciones al hacer scroll*/
const sections =
    document.querySelectorAll("section");

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {

entry.target.classList.add("visible");
        }
    });
});

sections.forEach((section) => {
    observer.observe(section);
});

