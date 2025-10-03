# JWT Secret Rotation Playbook

A dual-secret rotation mechanism allows accepting tokens signed by the _new_ secret while still honoring (only during a controlled window) tokens signed by the _previous_ secret. This enables zero‑downtime rotations.

## Environment Variables

- `NEXTAUTH_SECRET` (required): Current primary secret. All newly issued tokens are signed with this value.
- `NEXTAUTH_SECRET_PREVIOUS` (optional): Previous secret accepted for verification fallback. Not used for signing.

## Rotation Steps

1. Preparation
   - Generate a strong new secret (32+ random bytes / UUIDv4 + extra entropy).
   - Add it (securely) to secret management for each environment but DO NOT deploy yet.
2. Deploy Rotation Phase
   - Set `NEXTAUTH_SECRET` to the new value.
   - Set `NEXTAUTH_SECRET_PREVIOUS` to the old value.
   - Deploy. New tokens are signed with the new secret; existing tokens continue to work via fallback.
3. Drain Window
   - Wait for: `max(ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL)` (default: 7d) _or_ accelerate by forcing refresh/logout flows if acceptable.
4. Finalize
   - Remove `NEXTAUTH_SECRET_PREVIOUS` from the environment.
   - Redeploy. Old tokens can no longer be verified (they should be expired by now).
5. Post-Rotation Validation
   - Monitor auth error rates and login success metrics for anomalies.

## Misconfiguration Behavior

- If `NEXTAUTH_SECRET` is missing: the app throws on startup (fail fast).
- If `NEXTAUTH_SECRET_PREVIOUS` is set equal to `NEXTAUTH_SECRET`: it is ignored.
- If a token was signed by an older secret not present in either var: verification fails (treated as invalid / expired).

## Testing Strategy

Included unit tests (`jwt-rotation.test.ts`) cover:

- Standard verification under primary secret.
- Successful fallback to previous secret.
- Failure when rotation done without specifying `NEXTAUTH_SECRET_PREVIOUS`.

## Operational Recommendations

- Automate secret generation & injection (avoid manual copy/paste).
- Track rotation date & planned removal date for previous secret.
- Consider shortening refresh token TTL temporarily during high-frequency rotations.
- Log (at debug level) whenever verification succeeds via previous secret (already implemented under `NODE_ENV=test`).

## Security Notes

- Do NOT leave `NEXTAUTH_SECRET_PREVIOUS` set longer than necessary; it widens the usable window of compromised old tokens.
- Prefer storing secrets in a secure manager (Vault, AWS Secrets Manager, etc.)—avoid committing to repo or using `.env` in production.

## Future Enhancements

- Emit a metric counter (e.g., `auth.jwt.verify.previous_secret.count`) when fallback path is used.
- Add an alert if fallback verification continues after expected drain window.
- Support an array of historical keys with `kid` in JWT header (requires signing change) if multi-stage rotations become necessary.
