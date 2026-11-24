import { z } from "zod";

// Phone format: STD code with '-', or 10 digits starting 6-9, or special helplines like 1076
export const phoneRegex = /^(?:[6-9]\d{9}|0\d{2,4}-\d{6,8}|\d{3,5}-\d{6,8}|1076)$/;

export const phoneSchema = z.object({
  number: z
    .string()
    .min(3)
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, "")), {
      message: "Phone number must be STD code with '-' or 10 digits starting 6-9",
    }),
  type: z.enum(["office", "cug", "landline", "mobile_official"]),
  source_url: z.string().url("source_url must be a valid URL"),
  checked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checked_on must be YYYY-MM-DD"),
  status: z.enum(["verified", "unverified", "failed"]),
});

export const officeSchema = z
  .object({
    id: z.string().min(3),
    level: z.enum(["state", "division", "district", "tehsil", "block", "gram_panchayat", "ulb"]),
    role: z.enum([
      "secretary",
      "ado_panchayat",
      "bdo",
      "dpro",
      "tehsildar",
      "sdm",
      "cdo",
      "dm",
      "eo",
      "commissioner",
      "chairman",
      "mayor",
      "pradhan",
      "ward",
      "other",
    ]),
    office_name_en: z.string().min(1),
    office_name_hi: z.string().min(1),
    officer_name_en: z.string().optional(),
    officer_name_hi: z.string().optional(),
    phones: z.array(phoneSchema),
    email: z.string().email().optional().or(z.literal("")),
    address_en: z.string().optional(),
    address_hi: z.string().optional(),
    covers: z.array(z.string()),
    post_status: z.enum(["filled", "vacant", "additional_charge"]).optional(),
    also_covers: z.array(z.string()).optional(),
    fallback_office_id: z.string().optional(),
    source_url: z.string().url(),
    confidence: z.enum(["high", "medium", "low"]),
    valid_as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional(),
  })
  .superRefine((office, ctx) => {
    // If post_status is vacant or no phones, check fallback_office_id
    if (office.post_status === "vacant" && !office.fallback_office_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Vacant office '${office.id}' must specify fallback_office_id`,
        path: ["fallback_office_id"],
      });
    }
  });

export const placeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["village", "ward"]),
  name_en: z.string().min(1),
  name_hi: z.string().min(1),
  gp_id: z.string().optional(),
  ulb_id: z.string().optional(),
  block_id: z.string().optional(),
  tehsil_id: z.string().min(1),
  district_id: z.string().min(1),
  local_body_type: z.enum([
    "gram_panchayat",
    "nagar_panchayat",
    "nagar_palika_parishad",
    "nagar_nigam",
    "cantonment_board",
    "authority_area",
  ]),
  pincodes: z.array(z.string().regex(/^\d{6}$/)).optional(),
});

export const districtCoverageSchema = z.object({
  tier0: z.number().min(0).max(100),
  tier1: z.number().min(0).max(100),
  tier2: z.number().min(0).max(100),
  verified_pct: z.number().min(0).max(100),
  last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const districtIndexEntrySchema = z.object({
  id: z.string().min(2),
  name_en: z.string().min(1),
  name_hi: z.string().min(1),
  division_en: z.string().min(1),
  division_hi: z.string().min(1),
  coverage: districtCoverageSchema,
});

export const issueStepSchema = z
  .object({
    order: z.number().int().positive(),
    role: z.enum([
      "secretary",
      "ado_panchayat",
      "bdo",
      "dpro",
      "tehsildar",
      "sdm",
      "cdo",
      "dm",
      "eo",
      "commissioner",
      "chairman",
      "mayor",
      "pradhan",
      "ward",
      "other",
    ]),
    how_en: z.string().min(1),
    how_hi: z.string().min(1),
    time_limit_days: z.number().int().positive().nullable(),
    time_limit_source_url: z.string().url().nullable(),
  })
  .superRefine((step, ctx) => {
    // time_limit_days is non-null only if time_limit_source_url is non-null
    if (step.time_limit_days !== null && step.time_limit_source_url === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "time_limit_days can only be non-null if time_limit_source_url is provided",
        path: ["time_limit_source_url"],
      });
    }
  });

export const issueSchema = z.object({
  slug: z.enum(["street-light", "drain", "road", "handpump-water", "mgnrega", "garbage"]),
  title_en: z.string().min(1),
  title_hi: z.string().min(1),
  steps: z.array(issueStepSchema).min(1),
  keep_en: z.array(z.string().min(1)),
  keep_hi: z.array(z.string().min(1)),
});

export const districtDataSchema = z.object({
  district_id: z.string().min(2),
  verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  offices: z.array(officeSchema),
});

export const pincodesSchema = z.record(
  z.string().regex(/^\d{6}$/),
  z.array(
    z.object({
      district_id: z.string(),
      tehsil_id: z.string().optional(),
    })
  )
);

export const stateDataSchema = z.object({
  cm_helpline: z.object({
    number: z.string(),
    available: z.string(),
    toll_free: z.boolean(),
    source_url: z.string().url(),
  }),
  jansunwai: z.object({
    url: z.string().url(),
    name_en: z.string(),
    name_hi: z.string(),
    otp_required: z.boolean(),
  }),
});
