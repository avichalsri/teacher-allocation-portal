/* ============================================================
   results.js — Public allocation-result lookup (by name).
   Results are readable only when the admin has published them
   (enforced by Firestore security rules).
   ============================================================ */
import { getConfig, listRoster, getResultByRoster } from "./firebase-init.js";
import { t, localName } from "./i18n.js";
import { initChrome, requireConfig, showMsg, clearMsg, escapeHtml, setLoading } from "./common.js";

const $ = (id) => document.getElementById(id);
let roster = [];
let lastResult = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initChrome("results");
  if (!requireConfig($("setup-warn"))) return;

  $("btn-check").addEventListener("click", onCheck);
  document.addEventListener("langchange", () => {
    buildNameSelect();
    if (lastResult) renderResult(lastResult);
  });

  try {
    const cfg = await getConfig();
    if (!cfg.resultsPublished) {
      $("not-published").classList.remove("hidden");
      return;
    }
    roster = [...(await listRoster())].sort((a, b) =>
      localName(a.nameEn, a.nameHi).localeCompare(localName(b.nameEn, b.nameHi)));
    buildNameSelect();
    $("lookup").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    $("not-published").classList.remove("hidden");
  }
}

function buildNameSelect() {
  const sel = $("r-name");
  if (!sel) return;
  const keep = sel.value;
  sel.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = ""; ph.textContent = t("rp_select_name");
  sel.appendChild(ph);
  for (const r of roster) {
    const extra = [r.school, r.block].filter(Boolean).join(", ");
    const o = document.createElement("option");
    o.value = r.rosterId;
    o.textContent = localName(r.nameEn, r.nameHi) + (extra ? ` — ${extra}` : "");
    sel.appendChild(o);
  }
  if (keep) sel.value = keep;
}

async function onCheck() {
  clearMsg($("r-msg"));
  $("result-card").classList.add("hidden");
  const rosterId = $("r-name").value;
  if (!rosterId) { showMsg($("r-msg"), "error", t("rp_select_name")); return; }

  setLoading($("btn-check"), true, "loading");
  try {
    const res = await getResultByRoster(rosterId);
    if (!res) { showMsg($("r-msg"), "error", t("rp_not_found")); return; }
    lastResult = res;
    renderResult(res);
  } catch (err) {
    console.error(err);
    showMsg($("r-msg"), "error", t("rp_not_published_body"));
  } finally {
    setLoading($("btn-check"), false);
  }
}

function renderResult(res) {
  const body = $("result-body");
  const name = localName(res.nameEn, res.nameHi) || res.rosterId;

  if (res.allocated && res.panchayatId) {
    body.innerHTML = `
      <p><strong>${escapeHtml(name)}</strong></p>
      <table class="data" style="max-width:520px"><tbody>
        <tr><th>${t("rp_allocated_to")}</th><td>${escapeHtml(localName(res.panchayatNameEn, res.panchayatNameHi))}</td></tr>
        <tr><th>${t("rp_allocated_block")}</th><td>${escapeHtml(res.block || "—")}</td></tr>
        <tr><th>${t("rp_pref_granted")}</th><td>${res.prefIndex ? "#" + res.prefIndex : "—"}</td></tr>
      </tbody></table>`;
  } else {
    body.innerHTML = `
      <p><strong>${escapeHtml(name)}</strong></p>
      <div class="msg warn" style="margin:0">
        <strong>${t("rp_unallocated_title")}</strong>
        <p style="margin:8px 0 0">${t("rp_unallocated_body")}</p>
      </div>`;
  }
  $("result-card").classList.remove("hidden");
  $("result-card").scrollIntoView({ behavior: "smooth", block: "start" });
}
