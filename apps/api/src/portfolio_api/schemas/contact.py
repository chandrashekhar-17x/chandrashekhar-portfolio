"""Contact form request/response shapes (limits match the web form)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Reason = Literal["hiring", "freelance", "hello"]


class ContactIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=80)
    email: EmailStr = Field(max_length=254)
    reason: Reason = "hiring"
    message: str = Field(min_length=10, max_length=2000)
    turnstile_token: str | None = Field(default=None, max_length=2048)
    # Honeypot: hidden in the form; people leave it empty, simple bots fill it.
    website: str = Field(default="", max_length=200)

    @field_validator("name")
    @classmethod
    def _one_line(cls, v: str) -> str:
        # No newlines in a value that ends up in an email subject.
        if "\n" in v or "\r" in v:
            raise ValueError("must be a single line")
        return v


class ContactOut(BaseModel):
    status: Literal["received"] = "received"
