"""create character_attributes and attribute_distribution_log tables

Revision ID: 002_create_character_attributes
Revises: 001_add_free_points
Create Date: 2026-05-18 00:10:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '002_create_character_attributes'
down_revision = '001_add_free_points'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'character_attributes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('attribute_name', sa.String(length=50), nullable=False),
        sa.Column('base_value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('distributed_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('equipment_bonus', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('buff_multiplier', sa.Numeric(3,2), nullable=False, server_default='1.00'),
        sa.Column('calculated_at', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'attribute_distribution_log',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('attribute_name', sa.String(length=50), nullable=False),
        sa.Column('old_value', sa.Integer(), nullable=True),
        sa.Column('new_value', sa.Integer(), nullable=True),
        sa.Column('operation', sa.String(length=10), nullable=False),
        sa.Column('distributed_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('attribute_distribution_log')
    op.drop_table('character_attributes')
