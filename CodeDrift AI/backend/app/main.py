from importlib.resources import files

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.services.dependency_analyzer import analyze_dependencies

from app.services.github_service import clone_repository
from app.services.repository_scanner import (
    scan_repository,
    detect_project_type
)


app = FastAPI(title="CodeDrift AI")


class ScanRequest(BaseModel):
    repo_url: str


@app.get("/")
def home():
    return {
        "message": "CodeDrift AI Backend is Running"
    }


@app.post("/scan")
def scan(data: ScanRequest):

    try:

        repo_path = clone_repository(data.repo_url)

        files = scan_repository(repo_path)

        project_type = detect_project_type(files)

        dependencies = analyze_dependencies(
            repo_path,
            project_type
        )

        return {
            "message": "Repository scanned successfully",
            "repository": data.repo_url,
            "project_type": project_type,
            "total_files": len(files),
            "dependencies": dependencies,
            "files": files
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )