# Claudinho

🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)

Tu Claude Code, ahora con más vida. Una app de escritorio que conversa con el **Claude Code** de verdad (a través del SDK oficial de agentes) y dibuja la conversación sobre fondos de pantalla ASCII vivos, con Clawd a tu lado: 15 temas animados con música y sonidos, 278 animaciones de la biblioteca ASCII Magic, fondos de Wallpaper Engine, y tus propios videos, imágenes y GIFs.

Sitio: [meuclaudinho.com.br](https://meuclaudinho.com.br) · Hecho por [Luis Roberto](https://luisrobertoportifolio.com)

## Instalar

1. Instala [Claude Code](https://code.claude.com/docs/en/setup) e inicia sesión con tu cuenta (Claudinho usa el Claude Code que está en tu computadora).
2. Descarga el instalador en [Releases](../../releases/latest) (`Claudinho-Setup.exe`) y ábrelo. Windows 10 u 11.
3. Una vez instalado, Claudinho se actualiza solo: descarga la versión nueva en segundo plano y te avisa en la barra lateral (también en Personalizar → General → Actualizaciones).
4. El instalador no está firmado: si Windows muestra "Windows protegió su PC", haz clic en **Más información → Ejecutar de todas formas**.

**Cómo entra Claudinho a Claude**: por defecto, con el inicio de sesión del propio Claude Code (tu plan). En Personalizar → General → Cuenta puedes usar una **clave de API de Anthropic** en su lugar (se cobra por uso); la clave queda cifrada por el sistema.

## Desarrollar

```bash
npm install
npm start          # abre la app
npm run dist       # genera el instalador en dist/
```

## Cómo usar

- **Carpeta del proyecto** (barra lateral): la carpeta donde trabaja Claude Code.
- **Conversaciones**: "Todas" muestra las conversaciones de Claude Code de todos los proyectos (las de la terminal, las de la app de Claude en la pestaña Code y las de las otras ventanas), con el nombre del proyecto en cada una; "Esta carpeta" muestra solo las de la carpeta actual. La lista se sincroniza sola cuando cambia cualquier conversación, y el botón ⟳ la fuerza al instante. Abrir una conversación de otro proyecto lleva la ventana a la carpeta de ese proyecto. Las conversaciones de claude.ai (chat web/app) no aparecen: están en los servidores de Anthropic, sin acceso oficial.
- **Modelo y permisos**: elígelos en la barra lateral. En "Preguntar", cada herramienta que necesita aprobación aparece como una tarjeta con Permitir, Siempre en esta sesión y Denegar.
- **Temas**: pídeselo a Claude (*"pon el chat con Honu Lagoon"*), escribe `/tema`, `/tema chimenea`, `/tema predeterminado`, o usa el botón 🎨 Temas.
- **Biblioteca**: la pestaña Biblioteca del selector tiene 278 animaciones de [ASCII Magic](https://www.ascii-magic.com/ascii) (MIT), en 9 categorías: paisajes, ciudades, cosmos, clima y naturaleza, animales, algoritmos, arcade, fechas especiales y mascotas (la lista está en `tools/indice-magia.mjs`), con búsqueda y categorías. `/fondo gato` abre la búsqueda; Claude también busca y aplica (*"pon un fondo de lluvia"*).
- **Míos**: crea en [ASCII Motion](https://www.ascii-motion.com), exporta como JSON e importa (botón, `/importar` o arrastrando el archivo a la pestaña). Las sesiones `.asciimtn` sin capas también funcionan.
- **Adjuntos**: clip en el campo de mensaje, arrastrar archivos a la ventana o pegar imágenes (Ctrl+V). Las imágenes van a Claude; los demás archivos los abre por la ruta.
- **Comandos**: escribe `/` para ver los comandos de la app y los de Claude Code (skills, `/compact`, `/review`…). Las flechas eligen, Tab completa, Enter ejecuta. Los comandos de la app también responden a su nombre en portugués e inglés (`/theme`, `/fundo`, `/background`, `/nova`, `/new`, `/import`, `/customize`).
- **Esfuerzo**: la barrita junto al modelo define cuánto piensa Claude (de predeterminado a máximo). Permisos y modelo abren un menú que explica cada opción.
- **Conversaciones**: fijar arriba, duplicar, exportar en Markdown, renombrar y borrar (menú ⋯). La búsqueda (Ctrl+K) busca también dentro de los mensajes.
- **Respuestas**: copiar, leer en voz alta y **ramificar desde aquí** (una conversación nueva a partir de esa respuesta; la original queda intacta). Hora en cada mensaje.
- **Mientras Claude trabaja**: lo que envíes entra en la cola y sale cuando termine. Su plan (lista de tareas) queda fijo encima del campo, y el medidor junto al botón muestra cuánto del contexto ya se usó.
- **Avisos**: con la ventana en segundo plano, una notificación te avisa cuando Claude termina o necesita aprobación. Ctrl+Shift+Espacio muestra Claudinho desde cualquier lugar. Ctrl+/ lista los atajos.
- **Clawd**: la mascota de Claude Code está en todas partes. Al abrir se arma con baldosas; en la pantalla de inicio sigue el mouse con los ojos, saluda cuando pasas por encima, salta y suelta chispas con el clic y se duerme si te quedas quieto; junto al campo de mensaje acompaña a Claude (piensa, escribe, te llama, salta cuando termina); en la barra lateral y en el "pensando" se balancea y escribe. Puedes **agarrar a Clawd** junto al campo: se balancea colgado del mouse, cae cuando lo sueltas (y se marea si lo lanzas) y vuelve caminando a su lugar; haz clic en él y salta y habla (tiene muchas frases). De vez en cuando se asoma por detrás de la barra lateral cuando pasas el mouse sobre un proyecto. También es el ícono de la app; el acceso directo **Claudinho** en la carpeta abre la app con ese ícono.
- **Varias ventanas**: abre una conversación en otra ventana (menú ⋯ de la conversación) o una ventana nueva con Ctrl+Shift+N; cada ventana tiene su conversación.
- **Barra lateral**: grupos (carpetas que se abren y se cierran; arrastra conversaciones a ellas) y colores para las conversaciones, en el menú ⋯.
- **Las respuestas largas** vienen plegadas, con un índice de los títulos y "Leer la respuesta completa".
- **Ventanitas flotantes** (arrástralas por el título, cambia su tamaño desde la esquina y fíjalas con el alfiler para que queden abiertas en el mismo lugar, incluso después de cerrar la app): **Cambios de la conversación** (botón arriba: todos los archivos modificados, con diff y "deshacer desde aquí"), el **plan** de Claude destacado y el **reproductor de música** (en el botón de sonido).
- **Clic derecho** en el fondo de pantalla abre un menú radial. `!comando` en el campo le pide a Claude que lo ejecute en la terminal. Clic derecho en un bloquecito del riel devuelve los archivos a como estaban antes de ese punto.
- **Mientras Claude trabaja**: el razonamiento aparece en un bloque plegable, cada herramienta se vuelve un bloquecito en el riel de arriba (haz clic para ir a ella), las ediciones aparecen como diff (+/−), y el fondo de pantalla reacciona (ondas, ritmo).
- **Deshacer**: pasa el mouse sobre un mensaje tuyo y haz clic en la flecha: los archivos que Claude cambió desde ahí vuelven a como eran (con una vista previa antes).
- **Las preguntas de Claude** se vuelven un formulario con las opciones; **los textos pegados grandes** se vuelven un adjunto que puedes abrir y editar; **título automático** para conversaciones nuevas; aviso y "continuar solo" cuando se agota el límite del plan.
- **Personalizar** (barra lateral o `/personalizar`):
  - **General**: **idioma** (portugués, inglés o español; empieza en el idioma del sistema), enviar con Enter o Ctrl+Enter, **rendimiento** (Automático, Máximo o Ligero), mostrar razonamiento, título automático, Clawd, fondo de pantalla que reacciona, notificaciones y la **cuenta** (inicio de sesión de Claude Code o clave de API).
  - **Fondo**: tus imágenes, GIFs y videos como fondo de pantalla (también arrastrándolos a la pestaña Míos), y fondos de video y de página de **Wallpaper Engine** (los de escena solo funcionan dentro de él), con ajuste, oscurecer, desenfocar y sonido del video.
  - **Colores**: paletas listas, color de acento, del texto y del vidrio, opacidad y desenfoque del vidrio, vidrio claro u oscuro.
  - **Fuentes**: fuente de la interfaz y del código (de internet o tus archivos .ttf/.otf/.woff), tamaño del texto y ancho de la conversación.
  - **Sonidos**: un sonido tuyo para enviar, terminar, solicitud de aprobación, error, clic en el fondo de pantalla y abrir la app.
  - **Música**: tus canciones sonando en orden o al azar, en lugar de la música de los temas o junto con ella (controles también en el botón de sonido).
  - **Ícono y nombre**: ícono de la ventana y de la barra de tareas, opcionalmente en la barra lateral, y el nombre de la app.
  - Los archivos se copian en `%APPDATA%\Claudinho\pessoal`; "Restaurar todo" vuelve a lo predeterminado.
- **Uso del plan** (botón de aliento arriba): Clawd entrena en el gimnasio; se va cansando a medida que se llena la sesión de 5 horas y se duerme cuando llega al límite, con la hora en que se libera. También muestra la semana y el uso por modelo.
- **Clawd conversa**: de vez en cuando comenta el proyecto, cuenta curiosidades de Claude y de Anthropic, da consejos de la app y trae novedades (una búsqueda rápida por día). Haz clic en él para oír la siguiente. Puedes desactivarlo en Personalizar → General.
- **Créditos**: en la barra lateral, quién hizo cada arte y cada parte de la app.
- **Sonido**: botón arriba (empieza apagado).
- `/nueva` empieza una conversación nueva.

## Estructura

- `src/main.js`: la ventana y el puente con Claude Code (`query()` de `@anthropic-ai/claude-agent-sdk`), los permisos y las herramientas de tema que Claude puede llamar.
- `src/preload.cjs`: las llamadas que puede hacer la ventana.
- `src/renderer/`: la interfaz (`index.html`, `app.css`, `app.js`) y el motor de los fondos de pantalla (`wallpapers/`).
- `src/renderer/wallpapers/arte.mjs`: reproduce las piezas de ASCII Magic y las animaciones importadas; `magia-indice.js` lo genera `node tools/indice-magia.mjs`.
- `docs/pesquisa-melhorias.md`: lo que los usuarios más le piden a Claude y conceptos de diseño, con lo que ya se hizo y lo que falta.
- `src/renderer/personalizar.js`: el panel Personalizar (colores, fuentes, sonidos, música, ícono y nombre).
- `src/renderer/extras.js`, `clawd-arte.js`, `clawd.js`, `interface.js`, `os.js`: razonamiento, diffs, deshacer, preguntas, límites, Clawd, el riel de actividad, las ventanitas y el menú radial.
- `src/renderer/simulador.js`: abre la interfaz en un navegador común con respuestas de mentira, para trabajar en el aspecto visual sin Claude Code.
- `src/renderer/i18n/`: los textos de la interfaz en portugués (`pt-BR.js`, el original), inglés (`en.js`) y español (`es.js`); `i18n.js` trae `t("clave")`, que recurre al portugués cuando falta una traducción.
  - Para agregar un idioma: copia `en.js` (p. ej. `fr.js`) y tradúcelo, pon su `<script>` en `src/renderer/index.html` y su `import` en `src/main.js`, registra el nombre en `IDIOMAS` y el prefijo en `idiomaDe()` (en `i18n.js`) y ejecuta `node tools/confere-i18n.mjs`.

## Pruebas

- `node tools/teste-sdk.mjs`: una pregunta corta por el SDK, para comprobar el inicio de sesión y el streaming.
- `node tools/confere-i18n.mjs`: comprueba que cada clave de traducción exista en los tres idiomas.
- `VIVO_LOG=1 VIVO_TESTE="mensaje" npm start`: envía el mensaje al abrir y registra los eventos en la terminal (`VIVO_ANEXO=archivo` adjunta un archivo).
- `node`/pruebas: con `VIVO_PASTA` o `VIVO_JS` la app usa un perfil aparte (`%APPDATA%\Claudinho-teste`), así que las pruebas no tocan tu configuración y se ejecutan con la app abierta.
- `VIVO_MOTION=archivo.json`: importa una animación de ASCII Motion al abrir. `VIVO_JS="expresión" VIVO_FOTO=pantalla.png`: ejecuta código en la ventana y guarda una captura de ella.

## Licencia y créditos

Código bajo la licencia MIT (consulta `LICENSE`). Las animaciones de la biblioteca vienen del paquete [ascii-magic-art](https://www.ascii-magic.com/ascii) (MIT). El Claude Agent SDK es de Anthropic y sigue sus términos.

Claudinho es un proyecto independiente de fans. No está afiliado ni respaldado por Anthropic. Claude, Claude Code y Clawd son marcas de Anthropic.
