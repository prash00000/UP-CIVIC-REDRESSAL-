import {
  Issue,
  IssueSlug,
  IssueStep,
  LocalBodyType,
  OfficeRole,
  StateData,
} from "./types";
import { ResolutionResult, ResolvedOfficerItem } from "./resolver";

export type ResolvedIssueStep = {
  step: IssueStep;
  resolvedOfficer?: ResolvedOfficerItem;
  fallbackOfficer?: ResolvedOfficerItem;
  isUrbanAdapted?: boolean;
};

export type OfficialPortalItem = NonNullable<StateData["official_portals"]>[number];

export const ISSUE_LIST: Array<{ slug: IssueSlug; titleKey: string }> = [
  { slug: "street-light", titleKey: "issue.street-light" },
  { slug: "drain", titleKey: "issue.drain" },
  { slug: "road", titleKey: "issue.road" },
  { slug: "handpump-water", titleKey: "issue.handpump-water" },
  { slug: "mgnrega", titleKey: "issue.mgnrega" },
  { slug: "garbage", titleKey: "issue.garbage" },
];

const URBAN_CIVIC_STEPS: Record<
  Exclude<IssueSlug, "mgnrega">,
  Array<{ role: "eo" | "commissioner" | "sdm" | "cdo" | "dm"; en: string; hi: string }>
> = {
  "street-light": [
    {
      role: "eo",
      en: "Report the non-functional street light (with electric pole number and street landmark) to your Urban Executive Officer / Municipal Commissioner or helpline 1533 (e-NagarSewa).",
      hi: "खराब स्ट्रीट लाइट की शिकायत खंभा नंबर व निकटतम पहचान के साथ अपने अधिशासी अधिकारी (ईओ) / नगर आयुक्त अथवा हेल्पलाइन 1533 (ई-नगरसेवा) पर दर्ज कराएँ।",
    },
    {
      role: "sdm",
      en: "If unrepaired within 7–15 days, escalate with complaint receipt at Tehsil Samadhan Diwas (1st & 3rd Tuesday) before the SDM / Supervisory Officer.",
      hi: "7–15 दिनों में सुधार न होने पर शिकायत रसीद के साथ तहसील समाधान दिवस (प्रथम व तृतीय मंगलवार) में एसडीएम / प्रभारी अधिकारी के समक्ष प्रस्तुत करें।",
    },
    {
      role: "dm",
      en: "Submit formal petition to the District Magistrate (DM) or register on CM Helpline 1076 / Jansunwai with previous complaint reference.",
      hi: "पूर्व शिकायत संख्या सहित जिलाधिकारी (डीएम) को प्रार्थना पत्र दें या सीएम हेल्पलाइन 1076 / जनसुनवाई पोर्टल पर दर्ज करें।",
    },
  ],
  drain: [
    {
      role: "eo",
      en: "Submit written complaint for drain desilting / waterlogging clearance to your ULB Executive Officer / Municipal Commissioner or call 1533 (e-NagarSewa).",
      hi: "नाली की सफाई व जलभराव हटाने हेतु अपने नगर निकाय के अधिशासी अधिकारी (ईओ) / नगर आयुक्त को लिखित शिकायत दें या 1533 (ई-नगरसेवा) पर कॉल करें।",
    },
    {
      role: "sdm",
      en: "Escalate persistent urban waterlogging to SDM (or CDO in Municipal Corporations) citing health & sanitation risk.",
      hi: "जलभराव बना रहने पर संक्रामक रोग के खतरे का उल्लेख करते हुए एसडीएम (या नगर निगम क्षेत्र में सीडीओ) से शिकायत करें।",
    },
    {
      role: "dm",
      en: "Present before the District Magistrate during weekly public hearing / CM Helpline 1076.",
      hi: "साप्ताहिक जनसुनवाई में जिलाधिकारी (डीएम) को आवेदन दें व सीएम हेल्पलाइन 1076 पर संदर्भ दर्ज कराएँ।",
    },
  ],
  garbage: [
    {
      role: "eo",
      en: "Report unattended garbage dumps or missed collection to the Urban Executive Officer / Municipal Commissioner and call urban helpline 1533.",
      hi: "कूड़े के ढेर या कचरा संग्रहण न होने की शिकायत अपने अधिशासी अधिकारी (ईओ) / नगर आयुक्त से करें व शहरी हेल्पलाइन 1533 पर दर्ज कराएँ।",
    },
    {
      role: "sdm",
      en: "If unaddressed within 3–7 days, escalate with photos to SDM / Municipal supervisory authority.",
      hi: "3–7 दिनों में सफाई न होने पर फोटो सहित एसडीएम / नगर निकाय प्रभारी अधिकारी को शिकायत दें।",
    },
    {
      role: "dm",
      en: "Submit formal memorandum to the District Magistrate and escalate on CM Helpline 1076.",
      hi: "जिलाधिकारी (डीएम) को ज्ञापन दें एवं सीएम हेल्पलाइन 1076 पर शिकायत दर्ज करें।",
    },
  ],
  "handpump-water": [
    {
      role: "eo",
      en: "Report leaking pipe, contaminated water, or damaged public handpump to your Urban Executive Officer / Jal Kal department (or call 1533).",
      hi: "दूषित पेयजल, पाइप रिसाव या सार्वजनिक हैंडपंप खराब होने की सूचना अधिशासी अधिकारी (ईओ) / जलकल विभाग को दें या 1533 पर कॉल करें।",
    },
    {
      role: "sdm",
      en: "Escalate urgent drinking-water shortage to SDM / district supervisory officer for tanker or repair deployment.",
      hi: "पेयजल संकट के त्वरित समाधान हेतु एसडीएम / जिला प्रभारी अधिकारी को लिखित सूचना दें।",
    },
    {
      role: "dm",
      en: "Submit urgent representation to District Magistrate and register on Jansunwai / 1076.",
      hi: "जिलाधिकारी (डीएम) को तत्काल प्रार्थना पत्र दें तथा जनसुनवाई / 1076 पर दर्ज कराएँ।",
    },
  ],
  road: [
    {
      role: "eo",
      en: "Submit written complaint with street landmark & potholes photo to your Urban Executive Officer / Municipal Engineering wing.",
      hi: "सड़क के गड्ढों या अधूरे निर्माण का स्थान व फोटो सहित अपने अधिशासी अधिकारी (ईओ) / नगर निर्माण विभाग को पत्र दें।",
    },
    {
      role: "sdm",
      en: "Escalate unresolved municipal road defects to SDM / CDO for fund and quality verification.",
      hi: "मरम्मत न होने पर निर्माण गुणवत्ता व जांच हेतु एसडीएम / सीडीओ के समक्ष मामला उठाएँ।",
    },
    {
      role: "dm",
      en: "File formal petition to District Magistrate and seek certified work measurement details via RTI Form-A.",
      hi: "जिलाधिकारी (डीएम) को प्रार्थना पत्र दें व कार्य सत्यापन हेतु आरटीआई प्रपत्र-क लगाएँ।",
    },
  ],
};

function findOfficerForRole(
  officers: ResolvedOfficerItem[],
  roles: OfficeRole[]
): { primary?: ResolvedOfficerItem; fallback?: ResolvedOfficerItem } {
  const idx = officers.findIndex(
    (item) => roles.includes(item.resolvedRole) && !item.isFallback
  );
  if (idx >= 0) {
    const primary = officers[idx];
    const nextItem = officers[idx + 1];
    const fallback =
      nextItem && nextItem.isFallback
        ? nextItem
        : primary.noPhone && primary.office.fallback_office_id
        ? officers.find((o) => o.office.id === primary.office.fallback_office_id)
        : undefined;
    return { primary, fallback };
  }
  const fallbackMatch = officers.find((item) => roles.includes(item.resolvedRole));
  return { primary: fallbackMatch };
}

export function isUrbanLocalBody(type: LocalBodyType | "unknown" | "other" | null | undefined): boolean {
  return (
    type === "nagar_panchayat" ||
    type === "nagar_palika_parishad" ||
    type === "nagar_nigam"
  );
}

export function getIssueAreaSteps(
  issue: Issue,
  localBodyType: LocalBodyType | "unknown" | "other" | null | undefined,
  resolution: ResolutionResult | null
): { steps: ResolvedIssueStep[]; isRuralOnlyNotice: boolean; isUrbanFlow: boolean } {
  const effType = resolution?.place?.local_body_type || localBodyType;
  const isNigam = effType === "nagar_nigam";
  const isTown = effType === "nagar_panchayat" || effType === "nagar_palika_parishad";
  const isUrban = isNigam || isTown;
  const officers = resolution?.officers || [];

  if (issue.slug === "mgnrega") {
    const steps: ResolvedIssueStep[] = issue.steps.map((step) => {
      const matched = resolution
        ? findOfficerForRole(officers, [step.role])
        : {};
      return {
        step,
        resolvedOfficer: matched.primary,
        fallbackOfficer: matched.fallback,
      };
    });
    return { steps, isRuralOnlyNotice: isUrban, isUrbanFlow: false };
  }

  if (isUrban) {
    const templates = URBAN_CIVIC_STEPS[issue.slug];
    const steps: ResolvedIssueStep[] = templates.map((tpl, idx) => {
      const targetRole: OfficeRole =
        idx === 0 ? (isNigam ? "commissioner" : "eo") : idx === 1 ? (isNigam ? "cdo" : "sdm") : "dm";
      const matched = resolution
        ? findOfficerForRole(
            officers,
            idx === 0
              ? isNigam
                ? ["commissioner", "mayor", "ward"]
                : ["eo", "chairman", "ward"]
              : idx === 1
              ? isNigam
                ? ["cdo", "sdm"]
                : ["sdm", "cdo"]
              : ["dm"]
          )
        : {};
      return {
        step: {
          order: idx + 1,
          role: targetRole,
          how_en: tpl.en,
          how_hi: tpl.hi,
          time_limit_days: null,
          time_limit_source_url: null,
        },
        resolvedOfficer: matched.primary,
        fallbackOfficer: matched.fallback,
        isUrbanAdapted: true,
      };
    });
    return { steps, isRuralOnlyNotice: false, isUrbanFlow: true };
  }

  const steps: ResolvedIssueStep[] = issue.steps.map((step) => {
    const matched = resolution
      ? findOfficerForRole(officers, [step.role])
      : {};
    return {
      step,
      resolvedOfficer: matched.primary,
      fallbackOfficer: matched.fallback,
    };
  });
  return { steps, isRuralOnlyNotice: false, isUrbanFlow: false };
}

export function getPrimaryOfficerForIssue(
  issueSlug: IssueSlug,
  resolution: ResolutionResult | null
): ResolvedOfficerItem | null {
  if (!resolution || resolution.officers.length === 0) return null;
  const effType = resolution.place?.local_body_type;
  const isNigam = effType === "nagar_nigam";
  const isTown = effType === "nagar_panchayat" || effType === "nagar_palika_parishad";

  const preferredOrder: OfficeRole[] =
    issueSlug !== "mgnrega" && isNigam
      ? ["commissioner", "mayor", "cdo", "dm"]
      : issueSlug !== "mgnrega" && isTown
      ? ["eo", "chairman", "sdm", "dm"]
      : ["bdo", "secretary", "ado_panchayat", "dpro", "sdm", "cdo", "dm"];

  // First try an officer matching preferred role who has an active verified phone
  for (const role of preferredOrder) {
    const matchWithPhone = resolution.officers.find(
      (item) => item.resolvedRole === role && !item.noPhone && item.office.phones.length > 0
    );
    if (matchWithPhone) return matchWithPhone;
  }
  // If primary EO/Secretary has fallback officer with phone, return the fallback right beside it, else first matching
  for (const role of preferredOrder) {
    const matchAny = resolution.officers.find((item) => item.resolvedRole === role);
    if (matchAny) return matchAny;
  }
  return resolution.officers.find((o) => !o.noPhone) || resolution.officers[0] || null;
}

export function getRelevantPortals(
  issueSlug: IssueSlug,
  localBodyType: LocalBodyType | "unknown" | "other" | null | undefined,
  stateData: StateData | null
): OfficialPortalItem[] {
  const all = stateData?.official_portals || [];
  const isUrban = isUrbanLocalBody(localBodyType);
  const picked: OfficialPortalItem[] = [];
  const addById = (id: string) => {
    const found = all.find((p) => p.id === id);
    if (found && !picked.some((p) => p.id === found.id)) picked.push(found);
  };

  if (issueSlug === "mgnrega") {
    addById("nrega");
    addById("panchayatiraj");
  } else if (isUrban) {
    addById("e-nagarsewa");
  } else if (issueSlug === "handpump-water") {
    addById("jalsamadhan");
    addById("panchayatiraj");
  } else {
    addById("panchayatiraj");
  }

  return picked;
}
