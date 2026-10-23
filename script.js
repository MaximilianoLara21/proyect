const sections = document.querySelectorAll("section");
const catalogElement = document.querySelector("#catalogo");
const cartItemsElement = document.querySelector("#carrito-items");
const cartCountElement = document.querySelector("#carrito-cantidad");
const cartTotalElement = document.querySelector("#carrito-total");
const checkoutButton = document.querySelector("#continuar-pedido");
const cartStatus = document.querySelector("#estado-carrito");
const cartStorageKey = "boloyaco-carrito";
// Guardamos el código de cada sabor y cuántos queremos, como una lista de compras.
const cart = new Map();
let products = [];
let catalogLoaded = false;

// Al entrar a una sección, la mostramos suavemente; si el navegador no tiene
// esta animación disponible, dejamos todo visible para que nadie se pierda contenido.
if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    });

    sections.forEach((section) => observer.observe(section));
} else {
    sections.forEach((section) => section.classList.add("visible"));
}

function formatPrice(price) {
    // Usa el formato de moneda de Ecuador y dólares estadounidenses.
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

// Con los productos recibidos del servidor armamos una tarjeta por cada sabor.
function renderProducts() {
    catalogElement.replaceChildren();

    products.forEach((product) => {
        const card = createElement("article", "producto");
        const image = createElement("img", "tamaños");
        image.src = product.image;
        image.alt = `Bolo en bolsita de sabor a ${product.name.toLowerCase()}`;
        image.loading = "lazy";

        const title = createElement("h3", "", `Bolo de ${product.name}`);
        const description = createElement("p", "producto-descripcion", product.description);
        const price = createElement("p", "producto-precio", `${formatPrice(product.price)} por unidad`);
        const addButton = createElement("button", "agregar-producto", "Agregar al carrito");
        addButton.type = "button";
        addButton.addEventListener("click", () => changeQuantity(product._id, 1));

        card.append(image, title, description, price, addButton);
        catalogElement.append(card);
    });
}

function changeQuantity(productId, difference) {
    // Los botones suman o restan unidades; al llegar a cero, el sabor sale del carrito.
    const nextQuantity = (cart.get(productId) || 0) + difference;
    if (nextQuantity <= 0) {
        cart.delete(productId);
    } else {
        cart.set(productId, nextQuantity);
    }
    saveCart();
    renderCart();
}

function saveCart() {
    try {
        // Así el carrito sigue aquí si la persona cierra y vuelve a abrir la página.
        localStorage.setItem(cartStorageKey, JSON.stringify(Array.from(cart.entries())));
        cartStatus.textContent = "";
    } catch (error) {
        console.error("No se pudo guardar el carrito en este navegador:", error);
        cartStatus.textContent = "No se pudo guardar el carrito en este navegador. El pedido se conservará mientras esta página siga abierta.";
    }
}

function restoreCart() {
    let savedItems;
    try {
        const savedCart = localStorage.getItem(cartStorageKey);
        if (!savedCart) return;
        savedItems = JSON.parse(savedCart);
        if (!Array.isArray(savedItems)) {
            throw new Error("El contenido guardado no tiene el formato esperado.");
        }
    } catch (error) {
        console.error("No se pudo recuperar el carrito guardado:", error);
        cartStatus.textContent = "No se pudo recuperar el carrito guardado. Puedes volver a agregar tus productos.";
        return;
    }

    // Recuperamos solo cantidades válidas y sabores que todavía aparecen en el catálogo.
    let unavailableProduct = false;
    savedItems.forEach((entry) => {
        if (
            !Array.isArray(entry) ||
            typeof entry[0] !== "string" ||
            !Number.isSafeInteger(entry[1]) ||
            entry[1] < 1
        ) {
            console.error("Se omitió un producto con datos no válidos del carrito guardado.");
            return;
        }
        if (products.some((product) => product._id === entry[0])) {
            cart.set(entry[0], entry[1]);
        } else {
            unavailableProduct = true;
        }
    });

    if (unavailableProduct) {
        saveCart();
        cartStatus.textContent = "Se actualizaron los productos del carrito porque algunos ya no están disponibles.";
    }
}

function renderCart() {
    // Actualizamos la lista, el número de unidades y el total cada vez que cambia algo.
    cartItemsElement.replaceChildren();
    let itemCount = 0;
    let total = 0;

    cart.forEach((quantity, productId) => {
        const product = products.find((item) => item._id === productId);
        if (!product) return;

        itemCount += quantity;
        total += product.price * quantity;

        const row = createElement("li", "carrito-item");
        const details = createElement(
            "span",
            "carrito-detalles",
            `Bolo de ${product.name} — ${quantity} × ${formatPrice(product.price)}`
        );
        const controls = createElement("div", "controles-cantidad");
        const decreaseButton = createElement("button", "", "−");
        decreaseButton.type = "button";
        decreaseButton.setAttribute("aria-label", `Quitar una unidad de ${product.name}`);
        decreaseButton.addEventListener("click", () => changeQuantity(productId, -1));

        const quantityLabel = createElement("span", "", String(quantity));
        quantityLabel.setAttribute("aria-live", "polite");

        const increaseButton = createElement("button", "", "+");
        increaseButton.type = "button";
        increaseButton.setAttribute("aria-label", `Agregar una unidad de ${product.name}`);
        increaseButton.addEventListener("click", () => changeQuantity(productId, 1));

        controls.append(decreaseButton, quantityLabel, increaseButton);
        row.append(details, controls);
        cartItemsElement.append(row);
    });

    cartCountElement.textContent = String(itemCount);
    cartTotalElement.textContent = formatPrice(total);
    checkoutButton.disabled = itemCount === 0;
}

checkoutButton.addEventListener("click", () => {
    if (cart.size === 0) return;
    // La siguiente página recibe los códigos y cantidades para preparar el resumen.
    const orderUrl = new URL("pedido.html", window.location.href);
    orderUrl.searchParams.set("items", JSON.stringify(Array.from(cart.entries())));
    const orderWindow = window.open(orderUrl.href, "boloyaco-pedido");
    if (!orderWindow) {
        cartStatus.textContent = "Tu navegador bloqueó la nueva pestaña. Permite las ventanas emergentes e inténtalo de nuevo.";
        return;
    }
    cartStatus.textContent = "";
});

async function loadCatalog() {
    try {
        // Pedimos los sabores a nuestro servidor; el navegador no necesita entrar a la base de datos.
        const response = await fetch("/api/productos");
        if (!response.ok) {
            throw new Error(`El servidor respondió con estado ${response.status}`);
        }

        products = await response.json();
        restoreCart();
        catalogLoaded = true;
        renderProducts();
        renderCart();
    } catch (error) {
        console.error("No se pudo cargar el catálogo:", error);
        catalogElement.textContent = "No se pudo cargar el catálogo. Verifica que el servidor esté iniciado e inténtalo de nuevo.";
    }
}

window.addEventListener("storage", (event) => {
    if (event.key !== cartStorageKey || !catalogLoaded) return;
    // Si el carrito cambia en otra pestaña, ponemos esta vista al día también.
    cart.clear();
    restoreCart();
    renderCart();
});

loadCatalog();
