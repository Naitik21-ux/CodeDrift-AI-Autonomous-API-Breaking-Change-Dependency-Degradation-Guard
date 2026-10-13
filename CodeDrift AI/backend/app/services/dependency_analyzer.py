import os
import re
import xml.etree.ElementTree as ET


def analyze_dependencies(repo_path, project_type):

    if project_type == "Python":
        return analyze_python_dependencies(repo_path)

    if project_type == "Java / Maven":
        return analyze_maven_dependencies(repo_path)

    return []


def analyze_python_dependencies(repo_path):

    file_path = os.path.join(repo_path, "requirements.txt")

    if not os.path.exists(file_path):
        return []

    dependencies = []

    with open(file_path, "r", encoding="utf-8") as file:

        for line in file:

            line = line.strip()

            if not line or line.startswith("#"):
                continue

            match = re.match(r"^([A-Za-z0-9_.-]+)(?:==(.+))?$", line)

            if match:

                dependencies.append({
                    "name": match.group(1),
                    "version": match.group(2)
                })

    return dependencies


def analyze_maven_dependencies(repo_path):

    pom_path = os.path.join(repo_path, "pom.xml")

    if not os.path.exists(pom_path):
        return []

    tree = ET.parse(pom_path)
    root = tree.getroot()

    namespace = {
        "m": "http://maven.apache.org/POM/4.0.0"
    }

    dependencies = []

    for dependency in root.findall(
        ".//m:dependency",
        namespace
    ):

        group_id = dependency.find(
            "m:groupId",
            namespace
        )

        artifact_id = dependency.find(
            "m:artifactId",
            namespace
        )

        version = dependency.find(
            "m:version",
            namespace
        )

        dependencies.append({
            "group_id": group_id.text if group_id is not None else None,
            "artifact_id": artifact_id.text if artifact_id is not None else None,
            "version": version.text if version is not None else None
        })

    return dependencies