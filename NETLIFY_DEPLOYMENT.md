# Deploying the Threat Intelligence Platform

## Netlify frontend
1. Push this cleaned project folder to a GitHub repository (do not commit any `.env` files).
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. The root `netlify.toml` configures the frontend base as `frontend`, build command `npm run build`, and publish directory `dist`.
4. In Netlify site environment variables, add `VITE_CORE_API_URL` with the public HTTPS URL of your deployed Spring Boot Core API (no trailing slash).
5. Trigger a new deploy after setting/changing the variable.

## Backend and data services
Netlify hosts only the static React frontend. Deploy Spring Boot Core API and (if required) the Node ingestion service to a host that supports long-running services and WebSocket upgrades. Use MongoDB Atlas for the database. Configure backend environment variables using `.env.example` as a guide. Set `ALLOWED_ORIGINS` to the exact Netlify site origin, including any custom domain you use. The API must support HTTPS and WebSocket upgrades for `/ws/alerts`.

If Ollama is not deployed and reachable from the backend, set `OLLAMA_ENABLED=false`. Deploy the ingestion service separately if scheduled feed ingestion is needed.

## Security
Never put `JWT_SECRET`, database credentials, admin passwords, ingestion passwords, or API keys in Netlify `VITE_*` variables. `VITE_*` values are exposed to browsers. Rotate any credentials that were previously committed or shared.
