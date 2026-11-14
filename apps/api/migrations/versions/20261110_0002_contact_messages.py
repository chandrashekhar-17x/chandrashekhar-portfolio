"""Contact form messages (salted IP hash, delivery status).

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-10 22:48:55.776528
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "contact_message",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("reason", sa.String(length=16), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("ip_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.CheckConstraint(
            "reason IN ('hiring', 'freelance', 'hello')", name=op.f("ck_contact_message_reason")
        ),
        sa.CheckConstraint(
            "status IN ('stored', 'emailed', 'email_failed')",
            name=op.f("ck_contact_message_status"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contact_message")),
    )
    op.create_index(
        op.f("ix_contact_message_created_at"), "contact_message", ["created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_contact_message_created_at"), table_name="contact_message")
    op.drop_table("contact_message")
