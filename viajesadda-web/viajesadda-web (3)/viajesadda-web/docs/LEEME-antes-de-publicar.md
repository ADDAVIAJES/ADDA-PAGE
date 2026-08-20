# ViajesADDA — Guía para publicar en Vercel

## Qué contiene esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página completa. Todo el CSS y el JavaScript van adentro, no hay archivos sueltos que se puedan perder. |
| `cartagena.jpg` | Tu foto del centro histórico, optimizada de 332 KB a 285 KB y redimensionada a 1400 px. |
| `LEEME-antes-de-publicar.md` | Este documento. No lo subas a Vercel si no quieres — no afecta nada. |

---

## PASO OBLIGATORIO ANTES DE PUBLICAR: activar el formulario

Ahora mismo el formulario **no envía nada**. Está esperando que le pegues tu código de Formspree.
Si publicas sin hacer esto, alguien llenará el formulario, verá el mensaje de "gracias", y tú nunca te enterarás.

### Por qué Formspree y no otra cosa

Vercel no tiene manejo de formularios incluido (Netlify sí, por eso el archivo anterior lo usaba —
pero ese código en Vercel no hace absolutamente nada). Las opciones reales son:

- **Formspree** — gratis hasta 50 mensajes/mes, sin escribir código. Es lo que dejé configurado.
- **Web3Forms** — gratis ilimitado, funciona igual. Alternativa válida.
- **Función serverless en Vercel** — más control, pero requiere programar.

Para el volumen de una landing de captación en etapa piloto, 50 mensajes al mes sobra.

### Cómo activarlo (5 minutos)

1. Entra a **https://formspree.io** y crea una cuenta gratuita con `addacommunity@viajesadda.com`.
2. Crea un formulario nuevo. Ponle de nombre `ViajesADDA Landing`.
3. Formspree te dará una dirección así: `https://formspree.io/f/xayzabcd`
   El código del final (`xayzabcd`) es tu ID.
4. Abre `index.html` con el Bloc de notas o VS Code. Busca (Ctrl+F) el texto:

   ```
   TU_ID_DE_FORMSPREE
   ```

5. Reemplázalo por tu ID. Debe quedar así:

   ```html
   action="https://formspree.io/f/xayzabcd"
   ```

6. Guarda el archivo.
7. **Formspree te pedirá confirmar tu correo la primera vez.** Envíate un mensaje de prueba
   desde tu propia página y confirma el enlace que te llegue. Hasta que no lo hagas,
   los mensajes no se entregan.

---

## Publicar en Vercel

### Opción A — Arrastrar y soltar (la más rápida, sin instalar nada)

1. Entra a **https://vercel.com** y crea cuenta (puedes usar tu correo o tu cuenta de GitHub).
2. En el panel, busca el botón **Add New → Project**.
3. Busca la opción de despliegue por carpeta y **arrastra la carpeta completa** que contiene
   `index.html` y `cartagena.jpg`.
4. Vercel te dará una dirección tipo `viajesadda.vercel.app` en menos de un minuto.

Limitación: cada vez que cambies algo tendrás que volver a arrastrar la carpeta.

### Opción B — Conectada a GitHub (recomendada a mediano plazo)

Con esta opción, cada vez que cambies el archivo y lo subas a GitHub, Vercel republica sola.
Vale la pena si vas a editar la página con frecuencia.

1. Crea cuenta en **https://github.com**.
2. Crea un repositorio nuevo llamado `viajesadda-web`. Márcalo como público o privado, da igual.
3. Sube `index.html` y `cartagena.jpg` con el botón **Add file → Upload files**.
4. En Vercel: **Add New → Project → Import Git Repository** y selecciona `viajesadda-web`.
5. No cambies ninguna configuración. Es un sitio estático, Vercel lo detecta solo.
6. Presiona **Deploy**.

### Conectar tu dominio viajesadda.com

1. En Vercel, entra a tu proyecto → **Settings → Domains**.
2. Escribe `viajesadda.com` y presiona **Add**.
3. Vercel te mostrará unos registros DNS. Cópialos.
4. Entra donde compraste el dominio (GoDaddy, Namecheap, etc.) y pega esos registros
   en la zona DNS.
5. La propagación tarda entre 10 minutos y 48 horas. Normalmente menos de una hora.

Nota: los enlaces de redes sociales dentro de la página usan `https://www.viajesadda.com/`
como dirección oficial. Si terminas usando otro dominio, busca `viajesadda.com` en el
`index.html` y cámbialo — aparece en las etiquetas `canonical` y `og:`.

---

## Qué cambió respecto a lo que tenías

### Corregido

- **El archivo de deploy anterior estaba truncado.** Se cortaba en `var open=ite`, lo que rompía
  todo el JavaScript. Consecuencia: las secciones Approach, Pillars, Personas, Where We Go,
  Journeys, Testimonios, FAQ y Contacto habrían quedado **invisibles** en el sitio publicado,
  porque el CSS las mantiene en `opacity:0` hasta que el JavaScript las revela.
  Esta versión está completa y verificada.
- **Formulario de Netlify → formulario funcional.** El anterior no habría funcionado en Vercel.
- **Teléfono sin indicativo de país.** Decía `+321 760 4505`. Un canadiense o un europeo que
  tocara ese botón no te habría llamado nunca. Ahora es `+57 321 760 4505`.
- **Correo unificado.** Tenías `adda@` en una versión y `addacommunity@` en otra. Quedó
  `addacommunity@viajesadda.com` en los 5 lugares donde aparece. **Verifica que sea el correcto.**
- **El FAQ cortaba las respuestas largas** a 220 px de alto. Ahora caben completas.

### Agregado

- **Un `<h1>`.** La página no tenía ningún encabezado principal — ni uno. Para Google eso
  significa que no sabía de qué trataba el sitio. El texto que puse es provisional:
  *"Colombia, at the pace you actually want"*. Cámbialo por lo que se ajuste a tu voz de marca.
- **Meta description, Open Graph y favicon.** Antes, compartir el enlace en WhatsApp o LinkedIn
  mostraba una tarjeta vacía sin imagen ni descripción.
- **Menú móvil.** Los 5 enlaces del nav se apilaban en fila hasta en pantallas de teléfono.
  Ahora hay un botón de menú desplegable.
- **Los `hero-stats` ya no se montan sobre el texto en móvil.** Estaban posicionados en absoluto.
- **Tamaños de letra mínimos en móvil.** Nada de texto por debajo de 15 px en el cuerpo.
  Tu público tiene 50+ años; esto no es un detalle estético.
- **Red de seguridad para las animaciones.** Si el `IntersectionObserver` falla por cualquier
  razón, un temporizador revela el contenido igual. La página nunca se queda en blanco.
- **Anti-spam en el formulario** (campo trampa invisible para humanos).
- **Tu foto de Cartagena** reemplaza una imagen de stock de Unsplash en la sección Approach.

---

## Pendientes que quedaron sin resolver

Estos no los toqué porque son decisiones tuyas, no técnicas:

1. **Quedan 6 imágenes de Unsplash** en la galería. Son fotos genéricas de stock, cargadas desde
   un servidor externo. Para una marca cuyo argumento central es *"comunidades reales, no
   escenarios montados"*, usar stock es una contradicción que un comprador atento detecta.
   Reemplázalas por fotos tuyas de los viajes reales apenas las tengas.

2. **Los tres viajes cuestan exactamente lo mismo** — `$1,400–$1,800 USD`, misma duración,
   misma descripción de "6 o 9 días". Si Cartagena, el Eje Cafetero y Medellín valen igual,
   el precio deja de ser información útil y el visitante no tiene con qué decidir entre ellos.

3. **La página está solo en inglés.** Coherente si tu mercado es Canadá, EE.UU. y Europa.
   Solo tenlo consciente como decisión y no como omisión.

4. **No hay política de privacidad.** Si vas a captar datos personales de residentes europeos,
   el RGPD lo exige. Vale la pena resolverlo antes de hacer campañas pagas hacia Europa.
