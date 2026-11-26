import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://up-civic-redressal.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/find/`, lastModified: new Date() },
    { url: `${baseUrl}/letter/`, lastModified: new Date() },
    { url: `${baseUrl}/rti/`, lastModified: new Date() },
    { url: `${baseUrl}/directory/`, lastModified: new Date() },
    { url: `${baseUrl}/about/`, lastModified: new Date() },
    { url: `${baseUrl}/report/`, lastModified: new Date() },
  ];

  // Issues routes
  const issues = ["street-light", "drain", "road", "handpump-water", "mgnrega", "garbage"];
  const issueRoutes: MetadataRoute.Sitemap = issues.map((slug) => ({
    url: `${baseUrl}/issue/${slug}/`,
    lastModified: new Date(),
  }));

  // District routes
  const districtsPath = path.join(process.cwd(), "public", "data", "districts.json");
  let districtRoutes: MetadataRoute.Sitemap = [];
  if (fs.existsSync(districtsPath)) {
    const list = JSON.parse(fs.readFileSync(districtsPath, "utf-8"));
    districtRoutes = list.map((d: { id: string }) => ({
      url: `${baseUrl}/directory/${d.id}/`,
      lastModified: new Date(),
    }));
  }

  return [...staticRoutes, ...issueRoutes, ...districtRoutes];
}
