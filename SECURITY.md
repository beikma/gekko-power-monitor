# Security Policy

## Secrets Management

### Policy
- **Never commit secrets**: API keys, tokens, passwords must never be committed to version control
- **Use .env files**: Store secrets in `.env` files and add them to `.gitignore`
- **Rotate regularly**: Rotate API keys and tokens every 90 days or immediately if compromised
- **Environment-specific**: Use different secrets for development, staging, and production

### If Secrets Are Compromised
1. **Immediately rotate** all affected API keys and tokens
2. **Update** all systems using the old credentials
3. **Audit** logs for any suspicious activity
4. **Document** the incident with date and actions taken

## MCP Server Security

### Authentication
- The MCP server requires `Authorization: Bearer <MCP_TOKEN>` header for all API endpoints
- Use a strong, randomly generated token (minimum 32 characters)
- Never expose the MCP server publicly without proper authentication

### Rate Limiting
- API endpoints are limited to 30 requests per minute per IP address
- Exceeding limits returns HTTP 429 (Too Many Requests)

### CORS Protection
- CORS is configured to allow requests only from authorized origins
- Never use wildcard (`*`) origins in production

### Input Validation
- All API inputs are validated using Zod schemas
- Invalid inputs return HTTP 400 with sanitized error messages

## LLM Integration Warnings

⚠️ **CRITICAL SECURITY WARNING** ⚠️

### Never Expose Local LLM Ports Publicly
- Local LLM servers (Ollama, LocalAI, etc.) typically run without authentication
- **Never expose** ports like 11434, 8080, or similar to the internet
- Use reverse proxy with authentication if remote access is needed
- Monitor network traffic to detect unauthorized access attempts

### AI Agent Access Control
- Limit AI agent capabilities to minimum required permissions
- Never give AI agents access to sensitive system commands
- Log all AI agent interactions for audit purposes

## TLS/HTTPS Recommendations

### Development
- Use HTTP for local development only
- Never transmit real credentials over unencrypted connections

### Production
- **Always use HTTPS** in production environments
- Use TLS 1.2 or higher
- Implement proper certificate management
- Consider certificate pinning for high-security applications

### Certificate Management
- Use automated certificate renewal (Let's Encrypt, etc.)
- Monitor certificate expiration dates
- Test certificate validation regularly

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. Email security concerns to the project maintainers
3. Include detailed description and reproduction steps
4. Allow reasonable time for fixes before public disclosure

## Security Checklist

- [ ] All secrets stored in `.env` files (not committed)
- [ ] `.gitignore` includes `.env`, `*.env.*`, and sensitive files
- [ ] MCP server uses strong authentication tokens
- [ ] Rate limiting configured on all API endpoints
- [ ] Input validation implemented for all user inputs
- [ ] CORS configured with specific allowed origins
- [ ] HTTPS enabled in production
- [ ] No LLM ports exposed publicly
- [ ] Security monitoring and logging in place
- [ ] Regular security audits scheduled