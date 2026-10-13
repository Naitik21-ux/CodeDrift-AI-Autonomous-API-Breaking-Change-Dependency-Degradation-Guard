import os


def scan_repository(repo_path):

    files = []

    for root, dirs, filenames in os.walk(repo_path):

        if ".git" in dirs:
            dirs.remove(".git")

        for filename in filenames:
            files.append(
                os.path.relpath(
                    os.path.join(root, filename),
                    repo_path
                )
            )

    return files


def detect_project_type(files):

    if "pom.xml" in files:
        return "Java / Maven"

    if "build.gradle" in files or "build.gradle.kts" in files:
        return "Java / Gradle"

    if "package.json" in files:
        return "JavaScript / Node.js"

    if "requirements.txt" in files:
        return "Python"

    return "Unknown"