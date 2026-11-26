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

const SPECIAL_AUTHORITY_STEPS: Record<
  Exclude<IssueSlug, "mgnrega">,
  Array<{ role: "other" | "sdm" | "dm"; en: string; hi: string }>
> = {
  "street-light": [
    {
      role: "other",
      en: "Report the non-functional street light (sector/ward, electric pole number, and landmark) directly to your Development Authority / Cantonment Board Office.",
      hi: "खराब स्ट्रीट लाइट की शिकायत सेक्टर/वार्ड, खंभा नंबर व लैंडमार्क के साथ सीधे अपने विकास प्राधिकरण / छावनी परिषद कार्यालय में दर्ज कराएँ।",
    },
    {
      role: "sdm",
      en: "If unresolved within 7–15 days, escalate with complaint receipt before the Area Sub-Divisional Magistrate (SDM) / CDO.",
      hi: "7–15 दिनों में सुधार न होने पर शिकायत रसीद के साथ उपजिलाधिकारी (एसडीएम) / सीडीओ के समक्ष प्रस्तुत करें।",
    },
    {
      role: "dm",
      en: "Submit formal petition to the District Magistrate (DM) or register on CM Helpline 1076 / Jansunwai.",
      hi: "पूर्व शिकायत संख्या सहित जिलाधिकारी (डीएम) को प्रार्थना पत्र दें या सीएम हेल्पलाइन 1076 / जनसुनवाई पोर्टल पर दर्ज करें।",
    },
  ],
  drain: [
    {
      role: "other",
      en: "Submit written complaint for drain desilting or waterlogging clearance (sector/block landmark & photo) to your Development Authority / Cantonment Engineering Cell.",
      hi: "नाली सफाई व जलभराव हटाने हेतु अपने विकास प्राधिकरण / छावनी परिषद के अभियांत्रिकी प्रकोष्ठ को स्थान व फोटो सहित लिखित शिकायत दें।",
    },
    {
      role: "sdm",
      en: "Escalate persistent waterlogging to the Area SDM / CDO citing sanitation and public health risk.",
      hi: "जलभराव बना रहने पर स्वच्छता व जन-स्वास्थ्य जोखिम का उल्लेख करते हुए एसडीएम / सीडीओ से शिकायत करें।",
    },
    {
      role: "dm",
      en: "Submit formal representation to the District Magistrate and escalate on CM Helpline 1076.",
      hi: "साप्ताहिक जनसुनवाई में जिलाधिकारी (डीएम) को आवेदन दें व सीएम हेल्पलाइन 1076 पर संदर्भ दर्ज कराएँ।",
    },
  ],
  garbage: [
    {
      role: "other",
      en: "Report unattended garbage dumps or missed collection to your Development Authority / Cantonment Sanitation Wing.",
      hi: "कूड़े के ढेर या कचरा संग्रहण न होने की शिकायत अपने विकास प्राधिकरण / छावनी परिषद के स्वास्थ्य एवं सफाई अनुभाग में दर्ज कराएँ।",
    },
    {
      role: "sdm",
      en: "If unaddressed within 3–7 days, escalate with dated photos to the Area SDM / District Supervisory Officer.",
      hi: "3–7 दिनों में सफाई न होने पर दिनांकित फोटो सहित एसडीएम / जिला प्रभारी अधिकारी को शिकायत दें।",
    },
    {
      role: "dm",
      en: "Submit formal memorandum to the District Magistrate and lodge on CM Helpline 1076 / Jansunwai.",
      hi: "जिलाधिकारी (डीएम) को ज्ञापन दें एवं सीएम हेल्पलाइन 1076 / जनसुनवाई पर शिकायत दर्ज करें।",
    },
  ],
  "handpump-water": [
    {
      role: "other",
      en: "Report water supply failure, pipeline leak, or contamination immediately to your Development Authority / Cantonment Water Supply Division.",
      hi: "पेयजल आपूर्ति बाधित होने, पाइप रिसाव या दूषित पानी की सूचना तुरंत अपने विकास प्राधिकरण / छावनी परिषद के जल अनुभाग को दें।",
    },
    {
      role: "sdm",
      en: "Escalate urgent drinking-water shortage to the Area SDM / CDO for emergency repair or tanker support.",
      hi: "पेयजल संकट के त्वरित समाधान हेतु एसडीएम / सीडीओ को लिखित सूचना दें।",
    },
    {
      role: "dm",
      en: "Submit urgent representation to District Magistrate and register on Jansunwai / 1076.",
      hi: "जिलाधिकारी (डीएम) को तत्काल प्रार्थना पत्र दें तथा जनसुनवाई / 1076 पर दर्ज कराएँ।",
    },
  ],
  road: [
    {
      role: "other",
      en: "Submit complaint with exact sector/road stretch and pothole photos to your Development Authority / Cantonment Board Engineering Office.",
      hi: "सड़क के गड्ढों या अधूरे निर्माण की सेक्टर/मार्ग पहचान व फोटो सहित अपने विकास प्राधिकरण / छावनी परिषद के अभियांत्रिकी कार्यालय को पत्र दें।",
    },
    {
      role: "sdm",
      en: "Escalate unresolved road defects to Area SDM / CDO for contractor accountability and inspection.",
      hi: "मरम्मत न होने पर जांच व जवाबदेही तय करने हेतु एसडीएम / सीडीओ के समक्ष मामला उठाएँ।",
    },
    {
      role: "dm",
      en: "File formal petition to District Magistrate and seek certified work details via RTI Form-A.",
      hi: "जिलाधिकारी (डीएम) को प्रार्थना पत्र दें व कार्य सत्यापन हेतु आरटीआई प्रपत्र-क लगाएँ।",
    },
  ],
};

function findOfficerForRole(
  officers: ResolvedOfficerItem[],
  roles: OfficeRole[]
): { primary?: ResolvedOfficerItem; fallback?: ResolvedOfficerItem } {
  for (const role of roles) {
    const idx = officers.findIndex(
      (item) => item.resolvedRole === role && !item.isFallback
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
  const isSpecialAuthority =
    effType === "cantonment_board" ||
    effType === "authority_area" ||
    Boolean(resolution?.isCantonmentOrOther && !isUrban && effType !== "gram_panchayat");
  const officers = resolution?.officers || [];

  if (issue.slug === "mgnrega") {
    const isRuralOnlyNotice = isUrban || isSpecialAuthority;
    if (!isRuralOnlyNotice && resolution?.secretaryNotIndexed) {
      const bdoMatch = findOfficerForRole(officers, ["bdo", "ado_panchayat"]);
      const bdoId = bdoMatch.primary?.office.id;
      const collapsed: ResolvedIssueStep[] = [];
      for (const step of issue.steps) {
        if (step.role === "secretary" && bdoMatch.primary) {
          collapsed.push({
            step: {
              ...step,
              role: bdoMatch.primary.resolvedRole,
              how_en: `${step.how_en} Direct individual GP Secretary numbers are not published in the district directory — contact your Block Development Officer (Programme Officer) or submit Form-6 at your Gram Panchayat Bhawan.`,
              how_hi: `${step.how_hi} जिला निर्देशिका में ग्राम पंचायत सचिव का अलग नंबर प्रकाशित नहीं है — अपने खंड विकास अधिकारी (कार्यक्रम अधिकारी) से संपर्क करें या ग्राम पंचायत भवन पर प्रपत्र-6 जमा करें।`,
            },
            resolvedOfficer: bdoMatch.primary,
            fallbackOfficer: bdoMatch.fallback,
          });
          continue;
        }
        if (step.role === "bdo" && bdoId && collapsed.some((c) => c.resolvedOfficer?.office.id === bdoId)) {
          continue;
        }
        const matched = findOfficerForRole(officers, [step.role]);
        collapsed.push({
          step,
          resolvedOfficer: matched.primary,
          fallbackOfficer: matched.fallback,
        });
      }
      const steps = collapsed.map((item, i) => ({
        ...item,
        step: { ...item.step, order: i + 1 },
      }));
      return { steps, isRuralOnlyNotice: false, isUrbanFlow: false };
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
    return { steps, isRuralOnlyNotice, isUrbanFlow: false };
  }

  if (isSpecialAuthority) {
    const templates = SPECIAL_AUTHORITY_STEPS[issue.slug];
    const steps: ResolvedIssueStep[] = templates.map((tpl, idx) => {
      let matched: { primary?: ResolvedOfficerItem; fallback?: ResolvedOfficerItem } = {};
      if (resolution) {
        if (idx === 0) {
          matched = findOfficerForRole(officers, ["other", "eo", "commissioner", "chairman"]);
        } else if (idx === 1) {
          matched = findOfficerForRole(officers, ["sdm", "cdo"]);
        } else {
          matched = findOfficerForRole(officers, ["dm"]);
        }
      }
      const targetRole: OfficeRole =
        idx === 0 ? matched.primary?.resolvedRole || "other" : idx === 1 ? matched.primary?.resolvedRole || "sdm" : "dm";
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
        isUrbanAdapted: false,
      };
    });
    return { steps, isRuralOnlyNotice: false, isUrbanFlow: false };
  }

  if (isUrban) {
    const templates = URBAN_CIVIC_STEPS[issue.slug];
    const steps: ResolvedIssueStep[] = templates.map((tpl, idx) => {
      const matched = resolution
        ? findOfficerForRole(
            officers,
            idx === 0
              ? isNigam
                ? ["commissioner", "mayor", "ward"]
                : ["eo", "chairman", "ward"]
              : idx === 1
              ? ["sdm", "cdo"]
              : ["dm"]
          )
        : {};
      const targetRole: OfficeRole =
        idx === 0
          ? matched.primary?.resolvedRole || (isNigam ? "commissioner" : "eo")
          : idx === 1
          ? matched.primary?.resolvedRole || "sdm"
          : "dm";
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

  if (resolution?.secretaryNotIndexed) {
    const bdoMatch = findOfficerForRole(officers, ["bdo", "ado_panchayat"]);
    const step1Id = bdoMatch.primary?.office.id;
    const collapsed: ResolvedIssueStep[] = [];

    for (const step of issue.steps) {
      if (step.role === "secretary" && bdoMatch.primary) {
        collapsed.push({
          step: {
            ...step,
            role: bdoMatch.primary.resolvedRole,
            how_en: `${step.how_en} Direct individual GP Secretary numbers are not published in the district directory — contact your Block Development Officer (BDO) or submit a written copy at your Gram Panchayat Bhawan.`,
            how_hi: `${step.how_hi} जिला निर्देशिका में ग्राम पंचायत सचिव का अलग नंबर प्रकाशित नहीं है — अपने खंड विकास अधिकारी (बीडीओ) से संपर्क करें या ग्राम पंचायत भवन पर लिखित प्रति जमा करें।`,
          },
          resolvedOfficer: bdoMatch.primary,
          fallbackOfficer: bdoMatch.fallback,
        });
        continue;
      }

      if (step.role === "bdo") {
        const matched = findOfficerForRole(officers, ["bdo"]);
        if (step1Id && matched.primary?.office.id === step1Id) {
          continue;
        }
        collapsed.push({
          step,
          resolvedOfficer: matched.primary,
          fallbackOfficer: matched.fallback,
        });
        continue;
      }

      if (step.role === "ado_panchayat") {
        const matched = findOfficerForRole(officers, ["ado_panchayat"]);
        if (
          !matched.primary ||
          matched.primary.noPhone ||
          (step1Id && matched.primary.office.id === step1Id)
        ) {
          continue;
        }
        collapsed.push({
          step,
          resolvedOfficer: matched.primary,
          fallbackOfficer: matched.fallback,
        });
        continue;
      }

      const matched = findOfficerForRole(officers, [step.role]);
      collapsed.push({
        step,
        resolvedOfficer: matched.primary,
        fallbackOfficer: matched.fallback,
      });
    }

    const steps = collapsed.map((item, i) => ({
      ...item,
      step: { ...item.step, order: i + 1 },
    }));
    return { steps, isRuralOnlyNotice: false, isUrbanFlow: false };
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
  const isSpecialAuthority =
    effType === "cantonment_board" ||
    effType === "authority_area" ||
    Boolean(resolution.isCantonmentOrOther && !isNigam && !isTown && effType !== "gram_panchayat");

  let step1Roles: OfficeRole[];
  let escalationRoles: OfficeRole[];

  if (issueSlug !== "mgnrega" && isNigam) {
    step1Roles = ["commissioner", "mayor", "ward"];
    escalationRoles = ["sdm", "cdo", "dm"];
  } else if (issueSlug !== "mgnrega" && isTown) {
    step1Roles = ["eo", "chairman", "ward"];
    escalationRoles = ["sdm", "cdo", "dm"];
  } else if (issueSlug !== "mgnrega" && isSpecialAuthority) {
    step1Roles = ["other", "eo", "commissioner", "chairman"];
    escalationRoles = ["sdm", "cdo", "dm"];
  } else if (!resolution.secretaryNotIndexed && resolution.officers.some((o) => o.resolvedRole === "secretary")) {
    step1Roles = ["secretary"];
    escalationRoles = ["bdo", "ado_panchayat", "dpro", "sdm", "cdo", "dm"];
  } else {
    step1Roles = ["bdo", "ado_panchayat"];
    escalationRoles = ["dpro", "sdm", "cdo", "dm"];
  }

  // Match Ladder Step 01 first so "Who to contact first" agrees with Step 01
  const step1Match = findOfficerForRole(resolution.officers, step1Roles);
  if (step1Match.primary) {
    if (!step1Match.primary.noPhone && step1Match.primary.office.phones.length > 0) {
      return step1Match.primary;
    }
    if (step1Match.fallback && !step1Match.fallback.noPhone && step1Match.fallback.office.phones.length > 0) {
      return step1Match.fallback;
    }
    return step1Match.primary;
  }

  // If Step 01 office doesn't exist in directory at all (coverage gap / unindexed), prefer reachable escalation
  for (const role of escalationRoles) {
    const matchWithPhone = resolution.officers.find(
      (item) => item.resolvedRole === role && !item.noPhone && item.office.phones.length > 0
    );
    if (matchWithPhone) return matchWithPhone;
  }
  for (const role of escalationRoles) {
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
  const isSpecialAuthority =
    localBodyType === "authority_area" ||
    localBodyType === "cantonment_board" ||
    localBodyType === "other";
  const picked: OfficialPortalItem[] = [];
  const addById = (id: string) => {
    const found = all.find((p) => p.id === id);
    if (found && !picked.some((p) => p.id === found.id)) picked.push(found);
  };

  if (issueSlug === "mgnrega") {
    addById("nrega");
    addById("panchayatiraj");
  } else if (isUrban || isSpecialAuthority) {
    addById("e-nagarsewa");
  } else if (issueSlug === "handpump-water") {
    addById("jalsamadhan");
    addById("panchayatiraj");
  } else {
    addById("panchayatiraj");
  }

  return picked;
}
