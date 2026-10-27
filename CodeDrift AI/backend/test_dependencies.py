from app.services.dependency_analyzer import (
    analyze_maven_dependencies
)

repo_path = "repositories/spring-petclinic"

dependencies = analyze_maven_dependencies(repo_path)

for dependency in dependencies:

    print(
        dependency["group_id"],
        dependency["artifact_id"],
        dependency["version"]
    )