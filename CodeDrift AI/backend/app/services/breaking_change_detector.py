import json
import os
import re


DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "breaking_changes.json"
)


def load_breaking_changes():
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)["changes"]


def detect_breaking_changes(repo_path, library, old_version, new_version):

    changes = load_breaking_changes()

    matching_changes = [
        change for change in changes
        if change["library"] == library
        and change["old_version"] == old_version
        and change["new_version"] == new_version
    ]

    findings = []

    for root, _, filenames in os.walk(repo_path):

        for filename in filenames:

            if not filename.endswith(".java"):
                continue

            file_path = os.path.join(root, filename)

            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    source = file.read()
            except (OSError, UnicodeDecodeError):
                continue

            for change in matching_changes:

                method = change["method"]

                pattern = rf"\.\s*{re.escape(method)}\s*\("

                for match in re.finditer(pattern, source):

                    line_number = source.count(
                        "\n", 0, match.start()
                    ) + 1

                    findings.append({
                        "file": os.path.relpath(file_path, repo_path),
                        "line": line_number,
                        "method": method,
                        "replacement": change["replacement"],
                        "change_type": change["change_type"],
                        "description": change["description"],
                        "risk": "HIGH"
                    })

    return findings