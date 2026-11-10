"""Content tables: profile, skills, experience, education, projects, about, lab, graph extras.

Revision ID: 0001
Revises:
Create Date: 2026-11-10 22:32:52.452995
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "about_area",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_about_area")),
    )
    op.create_table(
        "about_step",
        sa.Column("position", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("position", name=op.f("pk_about_step")),
    )
    op.create_table(
        "education",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_education")),
    )
    op.create_table(
        "graph_edge",
        sa.Column("position", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("src", sa.String(length=128), nullable=False),
        sa.Column("dst", sa.String(length=128), nullable=False),
        sa.Column("rel", sa.String(length=16), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.CheckConstraint(
            "rel IN ('USED', 'BUILT_AT', 'WORKED_AT', 'RELATED', 'BUILT_ON', 'DEMONSTRATES')",
            name=op.f("ck_graph_edge_rel"),
        ),
        sa.CheckConstraint("src <> dst", name=op.f("ck_graph_edge_no_self_loop")),
        sa.PrimaryKeyConstraint("position", name=op.f("pk_graph_edge")),
    )
    op.create_table(
        "graph_topic",
        sa.Column("id", sa.String(length=96), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_graph_topic")),
    )
    op.create_table(
        "lab_entry",
        sa.Column("position", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("position", name=op.f("pk_lab_entry")),
    )
    op.create_table(
        "organization",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_organization")),
    )
    op.create_table(
        "profile",
        sa.Column("id", sa.SmallInteger(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.CheckConstraint("id = 1", name=op.f("ck_profile_singleton")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profile")),
    )
    op.create_table(
        "skill",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("proficiency", sa.String(length=16), nullable=True),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.CheckConstraint(
            "category IN ('frontend', 'cad', 'documents', 'realtime', 'performance', "
            "'backend', 'ai', 'fundamentals', 'leadership')",
            name=op.f("ck_skill_category"),
        ),
        sa.CheckConstraint(
            "proficiency IS NULL OR proficiency IN ('strong', 'good', 'learning')",
            name=op.f("ck_skill_proficiency"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skill")),
    )
    op.create_index(op.f("ix_skill_category"), "skill", ["category"], unique=False)
    op.create_table(
        "education_skill",
        sa.Column("education_id", sa.String(length=64), nullable=False),
        sa.Column("skill_id", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["education_id"],
            ["education.id"],
            name=op.f("fk_education_skill_education_id_education"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skill.id"],
            name=op.f("fk_education_skill_skill_id_skill"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("education_id", "skill_id", name=op.f("pk_education_skill")),
    )
    op.create_index(
        op.f("ix_education_skill_skill_id"), "education_skill", ["skill_id"], unique=False
    )
    op.create_table(
        "project",
        sa.Column("slug", sa.String(length=96), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("org_id", sa.String(length=64), nullable=True),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.CheckConstraint("type IN ('professional', 'personal')", name=op.f("ck_project_type")),
        sa.ForeignKeyConstraint(
            ["org_id"], ["organization.id"], name=op.f("fk_project_org_id_organization")
        ),
        sa.PrimaryKeyConstraint("slug", name=op.f("pk_project")),
    )
    op.create_index(op.f("ix_project_org_id"), "project", ["org_id"], unique=False)
    op.create_table(
        "role",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.String(length=64), nullable=False),
        sa.Column("start", sa.String(length=7), nullable=False),
        sa.Column("end", sa.String(length=7), nullable=True),
        sa.Column("doc", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(
            ["org_id"], ["organization.id"], name=op.f("fk_role_org_id_organization")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_role")),
    )
    op.create_index(op.f("ix_role_org_id"), "role", ["org_id"], unique=False)
    op.create_table(
        "project_skill",
        sa.Column("project_slug", sa.String(length=96), nullable=False),
        sa.Column("skill_id", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_slug"],
            ["project.slug"],
            name=op.f("fk_project_skill_project_slug_project"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skill.id"],
            name=op.f("fk_project_skill_skill_id_skill"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("project_slug", "skill_id", name=op.f("pk_project_skill")),
    )
    op.create_index(op.f("ix_project_skill_skill_id"), "project_skill", ["skill_id"], unique=False)
    op.create_table(
        "role_skill",
        sa.Column("role_id", sa.String(length=64), nullable=False),
        sa.Column("skill_id", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["role_id"], ["role.id"], name=op.f("fk_role_skill_role_id_role"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["skill_id"],
            ["skill.id"],
            name=op.f("fk_role_skill_skill_id_skill"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("role_id", "skill_id", name=op.f("pk_role_skill")),
    )
    op.create_index(op.f("ix_role_skill_skill_id"), "role_skill", ["skill_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_role_skill_skill_id"), table_name="role_skill")
    op.drop_table("role_skill")
    op.drop_index(op.f("ix_project_skill_skill_id"), table_name="project_skill")
    op.drop_table("project_skill")
    op.drop_index(op.f("ix_role_org_id"), table_name="role")
    op.drop_table("role")
    op.drop_index(op.f("ix_project_org_id"), table_name="project")
    op.drop_table("project")
    op.drop_index(op.f("ix_education_skill_skill_id"), table_name="education_skill")
    op.drop_table("education_skill")
    op.drop_index(op.f("ix_skill_category"), table_name="skill")
    op.drop_table("skill")
    op.drop_table("profile")
    op.drop_table("organization")
    op.drop_table("lab_entry")
    op.drop_table("graph_topic")
    op.drop_table("graph_edge")
    op.drop_table("education")
    op.drop_table("about_step")
    op.drop_table("about_area")
