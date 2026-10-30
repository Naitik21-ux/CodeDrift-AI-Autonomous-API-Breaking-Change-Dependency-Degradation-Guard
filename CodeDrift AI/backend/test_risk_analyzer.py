from app.services.risk_analyzer import analyze_risks


def test_removed_method_is_high_risk():
    findings = [
        {
            "method": "getName",
            "change_type": "removed",
            "replacement": "getFullName"
        }
    ]

    results = analyze_risks(findings)

    assert results[0]["risk"] == "HIGH"


def test_deprecated_method_is_medium_risk():
    findings = [
        {
            "method": "getAge",
            "change_type": "deprecated",
            "replacement": "getAgeInYears"
        }
    ]

    results = analyze_risks(findings)

    assert results[0]["risk"] == "MEDIUM"


def test_unknown_change_is_low_risk():
    findings = [
        {
            "method": "getAddress",
            "change_type": "unknown",
            "replacement": None
        }
    ]

    results = analyze_risks(findings)

    assert results[0]["risk"] == "LOW"


def test_original_findings_are_not_modified():
    findings = [
        {
            "method": "getName",
            "change_type": "removed",
            "replacement": "getFullName"
        }
    ]

    original_findings = [finding.copy() for finding in findings]

    analyze_risks(findings)

    assert findings == original_findings    