# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5ed76bfc-5970-43c6-beda-83a586a98566

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5ed76bfc-5970-43c6-beda-83a586a98566) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5ed76bfc-5970-43c6-beda-83a586a98566) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Security

### Rotate Secrets
**Important**: If any API keys or secrets in this repository were real and committed to version control, they must be rotated immediately.

**Last rotation check**: [DATE_NOT_SET] - Update this date when you rotate your API keys.

### Security Guidelines
- Never commit `.env` files or any secrets to version control
- Use `.env.example` as a template for required environment variables
- Rotate API keys every 90 days or immediately if compromised
- See [SECURITY.md](./SECURITY.md) for complete security guidelines

### MCP Server Security
The MCP server includes security hardening:
- Bearer token authentication required
- Rate limiting (30 req/min per IP)
- Input validation with Zod schemas
- CORS protection
- Request timeouts (8s)
- Sanitized error responses

## Voice Assistant

The application includes a zero-cost voice assistant that uses Web Speech APIs for speech recognition and synthesis.

### Supported Intents
- **Weather**: "What's the weather?" → Gets weather forecast for Bruneck
- **Health**: "System health" → Checks system status  
- **Forecast**: "Energy forecast" → Gets AI energy predictions
- **Lights**: "Turn on lights" → Light control (integration pending)

### Usage
1. Click the "Voice" button in the navbar for a floating assistant
2. Or visit the Admin dashboard for the full interface
3. Click the microphone to start listening (Chrome/Edge) or type your message
4. The assistant will respond both visually and audibly

### Technical Features
- **Zero cost**: Uses browser's Web Speech Recognition and Speech Synthesis APIs
- **Fallback support**: Provides text input when speech recognition unavailable
- **Rate limited**: 20 requests per minute per IP for security
- **MCP integration**: Securely proxies to MCP tools via server-side functions
- **Intent routing**: Simple rule-based intent detection (can be extended with LLM)

### Extending with LLM
To enhance intent detection with AI:
1. Replace simple rule matching in `assistant-route` function
2. Add OpenAI/Claude integration for natural language understanding
3. Connect to MCP weather tools for dynamic location detection
4. Add more sophisticated conversation context

### Architecture
```
Browser → Voice Assistant → Supabase Edge Function → MCP/Prophet APIs
```

The assistant never exposes MCP tokens to the browser - all API calls are proxied through secure edge functions.
