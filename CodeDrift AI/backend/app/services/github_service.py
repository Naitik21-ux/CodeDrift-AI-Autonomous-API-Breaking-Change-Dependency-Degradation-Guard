import os
import shutil
import stat

from git import Repo


def remove_readonly(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)


def clone_repository(repo_url):

    repo_name = repo_url.rstrip("/").split("/")[-1]

    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    base_dir = "repositories"
    os.makedirs(base_dir, exist_ok=True)

    repo_path = os.path.join(base_dir, repo_name)

    # Remove previous repository copy
    if os.path.exists(repo_path):
        shutil.rmtree(
            repo_path,
            onerror=remove_readonly
        )

    # Clone repository
    Repo.clone_from(repo_url, repo_path)

    return repo_path