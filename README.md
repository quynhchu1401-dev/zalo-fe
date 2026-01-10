# zalo-fe

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Deployment note ⚠️
If you deploy the static site (GitHub Pages) and your backend runs on a separate host, set the API base URL at build time so the app calls the correct backend. Example (PowerShell):

```powershell
$env:VUE_APP_API_BASE_URL = "https://api.example.com"
npm run build
```

This repository reads `VUE_APP_API_BASE_URL` and uses it to build API URLs (falls back to `/api` for local dev proxy).
