# Sparkle Spend

Quiero crear una aplicación web de finanzas personales para visualizar y gestionar mis gastos de todo el año.

IMPORTANTE:
La aplicación debe sentirse como una app moderna de lifestyle/fintech, no como un dashboard financiero corporativo tradicional.

Usa la imagen de referencia adjunta como inspiración visual para la estética general, composición, colores, cards, tipografía, navegación, formas y sensación mobile-first.

NO copies literalmente el diseño de la imagen. Crea una identidad visual original inspirada en sus principios.

==================================================
1. OBJETIVO DE LA APLICACIÓN
==================================================

La aplicación debe permitirme:

1. Visualizar dashboards con un resumen de mis gastos del año.
2. Analizar mis gastos mediante gráficos y filtros.
3. Consultar todos mis gastos históricos.
4. Crear, editar y eliminar gastos únicamente durante el mes calendario actual.
5. Mantener los gastos de meses anteriores en modo histórico/solo lectura.
6. Filtrar y explorar mis gastos fácilmente.
7. Ver cuánto he gastado, en qué categorías y mediante qué métodos de pago.
8. Identificar cuánto dinero es potencialmente reembolsable.

La experiencia debe ser simple, visual, divertida y agradable de usar.

La aplicación debe funcionar perfectamente tanto en mobile como en desktop, pero debe diseñarse con una filosofía Mobile First.

==================================================
2. ESTILO VISUAL
==================================================

La frase principal de diseño es:

"Finance doesn't have to look boring."

NO quiero un dashboard financiero genérico con fondo blanco, tablas grises y cards corporativas.

Quiero una UI:

- Divertida
- Moderna
- Fresh
- Premium
- Playful
- Visual
- Colorida pero sofisticada
- Muy fácil de entender
- Con personalidad

Toma como referencia visual la imagen adjunta.

Inspiración:

- Cards grandes y redondeadas.
- Colores pastel.
- Formas orgánicas.
- Fondos suaves.
- Tipografía grande y expresiva.
- Mucho espacio visual.
- Elementos de alto contraste.
- Navegación tipo aplicación móvil.
- Microinteracciones.
- Composición dinámica.
- Sensación de app premium.

No utilizar demasiados colores al mismo tiempo.

==================================================
3. PALETA DE COLORES
==================================================

Utilizar una paleta pastel moderna.

Colores principales:

- Amarillo pastel
- Rosa pastel
- Lila
- Azul lavanda
- Verde menta
- Crema / off-white
- Negro o carbón para textos importantes

Los colores pueden utilizarse para diferenciar categorías.

Ejemplo:

Alimentación → amarillo
Transporte → azul
Vivienda → lila
Entretenimiento → rosa
Viajes → verde
Compras → naranja
Servicios → azul claro
Salud → rojo/rosa suave

Los colores deben mantener suficiente contraste para garantizar buena accesibilidad.

La interfaz debe sentirse divertida pero sofisticada, no infantil.

==================================================
4. ESTRUCTURA DE LA APLICACIÓN
==================================================

Crear las siguientes secciones:

1. Home / Dashboard
2. Gastos
3. Insights
4. Configuración / Perfil

En desktop utilizar un sidebar moderno.

En mobile utilizar una navegación inferior estilo aplicación:

Home | Gastos | Insights | Perfil

Agregar un botón "+" prominente para crear rápidamente un nuevo gasto.


==================================================
5. BASE DE DATOS TEMPORAL — GOOGLE SHEETS
==================================================

IMPORTANTE:

Por ahora NO utilizar Supabase como base de datos.

Quiero utilizar Google Sheets como backend/base de datos temporal de la aplicación.

La aplicación debe leer y escribir los gastos directamente en Google Sheets mediante una integración segura.

Google Sheets será una solución temporal para esta primera versión.

La arquitectura del código debe mantenerse modular para que posteriormente pueda reemplazar Google Sheets por Supabase, PostgreSQL u otra base de datos sin tener que reconstruir toda la aplicación.

NO guardar los gastos únicamente en localStorage.

Los datos deben persistir en Google Sheets.

==================================================
6. ESTRUCTURA DE GOOGLE SHEETS
==================================================

Utilizar una hoja llamada:

Expenses

Las columnas deben ser:

| ID | User ID | Fecha | Método de pago | Categoría | Moneda | Descripción | Monto | Monto Reembolsable | Created At | Updated At |

Ejemplo:

ID:
EXP-00001

User ID:
usuario@example.com

Fecha:
2026-08-05

Método de pago:
Tarjeta de crédito

Categoría:
Alimentación

Moneda:
PEN

Descripción:
Almuerzo

Monto:
45.50

Monto Reembolsable:
0

Created At:
2026-08-05 14:30:00

Updated At:
2026-08-05 14:30:00

==================================================
7. INTEGRACIÓN CON GOOGLE SHEETS
==================================================

Crear una capa de servicios separada para la comunicación con Google Sheets.

Por ejemplo:

services/
  expensesService.ts
  googleSheetsService.ts

La UI NO debe comunicarse directamente con Google Sheets.

Utilizar funciones como:

getExpenses()
createExpense()
updateExpense()
deleteExpense()

De esta manera, si posteriormente cambiamos Google Sheets por Supabase, solamente tendremos que reemplazar la capa de servicios.

==================================================
8. AUTENTICACIÓN
==================================================

Para esta primera versión, utilizar Google Authentication si está disponible y es sencillo de implementar.

Cada gasto debe tener asociado un User ID.

El User ID puede ser el email o identificador único proporcionado por Google Authentication.

La aplicación debe filtrar los gastos utilizando ese identificador.

Un usuario únicamente debe visualizar sus propios gastos.

IMPORTANTE:

No confiar exclusivamente en filtros del frontend para la seguridad.

Si Google Sheets se utiliza mediante Google Apps Script, implementar la validación correspondiente en el backend/script.

==================================================
9. GOOGLE APPS SCRIPT
==================================================

Preferentemente utilizar Google Apps Script como capa intermedia entre la aplicación y Google Sheets.

La arquitectura debería ser:

Lovable App
     ↓
Google Apps Script API
     ↓
Google Sheets

NO exponer credenciales privadas de Google Sheets dentro del frontend.

El frontend debe comunicarse con un endpoint/API proporcionado por Google Apps Script.

Crear endpoints o acciones equivalentes para:

GET expenses
POST expense
PUT expense
DELETE expense

La capa de Google Apps Script debe validar:

- Usuario.
- ID del gasto.
- Operación solicitada.
- Permisos de edición.
- Fecha del gasto.

==================================================
10. REGLA DE EDICIÓN
==================================================

Esta regla debe implementarse también en Google Apps Script.

Los gastos del mes actual pueden:

- Crear
- Editar
- Eliminar

Los gastos de meses anteriores:

- Leer
- NO editar
- NO eliminar

Ejemplo:

Si estamos en agosto de 2026:

Agosto 2026:
✓ Crear
✓ Editar
✓ Eliminar

Julio 2026 y anteriores:
✓ Leer
✕ Editar
✕ Eliminar

La validación debe realizarse en el backend de Google Apps Script y no solamente en React.

Aunque un usuario intente llamar directamente al endpoint para modificar un gasto histórico, la operación debe ser rechazada.

==================================================
11. CRUD CON GOOGLE SHEETS
==================================================

Implementar:

GET:
Obtener los gastos del usuario.

POST:
Crear un nuevo gasto.

PUT:
Actualizar un gasto del mes actual.

DELETE:
Eliminar un gasto del mes actual.

Después de cada operación:

- Actualizar la interfaz.
- Actualizar KPIs.
- Actualizar gráficos.
- Actualizar insights.

No requerir refresh manual de la página.

==================================================
12. MANEJO DE ERRORES
==================================================

Si Google Sheets o Google Apps Script no están disponibles:

Mostrar un mensaje amigable:

"No pudimos conectar con tus gastos. Inténtalo nuevamente."

Implementar:

- Loading state.
- Error state.
- Retry.
- Toast de error.

No mostrar errores técnicos directamente al usuario.

==================================================
13. DATOS DE EJEMPLO
==================================================

Utilizar Google Sheets como fuente de datos.

Crear algunos registros de ejemplo en la hoja Expenses para probar:

- Dashboard.
- Filtros.
- Gráficos.
- CRUD.
- Multimoneda.
- Gastos históricos.
- Gastos del mes actual.

Los datos demo deben estar correctamente asociados a un usuario.

==================================================
14. MIGRACIÓN FUTURA
==================================================

IMPORTANTE:

Google Sheets es solamente el backend temporal.

No acoplar la aplicación directamente a la estructura interna de Google Sheets.

Crear una interfaz abstracta para el acceso a datos.

Por ejemplo:

ExpenseRepository

con métodos:

getExpenses()
createExpense()
updateExpense()
deleteExpense()

La implementación actual será:

GoogleSheetsExpenseRepository

En el futuro podremos crear:

SupabaseExpenseRepository

sin tener que modificar los componentes del dashboard, tabla o formularios.

La UI debe desconocer si los datos vienen de Google Sheets, Supabase o cualquier otra base de datos.

==================================================
15. SEGURIDAD
==================================================

NO colocar:

- API keys privadas.
- Service account credentials.
- Google Sheet credentials.
- Client secrets.

directamente en el frontend.

Toda credencial sensible debe permanecer en Google Apps Script o en variables de entorno/servidor cuando corresponda.

El frontend únicamente debe conocer el endpoint necesario para comunicarse con el backend.

==================================================
16. ESTRUCTURA RECOMENDADA
==================================================

Organizar el proyecto aproximadamente así:

src/
  components/
    dashboard/
    expenses/
    navigation/
    charts/
    ui/

  pages/
    Dashboard
    Expenses
    Insights
    Settings

  services/
    expensesService
    googleSheetsService

  hooks/
    useExpenses
    useDashboard

  types/
    expense.ts

  utils/
    dateUtils
    currencyUtils
    expenseUtils

La lógica de Google Sheets debe estar aislada.

==================================================
17. IMPORTANTE SOBRE LA ARQUITECTURA
==================================================

Aunque Google Sheets sea la base de datos temporal, quiero que la aplicación tenga una arquitectura suficientemente limpia para poder migrar posteriormente a una base de datos real.

No construir una solución rápida donde los componentes React hagan directamente fetch a Google Sheets desde diferentes lugares.

Centralizar toda la comunicación mediante el repository/service layer.

La aplicación debe tratar Google Sheets como una API/backend, no como un archivo que manipula directamente.

==================================================
18. RESULTADO
==================================================

El resultado debe ser:

React
TypeScript
Tailwind CSS
Recharts
Google Authentication
Google Apps Script
Google Sheets

Arquitectura:

Frontend
↓
Service / Repository Layer
↓
Google Apps Script
↓
Google Sheets

Posteriormente:

Frontend
↓
Service / Repository Layer
↓
Supabase / PostgreSQL

La migración futura debe requerir principalmente reemplazar la implementación del repository, sin reconstruir la UI.
==================================================
7. REGLA MÁS IMPORTANTE DEL CRUD
==================================================

Los gastos del mes actual pueden modificarse.

Los gastos de meses anteriores son únicamente históricos y no pueden modificarse.

Ejemplo:

Si estamos en agosto de 2026:

Agosto 2026:
- Crear permitido
- Editar permitido
- Eliminar permitido

Julio 2026 o anteriores:
- Leer permitido
- Editar NO permitido
- Eliminar NO permitido

Esta regla debe calcularse dinámicamente.

NO hardcodear el mes actual.

Debe funcionar automáticamente cada vez que cambie el mes.

IMPORTANTE:

La restricción debe existir tanto en frontend como en backend/database.

Implementar las políticas RLS o mecanismos equivalentes para impedir que un usuario pueda modificar o eliminar un gasto histórico directamente mediante una llamada a la API.

==================================================
8. TABLA DE GASTOS
==================================================

La página "Gastos" debe mostrar una tabla con:

| Fecha | Método de pago | Categoría | Moneda | Descripción | Monto Reembolsable |

También se puede mostrar "Monto" si es necesario.

Características:

- Ordenar por fecha.
- Ordenar por monto.
- Buscar por descripción.
- Filtrar por categoría.
- Filtrar por método de pago.
- Filtrar por moneda.
- Filtrar por rango de fechas.
- Paginación.
- Mostrar cantidad de resultados.
- Mostrar totales del conjunto filtrado.

Los filtros deben funcionar realmente con los datos de Supabase.

==================================================
9. ESTADO DE LOS GASTOS
==================================================

Los gastos del mes actual deben mostrar acciones:

Editar
Eliminar

Los gastos históricos deben ser claramente identificables como:

Histórico / Solo lectura

No mostrar botones de editar/eliminar para gastos históricos.

Si se considera útil, mostrar un pequeño icono de candado para indicar que están bloqueados.

Ejemplo:

🔒 Histórico

==================================================
10. CREAR Y EDITAR GASTOS
==================================================

Crear un modal o pantalla de formulario moderna.

Campos:

- Fecha
- Método de pago
- Categoría
- Moneda
- Descripción
- Monto
- Monto Reembolsable

El formulario debe tener excelente UX.

Método de pago:

- Tarjeta de crédito
- Tarjeta de débito
- Efectivo
- Transferencia
- Otro

Categorías:

- Alimentación
- Transporte
- Vivienda
- Entretenimiento
- Compras
- Salud
- Viajes
- Servicios
- Educación
- Otros

Monedas iniciales:

- PEN
- USD
- EUR

La arquitectura debe permitir agregar más monedas posteriormente.

==================================================
11. VALIDACIONES
==================================================

Validar:

- Fecha obligatoria.
- Método de pago obligatorio.
- Categoría obligatoria.
- Moneda obligatoria.
- Monto >= 0.
- Monto reembolsable >= 0.
- Monto reembolsable <= monto total.
- Descripción opcional.

No permitir crear gastos con fechas de meses anteriores.

Si el usuario intenta hacerlo, mostrar:

"Solo puedes registrar gastos del mes actual."

No permitir modificar un gasto histórico.

Mostrar un mensaje claro:

"Este gasto pertenece a un periodo cerrado y es solo de lectura."

==================================================
12. DASHBOARD PRINCIPAL
==================================================

Crear un dashboard muy visual.

El dashboard debe responder rápidamente:

- ¿Cuánto he gastado?
- ¿En qué he gastado?
- ¿Cómo ha evolucionado mi gasto?
- ¿Cuál es mi categoría principal?
- ¿Cuánto me deben reembolsar?
- ¿Qué método de pago utilizo más?

El dashboard debe sentirse más como una aplicación de lifestyle que como un Excel financiero.

==================================================
13. HEADER DEL DASHBOARD
==================================================

Crear un header amigable.

Ejemplo:

"Hola 👋"

"Veamos en qué se fue tu dinero."

O:

"Tu año en gastos ✨"

Mostrar debajo una breve descripción.

Evitar lenguaje excesivamente corporativo.

==================================================
14. FILTROS GLOBALES
==================================================

Crear un panel de filtros.

Filtros:

- Año
- Mes
- Rango de fechas
- Categoría
- Método de pago
- Moneda
- Reembolsable / No reembolsable

Agregar:

"Limpiar filtros"

Todos los KPIs y gráficos deben actualizarse automáticamente al cambiar los filtros.

==================================================
15. KPIs
==================================================

Mostrar cards visuales para:

1. Gasto total
2. Gasto promedio
3. Número de gastos
4. Monto reembolsable
5. Gasto del mes

Ejemplo visual:

💸
Total gastado

$24,350

+12.4% vs. periodo anterior

Las cards deben utilizar colores pastel y elementos gráficos pequeños.

No hacer simplemente cards blancas tradicionales.

==================================================
16. IMPORTANTE: MULTIMONEDA
==================================================

Los gastos pueden estar en diferentes monedas.

Por ejemplo:

PEN
USD
EUR

NO sumar diferentes monedas como si fueran equivalentes.

Si el usuario tiene:

PEN 5,000
USD 1,200
EUR 500

mostrar los totales separados por moneda.

Por ejemplo:

PEN
S/ 5,000

USD
$1,200

EUR
€500

No hacer conversiones automáticas.

En el futuro se podría agregar una funcionalidad de conversión de moneda, pero NO implementarla ahora.

==================================================
17. GRÁFICO: GASTOS POR MES
==================================================

Crear un gráfico moderno de barras o línea.

Mostrar:

Enero
Febrero
Marzo
...
Diciembre

Debe permitir identificar rápidamente qué meses tuvieron mayor gasto.

Animar suavemente el gráfico al cargar.

==================================================
18. GRÁFICO: GASTOS POR CATEGORÍA
==================================================

Crear un gráfico visual tipo donut.

Mostrar:

- Alimentación
- Transporte
- Vivienda
- Entretenimiento
- Compras
- Salud
- Viajes
- Servicios
- Educación
- Otros

Utilizar colores pastel.

Mostrar porcentaje y monto.

==================================================
19. GRÁFICO: MÉTODO DE PAGO
==================================================

Mostrar cuánto gasto mediante:

- Tarjeta de crédito
- Tarjeta de débito
- Efectivo
- Transferencia
- Otros

Puede utilizarse un bar chart horizontal o donut chart.

==================================================
20. GRÁFICO: MONEDA
==================================================

Mostrar distribución de gastos por moneda.

Ejemplo:

PEN 65%
USD 25%
EUR 10%

No mezclar valores monetarios de distintas monedas.

==================================================
21. EVOLUCIÓN DEL GASTO
==================================================

Crear una gráfica que muestre la evolución del gasto durante el año.

Debe ser visual y fácil de interpretar.

Permitir cambiar entre:

- Año completo
- Mes
- Periodo personalizado

==================================================
22. INSIGHTS
==================================================

Crear una sección llamada:

"Insights 👀"

Generar observaciones dinámicas basadas en los datos.

Ejemplos:

"Tu categoría con mayor gasto este año es Alimentación."

"Agosto registra 18% más gasto que julio."

"El 32% de tus gastos son potencialmente reembolsables."

"Tu método de pago más utilizado es Tarjeta de crédito."

Los insights deben calcularse realmente usando los datos.

Nunca inventar información.

Si no hay suficientes datos, mostrar un mensaje apropiado.

==================================================
23. MICROCOPY
==================================================

Utilizar lenguaje amigable.

En lugar de:

"Resumen de gastos"

usar:

"¿En qué se fue tu dinero? 👀"

En lugar de:

"Gastos mensuales"

usar:

"Tu año en gastos 📊"

En lugar de:

"Monto reembolsable"

usar:

"Te deben 💰"

En lugar de:

"No hay registros"

usar:

"Todavía no hay gastos por aquí 🌱"

En lugar de:

"Agregar gasto"

usar:

"+ Agregar gasto"

El lenguaje debe sentirse casual, pero premium.

No abusar de emojis.

==================================================
24. CARDS DE CATEGORÍAS
==================================================

Crear cards visuales para las principales categorías.

Ejemplo:

🍜
Alimentación

S/ 4,250

24% de tus gastos

Otro ejemplo:

✈️
Viajes

$1,250

12% de tus gastos

Cada categoría puede tener un color pastel diferente.

Las cards deben tener:

- Border radius grande.
- Fondo pastel.
- Icono.
- Nombre.
- Monto.
- Porcentaje.
- Pequeña interacción hover.

==================================================
25. NAVEGACIÓN MOBILE
==================================================

En mobile quiero una experiencia parecida a una app nativa.

Bottom navigation:

Home
Gastos
Insights
Perfil

Agregar un botón central/flotante:

+

para crear un nuevo gasto.

El botón debe ser visualmente prominente.

==================================================
26. NAVEGACIÓN DESKTOP
==================================================

En desktop utilizar sidebar.

Elementos:

Logo / nombre de la app

Home
Gastos
Insights
Configuración

El sidebar debe mantener la identidad visual de la aplicación.

No hacerlo demasiado grande.

==================================================
27. RESPONSIVE DESIGN
==================================================

Diseñar Mobile First.

En mobile:

- Cards en una o dos columnas.
- Gráficos adaptados al ancho.
- Tabla con scroll horizontal.
- Formularios optimizados para touch.
- Bottom navigation.
- Botón "+" flotante.

En tablet:

- Grid flexible.
- Navegación adaptada.

En desktop:

- Sidebar.
- Dashboard en múltiples columnas.
- Tabla completa.
- Gráficos más grandes.

La aplicación NO debe parecer una página desktop comprimida en mobile.

Debe sentirse como una verdadera aplicación móvil.

==================================================
28. ANIMACIONES
==================================================

Agregar microinteracciones sutiles:

- Fade-in de cards.
- Animaciones de gráficos.
- Hover effects.
- Transiciones al cambiar filtros.
- Feedback al crear un gasto.
- Feedback al editar.
- Feedback al eliminar.
- Animación del botón "+".
- Transiciones suaves entre páginas.

No utilizar animaciones excesivas.

La aplicación debe sentirse rápida.

==================================================
29. ESTADOS DE LA APLICACIÓN
==================================================

Implementar correctamente:

Loading states
Empty states
Error states
Success states

Ejemplo de empty state:

"Tu historia financiera empieza aquí 🌱"

"Agrega tu primer gasto para comenzar a ver tus estadísticas."

Botón:

"+ Agregar gasto"

==================================================
30. TOASTS / NOTIFICACIONES
==================================================

Después de crear:

"¡Gasto agregado! ✨"

Después de editar:

"Gasto actualizado."

Después de eliminar:

"Gasto eliminado."

Después de un error:

"No pudimos guardar el gasto. Inténtalo nuevamente."

==================================================
31. CONFIRMACIÓN DE ELIMINACIÓN
==================================================

Antes de eliminar un gasto mostrar un modal.

Ejemplo:

"¿Eliminar este gasto?"

"Esta acción no se puede deshacer."

Botones:

Cancelar
Eliminar

El botón eliminar debe utilizar un color de advertencia.

==================================================
32. SEGURIDAD Y RLS
==================================================

Implementar Supabase Row Level Security.

Reglas:

SELECT:
Un usuario únicamente puede leer sus propios gastos.

INSERT:
Un usuario únicamente puede crear gastos asociados a su propio user_id.

UPDATE:
Un usuario únicamente puede modificar gastos propios cuyo date pertenezca al mes calendario actual.

DELETE:
Un usuario únicamente puede eliminar gastos propios cuyo date pertenezca al mes calendario actual.

Los gastos históricos deben ser únicamente de lectura.

IMPORTANTE:

No depender exclusivamente de JavaScript para estas restricciones.

La base de datos debe impedir las operaciones no permitidas.

==================================================
33. DATOS DE EJEMPLO
==================================================

Agregar datos de ejemplo para poder probar el dashboard.

Distribuir gastos durante diferentes meses.

Utilizar:

- Diferentes categorías.
- Diferentes métodos de pago.
- Diferentes monedas.
- Diferentes montos.
- Algunos gastos reembolsables.
- Algunos no reembolsables.

Los datos deben ser suficientemente variados para que los gráficos sean interesantes.

IMPORTANTE:

Los datos demo deben respetar las reglas de edición.

==================================================
34. COMPONENTES REUTILIZABLES
==================================================

Crear componentes reutilizables para:

- Sidebar
- Bottom Navigation
- Header
- KPI Card
- Category Card
- Filter Panel
- Expense Table
- Expense Form
- Expense Modal
- Chart Card
- Insights Card
- Empty State
- Loading State
- Confirmation Modal
- Toasts

Evitar duplicar lógica.

==================================================
35. TECNOLOGÍA
==================================================

Utilizar:

React
TypeScript
Tailwind CSS
Supabase
Recharts

Utilizar componentes reutilizables y una arquitectura limpia.

El código debe ser mantenible y escalable.

==================================================
36. UX DEL DASHBOARD
==================================================

Quiero que el usuario pueda abrir la aplicación y entender su situación financiera en pocos segundos.

La jerarquía visual debe ser:

1. ¿Cuánto gasté?
2. ¿Cómo voy respecto al periodo anterior?
3. ¿En qué categorías gasté?
4. ¿Cómo evolucionó mi gasto?
5. ¿Cuánto me deben?
6. ¿Qué insights puedo obtener?

No sobrecargar la pantalla.

Utilizar whitespace y jerarquía visual.

==================================================
37. DISEÑO DE LA TABLA
==================================================

Aunque la UI sea divertida, la tabla debe seguir siendo muy clara y funcional.

Columnas:

Fecha
Método de pago
Categoría
Moneda
Descripción
Monto
Monto Reembolsable
Estado

Estado puede ser:

"Editable"
"Histórico"

Los gastos editables pueden tener acciones:

✏️ Editar
🗑 Eliminar

Los históricos:

🔒 Histórico

Utilizar colores pastel para categorías.

==================================================
38. EXPERIENCIA AL CREAR UN GASTO
==================================================

El flujo debe ser muy rápido.

El usuario pulsa:

+

Se abre el formulario.

Completa:

Fecha
Categoría
Método de pago
Moneda
Descripción
Monto
Reembolsable

Pulsa:

"Guardar gasto"

Después:

1. Guardar en Supabase.
2. Mostrar toast.
3. Cerrar formulario.
4. Actualizar tabla.
5. Actualizar KPIs.
6. Actualizar gráficos.
7. Actualizar insights.

Todo sin necesidad de recargar la página.

==================================================
39. EXPERIENCIA AL EDITAR
==================================================

Al pulsar editar:

Abrir el mismo formulario.

Prellenar todos los valores actuales.

Permitir modificar únicamente si el gasto pertenece al mes actual.

Después de guardar:

- Actualizar Supabase.
- Actualizar UI.
- Actualizar gráficos.
- Actualizar KPIs.
- Mostrar confirmación.

==================================================
40. EXPERIENCIA AL ELIMINAR
==================================================

Al pulsar eliminar:

Mostrar confirmación.

Si confirma:

Eliminar de Supabase.

Actualizar inmediatamente:

- Tabla.
- KPIs.
- Gráficos.
- Insights.

==================================================
41. CONFIGURACIÓN
==================================================

Crear una sección sencilla de configuración.

Permitir eventualmente gestionar:

- Categorías.
- Métodos de pago.
- Monedas.

Por ahora puede utilizar valores predefinidos, pero la arquitectura debe permitir convertirlos posteriormente en entidades configurables.

==================================================
42. CALIDAD VISUAL
==================================================

Quiero especial atención a:

- Espaciado.
- Tipografía.
- Border radius.
- Colores.
- Iconografía.
- Jerarquía.
- Responsive.
- Consistencia.

Evitar:

- Cards genéricas de Bootstrap.
- Tablas grises aburridas.
- Demasiados bordes.
- Sombras exageradas.
- Gradientes excesivos.
- Colores neón.
- Interfaz infantil.
- Demasiados emojis.

La referencia visual debe inspirar una UI:

Playful + Premium + Clean + Financial.

==================================================
43. PRINCIPIO DE DISEÑO
==================================================

La aplicación debe sentirse como:

"Una app que realmente quiero abrir para ver cómo estoy gastando mi dinero."

No como:

"Un sistema administrativo de contabilidad."

Priorizar:

Personalidad
Claridad
Simplicidad
Visualización
Buen UX
Mobile First

==================================================
44. RESULTADO FINAL
==================================================

Construye una aplicación funcional completa, no solamente una maqueta.

Debe incluir:

- Supabase.
- Auth.
- Base de datos.
- RLS.
- CRUD.
- Restricción de edición del mes actual.
- Dashboard.
- Filtros.
- KPIs.
- Gráficos.
- Insights.
- Tabla.
- Responsive design.
- Mobile navigation.
- Desktop sidebar.
- Empty states.
- Loading states.
- Error states.
- Toasts.
- Confirmaciones.
- Datos de ejemplo.

La interfaz debe ser visualmente sorprendente, divertida, moderna y premium, inspirada en la imagen adjunta pero con un diseño original.

La aplicación debe sentirse lista para producción.

Antes de terminar, verifica que:

1. El CRUD funciona realmente.
2. Los datos persisten en Supabase.
3. RLS está correctamente configurado.
4. Los usuarios solo ven sus propios gastos.
5. Los gastos históricos no pueden editarse/eliminarse.
6. Los gastos del mes actual sí pueden editarse/eliminarse.
7. Los filtros actualizan correctamente todos los gráficos y KPIs.
8. Las monedas no se mezclan incorrectamente.
9. El dashboard funciona sin datos.
10. La aplicación funciona correctamente en mobile y desktop.
11. No existen errores de TypeScript.
12. No existen errores de consola.
13. La UI mantiene una estética consistente en todas las páginas.

IMPORTANTE SOBRE LA REFERENCIA VISUAL:

Usa la imagen adjunta como referencia de dirección artística para la aplicación.

Quiero especialmente:

- Los colores pastel.
- Las formas redondeadas.
- El uso de cards.
- La tipografía grande.
- El diseño expresivo.
- La sensación de aplicación móvil.
- La navegación compacta.
- La mezcla de información y elementos visuales.

Pero NO copies literalmente la interfaz de la imagen.

Crea una identidad propia enfocada en finanzas personales.

La prioridad es:

Mobile-first + Playful + Premium + Clean + Data-driven.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d9b04339-e1c1-41be-b5e0-b7db37dbcfbe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
