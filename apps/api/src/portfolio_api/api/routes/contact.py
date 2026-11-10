"""POST /api/v1/contact: the website's contact form.

Order of checks (cheapest first): honeypot → per-IP rate limit → Turnstile →
store in Postgres → email via Resend. The message is saved before emailing,
so it's never lost if email delivery fails.
"""

import hashlib
from typing import cast

import httpx
from fastapi import APIRouter, HTTPException, Request, status

from portfolio_api.api.deps import RedisDep, SessionDep, SettingsDep
from portfolio_api.db.models import ContactMessage
from portfolio_api.schemas.contact import ContactIn, ContactOut
from portfolio_api.services import mailer, turnstile
from portfolio_api.services.rate_limit import retry_after

router = APIRouter(prefix="/api/v1", tags=["contact"])
WINDOW = 3600  # seconds


def _ip_hash(ip: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()


@router.post("/contact", status_code=status.HTTP_202_ACCEPTED)
async def contact(
    form: ContactIn, request: Request, settings: SettingsDep, session: SessionDep, redis: RedisDep
) -> ContactOut:
    if form.website:
        return ContactOut()  # bot: pretend it worked, store nothing

    ip = request.client.host if request.client else "unknown"
    ip_hash = _ip_hash(ip, settings.ip_hash_salt.get_secret_value())
    wait = await retry_after(
        redis, f"rl:contact:{ip_hash}", limit=settings.contact_limit_per_hour, window=WINDOW
    )
    if wait is not None:
        minutes = max(1, round(wait / 60))
        raise HTTPException(
            429,
            f"Too many messages. Try again in {minutes} min.",
            headers={"Retry-After": str(wait)},
        )

    http = cast(httpx.AsyncClient, request.app.state.http)
    if settings.turnstile_secret_key is not None:
        secret = settings.turnstile_secret_key.get_secret_value()
        if not form.turnstile_token or not await turnstile.verify(
            http, secret, form.turnstile_token, ip
        ):
            raise HTTPException(400, "Bot check failed. Please reload the page and try again.")

    message = ContactMessage(
        name=form.name,
        email=str(form.email),
        reason=form.reason,
        body=form.message,
        ip_hash=ip_hash,
    )
    session.add(message)
    await session.commit()

    if settings.email_enabled:
        sent = await mailer.send_contact_email(
            http,
            settings,
            name=form.name,
            email=str(form.email),
            reason=form.reason,
            body=form.message,
        )
        message.status = "emailed" if sent else "email_failed"
        await session.commit()
    return ContactOut()
