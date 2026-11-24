import fs from "fs";
import path from "path";
import IssueClient from "./IssueClient";

export async function generateStaticParams() {
  const issuesDir = path.join(process.cwd(), "public", "data", "issues");
  const files = fs.readdirSync(issuesDir).filter((f) => f.endsWith(".json"));
  return files.map((f) => ({
    slug: f.replace(".json", ""),
  }));
}

export default function IssuePage({ params }: { params: { slug: string } }) {
  const issuesDir = path.join(process.cwd(), "public", "data", "issues");
  const filePath = path.join(issuesDir, `${params.slug}.json`);
  let initialIssue = null;

  if (fs.existsSync(filePath)) {
    initialIssue = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  return <IssueClient slug={params.slug} initialIssue={initialIssue} />;
}
