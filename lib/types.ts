export type LocalBodyType =
  | "gram_panchayat"
  | "nagar_panchayat"
  | "nagar_palika_parishad"
  | "nagar_nigam"
  | "cantonment_board"
  | "authority_area";

export type Phone = {
  number: string; // digits, "-" allowed, e.g. "0542-262814" or "9XXXXXXXXX"
  type: "office" | "cug" | "landline" | "mobile_official";
  source_url: string; // official page where found
  checked_on: string; // ISO date
  status: "verified" | "unverified" | "failed";
};

export type OfficeRole =
  | "secretary"
  | "ado_panchayat"
  | "bdo"
  | "dpro"
  | "tehsildar"
  | "sdm"
  | "cdo"
  | "dm"
  | "eo"
  | "commissioner"
  | "chairman"
  | "mayor"
  | "pradhan"
  | "ward"
  | "other";

export type OfficeLevel =
  | "state"
  | "division"
  | "district"
  | "tehsil"
  | "block"
  | "gram_panchayat"
  | "ulb";

export type Office = {
  id: string; // stable, e.g. "up-<lgdDistrict>-bdo-<lgdBlock>"
  level: OfficeLevel;
  role: OfficeRole;
  office_name_en: string;
  office_name_hi: string;
  officer_name_en?: string;
  officer_name_hi?: string; // only if officially listed
  phones: Phone[];
  email?: string;
  address_en?: string;
  address_hi?: string;
  covers: string[]; // ids of blocks / GPs / ULBs this office serves
  post_status?: "filled" | "vacant" | "additional_charge";
  also_covers?: string[]; // other GP ids if additional charge
  fallback_office_id?: string; // used if vacant or no phone
  source_url: string;
  confidence: "high" | "medium" | "low";
  valid_as_of: string; // ISO date
  notes?: string;
};

export type Place = {
  id: string;
  type: "village" | "ward";
  name_en: string;
  name_hi: string;
  gp_id?: string;
  ulb_id?: string;
  block_id?: string;
  tehsil_id: string;
  district_id: string;
  local_body_type: LocalBodyType;
  pincodes?: string[];
};

export type DistrictCoverage = {
  tier0: number; // 0 to 100
  tier1: number;
  tier2: number;
  verified_pct: number;
  last_verified: string | null;
};

export type DistrictIndexEntry = {
  id: string;
  name_en: string;
  name_hi: string;
  division_en: string;
  division_hi: string;
  coverage: DistrictCoverage;
};

export type IssueSlug =
  | "street-light"
  | "drain"
  | "road"
  | "handpump-water"
  | "mgnrega"
  | "garbage";

export type IssueStep = {
  order: number;
  role: OfficeRole;
  how_en: string;
  how_hi: string;
  time_limit_days: number | null;
  time_limit_source_url: string | null;
};

export type Issue = {
  slug: IssueSlug;
  title_en: string;
  title_hi: string;
  steps: IssueStep[];
  keep_en: string[];
  keep_hi: string[];
};

export type DistrictData = {
  district_id: string;
  verified_on: string;
  offices: Office[];
};

export type PincodeMap = Record<string, { district_id: string; tehsil_id?: string }[]>;

export type StateData = {
  cm_helpline: {
    number: string;
    available: string;
    toll_free: boolean;
    source_url: string;
  };
  jansunwai: {
    url: string;
    name_en: string;
    name_hi: string;
    otp_required: boolean;
  };
  official_portals?: {
    id: string;
    name_en: string;
    name_hi: string;
    url: string;
    helpline?: string | null;
    scope_en: string;
    scope_hi: string;
  }[];
};
