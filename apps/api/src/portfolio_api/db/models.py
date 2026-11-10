"""Database tables for portfolio content (SQLAlchemy 2 typed ORM models).

Design: each row keeps the columns we query, join or sort on (ids, foreign keys,
`position`), plus `doc`, a JSONB copy of the original content object. The API
returns `doc`, so responses keep exactly the shapes in `content/schemas/`
without one column per display field. Relations that must stay valid
(project → skill, role → org, …) are real foreign keys, so Postgres itself
refuses a project that points at a skill that doesn't exist.

Graph nodes are not stored here: they are derived from these tables (Phase 2 PR 3).
Only the hand-written extras from `graph.json` (topics, extra edges) get tables.
"""

from typing import Any

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Integer,
    MetaData,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Stable constraint names, so Alembic migrations can refer to them later.
NAMING = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

SKILL_CATEGORIES = (
    "frontend",
    "cad",
    "documents",
    "realtime",
    "performance",
    "backend",
    "ai",
    "fundamentals",
    "leadership",
)

# Same list as graph.schema.json → edges.rel.
EDGE_RELS = ("USED", "BUILT_AT", "WORKED_AT", "RELATED", "BUILT_ON", "DEMONSTRATES")

Doc = dict[str, Any]


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING)
    type_annotation_map = {Doc: JSONB}  # noqa: RUF012 (SQLAlchemy class config)


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


class Profile(Base):
    """The single profile document (always id 1)."""

    __tablename__ = "profile"
    __table_args__ = (CheckConstraint("id = 1", name="singleton"),)

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, default=1)
    doc: Mapped[Doc]


class Organization(Base):
    __tablename__ = "organization"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(Text)
    doc: Mapped[Doc]


class Skill(Base):
    __tablename__ = "skill"
    __table_args__ = (
        CheckConstraint(_in("category", SKILL_CATEGORIES), name="category"),
        CheckConstraint(
            "proficiency IS NULL OR proficiency IN ('strong', 'good', 'learning')",
            name="proficiency",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(32), index=True)
    proficiency: Mapped[str | None] = mapped_column(String(16))
    doc: Mapped[Doc]


class Role(Base):
    """A job role at an organization (`experience.json` → roles)."""

    __tablename__ = "role"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    org_id: Mapped[str] = mapped_column(ForeignKey("organization.id"), index=True)
    start: Mapped[str] = mapped_column(String(7))  # "YYYY-MM"
    end: Mapped[str | None] = mapped_column(String(7))  # None = present
    doc: Mapped[Doc]


class Education(Base):
    __tablename__ = "education"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    doc: Mapped[Doc]


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (CheckConstraint("type IN ('professional', 'personal')", name="type"),)

    slug: Mapped[str] = mapped_column(String(96), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(16))
    featured: Mapped[bool] = mapped_column(default=False)
    org_id: Mapped[str | None] = mapped_column(ForeignKey("organization.id"), index=True)
    # The case study itself; `doc.body` keeps only the seed file path.
    body_markdown: Mapped[str] = mapped_column(Text, default="")
    doc: Mapped[Doc]


# Link tables: many-to-many "uses skill" relations, with real foreign keys.
# Deleting a project/role/education removes its links; deleting a skill that
# is still used is refused (RESTRICT), so the graph can never dangle.


class ProjectSkill(Base):
    __tablename__ = "project_skill"

    project_slug: Mapped[str] = mapped_column(
        ForeignKey("project.slug", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(
        ForeignKey("skill.id", ondelete="RESTRICT"), primary_key=True, index=True
    )


class RoleSkill(Base):
    __tablename__ = "role_skill"

    role_id: Mapped[str] = mapped_column(
        ForeignKey("role.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(
        ForeignKey("skill.id", ondelete="RESTRICT"), primary_key=True, index=True
    )


class EducationSkill(Base):
    __tablename__ = "education_skill"

    education_id: Mapped[str] = mapped_column(
        ForeignKey("education.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(
        ForeignKey("skill.id", ondelete="RESTRICT"), primary_key=True, index=True
    )


class AboutArea(Base):
    """An "Experience areas" card on the About section."""

    __tablename__ = "about_area"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    doc: Mapped[Doc]


class AboutStep(Base):
    """A "How I work" step (plain text), ordered by `position`."""

    __tablename__ = "about_step"

    position: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    text: Mapped[str] = mapped_column(Text)


class LabEntry(Base):
    """One topic on the learning timeline."""

    __tablename__ = "lab_entry"

    position: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    topic: Mapped[str] = mapped_column(Text)
    doc: Mapped[Doc]


class GraphTopic(Base):
    """Hand-written graph topic node (`graph.json` → topics)."""

    __tablename__ = "graph_topic"

    id: Mapped[str] = mapped_column(String(96), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    doc: Mapped[Doc]


class GraphEdge(Base):
    """Hand-written extra edge (`graph.json` → edges) between derived node ids."""

    __tablename__ = "graph_edge"
    __table_args__ = (
        CheckConstraint("src <> dst", name="no_self_loop"),
        CheckConstraint(_in("rel", EDGE_RELS), name="rel"),
    )

    position: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    src: Mapped[str] = mapped_column(String(128))
    dst: Mapped[str] = mapped_column(String(128))
    rel: Mapped[str] = mapped_column(String(16))
    doc: Mapped[Doc]
