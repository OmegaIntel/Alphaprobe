from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from db_models.users import Base as UserBase
from db_models.demo_requests import Base as DemoRequestBase
from db_models.deals import Base as DealsBase
from db_models.task_status import Base as TaskStatusBase
from db_models.workspace import Base as WorkspaceBase
from db_models.checklist import Base as ChecklistBase
from db_models.knowledgebase import Base as KnowledgeBase
from db_models.file_upload import Base as DocumentBase
from alembic import context
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_USER_NAME = os.getenv('DATABASE_USER_NAME')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
DATABASE_HOST = os.getenv('DATABASE_HOST')
DATABASE_PORT = int(os.getenv('DATABASE_PORT'))
DATABASE_NAME = os.getenv('DATABASE_NAME')

DATABASE_URL = f"mysql+mysqldb://{DATABASE_USER_NAME}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config
config.set_main_option('sqlalchemy.url', DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = [UserBase.metadata,DemoRequestBase.metadata,DealsBase.metadata,TaskStatusBase.metadata,WorkspaceBase.metadata,KnowledgeBase.metadata,ChecklistBase.metadata,DocumentBase.metadata]

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
