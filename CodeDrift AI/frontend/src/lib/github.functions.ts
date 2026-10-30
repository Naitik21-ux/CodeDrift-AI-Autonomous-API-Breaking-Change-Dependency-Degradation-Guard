import { createServerFn } from "@tanstack/react-start";

export type GithubRepo = {
  id: number;
  name: string;
  owner: string;
  private: boolean;
  description: string | null;
  clone_url: string;
};

// Lists repositories of the connected GitHub account. Runs server-side only; tokens never reach the browser.
export const listGithubRepos = createServerFn({ method: "GET" }).handler(async (): Promise<GithubRepo[]> => {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const ghKey = process.env["GITHUB_API_KEY"];
  if (!lovableKey || !ghKey) throw new Error("GitHub connection is not configured.");
  const all: GithubRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://connector-gateway.lovable.dev/github/user/repos?per_page=100&sort=updated&page=${page}`,
      { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": ghKey } },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`GitHub repos failed [${res.status}]: ${body}`);
      throw new Error(`GitHub request failed [${res.status}]`);
    }
    const data = (await res.json()) as Array<{ id: number; name: string; owner: { login: string }; private: boolean; description: string | null; clone_url: string }>;
    for (const r of data) all.push({ id: r.id, name: r.name, owner: r.owner.login, private: r.private, description: r.description, clone_url: r.clone_url });
    if (data.length < 100) break;
  }
  return all;
});
