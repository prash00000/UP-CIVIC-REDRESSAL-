import fs from "fs";
import path from "path";
import DistrictClient from "./DistrictClient";

export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), "public", "data", "districts.json");
  if (!fs.existsSync(filePath)) return [];
  const districts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return districts.map((d: { id: string }) => ({
    district: d.id,
  }));
}

export default function DistrictDirectoryPage({
  params,
}: {
  params: { district: string };
}) {
  const districtsPath = path.join(process.cwd(), "public", "data", "districts.json");
  const districtDataPath = path.join(
    process.cwd(),
    "public",
    "data",
    "districts",
    `${params.district}.json`
  );

  let initialMeta = null;
  let initialDistrictData = null;

  if (fs.existsSync(districtsPath)) {
    const list = JSON.parse(fs.readFileSync(districtsPath, "utf-8"));
    initialMeta = list.find((d: { id: string }) => d.id === params.district) || null;
  }

  if (fs.existsSync(districtDataPath)) {
    initialDistrictData = JSON.parse(fs.readFileSync(districtDataPath, "utf-8"));
  }

  return (
    <DistrictClient
      districtId={params.district}
      initialMeta={initialMeta}
      initialData={initialDistrictData}
    />
  );
}
