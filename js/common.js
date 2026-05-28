/* ============================================================
   common.js — Shared UI + utility helpers.
   ============================================================ */
import { applyI18n, initLangToggle, t } from "./i18n.js";
import { isConfigured } from "./firebase-config.js";

/** The 10 blocks (prakhand) of Saharsa district (official panchayat list order). */
export const SAHARSA_BLOCKS = [
  "Kahra", "Sour Bazar", "Sonbarsa", "Sattar Kataiya", "Nauhatta",
  "Mahishi", "Patarghat", "Simri Bakhtiyarpur", "Salkhua", "Banma",
];

/** Show a modal popup with a title + message (strings already localised). */
export function showModal(title, message) {
  let overlay = document.getElementById("app-modal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "app-modal";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
        <h3 id="app-modal-title"></h3>
        <p id="app-modal-body"></p>
        <div class="btn-row" style="justify-content:flex-end">
          <button class="btn" id="app-modal-ok"></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.classList.remove("show");
    overlay.querySelector("#app-modal-ok").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  overlay.querySelector("#app-modal-title").textContent = title;
  overlay.querySelector("#app-modal-body").textContent = message;
  overlay.querySelector("#app-modal-ok").textContent = t("ok");
  overlay.classList.add("show");
  overlay.querySelector("#app-modal-ok").focus();
}

/** Initialise page chrome: language toggle, i18n, active nav link, year. */
export function initChrome(activeNav) {
  initLangToggle();          // also applies i18n once
  if (activeNav) {
    document.querySelectorAll(".site-nav a").forEach((a) => {
      if (a.dataset.nav === activeNav) a.setAttribute("aria-current", "page");
    });
  }
  const y = document.getElementById("footer-year");
  if (y) y.textContent = new Date().getFullYear();
  // Re-apply i18n whenever language changes (dynamic content handled per-page)
  document.addEventListener("langchange", () => applyI18n(document));
}

/** If Firebase isn't configured, show a setup notice and return false. */
export function requireConfig(containerEl) {
  if (isConfigured()) return true;
  if (containerEl) {
    containerEl.innerHTML = `
      <div class="card">
        <div class="msg warn">
          <strong data-i18n="not_configured_title"></strong>
          <p data-i18n="not_configured_body" style="margin:8px 0 0"></p>
        </div>
      </div>`;
    applyI18n(containerEl);
  }
  return false;
}

/* ---------------- Messages ---------------- */
export function showMsg(el, type, text) {
  if (!el) return;
  el.className = `msg ${type}`;
  el.textContent = text;
  el.classList.remove("hidden");
}
export function clearMsg(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

/* ---------------- HTML safety ---------------- */
export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ---------------- CSV ----------------
   Minimal RFC-4180-ish parser: handles quoted fields, escaped quotes,
   commas and newlines inside quotes. Returns array of objects keyed by
   the (lower-cased, trimmed) header row.
------------------------------------------------------------------- */
export function parseCSV(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  // Normalise line endings, strip BOM
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); field = ""; row = []; }
      else if (ch === "\r") { /* ignore */ }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].length === 1 && rows[r][0].trim() === "") continue; // blank line
    const obj = {};
    headers.forEach((h, c) => { obj[h] = (rows[r][c] ?? "").trim(); });
    out.push(obj);
  }
  return out;
}

export function toCSV(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.key)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

export function downloadFile(filename, content, mime = "text/csv;charset=utf-8") {
  // Prepend BOM so Excel reads Hindi (UTF-8) correctly.
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read a File object as text (for CSV import). */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}

/** Human-friendly access code, e.g. "K7P2-9QXM". Avoids ambiguous chars. */
export function randomCode(groups = 2, size = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
  const buf = new Uint32Array(groups * size);
  crypto.getRandomValues(buf);
  const parts = [];
  let k = 0;
  for (let g = 0; g < groups; g++) {
    let s = "";
    for (let i = 0; i < size; i++) s += alphabet[buf[k++] % alphabet.length];
    parts.push(s);
  }
  return parts.join("-");
}

/** Toggle a button into a loading state with a spinner. */
export function setLoading(btn, loading, labelKey) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset._label = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t(labelKey))}`;
  } else {
    btn.disabled = false;
    if (btn.dataset._label) btn.innerHTML = btn.dataset._label;
  }
}
