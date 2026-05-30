/* ============================================================
   teacher.js — Public teacher preference form.
   Flow: pick name → details + mobile → check mobile → 5 prefs → submit.
   ============================================================ */
import {
  getConfig, listPanchayats, listRoster, isMobileUsed, submitRegistration,
} from "./firebase-init.js";
import { t, localName } from "./i18n.js";
import {
  initChrome, requireConfig, showMsg, clearMsg, setLoading, showModal, SAHARSA_BLOCKS,
} from "./common.js";

const NUM_PREFS = 5;

const els = {};
let roster = [];
let panchayats = [];
let current = null;        // { rosterId, nameEn, nameHi }

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initChrome("teacher");
  cache();
  if (!requireConfig(els.setupWarn)) return;

  els.btnContinue.addEventListener("click", onContinue);
  els.btnSubmit.addEventListener("click", onSubmit);
  els.btnRestart.addEventListener("click", onRestart);
  els.mobile.addEventListener("input", () => {
    els.mobile.value = els.mobile.value.replace(/\D/g, "").slice(0, 10);
    showMobileFeedback(false);
  });
  els.mobile.addEventListener("blur", () => showMobileFeedback(true));
  els.presentBlock.addEventListener("change", () => buildPresentPanchayatSelect(els.presentBlock.value));
  document.addEventListener("langchange", renderDynamic);

  try {
    const [cfg, ps, rs] = await Promise.all([getConfig(), listPanchayats(), listRoster()]);
    panchayats = sortPanchayats(ps);
    roster = [...rs].sort((a, b) => localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));

    if (cfg.resultsPublished) els.publishedBanner.classList.remove("hidden");

    if (!cfg.submissionsOpen) {
      els.closedBanner.classList.remove("hidden");
      return;
    }
    if (roster.length === 0) {
      showMsg(els.setupWarn.appendChild(document.createElement("div")), "warn", t("tp_no_roster"));
      return;
    }
    buildNameSelect();
    buildBlockSelect();
    buildPresentPanchayatSelect(els.presentBlock.value);
    els.step1.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showMsg(els.setupWarn.appendChild(document.createElement("div")), "error", t("tp_err_generic"));
  }
}

function cache() {
  els.setupWarn = document.getElementById("setup-warn");
  els.publishedBanner = document.getElementById("published-banner");
  els.closedBanner = document.getElementById("closed-banner");
  els.step1 = document.getElementById("step1");
  els.formArea = document.getElementById("form-area");
  els.successView = document.getElementById("success-view");
  els.mobileErr = document.getElementById("mobile-err");
  els.name = document.getElementById("t-name");
  els.post = document.getElementById("t-post");
  els.mobile = document.getElementById("t-mobile");
  els.presentBlock = document.getElementById("t-present-block");
  els.presentPanchayat = document.getElementById("t-present-panchayat");
  els.step1Msg = document.getElementById("step1-msg");
  els.btnContinue = document.getElementById("btn-continue");
  els.btnSubmit = document.getElementById("btn-submit");
  els.btnRestart = document.getElementById("btn-restart");
  els.submitMsg = document.getElementById("submit-msg");
  els.prefList = document.getElementById("pref-list");
}

function sortPanchayats(list) {
  return [...list].sort((a, b) =>
    (a.block || "").localeCompare(b.block || "") ||
    localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));
}

function makeOption(value, label) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = label;
  return o;
}

function buildNameSelect() {
  const keep = els.name.value;
  els.name.innerHTML = "";
  els.name.appendChild(makeOption("", t("tp_select_name_ph")));
  for (const r of roster) {
    const extra = [r.school, r.block].filter(Boolean).join(", ");
    const label = localName(r.nameEn, r.nameHi) + (extra ? ` — ${extra}` : "");
    const o = makeOption(r.rosterId, label);
    o.dataset.nameEn = r.nameEn || "";
    o.dataset.nameHi = r.nameHi || "";
    els.name.appendChild(o);
  }
  if (keep) els.name.value = keep;
}

function buildBlockSelect() {
  const keep = els.presentBlock.value;
  els.presentBlock.innerHTML = "";
  els.presentBlock.appendChild(makeOption("", t("tp_select_block_ph")));
  for (const b of SAHARSA_BLOCKS) els.presentBlock.appendChild(makeOption(b, b));
  if (keep) els.presentBlock.value = keep;
}

function buildPresentPanchayatSelect(block) {
  const keep = els.presentPanchayat.value;
  els.presentPanchayat.innerHTML = "";
  els.presentPanchayat.appendChild(makeOption("", t("tp_select_panchayat")));
  for (const p of panchayats.filter((x) => !block || x.block === block)) {
    els.presentPanchayat.appendChild(makeOption(p.id, localName(p.nameEn, p.nameHi)));
  }
  if (keep) els.presentPanchayat.value = keep;
}

function mobileValid() {
  return /^[6-9]\d{9}$/.test(els.mobile.value.trim());
}

/** Live feedback under the mobile field. `force` shows the error even while typing. */
function showMobileFeedback(force) {
  const v = els.mobile.value.trim();
  if (!v || mobileValid() || (!force && v.length < 10)) {
    els.mobile.classList.remove("invalid");
    els.mobileErr.classList.add("hidden");
  } else {
    els.mobile.classList.add("invalid");
    els.mobileErr.textContent = t("tp_err_mobile");
    els.mobileErr.classList.remove("hidden");
  }
}

function buildPrefRows(preselected = []) {
  els.prefList.innerHTML = "";
  for (let i = 0; i < NUM_PREFS; i++) {
    const li = document.createElement("li");
    li.className = "pref-row";
    const rank = document.createElement("div");
    rank.className = "pref-rank";
    rank.textContent = String(i + 1);
    const sel = document.createElement("select");
    sel.id = `pref-${i}`;
    sel.setAttribute("aria-label", `${t("tp_pref")} ${i + 1}`);
    sel.addEventListener("change", () => refreshPrefOptions());
    li.appendChild(rank);
    li.appendChild(sel);
    els.prefList.appendChild(li);
  }
  refreshPrefOptions(preselected);
}

/**
 * Populate each preference dropdown with panchayats, EXCLUDING:
 *   - the present panchayat
 *   - any panchayat already chosen in the OTHER preference dropdowns
 * Each select's own selection is preserved.
 */
function refreshPrefOptions(preselectedArr) {
  const selects = [];
  for (let i = 0; i < NUM_PREFS; i++) selects.push(document.getElementById(`pref-${i}`));
  const useArr = Array.isArray(preselectedArr) ? preselectedArr : null;
  const currentValues = selects.map((s, i) => (useArr ? (useArr[i] || "") : s.value));
  const present = els.presentPanchayat.value || "";

  selects.forEach((sel, i) => {
    const own = currentValues[i];
    const exclude = new Set();
    if (present) exclude.add(present);
    currentValues.forEach((v, j) => { if (j !== i && v) exclude.add(v); });

    sel.innerHTML = "";
    sel.appendChild(makeOption("", t("tp_select_panchayat")));
    appendPanchayatOptions(sel, exclude);
    if (own && [...sel.options].some((o) => o.value === own)) sel.value = own;
    else sel.value = "";
  });
}

function appendPanchayatOptions(sel, excludeSet) {
  const byBlock = new Map();
  for (const p of panchayats) {
    if (excludeSet && excludeSet.has(p.id)) continue;
    const b = p.block || "—";
    if (!byBlock.has(b)) byBlock.set(b, []);
    byBlock.get(b).push(p);
  }
  for (const [block, list] of byBlock) {
    const og = document.createElement("optgroup");
    og.label = block;
    for (const p of list) og.appendChild(makeOption(p.id, localName(p.nameEn, p.nameHi)));
    sel.appendChild(og);
  }
}

function readPrefs() {
  const out = [];
  for (let i = 0; i < NUM_PREFS; i++) out.push(document.getElementById(`pref-${i}`).value);
  return out;
}

function renderDynamic() {
  // Rebuild language-dependent dropdowns, preserving selections.
  buildNameSelect();
  buildBlockSelect();
  buildPresentPanchayatSelect(els.presentBlock.value);
  showMobileFeedback(false);
  if (els.prefList.children.length) {
    const selected = readPrefs();
    buildPrefRows(selected);
  }
}

async function onContinue() {
  clearMsg(els.step1Msg);
  const opt = els.name.options[els.name.selectedIndex];
  const rosterId = els.name.value;
  const mobile = els.mobile.value.trim();

  if (!rosterId) { showMsg(els.step1Msg, "error", t("tp_err_select_name")); return; }
  if (!els.post.value.trim() || !els.presentBlock.value || !els.presentPanchayat.value.trim()) {
    showMsg(els.step1Msg, "error", t("tp_err_fields")); return;
  }
  if (!mobileValid()) { showMobileFeedback(true); showMsg(els.step1Msg, "error", t("tp_err_mobile")); return; }

  setLoading(els.btnContinue, true, "tp_checking");
  try {
    if (await isMobileUsed(mobile)) {
      showModal(t("tp_dupe_title"), t("tp_dupe_mobile"));
      return;
    }
    current = {
      rosterId,
      nameEn: opt.dataset.nameEn || "",
      nameHi: opt.dataset.nameHi || "",
    };
    els.step1.classList.add("hidden");
    els.formArea.classList.remove("hidden");
    buildPrefRows();
    els.formArea.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showMsg(els.step1Msg, "error", t("tp_err_generic"));
  } finally {
    setLoading(els.btnContinue, false);
  }
}

async function onSubmit() {
  clearMsg(els.submitMsg);
  const prefs = readPrefs();
  if (prefs.some((p) => !p)) { showMsg(els.submitMsg, "error", t("tp_err_incomplete_pref")); return; }
  if (new Set(prefs).size !== prefs.length) { showMsg(els.submitMsg, "error", t("tp_err_duplicate_pref")); return; }

  setLoading(els.btnSubmit, true, "tp_submitting");
  let ok = false;
  try {
    await submitRegistration({
      rosterId: current.rosterId,
      nameEn: current.nameEn, nameHi: current.nameHi,
      post: els.post.value.trim(),
      mobile: els.mobile.value.trim(),
      presentBlock: els.presentBlock.value,
      presentPanchayat: els.presentPanchayat.value.trim(),
      preferences: prefs,
    });
    ok = true;
  } catch (err) {
    console.error(err);
    // Create failed → already registered (this teacher or this mobile), or window closed.
    let mobileUsed = false;
    try { mobileUsed = await isMobileUsed(els.mobile.value.trim()); } catch { /* ignore */ }
    showModal(t("tp_dupe_title"), mobileUsed ? t("tp_dupe_mobile") : t("tp_dupe_generic"));
  } finally {
    setLoading(els.btnSubmit, false);
  }

  if (ok) {
    clearMsg(els.submitMsg);
    els.formArea.classList.add("hidden");
    els.successView.classList.remove("hidden");
    els.successView.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function onRestart() {
  current = null;
  els.formArea.classList.add("hidden");
  els.successView.classList.add("hidden");
  els.prefList.innerHTML = "";
  clearMsg(els.submitMsg);
  els.btnSubmit.disabled = false;
  els.name.value = "";
  els.post.value = "";
  els.mobile.value = "";
  els.presentBlock.value = "";
  buildPresentPanchayatSelect("");
  els.step1.classList.remove("hidden");
  els.name.focus();
}
