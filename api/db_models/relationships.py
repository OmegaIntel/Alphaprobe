from sqlalchemy.orm import relationship, configure_mappers
from .users import User
from .projects import Project  # Ensure lowercase, consistent with filename
from .reports import ReportTable
from .documents import DocumentTable

# Define relationships after models are loaded
User.projects = relationship(Project, back_populates="user", cascade="all, delete")
Project.user = relationship(User, back_populates="projects")

Project.documents = relationship(DocumentTable, back_populates="project", cascade="all, delete")
Project.reports = relationship(ReportTable, back_populates="project", cascade="all, delete")

ReportTable.project = relationship(Project, back_populates="reports")
DocumentTable.project = relationship(Project, back_populates="documents")

# Ensure SQLAlchemy finalizes all model mappings
configure_mappers()