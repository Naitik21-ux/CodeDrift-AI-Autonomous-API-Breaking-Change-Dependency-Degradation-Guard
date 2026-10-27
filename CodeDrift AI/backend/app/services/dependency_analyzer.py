
import os
import re
import xml.etree.ElementTree as ET
import subprocess


# Matches Maven properties such as ${spring.version}
PROPERTY_PATTERN = re.compile(r"\$\{([^}]+)\}")


def analyze_dependencies(repo_path, project_type):
    if project_type == "Python":
        return analyze_python_dependencies(repo_path)

    if project_type == "Java / Maven":
        return analyze_maven_dependencies(repo_path)

    return []


# --------------------------------------------------
# Generate Maven Effective POM
# --------------------------------------------------

def generate_effective_pom(repo_path):
    repo_path = os.path.abspath(repo_path)

    pom_path = os.path.join(
        repo_path,
        "pom.xml"
    )
    effective_pom_path = os.path.join(
        repo_path,
        "effective-pom.xml"
    )

    if not os.path.isfile(pom_path):
        return None

    try:
        result = subprocess.run(
            [
                "cmd",
                "/c",
                "mvn",
                "-f",
                pom_path,
                "help:effective-pom",
                f"-Doutput={effective_pom_path}"
            ],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            print("Maven effective POM generation failed:")
            print(result.stderr)
            return None

        if os.path.isfile(effective_pom_path):
            return effective_pom_path

    except FileNotFoundError:
        print("Maven executable was not found.")

    except subprocess.TimeoutExpired:
        print("Maven effective POM generation timed out.")

    return None


# --------------------------------------------------
# Python Dependency Analyzer
# --------------------------------------------------

def analyze_python_dependencies(repo_path):
    file_path = os.path.join(
        repo_path,
        "requirements.txt"
    )

    if not os.path.isfile(file_path):
        return []

    dependencies = []

    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            # Ignore pip options and editable installs
            if line.startswith(("-", "--")):
                continue

            # Supports:
            # Flask==3.0.3
            # pandas>=2.0
            # requests~=2.31
            # numpy
            # package[extra]==1.0

            match = re.match(
                r"^([A-Za-z0-9_.-]+)"
                r"(?:\[[^\]]+\])?"
                r"\s*"
                r"(?:(==|===|~=|>=|<=|!=|>|<)\s*([^;\s]+))?",
                line
            )

            if not match:
                continue

            dependencies.append({
                "name": match.group(1),
                "version": match.group(3),
                "version_operator": match.group(2)
            })

    return dependencies


# --------------------------------------------------
# Original Maven POM Analyzer (Fallback)
# --------------------------------------------------

def analyze_maven_dependencies_original(repo_path):
    pom_path = os.path.join(repo_path, "pom.xml")

    if not os.path.isfile(pom_path):
        return []

    try:
        tree = ET.parse(pom_path)

    except (ET.ParseError, OSError) as error:
        print(f"Could not parse Maven pom.xml: {error}")
        return []

    root = tree.getroot()

    namespace_uri = (
        root.tag.split("}")[0].lstrip("{")
        if root.tag.startswith("{")
        else ""
    )

    def tag(name):
        if namespace_uri:
            return f"{{{namespace_uri}}}{name}"

        return name

    def child_text(element, name):
        child = element.find(tag(name))

        if child is None or child.text is None:
            return None

        return child.text.strip()

    # Read properties from the current POM
    properties = {}

    properties_element = root.find(tag("properties"))

    if properties_element is not None:
        for property_element in properties_element:
            property_name = property_element.tag.split("}")[-1]

            if property_element.text:
                properties[property_name] = property_element.text.strip()

    # Resolve local property references
    def resolve_properties(value):
        if value is None:
            return None

        resolved = value

        for _ in range(10):
            matches = list(
                PROPERTY_PATTERN.finditer(resolved)
            )

            if not matches:
                break

            previous = resolved

            for match in matches:
                property_name = match.group(1)

                if property_name in properties:
                    resolved = resolved.replace(
                        match.group(0),
                        properties[property_name]
                    )

            if resolved == previous:
                break

        return resolved

    # Collect dependencyManagement versions
    managed_versions = {}

    dependency_management = root.find(
        tag("dependencyManagement")
    )

    if dependency_management is not None:
        managed_dependencies = dependency_management.find(
            tag("dependencies")
        )

        if managed_dependencies is not None:
            for dependency in managed_dependencies.findall(
                tag("dependency")
            ):
                group_id = resolve_properties(
                    child_text(dependency, "groupId")
                )

                artifact_id = resolve_properties(
                    child_text(dependency, "artifactId")
                )

                version = resolve_properties(
                    child_text(dependency, "version")
                )

                if group_id and artifact_id and version:
                    managed_versions[
                        (group_id, artifact_id)
                    ] = version

    # Read direct project dependencies
    dependencies_element = root.find(
        tag("dependencies")
    )

    if dependencies_element is None:
        return []

    dependencies = []

    for dependency in dependencies_element.findall(
        tag("dependency")
    ):
        group_id = resolve_properties(
            child_text(dependency, "groupId")
        )

        artifact_id = resolve_properties(
            child_text(dependency, "artifactId")
        )

        raw_version = child_text(
            dependency,
            "version"
        )

        version = resolve_properties(raw_version)

        # Use dependencyManagement if version is missing
        if not version and group_id and artifact_id:
            version = managed_versions.get(
                (group_id, artifact_id)
            )

        dependencies.append({
            "group_id": group_id,
            "artifact_id": artifact_id,
            "version": version,
            "version_source": (
                "direct"
                if raw_version is not None
                else (
                    "dependency_management"
                    if version is not None
                    else "unresolved"
                )
            )
        })

    return dependencies


# --------------------------------------------------
# Parse Maven Effective POM
# --------------------------------------------------

def parse_effective_pom(effective_pom_path):
    try:
        tree = ET.parse(effective_pom_path)
        root = tree.getroot()

    except (ET.ParseError, OSError) as error:
        print(f"Could not parse effective POM: {error}")
        return []

    namespace_uri = (
        root.tag.split("}")[0].lstrip("{")
        if root.tag.startswith("{")
        else ""
    )

    def tag(name):
        if namespace_uri:
            return f"{{{namespace_uri}}}{name}"

        return name

    dependencies_element = root.find(
        tag("dependencies")
    )

    if dependencies_element is None:
        return []

    dependencies = []

    for dependency in dependencies_element.findall(
        tag("dependency")
    ):

        def child_text(name):
            child = dependency.find(tag(name))

            if child is None or child.text is None:
                return None

            return child.text.strip()

        dependencies.append({
            "group_id": child_text("groupId"),
            "artifact_id": child_text("artifactId"),
            "version": child_text("version"),
            "version_source": "effective_pom"
        })

    return dependencies


# --------------------------------------------------
# Maven Dependency Analyzer
# --------------------------------------------------

def analyze_maven_dependencies(repo_path):
    pom_path = os.path.join(
        repo_path,
        "pom.xml"
    )

    if not os.path.isfile(pom_path):
        return []

    effective_pom_path = generate_effective_pom(
        repo_path
    )

    if effective_pom_path:
        dependencies = parse_effective_pom(
            effective_pom_path
        )

        if dependencies:
            return dependencies

    print("Falling back to original pom.xml")

    return analyze_maven_dependencies_original(
        repo_path
    )

