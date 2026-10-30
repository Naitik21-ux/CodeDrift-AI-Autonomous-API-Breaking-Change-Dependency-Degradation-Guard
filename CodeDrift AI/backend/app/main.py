
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.dependency_analyzer import analyze_dependencies
from app.services.github_service import clone_repository
from app.services.breaking_change_detector import (
    detect_breaking_changes,
    load_breaking_changes,
)
from app.services.risk_analyzer import analyze_risks
from app.services.repository_scanner import (
    scan_repository,
    detect_project_type,
)


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="CodeDrift AI",
    description=(
        "Autonomous API Breaking-Change "
        "and Dependency Degradation Guard"
    ),
    version="0.1.0",
)


# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request Model
# --------------------------------------------------

class ScanRequest(BaseModel):
    repo_url: str
    library: str | None = None
    old_version: str | None = None
    new_version: str | None = None


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "CodeDrift AI Backend is Running",
        "version": "0.1.0",
    }


# --------------------------------------------------
# Repository Scan Route
# --------------------------------------------------

@app.post("/scan")
def scan(data: ScanRequest):

    try:

        # 1. Clone GitHub repository
        repo_path = clone_repository(
            data.repo_url
        )

        # 2. Scan repository files
        files = scan_repository(
            repo_path
        )

        # 3. Detect project type
        project_type = detect_project_type(
            files
        )

        # 4. Extract dependencies
        dependencies = analyze_dependencies(
            repo_path,
            project_type
        )

        # 5. Load breaking-change rules
        rules = load_breaking_changes()

        findings = []

        # --------------------------------------------------
        # 6. Manual Breaking-Change Scan
        # --------------------------------------------------

        if (
            data.library
            and data.old_version
            and data.new_version
        ):

            matching_dependency = any(
                dependency.get("artifact_id") == data.library
                and dependency.get("version") == data.old_version
                for dependency in dependencies
            )

            if matching_dependency:

                findings = detect_breaking_changes(
                    repo_path,
                    data.library,
                    data.old_version,
                    data.new_version,
                )

        # --------------------------------------------------
        # 7. Automatic Breaking-Change Scan
        # --------------------------------------------------

        else:

            for dependency in dependencies:

                artifact_id = dependency.get(
                    "artifact_id"
                )

                current_version = dependency.get(
                    "version"
                )

                # Skip dependencies without Maven coordinates
                if not artifact_id or not current_version:
                    continue

                for rule in rules:

                    rule_artifact = rule.get(
                        "artifact_id"
                    )

                    rule_old_version = rule.get(
                        "old_version"
                    )

                    # Match dependency against known rule
                    if (
                        rule_artifact == artifact_id
                        and rule_old_version == current_version
                    ):

                        detected = detect_breaking_changes(
                            repo_path,
                            rule["library"],
                            rule["old_version"],
                            rule["new_version"],
                        )

                        findings.extend(
                            detected
                        )

        # --------------------------------------------------
        # 8. Analyze Risk Levels
        # --------------------------------------------------

        findings = analyze_risks(
            findings
        )

        # --------------------------------------------------
        # 9. Calculate Risk Summary
        # --------------------------------------------------

        risk_summary = {
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0,
        }

        for finding in findings:

            risk = finding.get(
                "risk",
                "LOW"
            )

            if risk in risk_summary:
                risk_summary[risk] += 1

        # --------------------------------------------------
        # 10. Calculate Verification Summary
        # --------------------------------------------------

        mock_findings = sum(
            1
            for finding in findings
            if finding.get("verified") is False
        )

        verified_findings = sum(
            1
            for finding in findings
            if finding.get("verified") is True
        )

        verification_summary = {
            "mock_findings": mock_findings,
            "verified_findings": verified_findings,
            "message": (
                "Findings are based on mock rules and have not "
                "been independently verified."
                if mock_findings > 0
                else "No mock-rule findings were detected."
            ),
        }

        # --------------------------------------------------
        # 11. Return Scan Results
        # --------------------------------------------------

        return {
            "message": "Repository analyzed successfully",

            "repository": data.repo_url,

            "project_type": project_type,

            "total_files": len(files),

            "total_dependencies": len(dependencies),

            "dependencies": dependencies,

            "total_breaking_changes": len(findings),

            "risk_summary": risk_summary,

            "verification_summary": verification_summary,

            "breaking_changes": findings,
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )
