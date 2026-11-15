# Netlify deployment

Netlify serves the React frontend as a static site. The Spring Core API,
MongoDB, and ingestion service must be deployed separately; Netlify does not
run the Docker Compose stack.

## Deploy

1. Deploy the Core API and its required services to a host that supports the
   API's HTTP and WebSocket traffic. Make the API available over HTTPS.
2. In Netlify, import this repository. The root `netlify.toml` sets the
   frontend base directory, build command, publish directory, and SPA fallback.
3. In the Netlify site's environment variables, set
   `VITE_CORE_API_URL` to the Core API's public base URL, for example
   `https://api.example.com` (no trailing slash). This is a build-time variable;
   trigger a new deploy after changing it.
4. On the Core API host, set `ALLOWED_ORIGINS` to the exact Netlify site origin,
   for example `https://your-site.netlify.app`. Include any custom domain or
   deploy-preview origins that need access. The API host must allow WebSocket
   upgrades for `/ws/alerts`.

The frontend uses `VITE_CORE_API_URL` for both HTTP requests and the live-alert
WebSocket connection. See `.env.example` for the expected variable. Never put
backend secrets in `VITE_*` variables; frontend variables are included in the
public browser bundle.

## Other deployment requirements

Configure the API host with its MongoDB connection, a unique `JWT_SECRET`, and
strong admin and ingestion credentials. If Ollama is unavailable on that host,
disable it with `OLLAMA_ENABLED=false` or configure a reachable Ollama service.
Deploy the ingestion service separately if scheduled feed ingestion is needed.
