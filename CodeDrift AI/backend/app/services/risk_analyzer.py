
def calculate_risk(finding):
    """
    Assign a risk level based on the type of breaking change.
    """

    change_type = finding.get(
        "change_type",
        ""
    ).lower()

    if change_type in [
        "removed",
        "signature_changed",
        "parameter_changed"
    ]:
        return "HIGH"

    if change_type in [
        "deprecated",
        "behavior_changed"
    ]:
        return "MEDIUM"

    return "LOW"


def analyze_risks(findings):
    """
    Add a risk level to every breaking-change finding.
    """

    analyzed_findings = []

    for finding in findings:

        updated_finding = finding.copy()

        updated_finding["risk"] = calculate_risk(
            finding
        )

        analyzed_findings.append(
            updated_finding
        )

    return analyzed_findings
