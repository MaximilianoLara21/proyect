const orderStatus = document.querySelector("#estado-pedido");
const orderSummary = document.querySelector("#resumen-pedido");
const orderItemsElement = document.querySelector("#pedido-items");
const orderTotalElement = document.querySelector("#pedido-total");
const orderForm = document.querySelector("#formulario-pedido");
const phoneField = document.querySelector("#telefono");

// Mostramos los precios igual que en el catálogo para que el resumen sea familiar.
function formatPrice(price) {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD"
    }).format(price);
}

function parseOrderItems(value) {
    if (!value) return [];

    // Revisamos lo que llegó desde el catálogo antes de usarlo en el pedido.
    const entries = JSON.parse(value);
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error("El pedido está vacío o no es válido.");
    }

    return entries.map((entry) => {
        if (
            !Array.isArray(entry) ||
            typeof entry[0] !== "string" ||
            !Number.isSafeInteger(entry[1]) ||
            entry[1] < 1
        ) {
            throw new Error("El pedido contiene cantidades no válidas.");
        }
        return [entry[0], entry[1]];
    });
}

function showOrderError(message) {
    orderStatus.textContent = message;
    orderStatus.classList.add("mensaje-error");
}

async function renderOrder() {
    let orderItems;
    try {
        orderItems = parseOrderItems(new URLSearchParams(window.location.search).get("items"));
    } catch (error) {
        showOrderError(error.message);
        return;
    }

    try {
        // Consultamos otra vez los sabores para mostrar nombres y precios actualizados.
        const response = await fetch("/api/productos");
        if (!response.ok) {
            throw new Error(`El servidor respondió con estado ${response.status}`);
        }

        const products = await response.json();
        // Asociamos cada cantidad seleccionada con la información actual de su sabor.
        const selectedProducts = orderItems.map(([productId, quantity]) => {
            const product = products.find((item) => item._id === productId);
            if (!product) {
                throw new Error("Uno de los sabores del pedido ya no está disponible. Vuelve al catálogo para actualizarlo.");
            }
            return { product, quantity };
        });

        let total = 0;
        selectedProducts.forEach(({ product, quantity }) => {
            const lineTotal = product.price * quantity;
            total += lineTotal;

            const item = document.createElement("li");
            item.className = "pedido-item";
            item.textContent = `Bolo de ${product.name} — ${quantity} × ${formatPrice(product.price)}: ${formatPrice(lineTotal)}`;
            item.dataset.message = `Bolo de ${product.name} — cantidad: ${quantity}`;
            orderItemsElement.append(item);
        });

        orderTotalElement.textContent = formatPrice(total);
        orderSummary.hidden = false;
        orderForm.hidden = false;
    } catch (error) {
        console.error("No se pudo preparar el pedido:", error);
        showOrderError(error.message || "No se pudo cargar el pedido. Inténtalo de nuevo.");
    }
}

phoneField.addEventListener("input", () => {
    // Evitamos que el teléfono pase del máximo indicado en el formulario.
    if (phoneField.value.length > 10) {
        phoneField.value = phoneField.value.slice(0, 10);
    }
});

orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    // Reunimos los datos y productos en un mensaje listo para enviar por WhatsApp.
    const phoneNumber = orderForm.dataset.whatsappNumber;
    const formData = new FormData(orderForm);
    const items = Array.from(orderItemsElement.children, (item) => item.dataset.message);
    const message = [
        "Hola, deseo coordinar el siguiente pedido:",
        "",
        `Nombre: ${formData.get("nombre")}.`,
        formData.get("telefono") ? `Teléfono de contacto: ${formData.get("telefono")}.` : "",
        formData.get("correo") ? `Correo electrónico: ${formData.get("correo")}.` : "",
        "",
        "Productos solicitados:",
        ...items,
        `Total del pedido: ${orderTotalElement.textContent}.`,
        formData.get("indicaciones") ? `Indicaciones: ${formData.get("indicaciones")}.` : "",
        "",
        "Agradezco confirmar disponibilidad y detalles de entrega."
    ].filter((line) => line !== "");

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message.join("\n"))}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (!whatsappWindow) {
        showOrderError("Tu navegador bloqueó WhatsApp. Permite las ventanas emergentes e inténtalo de nuevo.");
        return;
    }
    whatsappWindow.opener = null;
});

renderOrder();
