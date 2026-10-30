
import os

from app.services.breaking_change_detector import (
    detect_breaking_changes,
    load_breaking_changes,
)


def test_automatic_rule_matching():

    repo_path = os.path.abspath(
        "../test-repo"
    )

    rules = load_breaking_changes()

    matching_rule = next(
        rule
        for rule in rules
        if rule["artifact_id"] == "example-library"
        and rule["old_version"] == "1.0.0"
    )

    findings = detect_breaking_changes(
        repo_path,
        matching_rule["library"],
        matching_rule["old_version"],
        matching_rule["new_version"],
    )

    assert len(findings) > 0

    assert any(
        finding["method"] == "getName"
        for finding in findings
    )

