// ================= GAON SHIKAYAT CIVIC ENGINE =================
// Active Language State: 'en' (default) | 'hi'
let currentLang = localStorage.getItem('gaon_shikayat_lang') || 'en';
let selectedBallot = 'pradhan';
let isPwdOverride = false;
let currentTab = 'bdo';
let currentResolvedAuthority = null;

// Comprehensive Bilingual UI Dictionary
const I18N = {
  hi: {
    "topbar-title": "Uttar Pradesh Civic Grievance Redressal",
    "txt-dial-btn": "डायल 1076",
    "hero-eyebrow": "<span>⚖️</span><span>उप्र जनहित गारंटी एवं पंचायती राज विधिक मंच</span>",
    "hero-title": "उप्र नागरिक अधिकार: समयबद्ध विधिक समाधान एवं जनहित जवाबदेही मंच",
    "hero-desc": "उत्तर प्रदेश जनहित गारंटी अधिनियम 2011 एवं पंचायती राज अधिनियम धारा 15 के तहत अपने विधिक अधिकारों का प्रयोग करें। प्रदेश के सभी 75 जनपदों के सक्षम अधिकारियों (BDO, EO, नगर आयुक्त) के सत्यापित CUG संपर्क प्राप्त करें और 30-दिवसीय समय-सीमा में विधिक समाधान सुनिश्चित करें।",
    "hero-badge-1": "⚖️ उप्र जनहित गारंटी अधिनियम 2011",
    "hero-badge-2": "🏛️ 75 जनपद व 824 ब्लॉक आच्छादित",
    "hero-badge-3": "⏱️ 30-दिवसीय विधिक समाधान प्रोटोकॉल",
    "hero-badge-4": "🛡️ सत्यापित शासकीय CUG संपर्क",
    "sec1-title": "चरण 1: समस्या की श्रेणी चुनें (Select Grievance Category)",
    "sec1-desc": "अपनी समस्या पर क्लिक करें; पत्र में संबंधित कानूनी विवरण स्वतः भर जाएगा:",
    "sec2-title": "चरण 1: समस्या की श्रेणी चुनें (Select Grievance Category)",
    "voter-section-title": "<span>📮</span><span>चरण 2: अपना पिन कोड व क्षेत्र चुनें</span>",
    "pincode-title": "<span>📮</span><span>त्वरित पहचान: अपना 6-अंकों का पिन कोड दर्ज करें</span>",
    "pincode-status-text": "पिन कोड दर्ज कर जिला, ब्लॉक व स्थानीय गाँव स्वतः चुनें",
    "txt-pincode-detect": "पहचान करें",
    "txt-pincode-clear": "हटाएं",
    "label-jurisdiction-heading": "अपना प्रशासनिक क्षेत्र एवं गाँव/वार्ड चुनें:",
    "ballot-pradhan-badge": "🌾 ग्रामीण क्षेत्र (Rural)",
    "ballot-pradhan-title": "ग्राम प्रधान (Gram Pradhan)",
    "ballot-pradhan-desc": "आपके यहाँ प्रधानी का चुनाव होता है। आपका निवास गाँव या मजरे में है।",
    "ballot-pradhan-officer": "सक्षम अधिकारी: <strong>खंड विकास अधिकारी (BDO)</strong> / प्रधान",
    "ballot-chairman-badge": "🏘️ कस्बा / नगर पालिका (Town)",
    "ballot-chairman-title": "चेयरमैन (Chairman / अध्यक्ष)",
    "ballot-chairman-desc": "आपके यहाँ चेयरमैन और वार्ड सभासद का चुनाव होता है। यह कस्बा या छोटा शहर है।",
    "ballot-chairman-officer": "सक्षम अधिकारी: <strong>अधिशासी अधिकारी (EO)</strong> / चेयरमैन",
    "ballot-mayor-badge": "🏛️ महानगर (17 नगर निगम)",
    "ballot-mayor-title": "मेयर व पार्षद (Mayor / Parshad)",
    "ballot-mayor-desc": "आपके यहाँ मेयर (महापौर) व पार्षद का चुनाव होता है (लखनऊ, कानपुर, वाराणसी, आगरा आदि)।",
    "ballot-mayor-officer": "सक्षम अधिकारी: <strong>नगर आयुक्त (Commissioner)</strong> / महापौर",
    "pwd-override-label-text": "🛣️ विशेष सड़क जांच: क्या सड़क पर 'PWD' या 'PMGSY' का बोर्ड / मील का पत्थर लगा है?",
    "pwd-override-subtext": "(सीधे अधिशासी अभियंता PWD को पत्र संबोधित होगा)",
    "sec2-title": "चरण 2: समस्या की श्रेणी चुनें (Select Grievance Category)",
    "sec2-desc": "अपनी समस्या पर क्लिक करें; पत्र में संबंधित कानूनी विवरण स्वतः भर जाएगा:",
    "cat-pill-road": "सड़क व खड़ंजा",
    "cat-title-road": "Road · सड़क व खड़ंजा",
    "cat-desc-road": "सड़क टूटी हुई है, कीचड़ भरा है या खड़ंजा/सीसी रोड कई वर्षों से स्वीकृत होने के बाद भी अधूरा है।",
    "cat-pill-drain": "नाली व जलभराव",
    "cat-title-drain": "Drain · नाली एवं जल निकासी",
    "cat-desc-drain": "नाली टूटी या चोक है, गंदा पानी रास्तों और घरों के आगे जमा हो रहा है, बीमारी का खतरा है।",
    "cat-pill-handpump": "पेयजल / जल निगम",
    "cat-title-handpump": "Water · हैंडपंप व पेयजल",
    "cat-desc-handpump": "इंडिया मार्क-2 हैंडपंप या पाइपलाइन खराब है, पीला/गंदा बदबूदार पानी आ रहा है, पेयजल संकट है।",
    "cat-pill-streetlight": "स्ट्रीट लाइट / नेडा",
    "cat-title-streetlight": "Light · स्ट्रीट व सोलर लाइट",
    "cat-desc-streetlight": "खंभों पर लगी सोलर लाइटें अथवा एलईडी लाइटें खराब पड़ी हैं, रात में गलियों में अंधेरा रहता है।",
    "cat-pill-cleanliness": "सफाई व्यवस्था",
    "cat-title-cleanliness": "Cleanliness · सफाई व कूड़ा",
    "cat-desc-cleanliness": "कूड़े के ढेर लगे हैं, नियुक्त सफाईकर्मी महीनों से अनुपस्थित है और नियमित झाड़ू नहीं लगती।",
    "cat-pill-pradhan": "विकास कार्य व निधि",
    "cat-title-pradhan": "Funds · निर्माण कार्य व निधि",
    "cat-desc-pradhan": "मनरेगा/निकाय निधि में फर्जीवाड़ा, मानक विहीन घटिया निर्माण सामग्री, या सरकारी धन का दुरुपयोग।",
    "authority-section-title": "<span>🏛️</span><span>चरण 3: विधिक प्रार्थना पत्र एवं सक्षम अधिकारी</span>",
    "authority-section-desc": "आपके चुने गए क्षेत्र व समस्या के आधार पर आपके सक्षम अधिकारी, CUG मोबाइल व आधिकारिक ईमेल:",
    "txt-quick-call": "CUG कॉल करें",
    "txt-quick-email": "ईमेल भेजें",
    "txt-scroll-workspace": "विधिक पत्र बनाएं",
    "tab-primary-title": "शिकायती प्रार्थना पत्र (Formal Application)",
    "tab-primary-badge": "प्राथमिक चरण",
    "tab-rti-title": "RTI आवेदन पत्र (Form-A Follow-up)",
    "tab-rti-badge": "पारदर्शिता चरण",
    "rti-disclaimer-title": "⚖️ सूचना का अधिकार (RTI) महत्वपूर्ण वैधानिक स्पष्टीकरण",
    "rti-disclaimer-desc": "<strong>RTI शिकायत निवारण का मंच नहीं है।</strong> इसका उद्देश्य सरकारी कार्यालयों से पूर्व शिकायत पर हुई कार्रवाई (ATR), तकनीकी स्वीकृति, माप पुस्तिका (MB) एवं मस्टर रोल की <strong>सत्यापित प्रतियां</strong> प्राप्त करना है।",
    "form-title": "आवेदक विवरण एवं प्रेषण विकल्प",
    "label-nm": "आपका नाम (Complainant Name) <span class=\"required-star\">*</span>",
    "label-mb": "मोबाइल नंबर (Mobile) <span class=\"required-star\">*</span>",
    "label-loc": "गाँव का नाम (Village) <span class=\"required-star\">*</span>",
    "label-ds": "जनपद / जिला (District) <span class=\"required-star\">*</span>",
    "label-subloc": "विकास खंड / ब्लॉक (Block) <span class=\"required-star\">*</span>",
    "label-tehsil": "संबंधित तहसील (Tehsil - SDM / समाधान दिवस क्षेत्राधिकार):",
    "auth-status-badge": "✓ आधिकारिक सत्यापित डेटा",
    "txt-view-auth-contacts": "अधिकारी संपर्क व सीधी हेल्पलाइन देखें",
    "txt-modal-call": "अधिकारी को सीधे कॉल करें",
    "txt-modal-email": "शासकीय आधिकारिक ईमेल भेजें",
    "label-modal-cug": "अधिकृत CUG मोबाइल (सीधी लाइन)",
    "label-modal-email": "शासकीय आधिकारिक ईमेल",
    "label-modal-cc": "पर्यवेक्षी व उच्चाधिकारी (Auto-CC):",
    "txt-modal-proceed": "विधिक पत्र तैयार करने हेतु आगे बढ़ें",
    "txt-modal-dismiss": "बंद करें",
    "label-auth-phone": "📞 CUG शासकीय मोबाइल:",
    "authCallBtn": "📲 कॉल करें",
    "label-auth-email": "📧 आधिकारिक सरकारी ईमेल:",
    "label-auth-cc": "👥 स्वतः संलग्न प्रतिलिपि (Auto-CC):",
    "label-pr": "समस्या का विस्तृत विवरण (Problem Details) <span class=\"required-star\">*</span>",
    "form-help-pr": "ऊपर किसी भी श्रेणी पर क्लिक करने से विवरण स्वतः भर जाता है।",
    "label-prior": "प्रधान/सचिव को पूर्व में कब बताया था? (वैकल्पिक)",
    "label-dt": "आवेदन दिनांक (Filing Date)",
    "legend-cc": "📌 प्रतिलिपि (Cc) विकल्प — अंतर-विभागीय समन्वय हेतु:",
    "label-cc-sdm": "उप-जिलाधिकारी (SDM / समाधान दिवस), तहसील प्रशासन",
    "label-cc-pwd": "अधिशासी अभियंता (EE), लोक निर्माण विभाग (PWD)",
    "btn-reset-text": "फॉर्म रीसेट करें (Reset Form)",
    "doc-status-indicator": "🟢 लाइव शासकीय प्रारूप",
    "prev-btn-email": "📧 ईमेल भेजें",
    "prev-btn-call": "📲 CUG कॉल",
    "prev-btn-jansunwai": "🌐 जनसुनवाई IGRS",
    "prev-btn-print": "🖨️ प्रिंट (A4)",
    "receiving-stub-title": "कार्यालय प्राप्ति रसीद / पावती (Office Receiving Stub)",
    "receiving-stub-diary": "डायरी / रसीद संख्या: __________________",
    "receiving-stub-date": "प्राप्ति दिनांक: __________________",
    "receiving-stub-sign": "प्राप्तकर्ता अधिकारी/बाबू के हस्ताक्षर व सील मोहर: ____________________________________",
    "roadmap-eyebrow": "⚖️ वैधानिक समय-सीमा व निवारण विफलता पर कार्रवाई",
    "roadmap-heading": "चरण 4: 30-दिवसीय समाधान व विधिक एस्केलेशन रोडमैप",
    "roadmap-rti-btn": "<span>🔍 सीधे RTI Form-A पर जाएं</span>",
    "roadmap-step1-badge": "Day 0: समानांतर प्रेषण",
    "roadmap-step1-title": "1. डिजिटल व भौतिक प्रेषण",
    "roadmap-step1-desc": "BDO/EO को सीधे ईमेल भेजें (CC: CDO, DPRO, DM)। पत्र प्रिंट कराकर कार्यालय पावती रसीद स्टब पर <strong>डायरी संख्या</strong> दर्ज कराएं।",
    "roadmap-step2-badge": "Day 7: स्थलीय निरीक्षण",
    "roadmap-step2-title": "2. CUG फोन पर फॉलो-अप",
    "roadmap-step2-desc": "सत्यापित CUG नंबर पर कॉल कर स्थलीय निरीक्षण टीम (JE/सचिव/ADO) के दौरे की तिथि पूछें और वस्तुस्थिति बताएं।",
    "roadmap-step3-badge": "Day 15: जनसुनवाई रिमाइंडर",
    "roadmap-step3-title": "3. IGRS जनसुनवाई रिमाइंडर",
    "roadmap-step3-desc": "15 दिन में काम शुरू न होने पर पूर्व डायरी संख्या के आधार पर जनसुनवाई पोर्टल पर रिमाइंडर दर्ज कराएं।",
    "roadmap-step4-badge": "Day 30+: RTI व समाधान दिवस",
    "roadmap-step4-title": "4. कानूनी अस्त्र (RTI & DM पेशी)",
    "roadmap-step4-desc": "प्रथम व तृतीय मंगलवार को तहसील दिवस पर DM के समक्ष पेश हों। <strong>RTI Act 2005 प्रारूप 'क'</strong> दाखिल कर MB, बिल व ATR तलब करें।",
    "footer-title": "उत्तर प्रदेश जनहित समाधान (Uttar Pradesh Civic Grievance Redressal)",
    "footer-desc": "सटीक प्रशासनिक क्षेत्राधिकार एवं नागरिक जवाबदेही प्रणाली।",
    "footer-call-btn": "📞 CM Helpline 1076",
    "footer-disclaimer": "<strong>अस्वीकरण:</strong> यह एक अनौपचारिक जन सहायक टूल है। शिकायतों का निस्तारण संबंधित विकास खंड, नगर निकाय एवं जनपद के प्रशासनिक क्षेत्राधिकार पर निर्भर करता है। आधिकारिक शिकायत हेतु <a href=\"https://jansunwai.up.nic.in\" target=\"_blank\" rel=\"noopener\">जनसुनवाई पोर्टल</a> अथवा <a href=\"https://rtionline.up.gov.in\" target=\"_blank\" rel=\"noopener\">RTI पोर्टल</a> का उपयोग करें।",
    "txt-modal-copy-phone": "कॉपी",
    "txt-modal-copy-email": "कॉपी",
    "faq-eyebrow": "📚 अक्सर पूछे जाने वाले प्रश्न",
    "faq-heading": "नागरिक अधिकार, शिकायत नियम एवं विधिक प्रक्रियाएं",
    "faq-subheading": "ग्राम पंचायत अधिकार, उप्र जनहित गारंटी अधिनियम के तहत समयबद्ध विधिक निस्तारण एवं RTI आवेदन से संबंधित महत्वपूर्ण जानकारियां।",
    "faq-q1": "उत्तर प्रदेश में ग्राम प्रधान अथवा पंचायत सचिव के विरुद्ध औपचारिक शिकायत कैसे दर्ज करें?",
    "faq-a1": "उप्र पंचायती राज अधिनियम 1947 के अंतर्गत ग्राम पंचायत के प्रशासनिक पर्यवेक्षक अधिकारी <strong>खंड विकास अधिकारी (BDO)</strong> एवं <strong>जिला पंचायत राज अधिकारी (DPRO)</strong> होते हैं। आप BDO को संबोधित औपचारिक विधिक प्रार्थना पत्र तैयार करें (जिसकी प्रति जिलाधिकारी और CDO को मार्क हो), कार्यालय से डायरी नंबर प्राप्त करें तथा सत्यापित CUG फोन से फॉलो-अप करें।",
    "faq-q2": "उप्र जनहित गारंटी अधिनियम 2011 के तहत जनसमस्याओं के निस्तारण की वैधानिक समय-सीमा क्या है?",
    "faq-a2": "<strong>उत्तर प्रदेश जनहित गारंटी अधिनियम 2011</strong> के अनुसार आवश्यक नागरिक सेवाओं (पेयजल हैंडपंप मरम्मत, नाली सफाई, खड़ंजा/सड़क मरम्मत) के निस्तारण हेतु विधिक समय-सीमा निर्धारित है (सामान्यतः <strong>7 से 30 कार्यदिवस</strong>)। निर्धारित समय में निस्तारण न होने पर नागरिक प्रथम अपीलीय अधिकारी (SDM/CDO) के समक्ष अपील कर सकते हैं व तहसील समाधान दिवस पर DM के समक्ष पेश हो सकते हैं।",
    "faq-q3": "गाँव या कस्बे के निर्माण कार्यों में RTI (प्रारूप 'क') कब और कैसे दाखिल करनी चाहिए?",
    "faq-a3": "RTI शिकायत निवारण का मंच नहीं है बल्कि पारदर्शिता का विधिक अस्त्र है। यदि आपकी शिकायत पर 30 दिन में कार्रवाई नहीं होती है, तो <strong>RTI Act 2005 प्रारूप 'क'</strong> दाखिल कर कार्य की माप पुस्तिका (Measurement Book - MB), तकनीकी स्वीकृति, सामग्री बिल व मस्टर रोल की प्रमाणित प्रति तलब करें ताकि जवाबदेही तय की जा सके।",
    "faq-q4": "जिलाधिकारी (DM), मुख्य विकास अधिकारी (CDO) व SDM को स्वतः प्रतिलिपि (Auto-CC) भेजने का क्या लाभ है?",
    "faq-a4": "पर्यवेक्षी उच्चाधिकारियों को औपचारिक प्रतिलिपि (CC) प्रेषित करने से आधिकारिक प्रशासनिक रिकॉर्ड स्थापित होता है। उप्र की साप्ताहिक प्रशासनिक समीक्षा बैठकों में BDO/EO को DM व CDO के समक्ष ऐसी शिकायतों की आख्या प्रस्तुत करनी पड़ती है, जिससे प्रार्थना पत्र दबाया नहीं जा सकता।"
  },
  en: {
    "topbar-title": "Uttar Pradesh Civic Grievance Redressal",
    "txt-dial-btn": "Dial 1076",
    "hero-eyebrow": "<span>⚖️</span><span>UP Janhit Guarantee & Panchayati Raj Statutory Authority</span>",
    "hero-title": "Empowering UP Citizens: Legally Backed Civic Grievance Redressal with Time-Bound Accountability",
    "hero-desc": "Hold local governance accountable under the UP Janhit Guarantee Act, 2011 and Section 15 of UP Panchayati Raj Act. Access verified administrative officers and CUG contacts across all 75 districts, enforce 30-day statutory resolution deadlines, and generate legally binding petitions & RTI Form-A.",
    "hero-badge-1": "⚖️ UP Janhit Guarantee Act 2011",
    "hero-badge-2": "🏛️ 75 Districts & 824 Blocks Covered",
    "hero-badge-3": "⏱️ 30-Day Legal Resolution Protocol",
    "hero-badge-4": "🛡️ S3WaaS Verified CUG Contacts",
    "sec1-title": "Stage 1: Select Grievance Category",
    "sec1-desc": "Click your civic issue below; statutory problem statement auto-fills into the petition:",
    "sec2-title": "Stage 1: Select Grievance Category",
    "voter-section-title": "<span>📮</span><span>Stage 2: Enter PIN Code & Select Area</span>",
    "pincode-title": "<span>📮</span><span>Fast Auto-Detect: Enter Your 6-Digit Postal PIN Code</span>",
    "pincode-status-text": "Enter PIN to auto-detect District, Block & Village suggestions",
    "txt-pincode-detect": "Auto-Detect",
    "txt-pincode-clear": "Clear",
    "label-jurisdiction-heading": "Select Your Administrative Jurisdiction & Village/Ward:",
    "ballot-pradhan-badge": "🌾 Rural Area (Gram Panchayat)",
    "ballot-pradhan-title": "Gram Pradhan (Village Head)",
    "ballot-pradhan-desc": "You vote in village Pradhan elections. You reside in a rural village or hamlet.",
    "ballot-pradhan-officer": "Designated Officer: <strong>Block Development Officer (BDO)</strong> / Pradhan",
    "ballot-chairman-badge": "🏘️ Semi-Urban / Town (Nagar Palika / Panchayat)",
    "ballot-chairman-title": "Chairman (Town President)",
    "ballot-chairman-desc": "You vote for Chairman and Ward Members (Sabhasad). This is a town or kasba.",
    "ballot-chairman-officer": "Designated Officer: <strong>Executive Officer (EO)</strong> / Chairman",
    "ballot-mayor-badge": "🏛️ Metropolitan City (17 Municipal Corporations)",
    "ballot-mayor-title": "Mayor & Corporator (Nagar Nigam)",
    "ballot-mayor-desc": "You vote for Mayor and Ward Corporators (Lucknow, Kanpur, Varanasi, Agra, etc.).",
    "ballot-mayor-officer": "Designated Officer: <strong>Municipal Commissioner</strong> / Mayor",
    "pwd-override-label-text": "🛣️ Special Road Check: Does the road have a 'PWD' or 'PMGSY' milestone / signpost?",
    "pwd-override-subtext": "(Directs petition to Executive Engineer, PWD)",
    "sec2-title": "Stage 2: Select Grievance Category",
    "sec2-desc": "Click your civic issue below; statutory problem statement auto-fills into the petition:",
    "cat-pill-road": "Road & Paving",
    "cat-title-road": "Road · Road & Brick Paving",
    "cat-desc-road": "Road is severely damaged, potholes/mud-filled, or brick/CC paving remains incomplete despite sanction.",
    "cat-pill-drain": "Drainage & Wastewater",
    "cat-title-drain": "Drain · Drainage & Waterlogging",
    "cat-desc-drain": "Drainage is blocked or broken, stagnant wastewater overflows onto passages and doorsteps, creating health risks.",
    "cat-pill-handpump": "Drinking Water",
    "cat-title-handpump": "Water · Handpump & Pipeline",
    "cat-desc-handpump": "India Mark-II handpump or drinking water pipeline is out of order, murky water, severe drinking water crisis.",
    "cat-pill-streetlight": "Streetlight / Solar",
    "cat-title-streetlight": "Light · Street & Solar Lights",
    "cat-desc-streetlight": "Poles have broken LED/solar fixtures, dark alleys after sunset leading to safety hazards.",
    "cat-pill-cleanliness": "Sanitation",
    "cat-title-cleanliness": "Cleanliness · Garbage & Sanitation",
    "cat-desc-cleanliness": "Garbage dump piles accumulated, assigned sanitation worker absent for months, no routine sweeping.",
    "cat-pill-pradhan": "Public Funds & Audit",
    "cat-title-pradhan": "Funds · Development Works & Audit",
    "cat-desc-pradhan": "Irregularities in MGNREGA / civic funds, substandard construction materials used, demanding technical inquiry.",
    "authority-section-title": "<span>🏛️</span><span>Stage 3: Application & Petition Drafting</span>",
    "authority-section-desc": "Based on your selected area and grievance, here is your designated competent officer, verified CUG mobile, and official email:",
    "txt-quick-call": "Call CUG",
    "txt-quick-email": "Send Email",
    "txt-scroll-workspace": "Draft Formal Petition",
    "tab-primary-title": "Formal Grievance Petition",
    "tab-primary-badge": "Primary Stage",
    "tab-rti-title": "RTI Application (Form-A Follow-up)",
    "tab-rti-badge": "Transparency Stage",
    "rti-disclaimer-title": "⚖️ Right to Information (RTI) Statutory Clarification",
    "rti-disclaimer-desc": "<strong>RTI is not a grievance redressal forum.</strong> Its purpose is to obtain <strong>certified copies</strong> of the Action Taken Report (ATR), technical sanctions, Measurement Book (MB), and muster rolls on prior complaints.",
    "form-title": "Applicant Particulars & Dispatch Options",
    "label-nm": "Your Full Name <span class=\"required-star\">*</span>",
    "label-mb": "Mobile Number (10 digits) <span class=\"required-star\">*</span>",
    "label-loc": "Village / Locality Name <span class=\"required-star\">*</span>",
    "label-ds": "District (75 Districts of UP) <span class=\"required-star\">*</span>",
    "label-subloc": "Block / Town Name <span class=\"required-star\">*</span>",
    "label-tehsil": "Tehsil (SDM / Samadhan Diwas Jurisdiction):",
    "auth-status-badge": "✓ Verified Official Record",
    "txt-view-auth-contacts": "View Direct Officer Contacts",
    "txt-modal-call": "Call Officer Directly",
    "txt-modal-email": "Send Official Email",
    "label-modal-cug": "Official CUG Mobile (Direct Line)",
    "label-modal-email": "Official Government Email",
    "label-modal-cc": "Supervisory & Escalation Officers (Auto-CC):",
    "txt-modal-proceed": "Proceed to Draft Petition",
    "txt-modal-dismiss": "Close",
    "label-auth-phone": "📞 Official CUG Mobile:",
    "authCallBtn": "📲 Call CUG",
    "label-auth-email": "📧 Official Government Email:",
    "label-auth-cc": "👥 Auto-CC Recipients:",
    "label-pr": "Grievance Details (Statement of Grievance) <span class=\"required-star\">*</span>",
    "form-help-pr": "Clicking any category above auto-populates this field.",
    "label-prior": "When was Pradhan/Officer previously notified? (Optional)",
    "label-dt": "Application Date",
    "legend-cc": "📌 Multi-CC Options — Inter-Departmental Coordination:",
    "label-cc-sdm": "Sub-Divisional Magistrate (SDM / Samadhan Diwas), Tehsil Admin",
    "label-cc-pwd": "Executive Engineer (EE), Public Works Department (PWD)",
    "btn-reset-text": "Reset Form",
    "doc-status-indicator": "🟢 Live Official Statutory Format",
    "prev-btn-email": "📧 Send Email",
    "prev-btn-call": "📲 Call CUG",
    "prev-btn-jansunwai": "🌐 Jansunwai IGRS",
    "prev-btn-print": "🖨️ Print (A4)",
    "receiving-stub-title": "Office Receiving Stub / Acknowledgment",
    "receiving-stub-diary": "Diary / Acknowledgment No.: __________________",
    "receiving-stub-date": "Date of Receipt: __________________",
    "receiving-stub-sign": "Receiving Official's Signature & Official Seal: ____________________________________",
    "roadmap-eyebrow": "⚖️ Statutory Timeframes & Failure-to-Redress Protocol",
    "roadmap-heading": "Stage 4: 30-Day Resolution & Legal Escalation Roadmap",
    "roadmap-rti-btn": "<span>🔍 Go Directly to RTI Form-A</span>",
    "roadmap-step1-badge": "Day 0: Parallel Filing",
    "roadmap-step1-title": "1. Digital & Physical Dispatch",
    "roadmap-step1-desc": "Send direct email to BDO/EO (CC: CDO, DPRO, DM). Print application and record <strong>Diary Number</strong> on receiving stub.",
    "roadmap-step2-badge": "Day 7: Inspection Follow-up",
    "roadmap-step2-title": "2. Official CUG Telephonic Follow-up",
    "roadmap-step2-desc": "Call verified CUG number to ascertain designated inspection date of field team (JE/Secretary/ADO).",
    "roadmap-step3-badge": "Day 15: Jansunwai Reminder",
    "roadmap-step3-title": "3. IGRS Jansunwai Reminder",
    "roadmap-step3-desc": "If rectification has not commenced within 15 days, lodge an online reminder on Jansunwai citing prior diary number.",
    "roadmap-step4-badge": "Day 30+: RTI & Samadhan Diwas",
    "roadmap-step4-title": "4. Legal Escalation (RTI & DM Hearing)",
    "roadmap-step4-desc": "Appear before DM on 1st/3rd Tuesday Tehsil Diwas. File <strong>RTI Act 2005 Form-A</strong> demanding MB, bills, and ATR.",
    "footer-title": "Uttar Pradesh Civic Grievance Redressal",
    "footer-desc": "Accurate jurisdictional routing and civic accountability system.",
    "footer-call-btn": "📞 CM Helpline 1076",
    "footer-disclaimer": "<strong>Disclaimer:</strong> This is a public facilitation platform. Grievance disposal is subject to administrative jurisdiction of relevant Development Blocks and Urban Bodies in UP. For official submissions, use <a href=\"https://jansunwai.up.nic.in\" target=\"_blank\" rel=\"noopener\">Jansunwai Portal</a> or <a href=\"https://rtionline.up.gov.in\" target=\"_blank\" rel=\"noopener\">UP RTI Portal</a>.",
    "txt-modal-copy-phone": "Copy",
    "txt-modal-copy-email": "Copy",
    "faq-eyebrow": "📚 Frequently Asked Questions",
    "faq-heading": "Citizen Rights, Grievance Rules & Legal Procedures",
    "faq-subheading": "Answers to key questions regarding Gram Panchayat authority, time-bound legal resolution under UP Janhit Guarantee Act, and RTI applications.",
    "faq-q1": "How to lodge an official complaint against a Gram Pradhan or Panchayat Secretary in Uttar Pradesh?",
    "faq-a1": "Under the UP Panchayati Raj Act, 1947, the supervisory administrative officer for a Gram Panchayat is the <strong>Block Development Officer (BDO)</strong> and the <strong>District Panchayat Raj Officer (DPRO)</strong>. You can draft a formal petition addressed to the BDO with auto-CC to the District Magistrate (DM) and Chief Development Officer (CDO), record a physical receipt diary number, and follow up via official CUG phone.",
    "faq-q2": "What is the statutory resolution timeframe for civic grievances under the UP Janhit Guarantee Act, 2011?",
    "faq-a2": "Under the <strong>Uttar Pradesh Janhit Guarantee Act, 2011</strong>, basic public services (drinking water handpump repair, drainage clearing, brick road paving) carry a statutory timeframe, typically between <strong>7 to 30 days</strong>. If an officer fails to act, citizens can escalate to the First Appellate Authority (SDM / CDO) and present the matter on Tehsil Samadhan Diwas.",
    "faq-q3": "When and how should an RTI Form-A application be filed for civic works in UP?",
    "faq-a3": "RTI (Right to Information) is not a grievance redressal mechanism, but a transparency tool. If your grievance is unresolved after 30 days, file <strong>RTI Form-A</strong> seeking certified copies of the Measurement Book (MB), technical sanction estimates, tender sanctions, and Action Taken Reports (ATR) to establish evidence of administrative inaction or financial irregularities.",
    "faq-q4": "How does multi-department Auto-CC to DM, CDO, and SDM ensure action?",
    "faq-a4": "Marking copies (CC) to supervisory authorities creates an official administrative trail. Under UP administrative protocols, field-level officers (BDOs/EOs) must report compliance to the <strong>District Magistrate and CDO</strong> during weekly review meetings, preventing field petitions from being silently ignored."
  }
};

const I18N_PLACEHOLDERS = {
  hi: {
    nm: "उदा. राम प्रसाद मौर्य",
    mb: "10 अंकों का मोबाइल नंबर",
    pr: "समस्या का स्पष्ट विवरण लिखें...",
    sn: "उदा. 15/10/2026 (यदि लागू हो)"
  },
  en: {
    nm: "e.g., Ram Prasad Maurya",
    mb: "10-digit mobile number",
    pr: "Describe the grievance in detail...",
    sn: "e.g., 15/10/2026 (if applicable)"
  }
};

// Bilingual Authority Mapping & Statutory Metadata
const ballotConfig = {
  pradhan: {
    title: { hi: "ग्राम पंचायत (Gram Panchayat)", en: "Gram Panchayat (Rural Council)" },
    officer: { hi: "श्रीमान खंड विकास अधिकारी (BDO महोदय)", en: "The Block Development Officer (BDO)" },
    office: {
      hi: "कार्यालय: खंड विकास अधिकारी, विकास खंड: {subloc}, जनपद: {ds}, उत्तर प्रदेश।",
      en: "Office of the Block Development Officer, Development Block: {subloc}, District: {ds}, Uttar Pradesh."
    },
    statute: {
      hi: "उत्तर प्रदेश पंचायती राज अधिनियम, 1947 की धारा 15 एवं UP जनहित गारंटी अधिनियम, 2011",
      en: "Section 15 of UP Panchayati Raj Act, 1947 & UP Janhit Guarantee Act, 2011"
    },
    locLabel: { hi: "गाँव का नाम (Village)", en: "Village / Hamlet (Majra)" },
    locPlaceholder: { hi: "उदा. रामपुर मजरा", en: "e.g., Rampur Majra" },
    sublocLabel: { hi: "विकास खंड / ब्लॉक (Block)", en: "Development Block" },
    sublocPlaceholder: { hi: "उदा. बछरावाँ", en: "e.g., Bachhrawan" },
    priorLabel: { hi: "प्रधान/सचिव को पूर्व में कब बताया था? (वैकल्पिक)", en: "When was Pradhan/Officer previously notified? (Optional)" },
    districtCcLabel: { hi: "जिला पंचायत राज अधिकारी (DPRO)", en: "District Panchayat Raj Officer (DPRO)" },
    defaultEmail: "cdo-{ds}@nic.in",
    badgeClass: "badge-pradhan",
    badgeText: { hi: "ग्राम पंचायत", en: "Gram Panchayat" }
  },
  chairman: {
    title: { hi: "नगर पालिका / नगर पंचायत (Nagar Palika / Panchayat)", en: "Nagar Palika Parishad / Town Panchayat" },
    officer: { hi: "श्रीमान अधिशासी अधिकारी (Executive Officer - EO महोदय)", en: "The Executive Officer (EO)" },
    office: {
      hi: "कार्यालय: नगर पालिका परिषद / नगर पंचायत {subloc}, जनपद: {ds}, उत्तर प्रदेश।",
      en: "Office of the Executive Officer, Nagar Palika / Panchayat {subloc}, District: {ds}, Uttar Pradesh."
    },
    statute: {
      hi: "उत्तर प्रदेश नगर पालिका अधिनियम, 1916 की धारा 7 व 8 एवं UP जनहित गारंटी अधिनियम, 2011",
      en: "Sections 7 & 8 of UP Municipalities Act, 1916 & UP Janhit Guarantee Act, 2011"
    },
    locLabel: { hi: "वार्ड संख्या व मोहल्ला (Ward & Locality)", en: "Ward No. & Locality" },
    locPlaceholder: { hi: "उदा. वार्ड 4, कटरा बाजार", en: "e.g., Ward 4, Katra Bazar" },
    sublocLabel: { hi: "नगर पालिका / नगर पंचायत (Town Name)", en: "Town / Nagar Palika Name" },
    sublocPlaceholder: { hi: "उदा. बछरावाँ टाउन", en: "e.g., Bachhrawan Town" },
    priorLabel: { hi: "चेयरमैन/सभासद को पूर्व में कब बताया था? (वैकल्पिक)", en: "When was Chairman/Member previously notified? (Optional)" },
    districtCcLabel: { hi: "जिलाधिकारी महोदय (DM कार्यालय)", en: "District Magistrate (DM Office)" },
    defaultEmail: "dm{ds}@nic.in",
    badgeClass: "badge-chairman",
    badgeText: { hi: "नगर पालिका / पंचायत", en: "Nagar Palika / Panchayat" }
  },
  mayor: {
    title: { hi: "नगर निगम (Municipal Corporation)", en: "Municipal Corporation (Nagar Nigam)" },
    officer: { hi: "श्रीमान नगर आयुक्त महोदय (Municipal Commissioner)", en: "The Municipal Commissioner (Nagar Ayukt)" },
    office: {
      hi: "कार्यालय: नगर निगम मुख्यालय / जोनल कार्यालय {subloc}, जनपद: {ds}, उत्तर प्रदेश।",
      en: "Office of the Municipal Commissioner / Zonal Office {subloc}, District: {ds}, Uttar Pradesh."
    },
    statute: {
      hi: "उत्तर प्रदेश नगर निगम अधिनियम, 1959 की धारा 114 व 561 एवं UP जनहित गारंटी अधिनियम, 2011",
      en: "Sections 114 & 561 of UP Municipal Corporation Act, 1959 & UP Janhit Guarantee Act, 2011"
    },
    locLabel: { hi: "वार्ड संख्या व मोहल्ला (Ward & Locality)", en: "Ward No. & Sector/Mohalla" },
    locPlaceholder: { hi: "उदा. वार्ड 12, इंदिरानगर", en: "e.g., Ward 12, Indira Nagar" },
    sublocLabel: { hi: "नगर निगम / जोन (Municipal Zone)", en: "Municipal Zone / City" },
    sublocPlaceholder: { hi: "उदा. जोन 4, लखनऊ", en: "e.g., Zone 4, Lucknow" },
    priorLabel: { hi: "वार्ड पार्षद/मेयर को पूर्व में कब बताया था? (वैकल्पिक)", en: "When was Corporator/Mayor previously notified? (Optional)" },
    districtCcLabel: { hi: "जिलाधिकारी महोदय (DM कार्यालय)", en: "District Magistrate (DM Office)" },
    defaultEmail: "comm{ds}@nic.in",
    badgeClass: "badge-mayor",
    badgeText: { hi: "नगर निगम", en: "Nagar Nigam" }
  }
};

// Bilingual Category Problem Presets
const categoryPresets = {
  road: {
    hi: "मार्ग पर खड़ंजा/सीसी रोड पूरी तरह क्षतिग्रस्त एवं कीचड़युक्त हो चुकी है, जिससे नागरिकों, स्कूली बच्चों व बुजुर्गों को आवागमन में भारी असुविधा का सामना करना पड़ रहा है। आए दिन दुर्घटनाएं हो रही हैं।",
    en: "The public road / brick paving (Kharanja/CC Road) is severely damaged, broken, and waterlogged with mud, causing acute hardship for daily commuters, school children, and senior citizens. Frequent road slips and minor accidents are occurring daily."
  },
  drain: {
    hi: "मुख्य जल निकासी नाली कई स्थानों पर टूटी एवं चोक पड़ी है, जिससे गंदा व बदबूदार पानी सड़कों व घरों के आगे जमा हो रहा है। इससे संक्रामक बीमारियों व मच्छरों का गंभीर प्रकोप फैलने की आशंका है।",
    en: "The primary drainage channel is choked and structurally damaged in multiple stretches. Stagnant, foul-smelling wastewater is inundating public passages and residential doorsteps, posing an imminent risk of vector-borne and communicable epidemic diseases."
  },
  handpump: {
    hi: "सार्वजनिक इंडिया मार्क-2 हैंडपंप/पाइपलाइन विगत कई माह से खराब/दूषित जल फेंक रहा है, जिससे इलाके में पेयजल का विकट संकट उत्पन्न हो गया है तथा लोग दूषित जल पीने को मजबूर हैं।",
    en: "The public India Mark-II handpump / drinking water pipeline has been non-functional or discharging contaminated muddy water for several months, triggering an acute potable drinking water crisis in the locality."
  },
  streetlight: {
    hi: "सार्वजनिक खंभों पर लगी स्ट्रीट लाइटें/सोलर लाइटें काफी समय से खराब पड़ी हैं, जिससे सूर्यास्त के पश्चात गलियों में घोर अंधकार रहता है और असामाजिक तत्वों का भय बना रहता है।",
    en: "Public streetlights / solar street lighting units have remained non-functional for a prolonged period, leaving streets in complete darkness after dusk and elevating civic safety concerns."
  },
  cleanliness: {
    hi: "इलाके में तैनात नियमित सफाई कर्मचारी कर्तव्य स्थल पर लंबे समय से अनुपस्थित चल रहा है। गलियों में नियमित झाड़ू नहीं लगती और सार्वजनिक स्थानों पर कूड़े के ढेर लगे हुए हैं।",
    en: "The sanctioned sanitation worker (Safai Karmchari) has been habitually absent from duty for months. Public thoroughfares are uncleaned and garbage dump heaps have accumulated in open public spaces."
  },
  pradhan: {
    hi: "स्वीकृत निर्माण कार्यों में मानक विहीन घटिया सामग्री का प्रयोग किया गया है तथा सार्वजनिक धन का भारी दुरुपयोग किया गया है, जिसकी स्थलीय तकनीकी जाँच कराया जाना जनहित में आवश्यक है।",
    en: "Substandard, non-conforming construction materials were utilized in sanctioned public development projects, accompanied by blatant misappropriation of sanctioned civic funds, demanding an immediate on-site technical inquiry."
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  document.getElementById('dt').value = `${dd}/${mm}/${yyyy}`;

  initGovernanceData();
  loadSavedData();
  setLanguage(currentLang, true);
  initStepperScrollSpy();
});

// Dynamic Stepper Scroll Spy & Synchronized Active Indicators
function initStepperScrollSpy() {
  const stepperBar = document.querySelector('.workflow-stepper-bar');
  if (!stepperBar) return;

  const steps = [
    { sectionId: 'voter-section', navId: 'step-nav-1' },
    { sectionId: 'problem', navId: 'step-nav-2' },
    { sectionId: 'workspace', navId: 'step-nav-3' },
    { sectionId: 'escalation-section', navId: 'step-nav-4' }
  ];

  function updateActiveStep() {
    let currentNav = steps[0].navId;
    const isBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);

    if (isBottom) {
      currentNav = steps[steps.length - 1].navId;
    } else {
      for (let i = 0; i < steps.length; i++) {
        const el = document.getElementById(steps[i].sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260) {
            currentNav = steps[i].navId;
          }
        }
      }
    }

    steps.forEach(s => {
      const navEl = document.getElementById(s.navId);
      if (navEl) {
        navEl.classList.toggle('active', s.navId === currentNav);
      }
    });
  }

  window.addEventListener('scroll', updateActiveStep, { passive: true });
  window.addEventListener('resize', updateActiveStep, { passive: true });
  updateActiveStep();

  // Smooth scroll click handler on step links
  steps.forEach(s => {
    const navEl = document.getElementById(s.navId);
    if (navEl) {
      navEl.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(s.sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          steps.forEach(x => {
            const el = document.getElementById(x.navId);
            if (el) el.classList.toggle('active', x.navId === s.navId);
          });
        }
      });
    }
  });
}

// Language Switcher Function
function setLanguage(lang, isInitial) {
  currentLang = lang;
  try { localStorage.setItem('gaon_shikayat_lang', lang); } catch (e) {}

  document.documentElement.lang = lang;
  document.title = "Uttar Pradesh Civic Grievance Redressal";

  const btnHi = document.getElementById('lang-btn-hi');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnHi && btnEn) {
    if (lang === 'en') {
      btnEn.classList.add('active');
      btnHi.classList.remove('active');
    } else {
      btnHi.classList.add('active');
      btnEn.classList.remove('active');
    }
  }

  // Update DOM elements by ID
  const dict = I18N[lang];
  if (dict) {
    Object.keys(dict).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = dict[id];
    });
  }

  // Update input placeholders
  const phs = I18N_PLACEHOLDERS[lang];
  if (phs) {
    Object.keys(phs).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.placeholder = phs[id];
    });
  }

  // Re-apply ballot labels & placeholders
  selectVoterAuthority(selectedBallot, true);

  resolveCurrentAuthority();
  updatePreview();

  if (!isInitial) {
    showToast(lang === 'en' ? 'Language switched to English' : 'भाषा बदलकर हिंदी कर दी गई');
  }
}

// ================= POSTAL PIN CODE AUTO-LOCATOR =================
// Offline Prefix Dictionary for All 75 Districts of Uttar Pradesh
const UP_PIN_PREFIX_MAP = {
  "201": "Gautam Buddha Nagar",
  "202": "Aligarh",
  "203": "Bulandshahr",
  "204": "Hathras",
  "205": "Mainpuri",
  "206": "Etawah",
  "207": "Etah",
  "208": "Kanpur Nagar",
  "209": "Kanpur Dehat",
  "210": "Banda",
  "211": "Prayagraj",
  "212": "Kaushambi",
  "221": "Varanasi",
  "222": "Jaunpur",
  "223": "Ghazipur",
  "224": "Ayodhya",
  "225": "Barabanki",
  "226": "Lucknow",
  "227": "Sultanpur",
  "228": "Amethi",
  "229": "Raebareli",
  "230": "Pratapgarh",
  "231": "Mirzapur",
  "232": "Chandauli",
  "233": "Ghazipur",
  "241": "Hardoi",
  "242": "Shahjahanpur",
  "243": "Bareilly",
  "244": "Moradabad",
  "245": "Hapur",
  "246": "Bijnor",
  "247": "Saharanpur",
  "250": "Meerut",
  "251": "Muzaffarnagar",
  "261": "Sitapur",
  "262": "Kheri",
  "271": "Gonda",
  "272": "Basti",
  "273": "Gorakhpur",
  "274": "Deoria",
  "275": "Mau",
  "276": "Azamgarh",
  "277": "Ballia",
  "281": "Mathura",
  "282": "Agra",
  "283": "Firozabad",
  "284": "Jhansi"
};

// Normalize district names from API to UP master records
function matchDistrictName(apiDistrict) {
  if (!apiDistrict || !window.UP_GOVERNANCE_DATA) return null;
  const clean = apiDistrict.trim().toLowerCase();

  const aliases = {
    'rae bareli': 'raebareli',
    'allahabad': 'prayagraj',
    'faizabad': 'ayodhya',
    'noida': 'gautam buddha nagar',
    'greater noida': 'gautam buddha nagar',
    'g.b. nagar': 'gautam buddha nagar',
    'gautam budh nagar': 'gautam buddha nagar',
    'lakhimpur kheri': 'kheri',
    'lakhimpur-kheri': 'kheri',
    'lakhimpur': 'kheri',
    'sant ravidas nagar': 'bhadohi',
    'sant ravidas nagar bhadohi': 'bhadohi',
    'kanshiram nagar': 'kasganj',
    'kanpur': 'kanpur nagar',
    'jyotiba phule nagar': 'amroha',
    'mahamaya nagar': 'hathras',
    'prabuddh nagar': 'shamli',
    'panchsheel nagar': 'hapur',
    'bhim nagar': 'sambhal'
  };

  const target = aliases[clean] || clean;

  // 1. Direct match
  let found = window.UP_GOVERNANCE_DATA.find(d => d.name.toLowerCase() === target || (d.hindi && d.hindi === apiDistrict));
  if (found) return found;

  // 2. Contains match
  found = window.UP_GOVERNANCE_DATA.find(d => d.name.toLowerCase().includes(target) || target.includes(d.name.toLowerCase()));
  return found || null;
}

let pincodeLookupAbortCtrl = null;

// Handle typing in PIN Code input
function onPincodeInput(val) {
  const sanitized = val.replace(/\D/g, '').slice(0, 6);
  const inputEl = document.getElementById('pincodeInput');
  if (inputEl.value !== sanitized) inputEl.value = sanitized;

  const badgeEl = document.getElementById('pincodeStatusBadge');

  if (sanitized.length === 6) {
    lookupPincode(sanitized);
  } else if (sanitized.length > 0) {
    const prefix = sanitized.slice(0, 3);
    const offlineDist = UP_PIN_PREFIX_MAP[prefix];
    if (offlineDist && badgeEl) {
      badgeEl.className = 'pincode-status-badge';
      badgeEl.innerHTML = `<span>📍</span><span>${currentLang === 'en' ? `Likely District: ${offlineDist} (Enter 6 digits)` : `संभावित जनपद: ${offlineDist} (6 अंक दर्ज करें)`}</span>`;
    } else if (badgeEl) {
      badgeEl.className = 'pincode-status-badge';
      badgeEl.innerHTML = `<span>⏳</span><span>${currentLang === 'en' ? 'Enter 6-digit PIN code...' : '6 अंकों का पिन कोड दर्ज करें...'}</span>`;
    }
  } else if (badgeEl) {
    badgeEl.className = 'pincode-status-badge';
    badgeEl.innerHTML = `<span>💡</span><span>${currentLang === 'en' ? 'Enter PIN to auto-detect District, Block & Village suggestions' : 'पिन कोड दर्ज कर जिला, ब्लॉक व स्थानीय गाँव स्वतः चुनें'}</span>`;
  }
}

// Manual button trigger for PIN lookup
function triggerPincodeLookup() {
  const val = (document.getElementById('pincodeInput').value || '').trim();
  if (val.length === 6 && /^\d{6}$/.test(val)) {
    lookupPincode(val);
  } else {
    showToast(currentLang === 'en' ? 'Please enter a valid 6-digit postal PIN code.' : 'कृपया 6 अंकों का मान्य पिन कोड दर्ज करें।');
    document.getElementById('pincodeInput').focus();
  }
}

// Clear PIN Code and restore initial state
function clearPincode() {
  document.getElementById('pincodeInput').value = '';
  const badgeEl = document.getElementById('pincodeStatusBadge');
  if (badgeEl) {
    badgeEl.className = 'pincode-status-badge';
    badgeEl.innerHTML = `<span>💡</span><span>${currentLang === 'en' ? 'Enter PIN to auto-detect District, Block & Village suggestions' : 'पिन कोड दर्ज कर जिला, ब्लॉक व स्थानीय गाँव स्वतः चुनें'}</span>`;
  }
  const datalist = document.getElementById('pincodeVillageList');
  if (datalist) datalist.innerHTML = '';
  showToast(currentLang === 'en' ? 'PIN code reset.' : 'पिन कोड हटा दिया गया।');
}

// Core Async PIN Code Resolver (Online Postal API + Offline UP Prefix Fallback)
async function lookupPincode(pin) {
  const badgeEl = document.getElementById('pincodeStatusBadge');
  if (badgeEl) {
    badgeEl.className = 'pincode-status-badge loading';
    badgeEl.innerHTML = `<span>⏳</span><span>${currentLang === 'en' ? `Locating PIN ${pin}...` : `पिन कोड ${pin} खोजा जा रहा है...`}</span>`;
  }

  // Pre-apply offline match if available for zero-latency UI reaction
  const prefix = pin.slice(0, 3);
  const offlineDistName = UP_PIN_PREFIX_MAP[prefix];
  if (offlineDistName) {
    const offlineDist = matchDistrictName(offlineDistName);
    if (offlineDist) {
      quickSelectDistrict(offlineDist.name);
    }
  }

  // Abort previous fetch if pending
  if (pincodeLookupAbortCtrl) {
    pincodeLookupAbortCtrl.abort();
  }
  pincodeLookupAbortCtrl = new AbortController();
  const timeoutId = setTimeout(() => pincodeLookupAbortCtrl.abort(), 4000);

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: pincodeLookupAbortCtrl.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
      const postOffices = data[0].PostOffice;
      const apiDistrict = postOffices[0].District;
      const matchedDist = matchDistrictName(apiDistrict) || (offlineDistName ? matchDistrictName(offlineDistName) : null);

      if (matchedDist) {
        quickSelectDistrict(matchedDist.name);

        // Find best matching block
        let matchedBlock = null;
        const poBlocks = [...new Set(postOffices.map(p => p.Block).filter(Boolean))];
        const poNames = [...new Set(postOffices.map(p => p.Name).filter(Boolean))];

        for (const pb of poBlocks) {
          const pbClean = pb.toLowerCase().trim();
          matchedBlock = matchedDist.blocks.find(b => {
            const bClean = b.name.toLowerCase().trim();
            return bClean === pbClean || bClean.includes(pbClean) || pbClean.includes(bClean);
          });
          if (matchedBlock) break;
        }

        // If block not matched by Block field, check if any PostOffice Name is a Block name
        if (!matchedBlock) {
          for (const pn of poNames) {
            const pnClean = pn.toLowerCase().trim();
            matchedBlock = matchedDist.blocks.find(b => b.name.toLowerCase().trim() === pnClean);
            if (matchedBlock) break;
          }
        }

        if (matchedBlock) {
          const blkSelect = document.getElementById('blockSelect');
          if (blkSelect) blkSelect.value = matchedBlock.name;
          document.getElementById('bk').value = matchedBlock.name;
        }

        // Populate Village Datalist with all post offices under this PIN
        const datalist = document.getElementById('pincodeVillageList');
        if (datalist) {
          datalist.innerHTML = '';
          poNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            datalist.appendChild(opt);
          });
        }

        // Auto-fill Village input if empty or previously blank
        const vlInput = document.getElementById('vl');
        if (vlInput && (!vlInput.value.trim() || vlInput.value === 'Rampur Majra')) {
          vlInput.value = poNames[0] || '';
        }

        resolveCurrentAuthority();
        updatePreview();

        if (badgeEl) {
          badgeEl.className = 'pincode-status-badge success';
          const distLabel = currentLang === 'en' ? matchedDist.name : (matchedDist.hindi || matchedDist.name);
          const blkLabel = matchedBlock ? ` · ${matchedBlock.name}` : '';
          badgeEl.innerHTML = `<span>✓</span><span>${currentLang === 'en' ? `PIN ${pin}: ${distLabel}${blkLabel} (${poNames.length} localities loaded)` : `पिन ${pin}: ${distLabel}${blkLabel} (${poNames.length} स्थानीय क्षेत्र उपलब्ध)`}</span>`;
        }

        showToast(currentLang === 'en' ? `✓ PIN ${pin} Verified: ${matchedDist.name}` : `✓ पिन ${pin} सत्यापित: ${matchedDist.hindi || matchedDist.name}`);
        return;
      }
    }
    throw new Error('No matching postal offices');
  } catch (err) {
    clearTimeout(timeoutId);
    // Graceful offline fallback
    if (offlineDistName) {
      const offlineDist = matchDistrictName(offlineDistName);
      if (offlineDist) {
        quickSelectDistrict(offlineDist.name);
        if (badgeEl) {
          badgeEl.className = 'pincode-status-badge success';
          const distLabel = currentLang === 'en' ? offlineDist.name : (offlineDist.hindi || offlineDist.name);
          badgeEl.innerHTML = `<span>✓</span><span>${currentLang === 'en' ? `PIN ${pin}: ${distLabel} (Offline verified)` : `पिन ${pin}: ${distLabel} (ऑफलाइन सत्यापित)`}</span>`;
        }
        showToast(currentLang === 'en' ? `PIN ${pin}: ${offlineDist.name} (Offline)` : `पिन ${pin}: ${offlineDist.hindi || offlineDist.name}`);
        return;
      }
    }

    if (badgeEl) {
      badgeEl.className = 'pincode-status-badge error';
      badgeEl.innerHTML = `<span>⚠️</span><span>${currentLang === 'en' ? `PIN ${pin} not in UP directory (Please select below)` : `पिन ${pin} UP डायरेक्टरी में नहीं मिला (कृपया नीचे चुनें)`}</span>`;
    }
  }
}

// Populate 75 Districts into District Selector
function initGovernanceData() {
  const select = document.getElementById('districtSelect');
  if (!select || !window.UP_GOVERNANCE_DATA) return;

  const defaultText = currentLang === 'en' ? '-- Select District (75 Districts) --' : '-- जनपद चुनें (75 Districts) --';
  select.innerHTML = `<option value="">${defaultText}</option>`;
  window.UP_GOVERNANCE_DATA.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.name;
    opt.textContent = `${d.hindi} (${d.name})`;
    select.appendChild(opt);
  });

  // Default to Raebareli if not set
  if (!document.getElementById('ds').value) {
    quickSelectDistrict('Raebareli');
  }
}

// District Selector handler
function quickSelectDistrict(districtName) {
  const select = document.getElementById('districtSelect');
  if (select) {
    select.value = districtName;
    onDistrictSelected(districtName);
  }
}

// District selection event
function onDistrictSelected(districtName) {
  if (!districtName) return;
  document.getElementById('ds').value = districtName;

  const distData = (window.UP_GOVERNANCE_DATA || []).find(d => d.name.toLowerCase() === districtName.toLowerCase());
  if (!distData) return;

  // Populate Blocks dropdown
  const blockSelect = document.getElementById('blockSelect');
  blockSelect.innerHTML = '';
  distData.blocks.forEach((blk) => {
    const opt = document.createElement('option');
    opt.value = blk.name;
    opt.textContent = blk.name;
    blockSelect.appendChild(opt);
  });

  // Default to first block or Bachhrawan
  const defaultBlock = distData.blocks.find(b => b.name.toLowerCase().includes('bachhrawan')) || distData.blocks[0];
  if (defaultBlock) {
    blockSelect.value = defaultBlock.name;
    document.getElementById('bk').value = defaultBlock.name;
  }

  // Populate Tehsils dropdown
  const tehsilSelect = document.getElementById('tehsilSelect');
  const tehDefault = currentLang === 'en' ? '-- Select Relevant Tehsil --' : '-- संबंधित तहसील चुनें --';
  tehsilSelect.innerHTML = `<option value="">${tehDefault}</option>`;
  distData.tehsils.forEach(teh => {
    const opt = document.createElement('option');
    opt.value = teh.name;
    opt.textContent = `${currentLang === 'en' ? 'Tehsil' : 'तहसील'}: ${teh.name} (${teh.sdmName || 'SDM'})`;
    tehsilSelect.appendChild(opt);
  });
  if (distData.tehsils.length > 0) {
    tehsilSelect.selectedIndex = 1;
  }

  resolveCurrentAuthority();
  updatePreview();
  showToast(currentLang === 'en' ? `District selected: ${distData.name}` : `जनपद चुना गया: ${distData.hindi}`);
}

// Block selection event
function onBlockSelected(blockName) {
  document.getElementById('bk').value = blockName;
  resolveCurrentAuthority();
  updatePreview();
}

// Tehsil selection event
function onTehsilSelected(tehsilName) {
  resolveCurrentAuthority();
  updatePreview();
}

// Resolve Designated Authority from Scraped Master
function resolveCurrentAuthority() {
  const dsVal = document.getElementById('ds').value.trim() || 'Raebareli';
  const bkVal = document.getElementById('bk').value.trim() || 'Bachhrawan';
  const tehsilVal = document.getElementById('tehsilSelect').value;
  const lang = currentLang;

  const distData = (window.UP_GOVERNANCE_DATA || []).find(d => d.name.toLowerCase() === dsVal.toLowerCase()) || (window.UP_GOVERNANCE_DATA ? window.UP_GOVERNANCE_DATA[0] : null);
  const distDisplayName = lang === 'en' ? (distData ? distData.name : dsVal) : (distData ? (distData.hindi || distData.name) : dsVal);

  let officerTitle = lang === 'en' ? "Block Development Officer (BDO)" : "खंड विकास अधिकारी (BDO)";
  let officerOffice = lang === 'en' ? `Office: Development Block ${bkVal}, District: ${distDisplayName}` : `कार्यालय: विकास खंड ${bkVal}, जनपद: ${distDisplayName}`;
  let officerPhone = "";
  let officerEmail = "";
  let ccList = [];

  if (distData) {
    const matchingBlock = distData.blocks.find(b => b.name.toLowerCase() === bkVal.toLowerCase()) || distData.blocks[0];
    const matchingTehsil = distData.tehsils.find(t => t.name.toLowerCase() === tehsilVal.toLowerCase()) || distData.tehsils[0];

    if (isPwdOverride) {
      officerTitle = lang === 'en' ? "Executive Engineer (EE), Public Works Department (PWD)" : "अधिशासी अभियंता (EE), लोक निर्माण विभाग (PWD)";
      officerOffice = lang === 'en' ? `Office of Executive Engineer, Provincial/Construction Division, PWD, District: ${distDisplayName}` : `कार्यालय: अधिशासी अभियंता, प्रांतीय / निर्माण खंड, लोक निर्माण विभाग (PWD), जनपद: ${distDisplayName}`;
      officerEmail = distData.pwd.email;
      officerPhone = distData.pwd.phone || distData.dm.phone;
      ccList = lang === 'en' ? [
        `Chief Development Officer (CDO): ${distData.cdo.email}`,
        `District Magistrate (DM): ${distData.dm.email}`
      ] : [
        `मुख्य विकास अधिकारी (CDO): ${distData.cdo.email}`,
        `जिलाधिकारी (DM): ${distData.dm.email}`
      ];
    } else if (selectedBallot === 'pradhan') {
      if (matchingBlock) {
        officerTitle = lang === 'en' ? `Block Development Officer (BDO), Block ${matchingBlock.name}` : `खंड विकास अधिकारी (BDO), ब्लॉक ${matchingBlock.name}`;
        officerOffice = lang === 'en' ? `Office: Block Development Officer, Block: ${matchingBlock.name}, District: ${distDisplayName}` : `कार्यालय: खंड विकास अधिकारी, विकास खंड: ${matchingBlock.name}, जनपद: ${distDisplayName}`;
        officerPhone = matchingBlock.bdoPhone || distData.cdo.phone;
        officerEmail = matchingBlock.bdoEmail;
      }
      ccList = lang === 'en' ? [
        `Chief Development Officer (CDO): ${distData.cdo.email}`,
        `DPRO (Panchayat Raj): ${distData.dpro.email}`,
        `District Magistrate (DM): ${distData.dm.email}`
      ] : [
        `मुख्य विकास अधिकारी (CDO): ${distData.cdo.email}`,
        `DPRO (पंचायत राज): ${distData.dpro.email}`,
        `जिलाधिकारी (DM): ${distData.dm.email}`
      ];
      if (matchingTehsil && matchingTehsil.sdmEmail) {
        ccList.unshift(lang === 'en' ? `Sub-Divisional Magistrate (SDM ${matchingTehsil.name}): ${matchingTehsil.sdmEmail}` : `उपजिलाधिकारी (SDM ${matchingTehsil.name}): ${matchingTehsil.sdmEmail}`);
      }
    } else if (selectedBallot === 'chairman') {
      officerTitle = lang === 'en' ? `Executive Officer (EO), Nagar Palika / Panchayat ${bkVal}` : `अधिशासी अधिकारी (EO), नगर पालिका / पंचायत ${bkVal}`;
      officerOffice = lang === 'en' ? `Office: Executive Officer, Nagar Palika Parishad / Panchayat ${bkVal}, District: ${distDisplayName}` : `कार्यालय: अधिशासी अधिकारी, नगर पालिका परिषद / नगर पंचायत ${bkVal}, जनपद: ${distDisplayName}`;
      officerPhone = (matchingTehsil ? matchingTehsil.sdmPhone : '') || distData.dm.phone;
      const cleanTown = bkVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      officerEmail = `eo.npp${cleanTown}@gmail.com`;
      ccList = lang === 'en' ? [
        `Sub-Divisional Magistrate (SDM): ${matchingTehsil ? matchingTehsil.sdmEmail : ''}`,
        `District Magistrate (DM): ${distData.dm.email}`
      ] : [
        `उपजिलाधिकारी (SDM): ${matchingTehsil ? matchingTehsil.sdmEmail : ''}`,
        `जिलाधिकारी (DM): ${distData.dm.email}`
      ];
    } else if (selectedBallot === 'mayor') {
      officerTitle = lang === 'en' ? `Municipal Commissioner, Municipal Corporation ${distData.name}` : `नगर आयुक्त महोदय (Municipal Commissioner), नगर निगम ${distData.name}`;
      officerOffice = lang === 'en' ? `Office: Municipal Corporation HQ / Zonal Office ${bkVal}, District: ${distDisplayName}` : `कार्यालय: नगर निगम मुख्यालय / जोनल कार्यालय ${bkVal}, जनपद: ${distDisplayName}`;
      officerPhone = distData.dm.phone;
      const cleanDs = distData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      officerEmail = `nagarnigam${cleanDs}@gmail.com`;
      ccList = lang === 'en' ? [
        `Divisional Commissioner: comm-${distData.division ? distData.division.toLowerCase() : cleanDs}@nic.in`,
        `District Magistrate (DM): ${distData.dm.email}`
      ] : [
        `मंडलायुक्त (Divisional Commissioner): comm-${distData.division ? distData.division.toLowerCase() : cleanDs}@nic.in`,
        `जिलाधिकारी (DM): ${distData.dm.email}`
      ];
    }
  }

  currentResolvedAuthority = {
    title: officerTitle,
    office: officerOffice,
    phone: officerPhone,
    email: officerEmail,
    ccList: ccList
  };

  // Update Live UI Card
  document.getElementById('authOfficerTitle').textContent = officerTitle;
  document.getElementById('authOfficerOffice').textContent = officerOffice;

  const phoneContainer = document.getElementById('authOfficerPhone');
  if (phoneContainer) {
    if (officerPhone && officerPhone.length >= 10) {
      phoneContainer.innerHTML = `<a href="tel:${escapeHtml(officerPhone)}" style="color: var(--primary); text-decoration: underline dotted; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">${escapeHtml(officerPhone)} <span style="font-size: 11px; background: var(--success-bg); color: var(--success); font-weight: 700; padding: 2px 7px; border-radius: var(--radius-pill); border: 1px solid var(--success-border);">📞 Tap to Call</span></a>`;
    } else {
      phoneContainer.textContent = officerPhone || (lang === 'en' ? "Available (NIC Record)" : "उपलब्ध (NIC रिकॉर्ड)");
    }
  }

  const emailContainer = document.getElementById('authOfficerEmail');
  if (emailContainer) {
    if (officerEmail && officerEmail.includes('@')) {
      emailContainer.innerHTML = `<a href="mailto:${escapeHtml(officerEmail)}" style="color: var(--primary); text-decoration: underline dotted; font-weight: 800; word-break: break-word; overflow-wrap: anywhere;">${escapeHtml(officerEmail)}</a>`;
    } else {
      emailContainer.textContent = officerEmail;
    }
  }
  
  const callBtn = document.getElementById('authCallBtn');
  if (callBtn) {
    if (officerPhone && officerPhone.length >= 10) {
      callBtn.style.display = 'inline-flex';
      callBtn.href = `tel:${officerPhone}`;
    } else {
      callBtn.style.display = 'none';
    }
  }

  document.getElementById('authCcSummary').innerHTML = ccList.map(c => `<span class="auth-cc-pill">${escapeHtml(c)}</span>`).join(' ');

  const emEl = document.getElementById('em');
  if (emEl) emEl.value = officerEmail;

  const modal = document.getElementById('authorityContactModal');
  if (modal && modal.classList.contains('open')) {
    updateModalAuthorityInfo();
  }
}

// Call Officer CUG Mobile
function callOfficerCug() {
  if (currentResolvedAuthority && currentResolvedAuthority.phone) {
    window.location.href = `tel:${currentResolvedAuthority.phone}`;
  } else {
    showToast(currentLang === 'en' ? 'Dialing CM Helpline directly: 1076' : 'इस अधिकारी का CUG नंबर सीधे डायल किया जा रहा है: 1076 (CM हेल्पलाइन)');
    window.location.href = 'tel:1076';
  }
}

// Deep Link to UP IGRS Jansunwai Portal with Copied Summary
function openJansunwaiPortal() {
  const nm = document.getElementById('nm').value.trim() || (currentLang === 'en' ? "Citizen" : "नागरिक");
  const vl = document.getElementById('vl').value.trim() || (currentLang === 'en' ? "Village/Ward" : "गाँव/वार्ड");
  const bk = document.getElementById('bk').value.trim() || (currentLang === 'en' ? "Block/Town" : "ब्लॉक/कस्बा");
  const ds = document.getElementById('ds').value.trim() || (currentLang === 'en' ? "District" : "जनपद");
  const pr = document.getElementById('pr').value.trim() || (currentLang === 'en' ? "Public Grievance" : "सार्वजनिक समस्या");

  const summary = currentLang === 'en'
    ? `Public Grievance - Uttar Pradesh\nApplicant: ${nm}\nLocation: ${vl}, ${bk}, ${ds}\nGrievance Details: ${pr}\n(Reference: UP Janhit Guarantee Act, 2011)`
    : `जनहित शिकायत - उत्तर प्रदेश\nआवेदक: ${nm}\nस्थान: ${vl}, ${bk}, ${ds}\nसमस्या विवरण: ${pr}\n(संदर्भ: UP जनहित गारंटी अधिनियम 2011)`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast(currentLang === 'en' ? '✓ Summary copied! Now paste on Jansunwai portal.' : '✓ शिकायत विवरण कॉपी हो गया! अब जनसुनवाई पोर्टल पर पेस्ट करें।');
    setTimeout(() => {
      window.open('https://jansunwai.up.nic.in', '_blank');
    }, 800);
  }).catch(() => {
    window.open('https://jansunwai.up.nic.in', '_blank');
  });
}

// ================= COMPETENT AUTHORITY MODAL =================
function updateModalAuthorityInfo(ballotKey) {
  const key = ballotKey || selectedBallot;
  const cfg = ballotConfig[key];
  const lang = currentLang;
  const auth = currentResolvedAuthority || {};

  const icons = { pradhan: '🌾', chairman: '🏘️', mayor: '🏛️' };
  const iconEl = document.getElementById('modalAuthIcon');
  if (iconEl) iconEl.textContent = icons[key] || '🏛️';

  const badgeEl = document.getElementById('modalAuthTierBadge');
  if (badgeEl && cfg) {
    badgeEl.textContent = cfg.badgeText ? cfg.badgeText[lang] : cfg.title[lang];
    badgeEl.className = `auth-modal-badge ${cfg.badgeClass || ''}`;
  }

  const titleEl = document.getElementById('modalAuthTitle');
  if (titleEl) {
    titleEl.textContent = lang === 'en' ? 'Competent Authority Contact & Direct Line' : 'सक्षम अधिकारी संपर्क एवं सीधी हेल्पलाइन';
  }

  const officerTitleEl = document.getElementById('modalOfficerTitle');
  if (officerTitleEl) officerTitleEl.textContent = auth.title || (cfg ? cfg.officer[lang] : '');

  const officerOfficeEl = document.getElementById('modalOfficerOffice');
  if (officerOfficeEl) officerOfficeEl.textContent = auth.office || '';

  const phoneValEl = document.getElementById('modalOfficerPhoneVal');
  const callBtn = document.getElementById('modalCallBtn');
  const phone = auth.phone || '';
  if (phoneValEl) {
    phoneValEl.textContent = phone || (lang === 'en' ? 'Available upon District NIC Sync' : 'उपलब्ध (NIC रिकॉर्ड)');
  }
  if (callBtn) {
    if (phone && phone.length >= 10) {
      callBtn.href = `tel:${phone}`;
      callBtn.style.display = 'inline-flex';
    } else {
      callBtn.href = 'tel:1076';
      callBtn.style.display = 'inline-flex';
    }
  }

  const emailValEl = document.getElementById('modalOfficerEmailVal');
  if (emailValEl) {
    emailValEl.textContent = auth.email || (lang === 'en' ? 'Official NIC Email' : 'शासकीय NIC ईमेल');
  }

  const ccEl = document.getElementById('modalOfficerCcList');
  if (ccEl && auth.ccList) {
    ccEl.innerHTML = auth.ccList.map(c => `<span class="auth-cc-pill" style="display:inline-block; margin:2px 4px 2px 0;">${escapeHtml(c)}</span>`).join(' ');
  }
}

function openAuthorityModal(ballotKey) {
  const modal = document.getElementById('authorityContactModal');
  if (!modal) return;

  updateModalAuthorityInfo(ballotKey || selectedBallot);

  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.classList.add('open');
  });
  document.body.style.overflow = 'hidden';

  const proceedBtn = document.getElementById('btn-modal-proceed');
  if (proceedBtn) proceedBtn.focus();
}

function closeAuthorityModal() {
  const modal = document.getElementById('authorityContactModal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 220);
}

function handleModalBackdropClick(event) {
  if (event.target && event.target.id === 'authorityContactModal') {
    closeAuthorityModal();
  }
}

function proceedFromModalToDraft() {
  closeAuthorityModal();
  const target = document.getElementById('workspace') || document.getElementById('authorityBadgeCard');
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }
}

// Copy Officer Phone & Email Helpers
function copyOfficerPhone() {
  const phone = (currentResolvedAuthority && currentResolvedAuthority.phone) || document.getElementById('modalOfficerPhoneVal').textContent.trim();
  if (phone && phone.length >= 8 && !phone.includes('Available') && !phone.includes('उपलब्ध')) {
    navigator.clipboard.writeText(phone).then(() => {
      showToast(currentLang === 'en' ? `✓ CUG Phone copied: ${phone}` : `✓ CUG फोन नंबर कॉपी हो गया: ${phone}`);
    }).catch(() => {
      showToast(phone);
    });
  } else {
    showToast(currentLang === 'en' ? 'CUG Phone: 1076 (CM Helpline)' : 'CUG फोन: 1076 (CM हेल्पलाइन)');
  }
}

function copyOfficerEmail() {
  const email = (currentResolvedAuthority && currentResolvedAuthority.email) || document.getElementById('modalOfficerEmailVal').textContent.trim();
  if (email && email.includes('@')) {
    navigator.clipboard.writeText(email).then(() => {
      showToast(currentLang === 'en' ? `✓ Official Email copied: ${email}` : `✓ शासकीय ईमेल कॉपी हो गया: ${email}`);
    }).catch(() => {
      showToast(email);
    });
  } else {
    showToast(currentLang === 'en' ? 'Official Email record pending NIC sync' : 'शासकीय ईमेल NIC सिंक हेतु प्रतीक्षारत');
  }
}

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('authorityContactModal');
    if (modal && modal.classList.contains('open')) {
      closeAuthorityModal();
    }
  }
});

// Select Voter Ballot ('pradhan', 'chairman', 'mayor')
function selectVoterAuthority(ballotKey, isLangRefresh, isUserClick) {
  selectedBallot = ballotKey;

  ['pradhan', 'chairman', 'mayor'].forEach(k => {
    const card = document.getElementById(`ballot-${k}`);
    if (card) {
      card.classList.remove('active');
      card.setAttribute('aria-checked', 'false');
    }
  });
  const activeCard = document.getElementById(`ballot-${ballotKey}`);
  if (activeCard) {
    activeCard.classList.add('active');
    activeCard.setAttribute('aria-checked', 'true');
  }

  const cfg = ballotConfig[ballotKey];
  const lang = currentLang;

  const locLabel = cfg.locLabel[lang];
  const locPh = cfg.locPlaceholder[lang];
  const sublocLabel = cfg.sublocLabel[lang];
  const sublocPh = cfg.sublocPlaceholder[lang];
  const priorLabel = cfg.priorLabel[lang];
  const distCcLabel = cfg.districtCcLabel[lang];

  document.getElementById('label-loc').innerHTML = `${locLabel} <span class="required-star">*</span>`;
  document.getElementById('vl').placeholder = locPh;
  document.getElementById('label-subloc').innerHTML = `${sublocLabel} <span class="required-star">*</span>`;
  document.getElementById('bk').placeholder = sublocPh;
  document.getElementById('label-prior').textContent = priorLabel;
  document.getElementById('ccLabelDistrict').textContent = distCcLabel;

  resolveCurrentAuthority();
  updatePreview();
  if (!isLangRefresh) {
    showToast(lang === 'en' ? `Selected: ${cfg.title[lang]}` : `चुना गया: ${cfg.title[lang]}`);
  }
  if (isUserClick) {
    openAuthorityModal(ballotKey);
  }
}

// Toggle PWD Road Override
function togglePwdOverride() {
  isPwdOverride = document.getElementById('pwdOverrideCheckbox').checked;
  
  const pwdCc = document.getElementById('ccPwd');
  if (isPwdOverride) {
    pwdCc.checked = true;
    showToast(currentLang === 'en' ? 'Road responsibility targeted to Public Works Department (PWD)!' : 'सड़क का दायित्व लोक निर्माण विभाग (PWD) को लक्षित किया गया!');
  }
  resolveCurrentAuthority();
  updatePreview();
}

// Category Selector
function selectCategory(categoryKey) {
  document.querySelectorAll('.category-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-pressed', 'false');
  });
  const activeCard = document.getElementById(`card-${categoryKey}`);
  if (activeCard) {
    activeCard.classList.add('selected');
    activeCard.setAttribute('aria-pressed', 'true');
  }

  const prField = document.getElementById('pr');
  if (categoryPresets[categoryKey] && categoryPresets[categoryKey][currentLang]) {
    prField.value = categoryPresets[categoryKey][currentLang];
  }

  const nextSec = document.getElementById('voter-section');
  if (nextSec) {
    nextSec.scrollIntoView({ behavior: 'smooth' });
  }
  resolveCurrentAuthority();
  updatePreview();
  showToast(currentLang === 'en' ? 'Grievance description added to petition!' : 'समस्या विवरण पत्र में जुड़ गया!');
}

// Switch Tabs
function switchTab(tab) {
  currentTab = tab;
  const bdoBtn = document.getElementById('tab-bdo-btn');
  const rtiBtn = document.getElementById('tab-rti-btn');
  const rtiDisclaimer = document.getElementById('rti-disclaimer');

  if (tab === 'bdo') {
    bdoBtn.classList.add('active');
    rtiBtn.classList.remove('active');
    rtiDisclaimer.style.display = 'none';
  } else {
    rtiBtn.classList.add('active');
    bdoBtn.classList.remove('active');
    rtiDisclaimer.style.display = 'block';
  }

  updatePreview();
}

// Two-Way Reactive Document Renderer
function updatePreview() {
  const nm = document.getElementById('nm').value.trim();
  const mb = document.getElementById('mb').value.trim();
  const vl = document.getElementById('vl').value.trim();
  const bk = document.getElementById('bk').value.trim();
  const ds = document.getElementById('ds').value.trim();
  const pr = document.getElementById('pr').value.trim();
  const sn = document.getElementById('sn').value.trim();
  const dt = document.getElementById('dt').value.trim();
  const em = (currentResolvedAuthority ? currentResolvedAuthority.email : "");

  const ccSdm = document.getElementById('ccSdm').checked;
  const ccPwd = document.getElementById('ccPwd').checked;
  const ccDpro = document.getElementById('ccDpro').checked;

  const pin = (document.getElementById('pincodeInput') ? document.getElementById('pincodeInput').value.trim() : '');
  saveData({ nm, mb, vl, bk, ds, pr, sn, dt, em, selectedBallot, isPwdOverride, lang: currentLang, pin });

  const lang = currentLang;
  const hasPriorNotice = sn.length > 0;

  const valOrToken = (val, placeholder) => val ? `<span class="token filled">${escapeHtml(val)}</span>` : `<span class="token">${placeholder}</span>`;

  const cfg = ballotConfig[selectedBallot];
  const nameVal = valOrToken(nm, lang === 'en' ? '[Your Full Name]' : '[आपका नाम]');
  const mobileVal = valOrToken(mb, lang === 'en' ? '[Mobile No.]' : '[मोबाइल नं.]');
  const locVal = valOrToken(vl, lang === 'en' ? `[${cfg.locLabel[lang].split(' ')[0]}]` : `[${cfg.locLabel[lang].split(' ')[0]}]`);
  const sublocVal = valOrToken(bk, lang === 'en' ? `[${cfg.sublocLabel[lang].split(' ')[0]}]` : `[${cfg.sublocLabel[lang].split(' ')[0]}]`);
  const districtVal = valOrToken(ds, lang === 'en' ? '[District]' : '[जनपद]');
  const problemVal = valOrToken(pr, lang === 'en' ? '[Enter statement of grievance]' : '[समस्या का स्पष्ट विवरण दर्ज करें]');
  const priorDateVal = hasPriorNotice ? escapeHtml(sn) : "";
  const dateVal = valOrToken(dt, lang === 'en' ? '[Date]' : '[दिनांक]');

  const container = document.getElementById('letter-content');
  const docTypeHeader = document.getElementById('preview-doc-type');
  const statuteHeader = document.getElementById('doc-legal-statute');

  // Resolved Officer & Office from Statewide Master
  let targetOfficer = (currentResolvedAuthority && currentResolvedAuthority.title) || cfg.officer[lang];
  let targetOffice = (currentResolvedAuthority && currentResolvedAuthority.office) || cfg.office[lang].replace('{subloc}', sublocVal).replace('{ds}', districtVal);
  let legalStatute = cfg.statute[lang];

  let subjectHeading = lang === 'en' 
    ? `Formal Representation for Urgent Redressal of Civic Grievance in ${locVal}, ${sublocVal} under ${cfg.title[lang]}`
    : `ग्राम/वार्ड ${locVal} में ${cfg.title[lang]} अंतर्गत सार्वजनिक समस्या के समाधान के संबंध में`;

  if (isPwdOverride) {
    if (lang === 'en') {
      targetOfficer = "The Executive Engineer (EE), Public Works Department (PWD)";
      targetOffice = `Office of the Executive Engineer, Provincial / Construction Division, PWD, District: ${districtVal}, Uttar Pradesh.`;
      subjectHeading = `Urgent Repair, Pothole Removal and Reconstruction of PWD Main Road Passing Through ${locVal} (${sublocVal})`;
      legalStatute = "UP Public Works Department (PWD) Citizen Charter & Road Maintenance Manual";
    } else {
      targetOfficer = "श्रीमान अधिशासी अभियंता (Executive Engineer), लोक निर्माण विभाग (PWD)";
      targetOffice = `कार्यालय: अधिशासी अभियंता, प्रान्तीय / निर्माण खंड, लोक निर्माण विभाग (PWD), जनपद: ${districtVal}, उत्तर प्रदेश।`;
      subjectHeading = `क्षेत्र ${locVal} (${sublocVal}) से गुजरने वाले PWD / मुख्य मार्ग की तत्काल मरम्मत व गड्ढामुक्त करने के संबंध में`;
      legalStatute = "उत्तर प्रदेश लोक निर्माण विभाग (PWD) नागरिक अधिकार पत्र एवं मार्ग संधारण नियमावली";
    }
  }

  statuteHeader.textContent = legalStatute;

  // Multi-Cc Block
  let ccList = [];
  if (lang === 'en') {
    if (ccSdm) ccList.push("1. Sub-Divisional Magistrate (SDM / Tehsil Samadhan Diwas), Sub-Division Admin.");
    if (ccPwd && !isPwdOverride) ccList.push("2. Executive Engineer (EE), Public Works Department (PWD), District Division.");
    if (isPwdOverride) ccList.push(`2. ${cfg.officer[lang]}, Local Administrative Body.`);
    if (ccDpro) ccList.push(`3. ${cfg.districtCcLabel[lang]}, District Headquarters.`);
  } else {
    if (ccSdm) ccList.push("1. श्रीमान उप-जिलाधिकारी (SDM महोदय / संपूर्ण समाधान दिवस), तहसील प्रशासन।");
    if (ccPwd && !isPwdOverride) ccList.push("2. अधिशासी अभियंता (EE), लोक निर्माण विभाग (PWD), जनपद खंड।");
    if (isPwdOverride) ccList.push(`2. ${cfg.officer[lang]}, स्थानीय निकाय प्रशासन।`);
    if (ccDpro) ccList.push(`3. ${cfg.districtCcLabel[lang]}, जनपद मुख्यालय।`);
  }

  let ccHtml = "";
  if (ccList.length > 0) {
    ccHtml = `
      <div style="margin-top: 24px; border-top: 1px solid #94A3B8; padding-top: 12px; font-size: 13.5px; line-height: 1.6;">
        <strong>${lang === 'en' ? 'Copy forwarded for information and urgent necessary action to:' : 'प्रतिलिपि सूचनार्थ एवं आवश्यक कार्रवाई हेतु प्रेषित:'}</strong><br>
        ${ccList.map(c => `• ${escapeHtml(c)}<br>`).join('')}
      </div>
    `;
  }

  // Statutory Jurisdiction Clause (clean, dignified legal standard)
  const jurisdictionClauseHtml = lang === 'en' ? `
    <div class="jurisdiction-clause-box">
      <strong>Statutory Jurisdiction & Inter-Departmental Transfer Mandate (Section 4, UP Janhit Guarantee Act, 2011):</strong><br>
      If any aspect of this grievance falls under the remit of another department (e.g., PWD, Jal Nigam, or Rural Development), under <em>Section 4 of the Uttar Pradesh Janhit Guarantee Adhiniyam, 2011</em>, this petition shall not be rejected; it is statutorily mandated to be forwarded to the competent authority within 48 hours with written intimation to the applicant.
    </div>
  ` : `
    <div class="jurisdiction-clause-box">
      <strong>विधिक क्षेत्राधिकार एवं अंतर-विभागीय अग्रेषण दायित्व (UP जनहित गारंटी अधिनियम 2011 की धारा 4):</strong><br>
      यदि उक्त स्थल अथवा समस्या आपके कार्यालय के क्षेत्राधिकार से परे किसी अन्य सहयोगी विभाग (जैसे PWD/जल निगम) के अंतर्गत आती है, तो <em>उत्तर प्रदेश जनहित गारंटी अधिनियम 2011 की धारा 4</em> के तहत इसे निरस्त करने के स्थान पर कृपया स्वयं संबंधित विभाग को 48 घंटे के भीतर अग्रेषित (Forward) कर प्रार्थी को सूचित करने की कृपा करें।
    </div>
  `;

  if (currentTab === 'bdo') {
    if (lang === 'en') {
      docTypeHeader.textContent = `Official Civic Grievance Petition (${isPwdOverride ? "PWD HIGHWAY JURISDICTION" : cfg.title[lang].toUpperCase()})`;

      const priorParagraph = hasPriorNotice ? `
        <p>It is pertinent to submit that this matter was previously brought to the notice of the local public representative / concerned office on <strong>${priorDateVal}</strong> through verbal and written representations; however, no tangible rectification has been initiated on the ground till date.</p>
      ` : '';

      const enclosuresHtml = hasPriorNotice ? `
        1. True copy of prior representation submitted on: ${priorDateVal}<br>
        2. Clear on-site photographs depicting the grievance
      ` : `
        1. Clear on-site photographs depicting the grievance
      `;

      container.innerHTML = `
        <p><strong>To,</strong><br>
        ${targetOfficer},<br>
        ${targetOffice}</p>

        <p><strong>Subject: ${subjectHeading}</strong><br>
        <span style="font-size: 13px; color: #4B5563;">(Statutory Mandate: ${legalStatute})</span></p>

        <p><strong>Respected Sir/Madam,</strong><br>
        Most respectfully, I, the applicant <strong>${nameVal}</strong>, am a bona fide resident of: <strong>${locVal}</strong>, <strong>${sublocVal}</strong>, District: <strong>${districtVal}</strong>, Uttar Pradesh.</p>

        <p>A severe civic grievance has persisted in our locality for a prolonged period, causing extreme hardship to daily commuters, school children, and senior citizens, and posing severe hygiene/safety risks:<br>
        <em>"${problemVal}"</em></p>

        ${priorParagraph}

        ${jurisdictionClauseHtml}

        <p><strong>Therefore, it is respectfully prayed that</strong> your good office may kindly conduct an immediate on-site technical inspection, issue directions for time-bound redressal in public interest, and provide a formal acknowledgment receipt with diary number for this representation.</p>

        <p style="margin-top: 18px;">
          <strong>Enclosures:</strong><br>
          ${enclosuresHtml}
        </p>

        <div style="margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            Date: ${dateVal}<br>
            Place: ${locVal}
          </div>
          <div style="text-align: right;">
            Yours faithfully,<br><br>
            Signature / Thumb Impression: ____________________<br>
            <strong>Name:</strong> ${nameVal}<br>
            <strong>Address:</strong> ${locVal}, ${sublocVal}, ${districtVal}<br>
            <strong>Mobile:</strong> ${mobileVal}
          </div>
        </div>

        ${ccHtml}
      `;
    } else {
      docTypeHeader.textContent = `राजकीय जनहित शिकायत पत्र (${isPwdOverride ? "PWD HIGHWAY FORMAT" : cfg.title[lang].toUpperCase()})`;

      const priorParagraph = hasPriorNotice ? `
        <p>उल्लेखनीय है कि इस संदर्भ में पूर्व में दिनांक <strong>${priorDateVal}</strong> को स्थानीय जनप्रतिनिधि / संबंधित पटल को मौखिक व लिखित रूप से अवगत कराया गया था, परंतु आज दिनांक तक इस विषय पर कोई धरातलीय कार्रवाई नहीं की गई है।</p>
      ` : '';

      const enclosuresHtml = hasPriorNotice ? `
        1. पूर्व में दिए गए आवेदन की छायाप्रति (दिनांक: ${priorDateVal})<br>
        2. समस्या स्थल के स्पष्ट छायाचित्र (फोटोग्राफ्स)
      ` : `
        1. समस्या स्थल के स्पष्ट छायाचित्र (फोटोग्राफ्स)
      `;

      container.innerHTML = `
        <p><strong>सेवा में,</strong><br>
        ${targetOfficer},<br>
        ${targetOffice}</p>

        <p><strong>विषय: ${subjectHeading} जनहित शिकायत पत्र।</strong><br>
        <span style="font-size: 13px; color: #4B5563;">(संवैधानिक संदर्भ: ${legalStatute})</span></p>

        <p><strong>महोदय,</strong><br>
        सविनय निवेदन है कि मैं प्रार्थी <strong>${nameVal}</strong>, निवासी: <strong>${locVal}</strong>, <strong>${sublocVal}</strong>, जनपद: <strong>${districtVal}</strong> का स्थायी नागरिक हूँ।</p>

        <p>हमारे क्षेत्र में निम्नलिखित समस्या लंबे समय से व्याप्त है, जिससे सामान्य जनजीवन अत्यंत त्रस्त है तथा आवागमन व स्वास्थ्य हेतु भारी संकट उत्पन्न हो गया है:<br>
        <em>"${problemVal}"</em></p>

        ${priorParagraph}

        ${jurisdictionClauseHtml}

        <p><strong>अतः श्रीमान जी से सादर प्रार्थना है कि</strong> उक्त स्थल का शीघ्र स्थलीय निरीक्षण कराकर जनहित में समस्या का अविलंब समाधान कराने की कृपा करें एवं इस पत्र की औपचारिक प्राप्ति रसीद (डायरी संख्या सहित) प्रदान करने का कष्ट करें।</p>

        <p style="margin-top: 18px;">
          <strong>संलग्नक:</strong><br>
          ${enclosuresHtml}
        </p>

        <div style="margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            दिनांक: ${dateVal}<br>
            स्थान: ${locVal}
          </div>
          <div style="text-align: right;">
            भवदीय / भवदीया,<br><br>
            हस्ताक्षर / अँगूठा: ____________________<br>
            <strong>नाम:</strong> ${nameVal}<br>
            <strong>पता:</strong> ${locVal}, ${sublocVal}, ${districtVal}<br>
            <strong>मोबाइल:</strong> ${mobileVal}
          </div>
        </div>

        ${ccHtml}
      `;
    }
  } else {
    // RTI TAB
    if (lang === 'en') {
      docTypeHeader.textContent = `Right to Information Application Form 'A' (${cfg.title[lang].toUpperCase()})`;

      const rtiPoint1 = hasPriorNotice
        ? `Certified copy of the day-to-day Action Taken Report (ATR) and proceedings recorded till date on the applicant's prior representation dated <strong>${priorDateVal}</strong>.`
        : `Certified copy of the day-to-day Action Taken Report (ATR) and proceedings recorded on this grievance representation.`;

      container.innerHTML = `
        <p><strong>To,</strong><br>
        The Public Information Officer (PIO) / Office of ${targetOfficer},<br>
        ${targetOffice}</p>

        <p><strong>Subject: Application for Information under Section 6(1) of the Right to Information Act, 2005 (Form 'A').</strong></p>

        <p><strong>1. Particulars of the Applicant:</strong><br>
        (a) Name: <strong>${nameVal}</strong><br>
        (b) Address: <strong>${locVal}</strong>, <strong>${sublocVal}</strong>, District: <strong>${districtVal}</strong><br>
        (c) Mobile No.: <strong>${mobileVal}</strong></p>

        <p><strong>2. Particulars of Information Sought (${locVal}):</strong><br>
        Kindly provide certified, official copies of government records on the following points within 30 days as mandated under Section 7(1) of the RTI Act, 2005:</p>

        <p style="padding-left: 16px;">
          <strong>Point 1:</strong> ${rtiPoint1}<br><br>
          <strong>Point 2:</strong> Certified copy of the on-site inspection report and photographs submitted by the designated investigating officer / Junior Engineer (JE).<br><br>
          <strong>Point 3:</strong> Details of the sanctioned annual action plan, administrative approval, and financial allocation sanctioned for the said site during the preceding three financial years.<br><br>
          <strong>Point 4:</strong> Certified copies of the Measurement Book (MB), material purchase bills/vouchers, and paid muster rolls relating to any repair or civil works at the said site.<br><br>
          <strong>Point 5:</strong> If no action has been initiated, certified copy of the government order specifying the designated time-frame and penalty guidelines for civic grievance resolution.
        </p>

        <p><strong>3. Application Fee:</strong> Prescribed application fee of ₹10/- is affixed via Indian Postal Order (IPO) / Court Fee Stamp.</p>

        <div style="margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            Date: ${dateVal}<br>
            Place: ${locVal}
          </div>
          <div style="text-align: right;">
            Signature of Applicant: ____________________<br>
            <strong>Name:</strong> ${nameVal}<br>
            <strong>Mobile:</strong> ${mobileVal}
          </div>
        </div>
      `;
    } else {
      docTypeHeader.textContent = `सूचना का अधिकार आवेदन प्रारूप 'क' (${cfg.title[lang].toUpperCase()})`;

      const rtiPoint1 = hasPriorNotice
        ? `प्रार्थी द्वारा पूर्व में दिनांक <strong>${priorDateVal}</strong> को प्रस्तुत शिकायत पर आज दिनांक तक की गई कुल कार्रवाई की दैनिक प्रगति आख्या (Action Taken Report - ATR) की प्रमाणित प्रति दें।`
        : `प्रार्थी द्वारा प्रस्तुत शिकायती प्रार्थना पत्र पर आज दिनांक तक की गई कुल कार्रवाई की दैनिक प्रगति आख्या (Action Taken Report - ATR) की प्रमाणित प्रति दें।`;

      container.innerHTML = `
        <p><strong>सेवा में,</strong><br>
        जन सूचना अधिकारी (PIO) / ${targetOfficer} कार्यालय,<br>
        ${targetOffice}</p>

        <p><strong>विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत आवेदन पत्र (प्रारूप 'क')।</strong></p>

        <p><strong>1. आवेदक का विवरण:</strong><br>
        (क) नाम: <strong>${nameVal}</strong><br>
        (ख) पता: <strong>${locVal}</strong>, <strong>${sublocVal}</strong>, जनपद: <strong>${districtVal}</strong><br>
        (ग) मोबाइल: <strong>${mobileVal}</strong></p>

        <p><strong>2. चाही गई सूचना का विवरण (${locVal}):</strong><br>
        कृपया निम्नलिखित बिंदुओं पर स्वप्रमाणित आधिकारिक सरकारी अभिलेख 30 कार्यदिवसों (धारा 7(1)) के भीतर उपलब्ध कराने की कृपा करें:</p>

        <p style="padding-left: 16px;">
          <strong>बिंदु 1:</strong> ${rtiPoint1}<br><br>
          <strong>बिंदु 2:</strong> उक्त शिकायत की जांच हेतु नामित अधिकारी/अभियंता द्वारा प्रस्तुत स्थलीय जांच आख्या एवं फोटोग्राफ्स की प्रमाणित प्रति दें।<br><br>
          <strong>बिंदु 3:</strong> संबंधित स्थल पर विगत 3 वित्तीय वर्षों में स्वीकृत कुल कार्ययोजना, तकनीकी स्वीकृति एवं वित्तीय आवंटन का ब्यौरा दें।<br><br>
          <strong>बिंदु 4:</strong> उक्त कार्य से संबंधित माप पुस्तिका (Measurement Book - MB), सामग्री खरीद के बिल-वाउचर तथा भुगतान किए गए मस्टर रोल की प्रमाणित प्रति दें।<br><br>
          <strong>बिंदु 5:</strong> यदि शिकायत पर कोई कार्रवाई नहीं हुई है, तो उत्तर प्रदेश नागरिक अधिकार पत्र के अनुसार जन शिकायतों के निस्तारण की निर्धारित वैधानिक समय-सीमा का शासनादेश उपलब्ध कराएं।
        </p>

        <p><strong>3. आवेदन शुल्क:</strong> निर्धारित सूचना शुल्क ₹10/- का पोस्टल ऑर्डर (IPO) / कोर्ट फीस टिकट संलग्न है।</p>

        <div style="margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            दिनांक: ${dateVal}<br>
            स्थान: ${locVal}
          </div>
          <div style="text-align: right;">
            आवेदक के हस्ताक्षर: ____________________<br>
            <strong>नाम:</strong> ${nameVal}<br>
            <strong>मोबाइल:</strong> ${mobileVal}
          </div>
        </div>
      `;
    }
  }
}

// Direct Email Integration Function with Full CC Packet
function sendOfficialEmail() {
  const nm = document.getElementById('nm').value.trim() || (currentLang === 'en' ? "Citizen" : "नागरिक");
  const vl = document.getElementById('vl').value.trim() || (currentLang === 'en' ? "Village/Ward" : "गाँव/वार्ड");
  const bk = document.getElementById('bk').value.trim() || (currentLang === 'en' ? "Block/Town" : "ब्लॉक/कस्बा");
  const ds = document.getElementById('ds').value.trim() || (currentLang === 'en' ? "District" : "जनपद");

  const docElement = document.getElementById('printable-doc');
  const letterText = docElement.innerText;

  let recipientEmail = (currentResolvedAuthority ? currentResolvedAuthority.email : "");
  let ccEmails = [];

  if (currentResolvedAuthority && currentResolvedAuthority.ccList) {
    currentResolvedAuthority.ccList.forEach(line => {
      const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match && match[0] !== recipientEmail) ccEmails.push(match[0]);
    });
  }

  const subject = currentLang === 'en'
    ? `Civic Grievance Petition: ${vl}, ${bk} (${ds}) - Applicant: ${nm}`
    : `जनहित शिकायत पत्र: ${vl}, ${bk} (${ds}) - आवेदक: ${nm}`;
  const ccParam = ccEmails.length > 0 ? `&cc=${encodeURIComponent(ccEmails.join(','))}` : '';
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}${ccParam}&body=${encodeURIComponent(letterText)}`;

  showToast(currentLang === 'en' ? 'Opening Email client...' : 'ईमेल ऐप खोला जा रहा है...');
  window.location.href = mailtoUrl;
}

function triggerPrint() { window.print(); }

function copyDocumentText() {
  const docElement = document.getElementById('printable-doc');
  navigator.clipboard.writeText(docElement.innerText).then(() => {
    showToast(currentLang === 'en' ? 'Document copied! Ready to paste.' : 'दस्तावेज कॉपी हो गया! अब कहीं भी पेस्ट कर सकते हैं।');
  }).catch(() => showToast(currentLang === 'en' ? 'Copy failed. Please copy manually.' : 'कॉपी नहीं हो सका, कृपया मैन्युअल कॉपी करें।'));
}

function shareOnWhatsApp() {
  const docElement = document.getElementById('printable-doc');
  const text = encodeURIComponent((currentLang === 'en' ? "Civic Grievance Petition (UP):\n\n" : "गाँव व नगर शिकायत आवेदन पत्र:\n\n") + docElement.innerText);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

let toastTimeoutId = null;
function showToast(message) {
  const toast = document.getElementById('toastMessage');
  const toastText = document.getElementById('toastText');
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.classList.add('show');
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => toast.classList.remove('show'), 3500);
}

function clearForm() {
  const confirmMsg = currentLang === 'en' ? 'Do you want to reset the entire form?' : 'क्या आप पूरा फॉर्म रीसेट करना चाहते हैं?';
  if (confirm(confirmMsg)) {
    document.getElementById('nm').value = '';
    document.getElementById('mb').value = '';
    document.getElementById('vl').value = '';
    document.getElementById('pr').value = '';
    document.getElementById('sn').value = '';
    const pinEl = document.getElementById('pincodeInput');
    if (pinEl) pinEl.value = '';
    const badgeEl = document.getElementById('pincodeStatusBadge');
    if (badgeEl) {
      badgeEl.className = 'pincode-status-badge';
      badgeEl.innerHTML = `<span>💡</span><span>${currentLang === 'en' ? 'Enter PIN to auto-detect District, Block & Village suggestions' : 'पिन कोड दर्ज कर जिला, ब्लॉक व स्थानीय गाँव स्वतः चुनें'}</span>`;
    }
    const datalist = document.getElementById('pincodeVillageList');
    if (datalist) datalist.innerHTML = '';
    quickSelectDistrict('Raebareli');
    localStorage.removeItem('gaon_shikayat_ballot_v4');
    updatePreview();
    showToast(currentLang === 'en' ? 'Form has been reset.' : 'फॉर्म रीसेट कर दिया गया।');
  }
}

function saveData(data) {
  try { localStorage.setItem('gaon_shikayat_ballot_v4', JSON.stringify(data)); } catch (e) {}
}

function loadSavedData() {
  try {
    const savedLang = localStorage.getItem('gaon_shikayat_lang');
    currentLang = savedLang || 'en';
    const saved = localStorage.getItem('gaon_shikayat_ballot_v4');
    if (saved) {
      const d = JSON.parse(saved);
      if (d.pin && document.getElementById('pincodeInput')) {
        document.getElementById('pincodeInput').value = d.pin;
      }
      if (d.nm) document.getElementById('nm').value = d.nm;
      if (d.mb) document.getElementById('mb').value = d.mb;
      if (d.vl) document.getElementById('vl').value = d.vl;
      if (d.ds) quickSelectDistrict(d.ds);
      if (d.bk) {
        document.getElementById('bk').value = d.bk;
        const blkSel = document.getElementById('blockSelect');
        if (blkSel) blkSel.value = d.bk;
      }
      if (d.pr) document.getElementById('pr').value = d.pr;
      if (d.sn) document.getElementById('sn').value = d.sn;
      if (d.dt) document.getElementById('dt').value = d.dt;
      if (d.selectedBallot) selectedBallot = d.selectedBallot;
      if (d.isPwdOverride) {
        document.getElementById('pwdOverrideCheckbox').checked = true;
        isPwdOverride = true;
      }
      if (d.lang) currentLang = d.lang;
    }
  } catch (e) {}
}

function escapeHtml(string) {
  const entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}
