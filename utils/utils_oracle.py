from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.db_models import PDFFiles
from db.db_config import engine


async def get_pdf_content(file_id: int):
    async with AsyncSession(engine) as session:
        async with session.begin():
            pdf_file = await session.execute(
                select(PDFFiles).where(PDFFiles.file_id == file_id)
            )
            pdf_file = pdf_file.scalar_one_or_none()

            # Create a detached copy of the data before the session closes
            if pdf_file:
                return {
                    "file_id": pdf_file.file_id,
                    "file_name": pdf_file.file_name,
                    "base64_data": pdf_file.base64_data,
                    "created_at": pdf_file.created_at,
                }

    return None
