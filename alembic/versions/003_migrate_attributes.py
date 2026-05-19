"""migrate attributes -> character_attributes and drop attributes table

Revision ID: 003_migrate_attributes
Revises: 002_create_character_attributes
Create Date: 2026-05-18 00:20:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '003_migrate_attributes'
down_revision = '002_create_character_attributes'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # copy rows from attributes to character_attributes
    conn.execute(sa.text(
        "INSERT INTO character_attributes (character_id, attribute_name, base_value, distributed_points, equipment_bonus, buff_multiplier, calculated_at) "
        "SELECT character_id, name, value, 0, 0, 1.0, NULL FROM attributes"
    ))
    # drop old table
    op.drop_table('attributes')


def downgrade():
    # recreate attributes table and copy back
    op.create_table(
        'attributes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Integer(), nullable=False),
    )
    conn = op.get_bind()
    conn.execute(sa.text(
        "INSERT INTO attributes (character_id, name, value) "
        "SELECT character_id, attribute_name, base_value FROM character_attributes"
    ))
    op.drop_table('character_attributes')
    op.drop_table('attribute_distribution_log')
