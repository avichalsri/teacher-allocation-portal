/* ============================================================
   i18n.js — Bilingual (English / Hindi) support.
   Usage:
     import { t, applyI18n, getLang, setLang, initLangToggle } from "./i18n.js";
   - Mark static text with  data-i18n="key"
   - Placeholders with       data-i18n-placeholder="key"
   - Raw HTML with           data-i18n-html="key"
   - Dynamic strings:         t("key", { name: "..." })
   ============================================================ */

export const STRINGS = {
  en: {
    // Generic / chrome
    app_title: "Teacher Allocation Portal",
    app_subtitle: "Saharsa District, Government of Bihar",
    emblem_text: "GoB",
    nav_home: "Home",
    nav_teacher: "Teacher Portal",
    nav_results: "Check Result",
    nav_admin: "Admin",
    home_hero_title: "Welcome",
    home_hero_lead: "An online portal for transparent, merit-based allocation of teachers to panchayats across Saharsa District — Education Department, Government of Bihar.",
    home_cta_teacher_title: "For Teachers",
    home_cta_teacher_desc: "Fill in your details and submit your 5 ranked panchayat preferences.",
    home_cta_teacher_btn: "Submit preferences →",
    home_cta_result_title: "Check Result",
    home_cta_result_desc: "Once allocation is published, find your allocated panchayat by name.",
    home_cta_result_btn: "View result →",
    home_cta_admin_title: "Administrator",
    home_cta_admin_desc: "District Education Office login to manage data and run allocation.",
    home_cta_admin_btn: "Admin login →",
    home_stat_districts: "District",
    home_stat_blocks: "Blocks",
    home_stat_panchayats: "Panchayats",
    home_about_title: "About this portal",
    home_about_body: "Each teacher chooses 5 preferred panchayats in order. The administrator then runs a deferred-acceptance allocation in which clashes are resolved by performance score, with seeded-random tie-breaks for full reproducibility. The complete official panchayat list of Saharsa District is built in. Results are published transparently and can be looked up by name.",
    footer_note: "Education Department, Saharsa District · Government of Bihar",
    footer_disclaimer: "For grievances, contact the District Education Office, Saharsa.",
    lang_en: "English",
    lang_hi: "हिंदी",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    ok: "OK",
    yes: "Yes",
    no: "No",
    back: "Back",
    required_field: "This field is required.",
    not_configured_title: "Setup not complete",
    not_configured_body: "The connection to the database has not been configured yet. The administrator must add the Firebase settings in js/firebase-config.js. See README.md for steps.",

    // Teacher portal
    tp_title: "Teacher Preference Form",
    tp_lead: "Select your name, fill in your details, then choose your 5 preferred panchayats in order.",
    tp_step1: "Step 1 — Your details",
    tp_select_name: "Select your name",
    tp_select_name_ph: "— Select your name —",
    tp_post: "Designation / Post",
    tp_post_ph: "e.g. Assistant Teacher",
    tp_mobile: "Mobile number",
    tp_mobile_hint: "10-digit mobile number.",
    tp_present_block: "Present Block (Prakhand)",
    tp_present_panchayat: "Present Panchayat",
    tp_select_block_ph: "— Select block —",
    tp_continue: "Continue",
    tp_checking: "Checking…",
    tp_step3: "Step 2 — Choose 5 preferences (in order)",
    tp_pref_lead: "Rank 1 is your most preferred panchayat. All five must be different.",
    tp_pref: "Preference",
    tp_select_panchayat: "— Select a panchayat —",
    tp_submit_prefs: "Submit my preferences",
    tp_submitting: "Submitting…",
    tp_submitted_ok: "Your preferences have been submitted successfully.",
    tp_submitted_sub: "Thank you. You may close this page.",
    tp_change_name: "Start over",
    tp_err_select_name: "Please select your name from the list.",
    tp_err_mobile: "Please enter a valid 10-digit mobile number.",
    tp_err_fields: "Please fill in all the details above.",
    tp_err_duplicate_pref: "Each preference must be a different panchayat.",
    tp_err_incomplete_pref: "Please select all 5 preferences.",
    tp_err_generic: "Something went wrong. Please try again.",
    tp_dupe_title: "Already registered",
    tp_dupe_mobile: "This mobile number has already been used to submit choices. If you want to change your choices, please ask the District Education Office (admin) to remove your previous entry — then you can register again.",
    tp_dupe_generic: "A submission already exists for this teacher or mobile number. To change your choices, please ask the District Education Office to remove your previous entry, then register again.",
    tp_closed_title: "Submissions are closed",
    tp_closed_body: "The window for submitting preferences is currently closed. Please contact the District Education Office for assistance.",
    tp_results_published_note: "Allocation results are published. ",
    tp_check_result_link: "Check your allocation »",
    tp_no_roster: "The teacher list has not been published yet. Please try again later.",

    // Results page
    rp_title: "Check Allocation Result",
    rp_lead: "Select your name to see your allocated panchayat. Results are also published on the notice board.",
    rp_select_name: "Select your name",
    rp_not_published_title: "Results not published yet",
    rp_not_published_body: "The allocation results have not been published yet. Please check back later.",
    rp_your_result: "Your Allocation",
    rp_allocated_to: "Allocated Panchayat",
    rp_allocated_block: "Block",
    rp_pref_granted: "Granted preference",
    rp_unallocated_title: "Not yet allocated",
    rp_unallocated_body: "You were not allocated to any of your 5 preferences in this round. The District Education Office will assign you manually. Please contact them.",
    rp_check: "Check result",
    rp_not_found: "No result found for this name. Please check, or contact the District Education Office.",

    // Admin — login
    ad_login_title: "Administrator Login",
    ad_login_lead: "Only authorised District Education Office staff may log in.",
    ad_email: "Email",
    ad_password: "Password",
    ad_login: "Log in",
    ad_logging_in: "Logging in…",
    ad_logout: "Log out",
    ad_login_err: "Login failed. Check your email and password.",
    ad_dashboard: "Administrator Dashboard",
    ad_signed_in_as: "Signed in as",

    ad_tab_overview: "Overview",
    ad_tab_panchayats: "Panchayats",
    ad_tab_teachers: "Teacher Roster",
    ad_tab_submissions: "Registrations",
    ad_tab_allocation: "Allocation",

    // Overview
    ad_status: "Submission window",
    ad_open: "OPEN",
    ad_closed: "CLOSED",
    ad_open_subs: "Open submissions",
    ad_close_subs: "Close submissions",
    ad_results_status: "Results",
    ad_published: "PUBLISHED",
    ad_unpublished: "NOT PUBLISHED",
    ad_stat_panchayats: "Panchayats",
    ad_stat_seats: "Total seats",
    ad_stat_teachers: "Teachers in roster",
    ad_stat_submitted: "Registered",
    ad_stat_allocated: "Allocated",
    ad_stat_unallocated: "Unallocated",

    // Panchayats
    ad_p_title: "Manage Panchayats",
    ad_p_lead: "Each panchayat is a posting with a number of seats (capacity). Add them manually or import a CSV.",
    ad_p_name_en: "Name (English)",
    ad_p_name_hi: "Name (Hindi)",
    ad_p_block: "Block",
    ad_p_capacity: "Seats",
    ad_p_add: "Add panchayat",
    ad_p_import: "Import CSV",
    ad_p_export: "Export CSV",
    ad_p_template: "Download template",
    ad_p_none: "No panchayats added yet.",
    ad_p_csv_help: "CSV columns: name_en, name_hi, block, capacity",
    ad_p_deleted: "Panchayat deleted.",
    ad_confirm_delete_p: "Delete this panchayat?",

    // Teacher roster
    ad_t_title: "Teacher Roster",
    ad_t_lead: "Upload the official teacher list with performance scores. Teachers pick their name from this list when registering. Performance scores are never shown to teachers and are used only to break clashes.",
    ad_t_name_en: "Name (English)",
    ad_t_name_hi: "Name (Hindi)",
    ad_t_school: "School (optional)",
    ad_t_block: "Block (optional)",
    ad_t_score: "Performance Score",
    ad_t_add: "Add teacher",
    ad_t_import: "Import CSV",
    ad_t_export: "Export roster CSV",
    ad_t_template: "Download template",
    ad_t_none: "No teachers in the roster yet.",
    ad_t_csv_help: "CSV columns: name_en, name_hi, school, block, performance_score (school & block are optional but help teachers find the right name)",
    ad_t_submitted_yes: "Registered",
    ad_t_submitted_no: "Pending",
    ad_confirm_delete_t: "Delete this teacher from the roster?",
    ad_t_higher_better: "Higher score = higher priority when two teachers want the same panchayat.",

    // Registrations
    ad_s_title: "Teacher Registrations",
    ad_s_lead: "Teachers who have submitted their preferences. Delete a registration to let that teacher submit again.",
    ad_s_name: "Name",
    ad_s_post: "Designation",
    ad_s_mobile: "Mobile",
    ad_s_present: "Present posting",
    ad_s_prefs: "Preferences (1 → 5)",
    ad_s_none: "No registrations yet.",
    ad_s_no_submission: "(no submission)",
    ad_confirm_delete_sub: "Remove this registration? The teacher will then be able to submit again.",
    ad_s_deleted: "Registration removed.",

    // Allocation
    ad_a_title: "Run Allocation",
    ad_a_lead: "Allocation uses teacher-proposing deferred acceptance. Priority is the performance score; a seeded random value breaks exact ties so every run is reproducible and auditable.",
    ad_a_run: "Run allocation",
    ad_a_running: "Running…",
    ad_a_rerun: "Re-run (new random seed)",
    ad_a_seed: "Random seed",
    ad_a_last_run: "Last run",
    ad_a_publish: "Publish results",
    ad_a_unpublish: "Unpublish results",
    ad_a_export: "Export results CSV",
    ad_a_results: "Allocation Results",
    ad_a_unallocated_list: "Unallocated teachers",
    ad_a_manual: "Manual assignment",
    ad_a_assign: "Assign",
    ad_a_free_seats: "Free seats remaining",
    ad_a_no_results: "No allocation has been run yet.",
    ad_a_confirm_run: "Run allocation now? This will replace any previous result for this round.",
    ad_a_confirm_publish: "Publish results so teachers can see their allocation?",
    ad_a_need_close: "Tip: close the submission window before running allocation so preferences don't change mid-run.",
    ad_a_col_teacher: "Teacher",
    ad_a_col_score: "Score",
    ad_a_col_alloc: "Allocated Panchayat",
    ad_a_col_pref: "Pref #",
    ad_a_done: "Allocation complete.",
    ad_a_published_ok: "Results published.",
    ad_a_unpublished_ok: "Results unpublished.",

    // CSV / generic admin
    ad_import_done: "Import complete: {n} rows added/updated.",
    ad_import_err: "Could not read the CSV. Check the column headers and try again.",
    ad_saved: "Saved.",
    ad_save_err: "Could not save. Please try again.",
  },

  hi: {
    app_title: "शिक्षक आवंटन पोर्टल",
    app_subtitle: "सहरसा ज़िला, बिहार सरकार",
    emblem_text: "बि.स.",
    nav_home: "मुख्य पृष्ठ",
    nav_teacher: "शिक्षक पोर्टल",
    nav_results: "परिणाम देखें",
    nav_admin: "प्रशासक",
    home_hero_title: "स्वागत है",
    home_hero_lead: "सहरसा ज़िले में पंचायतों के लिए शिक्षकों के पारदर्शी एवं योग्यता-आधारित आवंटन हेतु ऑनलाइन पोर्टल — शिक्षा विभाग, बिहार सरकार।",
    home_cta_teacher_title: "शिक्षकों के लिए",
    home_cta_teacher_desc: "अपना विवरण भरें और क्रम में अपनी 5 पंचायत वरीयताएँ जमा करें।",
    home_cta_teacher_btn: "वरीयताएँ जमा करें →",
    home_cta_result_title: "परिणाम देखें",
    home_cta_result_desc: "आवंटन प्रकाशित होने पर अपनी आवंटित पंचायत नाम से देखें।",
    home_cta_result_btn: "परिणाम देखें →",
    home_cta_admin_title: "प्रशासक",
    home_cta_admin_desc: "डेटा प्रबंधन और आवंटन हेतु ज़िला शिक्षा कार्यालय लॉगिन।",
    home_cta_admin_btn: "प्रशासक लॉगिन →",
    home_stat_districts: "ज़िला",
    home_stat_blocks: "प्रखंड",
    home_stat_panchayats: "पंचायतें",
    home_about_title: "पोर्टल के बारे में",
    home_about_body: "प्रत्येक शिक्षक क्रम में 5 पसंदीदा पंचायतें चुनता है। प्रशासक तब डेफ़र्ड-एक्सेप्टेंस आवंटन चलाते हैं, जिसमें टकराव प्रदर्शन अंक के आधार पर सुलझाए जाते हैं, और पूर्ण पुनरुत्पाद्यता हेतु सीडेड-रैंडम टाई-ब्रेक उपयोग होता है। सहरसा ज़िले की पूरी आधिकारिक पंचायत सूची पोर्टल में पहले से दर्ज है। परिणाम पारदर्शिता से प्रकाशित किए जाते हैं और नाम द्वारा देखे जा सकते हैं।",
    footer_note: "शिक्षा विभाग, सहरसा ज़िला · बिहार सरकार",
    footer_disclaimer: "शिकायत हेतु ज़िला शिक्षा कार्यालय, सहरसा से संपर्क करें।",
    lang_en: "English",
    lang_hi: "हिंदी",
    loading: "लोड हो रहा है…",
    save: "सहेजें",
    cancel: "रद्द करें",
    submit: "जमा करें",
    edit: "संपादित करें",
    delete: "हटाएँ",
    close: "बंद करें",
    ok: "ठीक है",
    yes: "हाँ",
    no: "नहीं",
    back: "वापस",
    required_field: "यह फ़ील्ड आवश्यक है।",
    not_configured_title: "सेटअप पूर्ण नहीं हुआ",
    not_configured_body: "डेटाबेस से कनेक्शन अभी कॉन्फ़िगर नहीं हुआ है। प्रशासक को js/firebase-config.js में Firebase सेटिंग जोड़नी होगी। चरणों के लिए README.md देखें।",

    tp_title: "शिक्षक वरीयता फ़ॉर्म",
    tp_lead: "अपना नाम चुनें, अपना विवरण भरें, फिर क्रम में अपनी 5 पसंदीदा पंचायतें चुनें।",
    tp_step1: "चरण 1 — आपका विवरण",
    tp_select_name: "अपना नाम चुनें",
    tp_select_name_ph: "— अपना नाम चुनें —",
    tp_post: "पदनाम / पद",
    tp_post_ph: "जैसे सहायक शिक्षक",
    tp_mobile: "मोबाइल नंबर",
    tp_mobile_hint: "10 अंकों का मोबाइल नंबर।",
    tp_present_block: "वर्तमान प्रखंड",
    tp_present_panchayat: "वर्तमान पंचायत",
    tp_select_block_ph: "— प्रखंड चुनें —",
    tp_continue: "आगे बढ़ें",
    tp_checking: "जाँच हो रही है…",
    tp_step3: "चरण 2 — क्रम में 5 वरीयताएँ चुनें",
    tp_pref_lead: "वरीयता 1 आपकी सबसे पसंदीदा पंचायत है। सभी पाँच अलग-अलग होनी चाहिए।",
    tp_pref: "वरीयता",
    tp_select_panchayat: "— पंचायत चुनें —",
    tp_submit_prefs: "मेरी वरीयताएँ जमा करें",
    tp_submitting: "जमा किया जा रहा है…",
    tp_submitted_ok: "आपकी वरीयताएँ सफलतापूर्वक जमा हो गई हैं।",
    tp_submitted_sub: "धन्यवाद। आप यह पृष्ठ बंद कर सकते हैं।",
    tp_change_name: "फिर से शुरू करें",
    tp_err_select_name: "कृपया सूची में से अपना नाम चुनें।",
    tp_err_mobile: "कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।",
    tp_err_fields: "कृपया ऊपर का सारा विवरण भरें।",
    tp_err_duplicate_pref: "प्रत्येक वरीयता एक अलग पंचायत होनी चाहिए।",
    tp_err_incomplete_pref: "कृपया सभी 5 वरीयताएँ चुनें।",
    tp_err_generic: "कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।",
    tp_dupe_title: "पहले से पंजीकृत",
    tp_dupe_mobile: "इस मोबाइल नंबर से पहले ही वरीयताएँ जमा की जा चुकी हैं। यदि आप अपनी पसंद बदलना चाहते हैं, तो कृपया ज़िला शिक्षा कार्यालय (प्रशासक) से अपनी पिछली प्रविष्टि हटवाएँ — फिर आप दोबारा पंजीकरण कर सकते हैं।",
    tp_dupe_generic: "इस शिक्षक या मोबाइल नंबर के लिए प्रविष्टि पहले से मौजूद है। बदलने हेतु कृपया ज़िला शिक्षा कार्यालय से अपनी पिछली प्रविष्टि हटवाएँ, फिर दोबारा पंजीकरण करें।",
    tp_closed_title: "सबमिशन बंद हैं",
    tp_closed_body: "वरीयताएँ जमा करने की अवधि अभी बंद है। कृपया सहायता हेतु ज़िला शिक्षा कार्यालय से संपर्क करें।",
    tp_results_published_note: "आवंटन परिणाम प्रकाशित हो चुके हैं। ",
    tp_check_result_link: "अपना आवंटन देखें »",
    tp_no_roster: "शिक्षक सूची अभी प्रकाशित नहीं हुई है। कृपया बाद में पुनः प्रयास करें।",

    rp_title: "आवंटन परिणाम देखें",
    rp_lead: "अपनी आवंटित पंचायत देखने के लिए अपना नाम चुनें। परिणाम सूचना पट्ट पर भी प्रकाशित किए जाते हैं।",
    rp_select_name: "अपना नाम चुनें",
    rp_not_published_title: "परिणाम अभी प्रकाशित नहीं हुए",
    rp_not_published_body: "आवंटन परिणाम अभी प्रकाशित नहीं हुए हैं। कृपया बाद में पुनः देखें।",
    rp_your_result: "आपका आवंटन",
    rp_allocated_to: "आवंटित पंचायत",
    rp_allocated_block: "प्रखंड",
    rp_pref_granted: "प्राप्त वरीयता",
    rp_unallocated_title: "अभी आवंटित नहीं",
    rp_unallocated_body: "इस चरण में आपको आपकी 5 वरीयताओं में से कोई भी आवंटित नहीं हुई। ज़िला शिक्षा कार्यालय आपको मैन्युअल रूप से आवंटित करेगा। कृपया उनसे संपर्क करें।",
    rp_check: "परिणाम देखें",
    rp_not_found: "इस नाम के लिए कोई परिणाम नहीं मिला। कृपया जाँचें या ज़िला शिक्षा कार्यालय से संपर्क करें।",

    ad_login_title: "प्रशासक लॉगिन",
    ad_login_lead: "केवल अधिकृत ज़िला शिक्षा कार्यालय कर्मचारी ही लॉगिन कर सकते हैं।",
    ad_email: "ईमेल",
    ad_password: "पासवर्ड",
    ad_login: "लॉगिन करें",
    ad_logging_in: "लॉगिन हो रहा है…",
    ad_logout: "लॉगआउट",
    ad_login_err: "लॉगिन विफल। अपना ईमेल और पासवर्ड जाँचें।",
    ad_dashboard: "प्रशासक डैशबोर्ड",
    ad_signed_in_as: "लॉगिन किया हुआ",

    ad_tab_overview: "अवलोकन",
    ad_tab_panchayats: "पंचायतें",
    ad_tab_teachers: "शिक्षक सूची",
    ad_tab_submissions: "पंजीकरण",
    ad_tab_allocation: "आवंटन",

    ad_status: "सबमिशन अवधि",
    ad_open: "खुली",
    ad_closed: "बंद",
    ad_open_subs: "सबमिशन खोलें",
    ad_close_subs: "सबमिशन बंद करें",
    ad_results_status: "परिणाम",
    ad_published: "प्रकाशित",
    ad_unpublished: "अप्रकाशित",
    ad_stat_panchayats: "पंचायतें",
    ad_stat_seats: "कुल सीटें",
    ad_stat_teachers: "सूची में शिक्षक",
    ad_stat_submitted: "पंजीकृत",
    ad_stat_allocated: "आवंटित",
    ad_stat_unallocated: "अनावंटित",

    ad_p_title: "पंचायतें प्रबंधित करें",
    ad_p_lead: "प्रत्येक पंचायत एक पदस्थापन है जिसमें सीटों की संख्या (क्षमता) होती है। इन्हें मैन्युअल रूप से जोड़ें या CSV आयात करें।",
    ad_p_name_en: "नाम (अंग्रेज़ी)",
    ad_p_name_hi: "नाम (हिंदी)",
    ad_p_block: "प्रखंड",
    ad_p_capacity: "सीटें",
    ad_p_add: "पंचायत जोड़ें",
    ad_p_import: "CSV आयात करें",
    ad_p_export: "CSV निर्यात करें",
    ad_p_template: "टेम्पलेट डाउनलोड करें",
    ad_p_none: "अभी कोई पंचायत नहीं जोड़ी गई।",
    ad_p_csv_help: "CSV कॉलम: name_en, name_hi, block, capacity",
    ad_p_deleted: "पंचायत हटाई गई।",
    ad_confirm_delete_p: "क्या इस पंचायत को हटाएँ?",

    ad_t_title: "शिक्षक सूची",
    ad_t_lead: "प्रदर्शन अंक के साथ आधिकारिक शिक्षक सूची अपलोड करें। पंजीकरण के समय शिक्षक इसी सूची से अपना नाम चुनते हैं। प्रदर्शन अंक शिक्षकों को कभी नहीं दिखाए जाते और केवल टकराव सुलझाने में उपयोग होते हैं।",
    ad_t_name_en: "नाम (अंग्रेज़ी)",
    ad_t_name_hi: "नाम (हिंदी)",
    ad_t_school: "विद्यालय (वैकल्पिक)",
    ad_t_block: "प्रखंड (वैकल्पिक)",
    ad_t_score: "प्रदर्शन अंक",
    ad_t_add: "शिक्षक जोड़ें",
    ad_t_import: "CSV आयात करें",
    ad_t_export: "सूची CSV निर्यात करें",
    ad_t_template: "टेम्पलेट डाउनलोड करें",
    ad_t_none: "अभी सूची में कोई शिक्षक नहीं।",
    ad_t_csv_help: "CSV कॉलम: name_en, name_hi, school, block, performance_score (विद्यालय व प्रखंड वैकल्पिक, पर सही नाम ढूँढने में मदद करते हैं)",
    ad_t_submitted_yes: "पंजीकृत",
    ad_t_submitted_no: "लंबित",
    ad_confirm_delete_t: "क्या इस शिक्षक को सूची से हटाएँ?",
    ad_t_higher_better: "अधिक अंक = समान पंचायत चाहने पर अधिक प्राथमिकता।",

    ad_s_title: "शिक्षक पंजीकरण",
    ad_s_lead: "जिन शिक्षकों ने वरीयताएँ जमा की हैं। किसी पंजीकरण को हटाने पर वह शिक्षक दोबारा जमा कर सकता है।",
    ad_s_name: "नाम",
    ad_s_post: "पदनाम",
    ad_s_mobile: "मोबाइल",
    ad_s_present: "वर्तमान पदस्थापन",
    ad_s_prefs: "वरीयताएँ (1 → 5)",
    ad_s_none: "अभी कोई पंजीकरण नहीं।",
    ad_s_no_submission: "(कोई सबमिशन नहीं)",
    ad_confirm_delete_sub: "क्या यह पंजीकरण हटाएँ? इसके बाद शिक्षक दोबारा जमा कर सकेगा।",
    ad_s_deleted: "पंजीकरण हटाया गया।",

    ad_a_title: "आवंटन चलाएँ",
    ad_a_lead: "आवंटन शिक्षक-प्रस्तावक डेफ़र्ड एक्सेप्टेंस का उपयोग करता है। प्राथमिकता प्रदर्शन अंक है; समान अंक होने पर एक सीडेड रैंडम मान टाई तोड़ता है ताकि हर रन पुनरुत्पाद्य और लेखापरीक्षणीय हो।",
    ad_a_run: "आवंटन चलाएँ",
    ad_a_running: "चल रहा है…",
    ad_a_rerun: "पुनः चलाएँ (नया रैंडम सीड)",
    ad_a_seed: "रैंडम सीड",
    ad_a_last_run: "अंतिम रन",
    ad_a_publish: "परिणाम प्रकाशित करें",
    ad_a_unpublish: "परिणाम अप्रकाशित करें",
    ad_a_export: "परिणाम CSV निर्यात करें",
    ad_a_results: "आवंटन परिणाम",
    ad_a_unallocated_list: "अनावंटित शिक्षक",
    ad_a_manual: "मैन्युअल आवंटन",
    ad_a_assign: "आवंटित करें",
    ad_a_free_seats: "शेष खाली सीटें",
    ad_a_no_results: "अभी तक कोई आवंटन नहीं चलाया गया।",
    ad_a_confirm_run: "अभी आवंटन चलाएँ? यह इस चरण के किसी भी पिछले परिणाम को बदल देगा।",
    ad_a_confirm_publish: "परिणाम प्रकाशित करें ताकि शिक्षक अपना आवंटन देख सकें?",
    ad_a_need_close: "सुझाव: आवंटन चलाने से पहले सबमिशन अवधि बंद करें ताकि रन के बीच वरीयताएँ न बदलें।",
    ad_a_col_teacher: "शिक्षक",
    ad_a_col_score: "अंक",
    ad_a_col_alloc: "आवंटित पंचायत",
    ad_a_col_pref: "वरीयता #",
    ad_a_done: "आवंटन पूर्ण।",
    ad_a_published_ok: "परिणाम प्रकाशित।",
    ad_a_unpublished_ok: "परिणाम अप्रकाशित।",

    ad_import_done: "आयात पूर्ण: {n} पंक्तियाँ जोड़ी/अपडेट की गईं।",
    ad_import_err: "CSV नहीं पढ़ा जा सका। कॉलम हेडर जाँचें और पुनः प्रयास करें।",
    ad_saved: "सहेजा गया।",
    ad_save_err: "सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।",
  },
};

const LS_KEY = "sta_lang";

export function getLang() {
  const saved = localStorage.getItem(LS_KEY);
  return saved === "hi" || saved === "en" ? saved : "en";
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "hi") lang = "en";
  localStorage.setItem(LS_KEY, lang);
  document.documentElement.lang = lang;
  document.body.setAttribute("data-lang", lang);
  applyI18n(document);
  updateToggleButtons();
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

export function t(key, params) {
  const lang = getLang();
  let s = (STRINGS[lang] && STRINGS[lang][key]) ?? (STRINGS.en[key] ?? key);
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.replaceAll(`{${k}}`, String(params[k]));
    }
  }
  return s;
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) document.title = t(titleEl.getAttribute("data-i18n")) + " — " + t("app_title");
}

function updateToggleButtons() {
  const lang = getLang();
  document.querySelectorAll(".lang-toggle button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  });
}

export function initLangToggle() {
  document.querySelectorAll(".lang-toggle button").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
  setLang(getLang());
}

/** Pick the right name for the current language, falling back gracefully. */
export function localName(nameEn, nameHi) {
  const lang = getLang();
  if (lang === "hi") return nameHi || nameEn || "";
  return nameEn || nameHi || "";
}
