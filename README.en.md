# Claudinho

🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)

Your Claude Code, now with more life. A desktop app that talks to the real **Claude Code** (through the official agent SDK) and draws the conversation over living ASCII wallpapers, with Clawd by your side: 15 animated themes with music and sounds, 278 animations from the ASCII Magic library, Wallpaper Engine wallpapers, and your own videos, images and GIFs.

Website: [meuclaudinho.com.br](https://meuclaudinho.com.br) · Made by [Luis Roberto](https://luisrobertoportifolio.com)

## Install

1. Install [Claude Code](https://code.claude.com/docs/en/setup) and sign in with your account (Claudinho uses the Claude Code on your computer).
2. Download the installer from [Releases](../../releases/latest) (`Claudinho-Setup.exe`) and run it. Windows 10 or 11.
3. Once installed, Claudinho updates itself: it downloads the new version in the background and lets you know in the sidebar (also in Customize → General → Updates).
4. The installer isn't signed: if Windows shows "Windows protected your PC", click **More info → Run anyway**.

**How Claudinho signs in to Claude**: by default, with Claude Code's own login (your plan). In Customize → General → Account you can use an **Anthropic API key** instead (billed per use); the key is encrypted by the system.

## Develop

```bash
npm install
npm start          # opens the app
npm run dist       # builds the installer in dist/
```

## How to use

- **Project folder** (sidebar): the folder where Claude Code works.
- **Chats**: "All" shows Claude Code conversations from every project (the ones from the terminal, from the Claude app's Code tab and from the other windows), with the project name on each one; "This folder" shows only the ones in the current folder. The list syncs by itself whenever any conversation changes, and the ⟳ button forces it right away. Opening a conversation from another project takes the window to that project's folder. claude.ai conversations (web/app chat) don't show up: they live on Anthropic's servers, with no official access.
- **Model and permissions**: pick them in the sidebar. In "Ask", every tool that needs approval shows up as a card with Allow, Always this session and Deny.
- **Themes**: ask Claude (*"switch the chat to Honu Lagoon"*), type `/theme`, `/theme fireplace`, `/theme default`, or use the 🎨 Themes button.
- **Library**: the selector's Library tab has 278 animations from [ASCII Magic](https://www.ascii-magic.com/ascii) (MIT), in 9 categories: landscapes, cities, cosmos, weather and nature, animals, algorithms, arcade, holidays and mascots (the list lives in `tools/indice-magia.mjs`), with search and categories. `/background cat` opens the search; Claude can also find and apply one (*"put on a rain background"*).
- **Mine**: create in [ASCII Motion](https://www.ascii-motion.com), export as JSON and import (button, `/import` or dragging the file onto the tab). `.asciimtn` sessions without layers work too.
- **Attachments**: paperclip in the message field, drag files onto the window or paste images (Ctrl+V). Images go to Claude; for other files it opens them by path.
- **Commands**: type `/` to see the app's commands and Claude Code's (skills, `/compact`, `/review`…). Arrows pick, Tab completes, Enter runs. The app's commands also answer to their Portuguese and Spanish names (`/tema`, `/fundo`, `/fondo`, `/nova`, `/nueva`, `/importar`, `/personalizar`).
- **Effort**: the little bar next to the model sets how much Claude thinks (default to max). Permissions and model open a menu that explains each option.
- **Chats**: pin to top, duplicate, export as Markdown, rename and delete (⋯ menu). Search (Ctrl+K) also looks inside messages.
- **Replies**: copy, read aloud and **branch from here** (a new conversation starting from that reply; the original stays intact). Time on every message.
- **While Claude works**: whatever you send goes into a queue and goes out when it's done. Its plan (task list) stays pinned above the field, and the meter next to the button shows how much of the context has been used.
- **Notifications**: with the window in the background, a notification lets you know when Claude finishes or needs approval. Ctrl+Shift+Space brings up Claudinho from anywhere. Ctrl+/ lists the shortcuts.
- **Clawd**: Claude Code's mascot is everywhere. On launch he builds himself out of tiles; on the home screen he follows the mouse with his eyes, waves when you hover over him, jumps and throws sparks when clicked, and falls asleep if you sit still; next to the message field he keeps up with Claude (thinks, types, calls you, jumps when it's done); in the sidebar and in "thinking" he sways and types. You can **grab Clawd** next to the field: he dangles from the mouse, falls when you let go (and gets dizzy if you throw him) and walks back to his spot; click him and he jumps and talks (he has lots of lines). Every now and then he peeks out from behind the sidebar when you hover over a project. He's also the app icon; the **Claudinho** shortcut in the folder opens the app with that icon.
- **Multiple windows**: open a conversation in another window (the conversation's ⋯ menu) or a new window with Ctrl+Shift+N; each window has its own conversation.
- **Sidebar**: groups (folders that open and close; drag conversations into them) and colors for conversations, in the ⋯ menu.
- **Long replies** come folded, with an index of the headings and "Read the whole reply".
- **Floating mini-windows** (drag by the title, resize from the corner and pin them so they stay open in the same place, even after closing the app): **Conversation changes** (button at the top: every changed file, with diff and "undo from here"), Claude's **plan** pulled out, and the **music player** (on the sound button).
- **Right-click** on the wallpaper opens a radial menu. `!command` in the field asks Claude to run it in the terminal. Right-clicking a block on the rail rolls the files back to before that point.
- **While Claude works**: the reasoning shows up in a collapsible block, each tool becomes a little block on the rail at the top (click to jump to it), edits show up as a diff (+/−), and the wallpaper reacts (waves, rhythm).
- **Undo**: hover over one of your messages and click the arrow: the files Claude changed from there on go back to how they were (with a preview first).
- **Claude's questions** become a form with the options; **large pasted texts** become an attachment you can open and edit; **automatic title** for new conversations; a warning and "continue on its own" when the plan limit runs out.
- **Customize** (sidebar or `/customize`):
  - **General**: **language** (Portuguese, English or Spanish; starts in the system language), send with Enter or Ctrl+Enter, **performance** (Automatic, Maximum or Light), show reasoning, automatic title, Clawd, reactive wallpaper, notifications and the **account** (Claude Code login or API key).
  - **Background**: your images, GIFs and videos as wallpaper (also by dragging onto the Mine tab), and **Wallpaper Engine** video and web wallpapers (scene ones only run inside it), with fit, darken, blur and video sound.
  - **Colors**: ready-made palettes, accent, text and glass color, glass opacity and blur, light or dark glass.
  - **Fonts**: interface and code font (from the web or your own .ttf/.otf/.woff files), text size and conversation width.
  - **Sounds**: your own sound for send, finish, approval request, error, wallpaper click and app launch.
  - **Music**: your songs playing in order or shuffled, instead of the theme music or alongside it (controls also on the sound button).
  - **Icon and name**: window and taskbar icon, optionally in the sidebar, and the app name.
  - Files are copied to `%APPDATA%\Claudinho\pessoal`; "Restore all" goes back to the defaults.
- **Plan usage** (the stamina button at the top): Clawd works out at the gym; he gets tired as the 5-hour session fills up and falls asleep when he hits the limit, showing the time it resets. It also shows the week and usage per model.
- **Clawd chats**: every so often he comments on the project, shares fun facts about Claude and Anthropic, gives app tips and brings news (one quick search a day). Click him to hear the next one. You can turn it off in Customize → General.
- **Credits**: in the sidebar, who made each piece of art and each part of the app.
- **Sound**: button at the top (starts off).
- `/new` starts a new conversation.

## Structure

- `src/main.js`: the window and the bridge to Claude Code (`query()` from `@anthropic-ai/claude-agent-sdk`), permissions and the theme tools Claude can call.
- `src/preload.cjs`: the calls the window can make.
- `src/renderer/`: the interface (`index.html`, `app.css`, `app.js`) and the wallpaper engine (`wallpapers/`).
- `src/renderer/wallpapers/arte.mjs`: plays the ASCII Magic pieces and the imported animations; `magia-indice.js` is generated by `node tools/indice-magia.mjs`.
- `docs/pesquisa-melhorias.md`: what users ask Claude for most and design concepts, with what's been done and what's left.
- `src/renderer/personalizar.js`: the Customize panel (colors, fonts, sounds, music, icon and name).
- `src/renderer/extras.js`, `clawd-arte.js`, `clawd.js`, `interface.js`, `os.js`: reasoning, diffs, undo, questions, limits, Clawd, the activity rail, the mini-windows and the radial menu.
- `src/renderer/simulador.js`: opens the interface in a regular browser with fake replies, to tweak the look without Claude Code.
- `src/renderer/i18n/`: the interface texts in Portuguese (`pt-BR.js`, the original), English (`en.js`) and Spanish (`es.js`); `i18n.js` provides `t("key")`, which falls back to Portuguese when a translation is missing.
  - To add a language: copy `en.js` (e.g. `fr.js`) and translate it, add its `<script>` to `src/renderer/index.html` and its `import` to `src/main.js`, register its name in `IDIOMAS` and its prefix in `idiomaDe()` (in `i18n.js`), and run `node tools/confere-i18n.mjs`.

## Tests

- `node tools/teste-sdk.mjs`: a short question through the SDK, to check the login and streaming.
- `node tools/confere-i18n.mjs`: checks that every translation key exists in all three languages.
- `VIVO_LOG=1 VIVO_TESTE="message" npm start`: sends the message on launch and logs the events to the terminal (`VIVO_ANEXO=file` attaches a file).
- `node`/tests: with `VIVO_PASTA` or `VIVO_JS` the app uses a separate profile (`%APPDATA%\Claudinho-teste`), so tests don't touch your settings and run with the app open.
- `VIVO_MOTION=file.json`: imports an ASCII Motion animation on launch. `VIVO_JS="expression" VIVO_FOTO=screen.png`: runs some code in the window and saves a screenshot of it.

## License and credits

Code under the MIT license (see `LICENSE`). The library's animations come from the [ascii-magic-art](https://www.ascii-magic.com/ascii) package (MIT). The Claude Agent SDK belongs to Anthropic and follows its terms.

Claudinho is an independent fan project. It is not affiliated with or endorsed by Anthropic. Claude, Claude Code and Clawd are trademarks of Anthropic.
