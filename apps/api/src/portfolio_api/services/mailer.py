"""Send the contact message to the owner's inbox via Resend's HTTP API.

The visitor's address goes in Reply-To (never From), so replying in the mail
client answers them while the sender stays our verified domain.
"""

import logging

import httpx

from portfolio_api.core.config import Settings

RESEND_URL = "https://api.resend.com/emails"
log = logging.getLogger(__name__)


async def send_contact_email(
    http: httpx.AsyncClient, settings: Settings, *, name: str, email: str, reason: str, body: str
) -> bool:
    """True if Resend accepted the email."""
    if not settings.email_enabled or settings.resend_api_key is None:
        return False
    payload = {
        "from": settings.contact_from_email,
        "to": [settings.contact_to_email],
        "reply_to": email,
        "subject": f"Portfolio contact ({reason}): {name}",
        "text": f"From: {name} <{email}>\nReason: {reason}\n\n{body}",
    }
    headers = {"Authorization": f"Bearer {settings.resend_api_key.get_secret_value()}"}
    try:
        res = await http.post(RESEND_URL, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        log.warning("email send failed: %s", exc.__class__.__name__)
        return False
    if res.is_success:
        return True
    log.warning("email rejected by Resend: HTTP %s", res.status_code)
    return False
