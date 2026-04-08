"""Generic Alembic environment script template."""
<%text>
This file is a template used by Alembic when creating new revision files.
Customize if necessary.
</%text>

"""
Revision ID: ${up_revision}
Revises: ${down_revision | none}
Create Date: ${create_date}
"""

from alembic import op
import sqlalchemy as sa

${imports if imports else ""}

def upgrade():
    ${upgrades if upgrades else "pass"}


def downgrade():
    ${downgrades if downgrades else "pass"}
