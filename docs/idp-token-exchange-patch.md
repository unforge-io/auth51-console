# Authority Patch — RFC 8693 Token Exchange

Drop these changes into the patchet IDP (`/Users/ago/workspace/patchet/src/idp/`) to support Console identity federation.

After applying + redeploying ECS, the Auth51 Console can sign in users via Clerk and have them act on the Authority **without** ever holding OAuth client_secrets in the browser.

---

## 1. Add `httpx` and `python-jose` (or equivalent) to your `Pipfile`

```toml
# Pipfile
httpx = "*"
python-jose = {extras = ["cryptography"], version = "*"}
```

If `python-jose` is already there (you're using it for the existing OAuth token signing), no change needed.

---

## 2. Add a trusted-issuer registry

Create `src/idp/trusted_issuers.py`:

```python
"""
Trusted external issuers whose subject_token JWTs the Authority will
accept for OAuth 2.0 Token Exchange (RFC 8693).

Each entry maps an issuer URL to:
  - jwks_uri:   where to fetch its public keys
  - audience:   the `aud` claim we expect on tokens from this issuer
  - role_map:   user-claim -> Authority scopes & audiences
"""

from dataclasses import dataclass
from typing import Dict, List

@dataclass
class TrustedIssuer:
    issuer: str
    jwks_uri: str
    expected_audience: str
    default_scopes: List[str]
    default_authority_audiences: List[str]


TRUSTED_ISSUERS: Dict[str, TrustedIssuer] = {
    "https://auth51.com": TrustedIssuer(
        issuer="https://auth51.com",
        jwks_uri="https://auth51.com/api/jwks.json",
        expected_audience="idp.localhost",  # Authority's own audience
        default_scopes=[
            "read:agents",
            "generate:intent-token",
        ],
        default_authority_audiences=[
            "idp.localhost",
        ],
    ),
}
```

You can extend this later with role mapping (e.g., look up the user's email
in your own user DB and decide what scopes to grant). For V1, every
Console-vouched user gets `read:agents`.

---

## 3. Add a JWKS fetch + verification helper

Create `src/idp/external_jwks.py`:

```python
"""
Fetch + cache external JWKS, used to verify subject_token JWTs from
trusted issuers during token exchange.

Cache TTL: 10 min. Keys rotate, so we refresh occasionally.
"""

import time
import httpx
from typing import Dict, Any

_cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_S = 600


async def fetch_jwks(jwks_uri: str) -> Dict[str, Any]:
    cached = _cache.get(jwks_uri)
    if cached and cached[0] > time.time():
        return cached[1]
    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.get(jwks_uri)
        res.raise_for_status()
        keys = res.json()
    _cache[jwks_uri] = (time.time() + _CACHE_TTL_S, keys)
    return keys
```

---

## 4. Add the token-exchange handler to the existing `/oauth/token` endpoint

In `src/idp/oauth.py`, modify the existing token endpoint:

```python
from idp.trusted_issuers import TRUSTED_ISSUERS
from idp.external_jwks import fetch_jwks
from jose import jwt as jose_jwt
from jose.exceptions import JWTError

TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange"

@oauth_router.post("/token", response_model=TokenResponse)
async def token(
    grant_type: str = Form(...),
    # client_credentials params (existing)
    client_id: str = Form(default=None),
    client_secret: str = Form(default=None),
    # token-exchange params (new — RFC 8693)
    subject_token: str = Form(default=None),
    subject_token_type: str = Form(default=None),
    audience: str = Form(default=""),
    scope: str = Form(default=""),
):
    if grant_type == TOKEN_EXCHANGE_GRANT:
        return await _handle_token_exchange(
            subject_token=subject_token,
            subject_token_type=subject_token_type,
            audience=audience,
            scope=scope,
        )

    # ── existing client_credentials handler stays as is below ──
    if grant_type != "client_credentials":
        raise HTTPException(400, "unsupported_grant_type")
    # ... existing implementation ...


async def _handle_token_exchange(
    subject_token: str,
    subject_token_type: str,
    audience: str,
    scope: str,
):
    if not subject_token:
        raise HTTPException(400, "missing subject_token")
    if subject_token_type and subject_token_type != "urn:ietf:params:oauth:token-type:jwt":
        raise HTTPException(400, "unsupported subject_token_type")

    # Decode header to find the issuer (peek at claims without verifying yet)
    try:
        unverified = jose_jwt.get_unverified_claims(subject_token)
    except JWTError:
        raise HTTPException(400, "malformed subject_token")

    issuer = unverified.get("iss")
    if not issuer or issuer not in TRUSTED_ISSUERS:
        raise HTTPException(401, f"untrusted issuer: {issuer}")

    trusted = TRUSTED_ISSUERS[issuer]
    # Fetch the issuer's public keys and verify the JWT
    jwks = await fetch_jwks(trusted.jwks_uri)
    try:
        claims = jose_jwt.decode(
            subject_token,
            key=jwks,
            algorithms=["EdDSA", "RS256", "ES256"],
            audience=trusted.expected_audience,
            issuer=trusted.issuer,
        )
    except JWTError as e:
        raise HTTPException(401, f"subject_token verification failed: {e}")

    # Extract user identity for audit + role mapping
    user_sub = claims.get("sub")
    user_email = claims.get("email")
    if not user_sub:
        raise HTTPException(400, "subject_token missing sub claim")

    # Determine granted scopes + audiences
    requested_scopes = [s for s in scope.split() if s] or trusted.default_scopes
    granted_scopes = [s for s in requested_scopes if s in trusted.default_scopes]
    if not granted_scopes:
        raise HTTPException(403, "no requested scopes are permitted for this issuer")

    requested_audiences = [a for a in audience.split() if a] or trusted.default_authority_audiences
    granted_audiences = [a for a in requested_audiences if a in trusted.default_authority_audiences]
    if not granted_audiences:
        raise HTTPException(403, "no requested audiences are permitted for this issuer")

    # Mint our own access token bound to the federated user
    access_token = _mint_internal_token(
        sub=f"federated:{issuer}:{user_sub}",
        email=user_email,
        scopes=granted_scopes,
        audiences=granted_audiences,
        federated_issuer=issuer,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=1800,
        scope=" ".join(granted_scopes),
    )


def _mint_internal_token(sub, email, scopes, audiences, federated_issuer):
    """Use your existing _mint_internal helper — just set extra claims."""
    # Pseudocode — adapt to your existing token-minting function.
    # The important addition is including 'federated_iss' and 'email'
    # so audit logs capture who actually acted.
    import time, uuid, jwt as pyjwt
    now = int(time.time())
    claims = {
        "iss": "https://idp.unforge.io",
        "sub": sub,
        "email": email,
        "aud": audiences,
        "scope": " ".join(scopes),
        "federated_iss": federated_issuer,
        "iat": now,
        "exp": now + 1800,
        "jti": str(uuid.uuid4()),
    }
    return pyjwt.encode(claims, priv_pem, algorithm="RS256", headers={"kid": KID})
```

---

## 5. Quick sanity test

After redeploying:

```bash
# 1. Mint a Console-style subject_token via curl (use jwt.io or scripted)
# (See: signing your own JWT with the auth51.com private key. For testing
#  you can also just exercise this end-to-end via the Console UI.)

# 2. Exchange it directly
curl -s -X POST https://idp.auth51.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  --data-urlencode "subject_token=$SUBJECT_TOKEN" \
  --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:jwt" \
  --data-urlencode "audience=idp.localhost" \
  --data-urlencode "scope=read:agents"

# Expect: 200 with { "access_token": "<jwt>", "token_type": "Bearer", ... }
```

---

## 6. Verify the trust path

After deploying:

```bash
# JWKS must be publicly fetchable from the Authority's perspective
curl https://auth51.com/api/jwks.json
# Expect: { "keys": [{ "kty": "OKP", "crv": "Ed25519", "x": "...", "kid": "auth51-console-v1", ... }] }
```

The Authority will fetch this URL when verifying subject_tokens. Make sure
it's reachable from your ECS task's network.
