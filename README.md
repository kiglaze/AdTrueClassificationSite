# ad-true-data-site
## Versions
- Node: v20

Switch to Node 20 if you are using n:
```bash
n 20
```

This template should help get you started developing with Vue 3 in Vite.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run on Production
```sh
PORT=3000 NODE_ENV=production HOST=0.0.0.0 node prod-server.js
```
OR using pm2 (preferred -- to keep the server alive in the background):
```sh
PORT=3000 NODE_ENV=production HOST=0.0.0.0 pm2 start prod-server.js --name mysite
```
OR
```sh
PORT=3000 NODE_ENV=production node dev-server.js
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).


