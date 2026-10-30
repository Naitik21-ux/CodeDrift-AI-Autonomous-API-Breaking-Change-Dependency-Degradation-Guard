import json
import os
import re

from app.services.risk_analyzer import analyze_risks

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "breaking_changes.json"
)

IGNORED_DIRECTORIES = {
    ".git",
    "target",
    "build",
    "out",
    ".venv",
    "venv"
}


def load_breaking_changes():
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)["changes"]


def detect_breaking_changes(
    repo_path,
    library,
    old_version,
    new_version
):
    changes = load_breaking_changes()

    matching_changes = [
        change for change in changes
        if change["library"] == library
        and change["old_version"] == old_version
        and change["new_version"] == new_version
    ]

    findings = []
    seen_findings = set()

    for root, directories, filenames in os.walk(repo_path):

        # Skip generated and irrelevant directories.
        directories[:] = [
            directory for directory in directories
            if directory not in IGNORED_DIRECTORIES
        ]

        for filename in filenames:

            if not filename.endswith(".java"):
                continue

            file_path = os.path.join(root, filename)

            try:
                with open(
                    file_path,
                    "r",
                    encoding="utf-8"
                ) as file:
                    source = file.read()

            except (OSError, UnicodeDecodeError):
                continue

            for change in matching_changes:

                method = change["method"]

                # Detect method calls such as:
                # user.getName()
                # this.getName()
                # getName()
                pattern = (
                    rf"(?<![\w$])"
                    rf"[\w$]+\s*\.\s*"
                    rf"{re.escape(method)}"
                    rf"\s*\("
                )

                for match in re.finditer(pattern, source):

                    line_number = (
                        source.count("\n", 0, match.start()) + 1
                    )

                    relative_path = os.path.relpath(
                        file_path,
                        repo_path
                    )

                    finding_key = (
                        relative_path,
                        line_number,
                        method,
                        change["change_type"],
                        change["replacement"]
                    )

                    # Prevent duplicate findings.
                    if finding_key in seen_findings:
                        continue

                    seen_findings.add(finding_key)

                    findings.append({
                        "file": relative_path,
                        "line": line_number,
                        "method": method,
                        "replacement": change["replacement"],
                        "change_type": change["change_type"],
                        "description": change["description"],
                        "source_type": change.get("source_type", "mock_rule"),
                        "verified": change.get("verified", False)
                    })  

    return analyze_risks(findings)