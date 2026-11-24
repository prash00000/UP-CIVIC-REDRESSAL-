import fs from "fs";
import path from "path";
import {
  districtIndexEntrySchema,
  districtDataSchema,
  placeSchema,
  issueSchema,
  pincodesSchema,
  stateDataSchema,
} from "../lib/validate";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function runValidation() {
  console.log("🔍 Validating civic grievance dataset in:", DATA_DIR);
  let errors: string[] = [];

  // 1. districts.json
  const districtsPath = path.join(DATA_DIR, "districts.json");
  if (!fs.existsSync(districtsPath)) {
    errors.push("Missing public/data/districts.json");
    console.error("❌ " + errors[0]);
    process.exit(1);
  }

  const districtsRaw = JSON.parse(fs.readFileSync(districtsPath, "utf-8"));
  const districtsParsed = z.array(districtIndexEntrySchema).safeParse(districtsRaw);
  if (!districtsParsed.success) {
    errors.push(`districts.json schema error: ${districtsParsed.error.message}`);
  }

  const districtIds = new Set((districtsParsed.data || []).map((d) => d.id));

  // 2. pincodes.json
  const pincodesPath = path.join(DATA_DIR, "pincodes.json");
  if (fs.existsSync(pincodesPath)) {
    const pincodesRaw = JSON.parse(fs.readFileSync(pincodesPath, "utf-8"));
    const pincodesParsed = pincodesSchema.safeParse(pincodesRaw);
    if (!pincodesParsed.success) {
      errors.push(`pincodes.json schema error: ${pincodesParsed.error.message}`);
    }
  } else {
    errors.push("Missing public/data/pincodes.json");
  }

  // 3. state.json
  const statePath = path.join(DATA_DIR, "state.json");
  if (fs.existsSync(statePath)) {
    const stateRaw = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    const stateParsed = stateDataSchema.safeParse(stateRaw);
    if (!stateParsed.success) {
      errors.push(`state.json schema error: ${stateParsed.error.message}`);
    }
  } else {
    errors.push("Missing public/data/state.json");
  }

  // 4. issues/*.json
  const issuesDir = path.join(DATA_DIR, "issues");
  if (fs.existsSync(issuesDir)) {
    const issueFiles = fs.readdirSync(issuesDir).filter((f) => f.endsWith(".json"));
    for (const f of issueFiles) {
      const issueRaw = JSON.parse(fs.readFileSync(path.join(issuesDir, f), "utf-8"));
      const parsed = issueSchema.safeParse(issueRaw);
      if (!parsed.success) {
        errors.push(`Issue ${f} schema error: ${parsed.error.message}`);
      }
    }
  } else {
    errors.push("Missing public/data/issues directory");
  }

  // 5. districts/*.json & places/*.json
  const districtsDir = path.join(DATA_DIR, "districts");
  const placesDir = path.join(DATA_DIR, "places");

  if (fs.existsSync(districtsDir)) {
    const districtFiles = fs.readdirSync(districtsDir).filter((f) => f.endsWith(".json"));
    for (const df of districtFiles) {
      const dId = df.replace(".json", "");
      const districtDataRaw = JSON.parse(fs.readFileSync(path.join(districtsDir, df), "utf-8"));
      const parsed = districtDataSchema.safeParse(districtDataRaw);
      if (!parsed.success) {
        errors.push(`District file ${df} schema error: ${parsed.error.message}`);
        continue;
      }

      const offices = parsed.data.offices;
      const officeIds = new Set<string>();
      const phoneUsage = new Map<string, string>(); // phone -> officeId

      for (const off of offices) {
        if (officeIds.has(off.id)) {
          errors.push(`Duplicate office ID '${off.id}' in ${df}`);
        }
        officeIds.add(off.id);

        for (const phone of off.phones) {
          const cleanNum = phone.number.replace(/\s+/g, "");
          if (phoneUsage.has(cleanNum) && !off.notes) {
            errors.push(
              `Phone '${cleanNum}' appears in office '${off.id}' and '${phoneUsage.get(
                cleanNum
              )}' without an explanatory note in ${df}`
            );
          }
          phoneUsage.set(cleanNum, off.id);
        }
      }

      // Check fallback_office_id exists in same file
      for (const off of offices) {
        if (off.fallback_office_id && !officeIds.has(off.fallback_office_id)) {
          errors.push(
            `Office '${off.id}' specifies fallback_office_id '${off.fallback_office_id}' which does not exist in ${df}`
          );
        }
      }

      // Check places for this district
      const pf = path.join(placesDir, df);
      if (fs.existsSync(pf)) {
        const placesRaw = JSON.parse(fs.readFileSync(pf, "utf-8"));
        const placesParsed = z.array(placeSchema).safeParse(placesRaw);
        if (!placesParsed.success) {
          errors.push(`Places file ${df} schema error: ${placesParsed.error.message}`);
        } else {
          const placeIds = new Set<string>();
          for (const pl of placesParsed.data) {
            if (placeIds.has(pl.id)) {
              errors.push(`Duplicate place ID '${pl.id}' in ${df}`);
            }
            placeIds.add(pl.id);

            // Chain check
            if (pl.type === "village") {
              if (!pl.gp_id || !pl.block_id || !pl.tehsil_id || !pl.district_id) {
                errors.push(
                  `Village place '${pl.id}' incomplete hierarchy: gp_id=${pl.gp_id}, block_id=${pl.block_id}, tehsil_id=${pl.tehsil_id}, district_id=${pl.district_id}`
                );
              }
            } else if (pl.type === "ward") {
              if (!pl.ulb_id || !pl.district_id) {
                errors.push(
                  `Ward place '${pl.id}' incomplete hierarchy: ulb_id=${pl.ulb_id}, district_id=${pl.district_id}`
                );
              }
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error("  - " + err);
    }
    process.exit(1);
  }

  console.log("✅ All data files passed strict validation!");
}

runValidation();
