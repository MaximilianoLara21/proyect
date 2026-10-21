const sections = document.querySelectorAll("section");
const catalogElement = document.querySelector("#catalogo");
const cartItemsElement = document.querySelector("#carrito-items");
const cartCountElement = document.querySelector("#carrito-cantidad");
const cartTotalElement = document.querySelector("#carrito-total");
const checkoutButton = document.querySelector("#continuar-pedido");
const cartStatus = document.querySelector("#estado-carrito");
// El carrito guarda el identificador del producto y las unidades elegidas.
const cart = new Map();
let products = [];

// Mantiene la animación existente y respeta el modo de movimiento reducido.
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

function renderProducts() {
    // Construye las tarjetas con los datos que entrega la API de MongoDB.
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
    // Cambia las unidades; si llegan a cero, quita el producto del carrito.
    const nextQuantity = (cart.get(productId) || 0) + difference;
    if (nextQuantity <= 0) {
        cart.delete(productId);
    } else {
        cart.set(productId, nextQuantity);
    }
    renderCart();
}

function renderCart() {
    // Vuelve a dibujar el carrito y calcula cantidad y precio total.
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
    const orderUrl = new URL("pedido.html", window.location.href);
    orderUrl.searchParams.set("items", JSON.stringify(Array.from(cart.entries())));
    const orderWindow = window.open(orderUrl.href, "_blank");
    if (!orderWindow) {
        cartStatus.textContent = "Tu navegador bloqueó la nueva pestaña. Permite las ventanas emergentes e inténtalo de nuevo.";
        return;
    }
    orderWindow.opener = null;
    cartStatus.textContent = "";
});

async function loadCatalog() {
    try {
        // El navegador solicita los productos al servidor, no se conecta directamente a Atlas.
        const response = await fetch("/api/productos");
        if (!response.ok) {
            throw new Error(`El servidor respondió con estado ${response.status}`);
        }

        products = await response.json();
        renderProducts();
        renderCart();
    } catch (error) {
        console.error("No se pudo cargar el catálogo:", error);
        catalogElement.textContent = "No se pudo cargar el catálogo. Verifica que el servidor esté iniciado e inténtalo de nuevo.";
    }
}

loadCatalog();
