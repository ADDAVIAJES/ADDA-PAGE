# PENDIENTE: crear privacy-policy.html

## Estado actual

`privacy-policy.html` **NO existe** en el proyecto.

No lo genere a proposito. Tus instrucciones fueron claras: no inventar una politica
legal, y estoy de acuerdo — una politica de privacidad contiene datos que solo tu
puedes aportar y que no aparecen en ningun archivo del proyecto.

## Que pasa mientras tanto

El formulario ya enlaza a `/privacy-policy.html` desde la casilla de consentimiento.
Como el archivo no existe, ese enlace devuelve **404** en Vercel.

Consecuencia practica: tus visitantes marcan una casilla que remite a una pagina
que no esta. Bajo el RGPD, un consentimiento cuya informacion no puede consultarse
es discutible.

## Datos que solo tu puedes aportar

Cuando quieras que armemos la pagina, necesito de ti:

1. **Responsable del tratamiento** — nombre legal completo o razon social.
2. **Direccion fisica** registrada.
3. **Correo de contacto** para ejercicio de derechos.
4. **Plazo de conservacion** de los datos de contacto.
5. **Encargados del tratamiento** — herramientas por las que pasan los datos.
   Hasta donde se por el codigo actual: Formspree y Microsoft Bookings.
   Si usas ademas un CRM o gestor de correo, hay que listarlo.
6. **Transferencias internacionales** — Formspree y Microsoft alojan datos fuera de
   la UE; esto se declara explicitamente.
7. **Base juridica** del tratamiento (previsiblemente consentimiento).

## Donde colocarlo

En la **raiz** del proyecto, junto a `index.html`:

```
viajesadda-web/
├── index.html
├── privacy-policy.html   <-- aqui
```

Asi la ruta `/privacy-policy.html` que ya esta en el enlace resuelve correctamente
en Vercel sin tocar nada mas.
