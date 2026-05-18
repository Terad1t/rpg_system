"""add free_points and total_points_distributed to characters

Revision ID: 001_add_free_points
Revises: 
Create Date: 2026-05-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_add_free_points'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('characters', sa.Column('free_points', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('characters', sa.Column('total_points_distributed', sa.Integer(), nullable=True, server_default='0'))
    # optionally create an index
    op.create_index('idx_char_free_points', 'characters', ['free_points'], unique=False)


def downgrade():
    op.drop_index('idx_char_free_points', table_name='characters')
    op.drop_column('characters', 'total_points_distributed')
    op.drop_column('characters', 'free_points')
