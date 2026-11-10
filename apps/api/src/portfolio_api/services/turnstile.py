"""Cloudflare Turnstile: a privacy-friendly CAPTCHA. The browser widget gives the
form a one-time token; the server asks Cloudflare whether that token is genuine.
"""

import logging

import httpx

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
log = logging.getLogger(__name__)


async def verify(http: httpx.AsyncClient, secret: str, token: str, ip: str | None) -> bool:
    data = {"secret": secret, "response": token} | ({"remoteip": ip} if ip else {})
    try:
        res = await http.post(VERIFY_URL, data=data)
        return bool(res.json().get("success"))
    except (httpx.HTTPError, ValueError) as exc:
        # Fail closed: if we can't verify, we don't accept the message.
        log.warning("turnstile verify failed: %s", exc.__class__.__name__)
        return False
