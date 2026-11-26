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
const GLUED_EMAIL_RE = /(?:^\d{5,}|[a-z-]+\d{9,})@/i;
const SYNTHETIC_GMAIL_RE = /^(?:bdo|sdm)\.[a-z0-9-]+\.[a-z0-9-]+@gmail\.com$/i;
const MIS_SPLIT_METRO_STD_RE =
  /^(?:0120|0121|0122|0131|0132|0510|0512|0522|0532|0535|0542|0547|0548|0551|0562|0565|0571|0581|0591|0595)\d-\d+$/;
const DEVANAGARI_RE = /[\u0900-\u097f]/;
const DEVANAGARI_DIGIT_RE = /[\u0966-\u096f]/;
const ASCII_LETTER_RE = /[A-Za-z]/;
const MOJIBAKE_RE = /[^\x00-\x7F\u0900-\u097F\u200C\u200D\u2013\u2014\u2018-\u201D\u00A0]/;
const KRUTIDEV_ZERO_DOT_RE = /[\u0900-\u097f]0|[a-z]0[a-z]/i;
const NON_CIVIC_EO_RE =
  /\b(?:dios|dio|di\.ai\.o|di0ai|a\.?d\.?e\.?o|tehsildar|tahasiladar|naib|esadiem|drda|project\s*director|rajistrar|registrar|kaushal|prashikshan|lekhapariksha|lekha\s*karyalay|shram\s*sansthan|ema\s*esa\s*ema\s*i)\b/i;

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

        if (off.email) {
          if (GLUED_EMAIL_RE.test(off.email)) {
            errors.push(`Glued/digit-prefixed email '${off.email}' in ${df}:${off.id}`);
          }
          if (SYNTHETIC_GMAIL_RE.test(off.email)) {
            errors.push(`Synthetic placeholder email '${off.email}' in ${df}:${off.id}`);
          }
        }

        for (const [field, val] of [
          ["office_name_en", off.office_name_en],
          ["officer_name_en", off.officer_name_en],
          ["address_en", off.address_en],
        ] as const) {
          if (val && DEVANAGARI_RE.test(val)) {
            errors.push(`Devanagari characters inside ${field} '${val}' in ${df}:${off.id}`);
          }
          if (val && MOJIBAKE_RE.test(val)) {
            errors.push(`Mojibake characters inside ${field} '${val}' in ${df}:${off.id}`);
          }
        }

        if (ASCII_LETTER_RE.test(off.office_name_hi)) {
          errors.push(`Mixed ASCII letters inside office_name_hi '${off.office_name_hi}' in ${df}:${off.id}`);
        }
        if (MOJIBAKE_RE.test(off.office_name_hi)) {
          errors.push(`Mojibake characters inside office_name_hi '${off.office_name_hi}' in ${df}:${off.id}`);
        }
        if (
          KRUTIDEV_ZERO_DOT_RE.test(off.office_name_en) ||
          KRUTIDEV_ZERO_DOT_RE.test(off.office_name_hi)
        ) {
          errors.push(`Unconverted KrutiDev 0-dot abbreviation in ${df}:${off.id}`);
        }
        if (off.role === "eo" && NON_CIVIC_EO_RE.test(`${off.id} ${off.office_name_en}`)) {
          errors.push(`Misclassified non-civic EO office '${off.office_name_en}' in ${df}:${off.id}`);
        }

        for (const phone of off.phones) {
          const cleanNum = phone.number.replace(/\s+/g, "");
          if (DEVANAGARI_DIGIT_RE.test(cleanNum)) {
            errors.push(`Devanagari digits in phone '${cleanNum}' in ${df}:${off.id}`);
          }
          if (MIS_SPLIT_METRO_STD_RE.test(cleanNum)) {
            errors.push(`Mis-split 4-digit city STD phone '${cleanNum}' in ${df}:${off.id}`);
          }
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
      const bdoCovers = new Set(offices.filter((o) => o.role === "bdo").flatMap((o) => o.covers));
      const sdmCovers = new Set(offices.filter((o) => o.role === "sdm").flatMap((o) => o.covers));
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

            if (DEVANAGARI_RE.test(pl.name_en)) {
              errors.push(`Devanagari characters inside place.name_en '${pl.name_en}' in ${df}:${pl.id}`);
            }
            if (pl.block_name_en && DEVANAGARI_RE.test(pl.block_name_en)) {
              errors.push(`Devanagari characters inside place.block_name_en '${pl.block_name_en}' in ${df}:${pl.id}`);
            }
            if (pl.tehsil_name_en && DEVANAGARI_RE.test(pl.tehsil_name_en)) {
              errors.push(`Devanagari characters inside place.tehsil_name_en '${pl.tehsil_name_en}' in ${df}:${pl.id}`);
            }
            if (ASCII_LETTER_RE.test(pl.name_hi)) {
              errors.push(`ASCII letters inside place.name_hi '${pl.name_hi}' in ${df}:${pl.id}`);
            }
            if (pl.block_name_hi && ASCII_LETTER_RE.test(pl.block_name_hi)) {
              errors.push(`ASCII letters inside place.block_name_hi '${pl.block_name_hi}' in ${df}:${pl.id}`);
            }
            if (pl.tehsil_name_hi && ASCII_LETTER_RE.test(pl.tehsil_name_hi)) {
              errors.push(`ASCII letters inside place.tehsil_name_hi '${pl.tehsil_name_hi}' in ${df}:${pl.id}`);
            }
            if (MOJIBAKE_RE.test(`${pl.name_en} ${pl.name_hi}`)) {
              errors.push(`Mojibake characters inside place '${pl.name_en}' in ${df}:${pl.id}`);
            }

            // Chain check
            if (pl.type === "village") {
              if (!pl.gp_id || !pl.block_id || !pl.tehsil_id || !pl.district_id) {
                errors.push(
                  `Village place '${pl.id}' incomplete hierarchy: gp_id=${pl.gp_id}, block_id=${pl.block_id}, tehsil_id=${pl.tehsil_id}, district_id=${pl.district_id}`
                );
              }
              if (pl.block_id && !bdoCovers.has(pl.block_id)) {
                errors.push(
                  `Village '${pl.id}' references block_id '${pl.block_id}' missing from BDO offices in ${df}`
                );
              }
              if (pl.tehsil_id && !sdmCovers.has(pl.tehsil_id)) {
                errors.push(
                  `Village '${pl.id}' references tehsil_id '${pl.tehsil_id}' missing from SDM offices in ${df}`
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
