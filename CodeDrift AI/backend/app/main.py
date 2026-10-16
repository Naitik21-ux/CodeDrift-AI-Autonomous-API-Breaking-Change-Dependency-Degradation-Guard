from importlib.resources import files

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.services.dependency_analyzer import analyze_dependencies


from app.services.github_service import clone_repository
from app.services.breaking_change_detector import detect_breaking_changes
from app.services.repository_scanner import (
    scan_repository,
    detect_project_type
)


app = FastAPI(title="CodeDrift AI")


class ScanRequest(BaseModel):
    repo_url: str
    library: str | None = None
    old_version: str | None = None
    new_version: str | None = None


@app.get("/")
def home():
    return {
        "message": "CodeDrift AI Backend is Running"
    }


@app.post("/scan")
def scan(data: ScanRequest):

    try:
        # Clone the GitHub repository
        repo_path = clone_repository(data.repo_url)

        # Scan repository files
        files = scan_repository(repo_path)

        # Detect project type
        project_type = detect_project_type(files)

        # Extract dependencies
        dependencies = analyze_dependencies(
            repo_path,
            project_type
        )

        # Detect potential breaking changes
        findings = []

        if data.library and data.old_version and data.new_version:
            findings = detect_breaking_changes(
                repo_path,
                data.library,
                data.old_version,
                data.new_version
            )

        return {
            "message": "Repository analyzed successfully",
            "repository": data.repo_url,
            "project_type": project_type,
            "total_files": len(files),
            "dependencies": dependencies,
            "breaking_changes": findings
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )