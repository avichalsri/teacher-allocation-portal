/* ============================================================
   admin.js — Administrator dashboard.
   Login (Firebase Auth) + manage panchayats / teacher roster,
   view registrations (with delete), run + publish allocation.
   ============================================================ */
import {
  onAdminAuth, adminLogin, adminLogout,
  getConfig, setConfig,
  listPanchayats, savePanchayat, deletePanchayat, bulkSavePanchayats,
  listTeachers, saveTeacher, deleteTeacher, bulkSaveTeachers,
  listSubmissions, deleteSubmission,
  listResults, publishResults, clearResults,
} from "./firebase-init.js";
import { t, localName } from "./i18n.js";
import {
  initChrome, requireConfig, showMsg, clearMsg, escapeHtml, setLoading,
  parseCSV, toCSV, downloadFile, readFileAsText,
} from "./common.js";
import { runAllocation } from "./allocation.js";

const $ = (id) => document.getElementById(id);

const state = {
  config: { submissionsOpen: false, resultsPublished: false },
  panchayats: [],
  teachers: [],
  submissions: [],
  resultRows: [],
};

document.addEventListener("DOMContentLoaded", () => {
  initChrome("admin");
  if (!requireConfig($("setup-warn"))) return;

  $("btn-login").addEventListener("click", doLogin);
  $("a-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("btn-logout").addEventListener("click", () => adminLogout());
  wireTabs();
  wirePanchayats();
  wireTeachers();
  wireRegistrations();
  wireAllocation();
  document.addEventListener("langchange", renderAll);

  onAdminAuth((user) => (user ? onSignedIn(user) : onSignedOut()));
});

/* ================= Auth ================= */
function onSignedOut() {
  $("dash-view").classList.add("hidden");
  $("login-view").classList.remove("hidden");
  $("btn-logout").classList.add("hidden");
  $("admin-email").textContent = "";
}
async function onSignedIn(user) {
  $("login-view").classList.add("hidden");
  $("dash-view").classList.remove("hidden");
  $("btn-logout").classList.remove("hidden");
  $("admin-email").textContent = `${t("ad_signed_in_as")}: ${user.email}`;
  await loadAll();
}
async function doLogin() {
  clearMsg($("login-msg"));
  const email = $("a-email").value.trim();
  const pass = $("a-pass").value;
  if (!email || !pass) { showMsg($("login-msg"), "error", t("required_field")); return; }
  setLoading($("btn-login"), true, "ad_logging_in");
  try { await adminLogin(email, pass); }
  catch (err) { console.error(err); showMsg($("login-msg"), "error", t("ad_login_err")); }
  finally { setLoading($("btn-login"), false); }
}

/* ================= Load + render ================= */
async function loadAll() {
  const [config, panchayats, teachers, submissions, results] = await Promise.all([
    getConfig(), listPanchayats(), listTeachers(), listSubmissions(), listResults(),
  ]);
  state.config = config;
  state.panchayats = panchayats;
  state.teachers = teachers;
  state.submissions = submissions;
  state.resultRows = results;
  renderAll();
}
function renderAll() {
  if ($("dash-view").classList.contains("hidden")) return;
  renderOverview();
  renderPanchayatTable();
  renderTeacherTable();
  renderRegistrationTable();
  renderAllocation();
}

/* ================= Tabs ================= */
function wireTabs() {
  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      const name = tab.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.dataset.panel !== name));
    });
  });
}

/* ================= Helpers ================= */
const keyBy = (arr, key) => Object.fromEntries(arr.map((x) => [x[key], x]));
const teacherById = () => keyBy(state.teachers, "rosterId");
const panchById = () => keyBy(state.panchayats, "id");
const totalSeats = () => state.panchayats.reduce((s, p) => s + (parseInt(p.capacity, 10) || 1), 0);
function freeSeatsMap() {
  const free = {};
  for (const p of state.panchayats) free[p.id] = (parseInt(p.capacity, 10) || 1);
  for (const r of state.resultRows) if (r.panchayatId && free[r.panchayatId] != null) free[r.panchayatId]--;
  return free;
}

/* ================= Overview ================= */
function renderOverview() {
  const open = !!state.config.submissionsOpen;
  const pub = !!state.config.resultsPublished;
  const sb = $("ov-sub-badge");
  sb.className = `badge ${open ? "open" : "closed"}`;
  sb.textContent = open ? t("ad_open") : t("ad_closed");
  $("btn-open-subs").disabled = open;
  $("btn-close-subs").disabled = !open;
  $("btn-open-subs").onclick = () => toggleSubs(true);
  $("btn-close-subs").onclick = () => toggleSubs(false);

  const rb = $("ov-res-badge");
  rb.className = `badge ${pub ? "open" : "pending"}`;
  rb.textContent = pub ? t("ad_published") : t("ad_unpublished");

  const allocated = state.resultRows.filter((r) => r.panchayatId).length;
  const registered = state.submissions.length;
  $("st-panchayats").textContent = state.panchayats.length;
  $("st-seats").textContent = totalSeats();
  $("st-teachers").textContent = state.teachers.length;
  $("st-submitted").textContent = registered;
  $("st-allocated").textContent = allocated;
  $("st-unallocated").textContent = Math.max(0, registered - allocated);
}
async function toggleSubs(open) {
  try { await setConfig({ submissionsOpen: open }); state.config.submissionsOpen = open; renderOverview(); }
  catch (e) { console.error(e); alert(t("ad_save_err")); }
}

/* ================= Panchayats ================= */
function wirePanchayats() {
  $("btn-p-add").addEventListener("click", onPanchayatSave);
  $("btn-p-cancel").addEventListener("click", resetPanchayatForm);
  $("btn-p-import").addEventListener("click", () => $("p-file").click());
  $("p-file").addEventListener("change", onPanchayatImport);
  $("btn-p-export").addEventListener("click", exportPanchayats);
  $("btn-p-template").addEventListener("click", () =>
    downloadFile("panchayats-template.csv", "name_en,name_hi,block,capacity\nExample Panchayat,उदाहरण पंचायत,Kahra,1\n"));
  $("p-table").addEventListener("click", onPanchayatTableClick);
}
function renderPanchayatTable() {
  const rows = [...state.panchayats].sort((a, b) =>
    (a.block || "").localeCompare(b.block || "") ||
    localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));
  const head = `<thead><tr>
    <th>${t("ad_p_name_en")}</th><th>${t("ad_p_name_hi")}</th>
    <th>${t("ad_p_block")}</th><th>${t("ad_p_capacity")}</th><th></th></tr></thead>`;
  const body = rows.length
    ? rows.map((p) => `<tr>
        <td>${escapeHtml(p.nameEn)}</td><td>${escapeHtml(p.nameHi)}</td>
        <td>${escapeHtml(p.block)}</td><td class="num">${escapeHtml(p.capacity)}</td>
        <td><button class="btn secondary small" data-act="edit" data-id="${escapeHtml(p.id)}">${t("edit")}</button>
            <button class="btn danger small" data-act="del" data-id="${escapeHtml(p.id)}">${t("delete")}</button></td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="inline-note">${t("ad_p_none")}</td></tr>`;
  $("p-table").innerHTML = head + `<tbody>${body}</tbody>`;
}
async function onPanchayatSave() {
  const p = {
    id: $("p-edit-id").value || null,
    nameEn: $("p-name-en").value.trim(), nameHi: $("p-name-hi").value.trim(),
    block: $("p-block").value.trim(), capacity: $("p-cap").value,
  };
  if (!p.nameEn && !p.nameHi) { showMsg($("p-msg"), "error", t("required_field")); return; }
  try {
    await savePanchayat(p);
    resetPanchayatForm();
    showMsg($("p-msg"), "ok", t("ad_saved"));
    state.panchayats = await listPanchayats();
    renderPanchayatTable(); renderOverview();
  } catch (e) { console.error(e); showMsg($("p-msg"), "error", t("ad_save_err")); }
}
function resetPanchayatForm() {
  ["p-edit-id", "p-name-en", "p-name-hi", "p-block"].forEach((i) => ($(i).value = ""));
  $("p-cap").value = "1";
  $("btn-p-add").textContent = t("ad_p_add");
  $("btn-p-cancel").classList.add("hidden");
}
function onPanchayatTableClick(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === "edit") {
    const p = state.panchayats.find((x) => x.id === id);
    if (!p) return;
    $("p-edit-id").value = p.id;
    $("p-name-en").value = p.nameEn || "";
    $("p-name-hi").value = p.nameHi || "";
    $("p-block").value = p.block || "";
    $("p-cap").value = p.capacity || 1;
    $("btn-p-add").textContent = t("save");
    $("btn-p-cancel").classList.remove("hidden");
    $("p-name-en").scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (btn.dataset.act === "del") {
    if (!confirm(t("ad_confirm_delete_p"))) return;
    deletePanchayat(id).then(async () => {
      state.panchayats = await listPanchayats();
      renderPanchayatTable(); renderOverview();
      showMsg($("p-msg"), "ok", t("ad_p_deleted"));
    }).catch((err) => { console.error(err); showMsg($("p-msg"), "error", t("ad_save_err")); });
  }
}
async function onPanchayatImport(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const rows = parseCSV(await readFileAsText(file)).map((r) => ({
      nameEn: r.name_en, nameHi: r.name_hi, block: r.block, capacity: r.capacity,
    }));
    if (!rows.length) throw new Error("empty");
    await bulkSavePanchayats(rows);
    state.panchayats = await listPanchayats();
    renderPanchayatTable(); renderOverview();
    showMsg($("p-msg"), "ok", t("ad_import_done", { n: rows.length }));
  } catch (err) { console.error(err); showMsg($("p-msg"), "error", t("ad_import_err")); }
}
function exportPanchayats() {
  const cols = [{ key: "name_en" }, { key: "name_hi" }, { key: "block" }, { key: "capacity" }];
  const rows = state.panchayats.map((p) => ({
    name_en: p.nameEn, name_hi: p.nameHi, block: p.block, capacity: p.capacity,
  }));
  downloadFile("panchayats.csv", toCSV(rows, cols));
}

/* ================= Teacher roster ================= */
function wireTeachers() {
  $("btn-t-add").addEventListener("click", onTeacherSave);
  $("btn-t-cancel").addEventListener("click", resetTeacherForm);
  $("btn-t-import").addEventListener("click", () => $("t-file").click());
  $("t-file").addEventListener("change", onTeacherImport);
  $("btn-t-export").addEventListener("click", exportRoster);
  $("btn-t-template").addEventListener("click", () =>
    downloadFile("teachers-template.csv",
      "name_en,name_hi,school,block,performance_score\n" +
      "Example Teacher,उदाहरण शिक्षक,Middle School Bairo,Kahra,82.5\n"));
  $("t-table").addEventListener("click", onTeacherTableClick);
}
function renderTeacherTable() {
  const submittedSet = new Set(state.submissions.map((s) => s.rosterId));
  const rows = [...state.teachers].sort((a, b) =>
    localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));
  const head = `<thead><tr>
    <th>${t("ad_t_name_en")}</th><th>${t("ad_t_name_hi")}</th><th>${t("ad_t_school")}</th>
    <th>${t("ad_t_block")}</th><th>${t("ad_t_score")}</th><th>${t("ad_tab_submissions")}</th><th></th></tr></thead>`;
  const body = rows.length
    ? rows.map((tc) => `<tr>
        <td>${escapeHtml(tc.nameEn)}</td><td>${escapeHtml(tc.nameHi)}</td>
        <td>${escapeHtml(tc.school)}</td><td>${escapeHtml(tc.block)}</td>
        <td class="num">${escapeHtml(tc.performanceScore)}</td>
        <td>${submittedSet.has(tc.rosterId)
              ? `<span class="badge open">${t("ad_t_submitted_yes")}</span>`
              : `<span class="badge pending">${t("ad_t_submitted_no")}</span>`}</td>
        <td><button class="btn secondary small" data-act="edit" data-id="${escapeHtml(tc.rosterId)}">${t("edit")}</button>
            <button class="btn danger small" data-act="del" data-id="${escapeHtml(tc.rosterId)}">${t("delete")}</button></td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="inline-note">${t("ad_t_none")}</td></tr>`;
  $("t-table").innerHTML = head + `<tbody>${body}</tbody>`;
}
async function onTeacherSave() {
  const tc = {
    rosterId: $("t-edit-id").value || null,
    nameEn: $("t-name-en").value.trim(), nameHi: $("t-name-hi").value.trim(),
    school: $("t-school").value.trim(), block: $("t-block").value.trim(),
    performanceScore: $("t-score").value,
  };
  if (!tc.nameEn && !tc.nameHi) { showMsg($("t-msg"), "error", t("required_field")); return; }
  try {
    await saveTeacher(tc);
    resetTeacherForm();
    showMsg($("t-msg"), "ok", t("ad_saved"));
    state.teachers = await listTeachers();
    renderTeacherTable(); renderOverview();
  } catch (e) { console.error(e); showMsg($("t-msg"), "error", t("ad_save_err")); }
}
function resetTeacherForm() {
  ["t-edit-id", "t-name-en", "t-name-hi", "t-school", "t-block", "t-score"].forEach((i) => ($(i).value = ""));
  $("btn-t-add").textContent = t("ad_t_add");
  $("btn-t-cancel").classList.add("hidden");
}
function onTeacherTableClick(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === "edit") {
    const tc = state.teachers.find((x) => x.rosterId === id);
    if (!tc) return;
    $("t-edit-id").value = tc.rosterId;
    $("t-name-en").value = tc.nameEn || "";
    $("t-name-hi").value = tc.nameHi || "";
    $("t-school").value = tc.school || "";
    $("t-block").value = tc.block || "";
    $("t-score").value = tc.performanceScore ?? "";
    $("btn-t-add").textContent = t("save");
    $("btn-t-cancel").classList.remove("hidden");
    $("t-name-en").scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (btn.dataset.act === "del") {
    if (!confirm(t("ad_confirm_delete_t"))) return;
    deleteTeacher(id).then(async () => {
      state.teachers = await listTeachers();
      renderTeacherTable(); renderOverview();
    }).catch((err) => { console.error(err); showMsg($("t-msg"), "error", t("ad_save_err")); });
  }
}
async function onTeacherImport(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const rows = parseCSV(await readFileAsText(file)).map((r) => ({
      nameEn: r.name_en, nameHi: r.name_hi, school: r.school, block: r.block,
      performanceScore: r.performance_score,
    })).filter((r) => r.nameEn || r.nameHi);
    if (!rows.length) throw new Error("empty");
    await bulkSaveTeachers(rows);
    state.teachers = await listTeachers();
    renderTeacherTable(); renderOverview();
    showMsg($("t-msg"), "ok", t("ad_import_done", { n: rows.length }));
  } catch (err) { console.error(err); showMsg($("t-msg"), "error", t("ad_import_err")); }
}
function exportRoster() {
  const cols = [{ key: "name_en" }, { key: "name_hi" }, { key: "school" }, { key: "block" }, { key: "performance_score" }];
  const rows = state.teachers.map((tc) => ({
    name_en: tc.nameEn, name_hi: tc.nameHi, school: tc.school, block: tc.block,
    performance_score: tc.performanceScore,
  }));
  downloadFile("teachers-roster.csv", toCSV(rows, cols));
}

/* ================= Registrations ================= */
function wireRegistrations() {
  $("s-table").addEventListener("click", onRegistrationClick);
}
function renderRegistrationTable() {
  const pmap = panchById();
  const rows = [...state.submissions].sort((a, b) =>
    localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));
  const head = `<thead><tr>
    <th>${t("ad_s_name")}</th><th>${t("ad_s_post")}</th><th>${t("ad_s_mobile")}</th>
    <th>${t("ad_s_present")}</th><th>${t("ad_s_prefs")}</th><th></th></tr></thead>`;
  const body = rows.length
    ? rows.map((s) => {
        const prefs = (s.preferences || []).map((pid, i) => {
          const p = pmap[pid];
          return `${i + 1}. ${escapeHtml(p ? localName(p.nameEn, p.nameHi) : pid)}`;
        }).join("<br>");
        const pp = pmap[s.presentPanchayat];
        const presentName = pp ? localName(pp.nameEn, pp.nameHi) : (s.presentPanchayat || "");
        const present = [presentName, s.presentBlock].filter(Boolean).join(", ");
        return `<tr>
          <td>${escapeHtml(localName(s.nameEn, s.nameHi))}</td>
          <td>${escapeHtml(s.post || "—")}</td>
          <td>${escapeHtml(s.mobile || "—")}</td>
          <td>${escapeHtml(present || "—")}</td>
          <td>${prefs || t("ad_s_no_submission")}</td>
          <td><button class="btn danger small" data-del="${escapeHtml(s.rosterId)}"
                data-mobile="${escapeHtml(s.mobile || "")}">${t("delete")}</button></td></tr>`;
      }).join("")
    : `<tr><td colspan="6" class="inline-note">${t("ad_s_none")}</td></tr>`;
  $("s-table").innerHTML = head + `<tbody>${body}</tbody>`;
}
function onRegistrationClick(e) {
  const btn = e.target.closest("button[data-del]");
  if (!btn) return;
  if (!confirm(t("ad_confirm_delete_sub"))) return;
  deleteSubmission(btn.dataset.del, btn.dataset.mobile).then(async () => {
    state.submissions = await listSubmissions();
    renderRegistrationTable(); renderTeacherTable(); renderOverview();
  }).catch((err) => { console.error(err); alert(t("ad_save_err")); });
}

/* ================= Allocation ================= */
function wireAllocation() {
  $("btn-run").addEventListener("click", () => doRun());
  $("btn-rerun").addEventListener("click", () => doRun());
  $("btn-publish").addEventListener("click", () => setPublished(true));
  $("btn-unpublish").addEventListener("click", () => setPublished(false));
  $("btn-export-results").addEventListener("click", exportResults);
  $("a-unalloc-table").addEventListener("click", onManualAssign);
}
function renderAllocation() {
  const hasResults = state.resultRows.length > 0;
  const pub = !!state.config.resultsPublished;
  $("btn-run").classList.toggle("hidden", hasResults);
  $("btn-rerun").classList.toggle("hidden", !hasResults);
  $("btn-publish").classList.toggle("hidden", !hasResults || pub);
  $("btn-unpublish").classList.toggle("hidden", !hasResults || !pub);
  $("btn-export-results").classList.toggle("hidden", !hasResults);

  const meta = [];
  if (state.config.allocationSeed != null) meta.push(`${t("ad_a_seed")}: ${state.config.allocationSeed}`);
  if (state.config.lastAllocationAt) meta.push(`${t("ad_a_last_run")}: ${new Date(state.config.lastAllocationAt).toLocaleString()}`);
  $("a-meta").textContent = meta.join("  ·  ");

  if (!hasResults) {
    $("a-results-card").style.display = "none";
    $("a-unalloc-card").style.display = "none";
    return;
  }

  const tmap = teacherById();
  const allocated = state.resultRows.filter((r) => r.panchayatId)
    .sort((a, b) => (a.block || "").localeCompare(b.block || "") ||
      localName(a.panchayatNameEn, a.panchayatNameHi).localeCompare(localName(b.panchayatNameEn, b.panchayatNameHi)));
  const head = `<thead><tr>
    <th>${t("ad_a_col_teacher")}</th><th>${t("ad_a_col_score")}</th>
    <th>${t("ad_a_col_alloc")}</th><th>${t("ad_p_block")}</th><th>${t("ad_a_col_pref")}</th></tr></thead>`;
  const body = allocated.map((r) => {
    const tc = tmap[r.rosterId] || {};
    return `<tr>
      <td>${escapeHtml(localName(r.nameEn, r.nameHi) || r.rosterId)}</td>
      <td class="num">${escapeHtml(tc.performanceScore ?? "—")}</td>
      <td>${escapeHtml(localName(r.panchayatNameEn, r.panchayatNameHi))}</td>
      <td>${escapeHtml(r.block)}</td>
      <td class="num">${r.prefIndex ? r.prefIndex : "—"}</td></tr>`;
  }).join("");
  $("a-table").innerHTML = head + `<tbody>${body}</tbody>`;
  $("a-results-card").style.display = "";

  const free = freeSeatsMap();
  const freeList = state.panchayats.filter((p) => free[p.id] > 0)
    .sort((a, b) => (a.block || "").localeCompare(b.block || ""));
  const unalloc = state.resultRows.filter((r) => !r.panchayatId)
    .sort((a, b) => localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));

  if (!unalloc.length) {
    $("a-unalloc-card").style.display = "none";
  } else {
    const opts = `<option value="">—</option>` + freeList.map((p) =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(localName(p.nameEn, p.nameHi))} (${escapeHtml(p.block)}) · ${t("ad_a_free_seats")}: ${free[p.id]}</option>`).join("");
    const uhead = `<thead><tr>
      <th>${t("ad_a_col_teacher")}</th><th>${t("ad_a_col_score")}</th><th>${t("ad_a_manual")}</th></tr></thead>`;
    const ubody = unalloc.map((r) => {
      const tc = tmap[r.rosterId] || {};
      return `<tr>
        <td>${escapeHtml(localName(r.nameEn, r.nameHi) || r.rosterId)}</td>
        <td class="num">${escapeHtml(tc.performanceScore ?? "—")}</td>
        <td><select data-uid="${escapeHtml(r.rosterId)}" style="max-width:340px">${opts}</select>
            <button class="btn small" data-assign="${escapeHtml(r.rosterId)}">${t("ad_a_assign")}</button></td></tr>`;
    }).join("");
    $("a-unalloc-table").innerHTML = uhead + `<tbody>${ubody}</tbody>`;
    $("a-unalloc-card").style.display = "";
  }
}
async function doRun() {
  if (!state.submissions.length) { showMsg($("a-msg"), "warn", t("ad_s_none")); return; }
  if (!confirm(t("ad_a_confirm_run"))) return;
  const btn = state.resultRows.length ? $("btn-rerun") : $("btn-run");
  setLoading(btn, true, "ad_a_running");
  try {
    const seed = Date.now();
    const subsMap = {};
    state.submissions.forEach((s) => (subsMap[s.rosterId] = s.preferences || []));
    const teachersForAlloc = state.teachers.map((tc) => ({
      teacherId: tc.rosterId, performanceScore: tc.performanceScore,
    }));
    const panchForAlloc = state.panchayats.map((p) => ({ id: p.id, capacity: p.capacity }));
    const alloc = runAllocation(teachersForAlloc, panchForAlloc, subsMap, seed);

    const pmap = panchById();
    const rows = state.submissions.map((s) => {
      const a = alloc.assignments[s.rosterId];
      const p = a ? pmap[a.panchayatId] : null;
      return {
        rosterId: s.rosterId,
        nameEn: s.nameEn || "", nameHi: s.nameHi || "",
        panchayatId: a ? a.panchayatId : "",
        panchayatNameEn: p ? p.nameEn : "",
        panchayatNameHi: p ? p.nameHi : "",
        block: p ? p.block : "",
        prefIndex: a ? a.prefIndex : null,
      };
    });

    await clearResults();
    await publishResults(rows);
    const lastRun = new Date().toISOString();
    await setConfig({ allocationSeed: alloc.seed, lastAllocationAt: lastRun, resultsPublished: false });

    state.resultRows = await listResults();
    state.config.allocationSeed = alloc.seed;
    state.config.lastAllocationAt = lastRun;
    state.config.resultsPublished = false;
    renderAll();
    showMsg($("a-msg"), "ok", t("ad_a_done"));
  } catch (err) {
    console.error(err);
    showMsg($("a-msg"), "error", t("ad_save_err"));
  } finally {
    setLoading(btn, false);
  }
}
async function onManualAssign(e) {
  const btn = e.target.closest("button[data-assign]");
  if (!btn) return;
  const rosterId = btn.dataset.assign;
  const sel = $("a-unalloc-table").querySelector(`select[data-uid="${CSS.escape(rosterId)}"]`);
  const panchayatId = sel ? sel.value : "";
  if (!panchayatId) return;
  const row = state.resultRows.find((r) => r.rosterId === rosterId);
  const p = panchById()[panchayatId];
  if (!row || !p) return;
  try {
    await publishResults([{
      rosterId,
      nameEn: row.nameEn, nameHi: row.nameHi,
      panchayatId, panchayatNameEn: p.nameEn, panchayatNameHi: p.nameHi,
      block: p.block, prefIndex: null,
    }]);
    state.resultRows = await listResults();
    renderAll();
    showMsg($("a-msg"), "ok", t("ad_saved"));
  } catch (err) { console.error(err); showMsg($("a-msg"), "error", t("ad_save_err")); }
}
async function setPublished(pub) {
  if (pub && !confirm(t("ad_a_confirm_publish"))) return;
  try {
    await setConfig({ resultsPublished: pub });
    state.config.resultsPublished = pub;
    renderAllocation(); renderOverview();
    showMsg($("a-msg"), "ok", pub ? t("ad_a_published_ok") : t("ad_a_unpublished_ok"));
  } catch (err) { console.error(err); showMsg($("a-msg"), "error", t("ad_save_err")); }
}
function exportResults() {
  const tmap = teacherById();
  const cols = [
    { key: "name_en" }, { key: "name_hi" }, { key: "score" },
    { key: "panchayat_en" }, { key: "panchayat_hi" }, { key: "block" }, { key: "pref_index" },
  ];
  const rows = state.resultRows.map((r) => ({
    name_en: r.nameEn, name_hi: r.nameHi,
    score: tmap[r.rosterId]?.performanceScore ?? "",
    panchayat_en: r.panchayatNameEn, panchayat_hi: r.panchayatNameHi,
    block: r.block, pref_index: r.prefIndex ?? "",
  }));
  downloadFile("allocation-results.csv", toCSV(rows, cols));
}
