import os

from app.services.breaking_change_detector import (
    detect_breaking_changes
)


REPO_PATH = os.path.join(
    "test_fixtures",
    "breaking_changes"
)


def test_detects_matching_method_call():
    findings = detect_breaking_changes(
        REPO_PATH,
        "example-library",
        "1.0.0",
        "2.0.0"
    )

    matching_findings = [
        finding for finding in findings
        if finding["method"] == "getName"
    ]

    assert len(matching_findings) >= 1


def test_finding_contains_required_fields():
    findings = detect_breaking_changes(
        REPO_PATH,
        "example-library",
        "1.0.0",
        "2.0.0"
    )

    assert len(findings) > 0

    finding = findings[0]

    assert "file" in finding
    assert "line" in finding
    assert "method" in finding
    assert "replacement" in finding
    assert "change_type" in finding
    assert "description" in finding
    assert "risk" in finding


def test_detected_finding_has_high_risk():
    findings = detect_breaking_changes(
        REPO_PATH,
        "example-library",
        "1.0.0",
        "2.0.0"
    )

    matching_findings = [
        finding for finding in findings
        if finding["method"] == "getName"
    ]

    assert matching_findings
    assert matching_findings[0]["risk"] == "HIGH"


def test_no_findings_for_unmatched_version():
    findings = detect_breaking_changes(
        REPO_PATH,
        "example-library",
        "1.0.0",
        "9.0.0"
    )

    assert findings == []


def test_method_declaration_is_not_detected():
    findings = detect_breaking_changes(
        REPO_PATH,
        "example-library",
        "1.0.0",
        "2.0.0"
    )

    matching_findings = [
        finding for finding in findings
        if finding["method"] == "getName"
    ]

    assert len(matching_findings) == 1
    assert matching_findings[0]["line"] == 15