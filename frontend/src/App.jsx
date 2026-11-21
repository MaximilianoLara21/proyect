import { useEffect, useState } from 'react'
import './style.css'

const CART_STORAGE_KEY = 'boloyaco-carrito'
const WHATSAPP_NUMBER = '593958947180'

function formatPrice(price) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function Header({ orderPage = false, cartCount = 0 }) {
  return (
    <header>
      <img
        src="/assets/img/boloyaco-icono.png"
        alt="Icono de Boloyaco, representando tres bolos refrescantes"
        className="icono"
      />
      <h1>Boloyaco</h1>
      <nav aria-label="Navegación">
        <ul>
          {orderPage ? (
            <li><a href="/index.html#sabores">Volver al catálogo</a></li>
          ) : (
            <>
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="#sabores">Sabores</a></li>
              <li><a href="#carrito">Carrito (<span id="carrito-cantidad">{cartCount}</span>)</a></li>
              <li><a href="#nosotros">Nosotros</a></li>
              <li><a href="#ubicacion">Ubicación</a></li>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}

function Footer({ showQuestions = false }) {
  return (
    <footer>
      <h2>Boloyaco es lo más fresco de Guayaquil.</h2>
      <p>Deliciosos bolos para refrescar tus días en Guayaquil.</p>
      {showQuestions && (
        <section id="preguntas" aria-labelledby="preguntas-titulo">
          <h2 id="preguntas-titulo">Preguntas frecuentes</h2>
          <details>
            <summary>¿Es posible incluir varios sabores en un mismo pedido?</summary>
            <p>Sí. Puede seleccionar las cantidades deseadas de cada sabor disponible y agregarlas al carrito.</p>
          </details>
          <details>
            <summary>¿Dónde puedo consultar los precios?</summary>
            <p>El precio vigente se indica en la información de cada producto dentro del catálogo.</p>
          </details>
          <details>
            <summary>¿Cómo se coordinan la entrega y su costo?</summary>
            <p>Luego de recibir su pedido, confirmaremos por WhatsApp la disponibilidad, la ubicación de entrega y el costo correspondiente, si aplica.</p>
          </details>
          <details>
            <summary>¿En qué momento se confirma el pedido?</summary>
            <p>El pedido quedará confirmado cuando acordemos por WhatsApp las cantidades, el total y los detalles de entrega.</p>
          </details>
        </section>
      )}
      {showQuestions && (
        <nav aria-label="Redes sociales">
          <ul>
            <li>
              <a href="https://www.facebook.com/share/19b958bYM8/" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/bolos_guayacos?obrf=MTlrb3g2enFyYjFubg==" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.tiktok.com/@boloyacos?_r=1&_t=ZS-9AimOxxSCxT" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
        </nav>
      )}
      <p>&copy; 2026 Boloyaco. Todos los derechos reservados.</p>
    </footer>
  )
}

function HomeHero() {
  return (
    <section id="inicio">
      <div className="inicio-contenido">
        <h2>Refresca tu día con nuestros deliciosos bolos</h2>
        <p>
          Disfruta de nuestros deliciosos bolos refrescantes, preparados para
          ayudarte a combatir el calor de Guayaquil.
        </p>
        <a href="#sabores">Ver nuestros sabores</a>
      </div>
      <img
        className="logo-inicio"
        src="/assets/img/boloyaco-logo.png"
        alt="Boloyaco, frescura bien guayaca"
      />
    </section>
  )
}

function ProductCatalog({ products, loading, onAdd }) {
  return (
    <section id="sabores">
      <h2>Nuestro catálogo</h2>
      <p>Elige tus sabores favoritos. Cada bolo viene en su bolsita plástica y cuesta $0,50.</p>
      {loading ? (
        <div className="catalogo" aria-live="polite">Cargando sabores...</div>
      ) : products.length > 0 ? (
        <div className="catalogo" aria-live="polite">
          {products.map((product) => (
            <article className="producto" key={product._id}>
              <img
                className="tamaños"
                src={product.image}
                alt={`Bolo en bolsita de sabor a ${product.name.toLowerCase()}`}
                loading="lazy"
              />
              <h3>Bolo de {product.name}</h3>
              <p className="producto-descripcion">{product.description}</p>
              <p className="producto-precio">{formatPrice(product.price)} por unidad</p>
              <button
                className="agregar-producto"
                type="button"
                onClick={() => onAdd(product._id, 1)}
              >
                Agregar al carrito
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p role="status">No se pudo cargar el catálogo. Verifica que el servidor esté iniciado e inténtalo de nuevo.</p>
      )}
    </section>
  )
}

function Cart({ cart, products, status, onChangeQuantity, onContinueError }) {
  const itemCount = Array.from(cart.values()).reduce((sum, quantity) => sum + quantity, 0)
  const total = Array.from(cart.entries()).reduce((sum, [productId, quantity]) => {
    const product = products.find((item) => item._id === productId)
    return sum + (product ? product.price * quantity : 0)
  }, 0)

  function continueToOrder() {
    if (cart.size === 0) return
    const orderUrl = new URL('/pedido.html', window.location.origin)
    orderUrl.searchParams.set('items', JSON.stringify(Array.from(cart.entries())))
    const orderWindow = window.open(orderUrl.href, 'boloyaco-pedido')
    if (!orderWindow) {
      onContinueError('Tu navegador bloqueó la nueva pestaña. Permite las ventanas emergentes e inténtalo de nuevo.')
    }
  }

  return (
    <section id="carrito" className="seccion-carrito">
      <h2>Tu carrito</h2>
      <p>Revisa las cantidades y el total antes de preparar tu pedido.</p>
      <ul className="lista-carrito" aria-live="polite">
        {Array.from(cart.entries()).map(([productId, quantity]) => {
          const product = products.find((item) => item._id === productId)
          if (!product) return null
          return (
            <li className="carrito-item" key={productId}>
              <span className="carrito-detalles">
                Bolo de {product.name} — {quantity} × {formatPrice(product.price)}
              </span>
              <div className="controles-cantidad">
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${product.name}`}
                  onClick={() => onChangeQuantity(productId, -1)}
                >
                  −
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label={`Agregar una unidad de ${product.name}`}
                  onClick={() => onChangeQuantity(productId, 1)}
                >
                  +
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="total-carrito">Total: <strong>{formatPrice(total)}</strong></p>
      <button id="continuar-pedido" type="button" disabled={itemCount === 0} onClick={continueToOrder}>
        Continuar al pedido
      </button>
      <p id="estado-carrito" role="status" aria-live="polite">{status}</p>
    </section>
  )
}

function About() {
  return (
    <section id="nosotros">
      <h2>Sobre nosotros</h2>
      <p>
        Somos un emprendimiento dedicado a la elaboración y venta de bolos
        refrescantes en la ciudad de Guayaquil, Ecuador.
      </p>
      <p>
        Nuestro objetivo es ofrecer productos deliciosos y refrescantes,
        ideales para disfrutar durante los días calurosos de la ciudad.
      </p>
      <h3>¿Por qué elegir nuestros bolos?</h3>
      <ul>
        <li>Productos refrescantes.</li>
        <li>Variedad de sabores.</li>
        <li>Ingredientes de calidad.</li>
        <li>Precios accesibles.</li>
        <li>Ideales para todas las edades.</li>
      </ul>
    </section>
  )
}

function Location() {
  return (
    <section id="ubicacion">
      <h2>Encuéntranos en Guayaquil</h2>
      <p>Estamos ubicados en la ciudad de Guayaquil, Ecuador.</p>
      <address className="ubicacion">
        <p><strong>Dirección:</strong> Ismael Perez Pazmiño</p>
        <p><strong>Teléfono:</strong> <a href="tel:+593958947180">+593 95 894 7180</a></p>
        <p><strong>Horario:</strong> Lunes a sábado, de 09:00 a 18:00</p>
      </address>
    </section>
  )
}

function parseSavedCart(value, products) {
  if (!value) return { cart: new Map(), unavailableProduct: false }
  const entries = JSON.parse(value)
  if (!Array.isArray(entries)) {
    throw new Error('El contenido guardado no tiene el formato esperado.')
  }

  const cart = new Map()
  let unavailableProduct = false
  entries.forEach((entry) => {
    if (
      !Array.isArray(entry) ||
      typeof entry[0] !== 'string' ||
      !Number.isSafeInteger(entry[1]) ||
      entry[1] < 1
    ) {
      console.error('Se omitió un producto con datos no válidos del carrito guardado.')
      return
    }
    if (products.some((product) => product._id === entry[0])) {
      cart.set(entry[0], entry[1])
    } else {
      unavailableProduct = true
    }
  })
  return { cart, unavailableProduct }
}

function ElfsightChatbot() {
  useEffect(() => {
    if (document.getElementById('elfsight-platform-script')) return
    const script = document.createElement('script')
    script.id = 'elfsight-platform-script'
    script.src = 'https://elfsightcdn.com/platform.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  return <div className="elfsight-app-e8905360-eea2-462d-97f2-d696e4a2b1ca" data-elfsight-app-lazy />
}

function HomePage() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(new Map())
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [cartStatus, setCartStatus] = useState('')

  useEffect(() => {
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      })
      : null
    const sections = document.querySelectorAll('section')
    if (observer) {
      sections.forEach((section) => observer.observe(section))
    } else {
      sections.forEach((section) => section.classList.add('visible'))
    }
    return () => observer?.disconnect()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadCatalog() {
      try {
        const response = await fetch('/api/productos', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`El servidor respondió con estado ${response.status}`)
        }
        const catalog = await response.json()
        setProducts(catalog)
        try {
          const restored = parseSavedCart(localStorage.getItem(CART_STORAGE_KEY), catalog)
          setCart(restored.cart)
          if (restored.unavailableProduct) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.from(restored.cart.entries())))
            setCartStatus('Se actualizaron los productos del carrito porque algunos ya no están disponibles.')
          }
        } catch (error) {
          console.error('No se pudo recuperar el carrito guardado:', error)
          setCartStatus('No se pudo recuperar el carrito guardado. Puedes volver a agregar tus productos.')
        }
        setCatalogLoaded(true)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('No se pudo cargar el catálogo:', error)
        }
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false)
      }
    }
    loadCatalog()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    function syncCart(event) {
      if (event.key !== CART_STORAGE_KEY || !catalogLoaded) return
      try {
        const restored = parseSavedCart(event.newValue, products)
        setCart(restored.cart)
        if (restored.unavailableProduct) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.from(restored.cart.entries())))
          setCartStatus('Se actualizaron los productos del carrito porque algunos ya no están disponibles.')
        }
      } catch (error) {
        console.error('No se pudo recuperar el carrito guardado:', error)
        setCartStatus('No se pudo recuperar el carrito guardado. Puedes volver a agregar tus productos.')
      }
    }
    window.addEventListener('storage', syncCart)
    return () => window.removeEventListener('storage', syncCart)
  }, [catalogLoaded, products])

  function changeQuantity(productId, difference, statusMessage) {
    if (!productId) {
      setCartStatus(statusMessage)
      return
    }
    const nextCart = new Map(cart)
    const nextQuantity = (nextCart.get(productId) || 0) + difference
    if (nextQuantity <= 0) {
      nextCart.delete(productId)
    } else {
      nextCart.set(productId, nextQuantity)
    }
    setCart(nextCart)
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.from(nextCart.entries())))
      setCartStatus('')
    } catch (error) {
      console.error('No se pudo guardar el carrito en este navegador:', error)
      setCartStatus('No se pudo guardar el carrito en este navegador. El pedido se conservará mientras esta página siga abierta.')
    }
  }

  const itemCount = Array.from(cart.values()).reduce((sum, quantity) => sum + quantity, 0)

  return (
    <>
      <Header cartCount={itemCount} />
      <main>
        <HomeHero />
        <ProductCatalog products={products} loading={catalogLoading} onAdd={changeQuantity} />
        <Cart
          cart={cart}
          products={products}
          status={cartStatus}
          onChangeQuantity={changeQuantity}
          onContinueError={setCartStatus}
        />
        <About />
        <Location />
      </main>
      <Footer showQuestions />
      <ElfsightChatbot />
    </>
  )
}

function parseOrderItems(value) {
  if (!value) return []
  const entries = JSON.parse(value)
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('El pedido está vacío o no es válido.')
  }
  return entries.map((entry) => {
    if (
      !Array.isArray(entry) ||
      typeof entry[0] !== 'string' ||
      !Number.isSafeInteger(entry[1]) ||
      entry[1] < 1
    ) {
      throw new Error('El pedido contiene cantidades no válidas.')
    }
    return [entry[0], entry[1]]
  })
}

function OrderPage() {
  const [order, setOrder] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    async function loadOrder() {
      let orderItems
      try {
        orderItems = parseOrderItems(new URLSearchParams(window.location.search).get('items'))
      } catch (error) {
        setStatus(error.message)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/productos', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`El servidor respondió con estado ${response.status}`)
        }
        const catalog = await response.json()
        const selectedProducts = orderItems.map(([productId, quantity]) => {
          const product = catalog.find((item) => item._id === productId)
          if (!product) {
            throw new Error('Uno de los sabores del pedido ya no está disponible. Vuelve al catálogo para actualizarlo.')
          }
          return { product, quantity }
        })
        setOrder(selectedProducts)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('No se pudo preparar el pedido:', error)
          setStatus(error.message || 'No se pudo cargar el pedido. Inténtalo de nuevo.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadOrder()
    return () => controller.abort()
  }, [])

  function submitOrder(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const total = order.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
    const message = [
      'Hola, deseo coordinar el siguiente pedido:',
      '',
      `Nombre: ${formData.get('nombre')}.`,
      formData.get('telefono') ? `Teléfono de contacto: ${formData.get('telefono')}.` : '',
      formData.get('correo') ? `Correo electrónico: ${formData.get('correo')}.` : '',
      '',
      'Productos solicitados:',
      ...order.map(({ product, quantity }) => `Bolo de ${product.name} — cantidad: ${quantity}`),
      `Total del pedido: ${formatPrice(total)}.`,
      formData.get('indicaciones') ? `Indicaciones: ${formData.get('indicaciones')}.` : '',
      '',
      'Agradezco confirmar disponibilidad y detalles de entrega.',
    ].filter((line) => line !== '')
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message.join('\n'))}`
    const whatsappWindow = window.open(whatsappUrl, '_blank')
    if (!whatsappWindow) {
      setStatus('Tu navegador bloqueó WhatsApp. Permite las ventanas emergentes e inténtalo de nuevo.')
      return
    }
    whatsappWindow.opener = null
    setStatus('')
  }

  const total = order.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)

  return (
    <>
      <Header orderPage />
      <main>
        <div className="pagina-pedido">
          <h2>Completa tu pedido</h2>
          <p>Revisa el resumen y déjanos tus datos. Confirmaremos los detalles por WhatsApp.</p>
          {status && <div className="mensaje-error" id="estado-pedido" role="status" aria-live="polite">{status}</div>}
          {loading && <p role="status">Cargando tu pedido...</p>}
          {!loading && order.length > 0 && (
            <>
              <div className="resumen-pedido">
                <h3>Resumen de tu pedido</h3>
                <ul className="lista-carrito">
                  {order.map(({ product, quantity }, index) => (
                    <li className="pedido-item" key={`${product._id}-${index}`}>
                      Bolo de {product.name} — {quantity} × {formatPrice(product.price)}: {formatPrice(product.price * quantity)}
                    </li>
                  ))}
                </ul>
                <p className="total-carrito">Total del pedido: <strong>{formatPrice(total)}</strong></p>
              </div>
              <form id="formulario-pedido" onSubmit={submitOrder}>
                <div>
                  <label htmlFor="nombre">Nombre completo:</label>
                  <input type="text" id="nombre" name="nombre" autoComplete="name" required />
                </div>
                <div>
                  <label htmlFor="correo">Correo electrónico:</label>
                  <input type="email" id="correo" name="correo" autoComplete="email" placeholder="ejemplo@correo.com" required />
                </div>
                <div>
                  <label htmlFor="telefono">Teléfono de contacto (máximo 10 dígitos):</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    inputMode="numeric"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    autoComplete="tel"
                    placeholder="0999999999"
                  />
                </div>
                <div>
                  <label htmlFor="indicaciones">Indicaciones adicionales (opcional):</label>
                  <textarea id="indicaciones" name="indicaciones" rows="3" placeholder="Por ejemplo, referencias para coordinar la entrega" />
                </div>
                <button type="submit">Continuar por WhatsApp</button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const isOrderPage = window.location.pathname === '/pedido.html' || window.location.pathname === '/pedido'
  return isOrderPage ? <OrderPage /> : <HomePage />
}
