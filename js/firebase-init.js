/* ============================================================
   firebase-init.js — Initialises Firebase and exposes a small
   data-access layer (DAL) used by the rest of the app.

   Data model (self-registration by name + mobile):
     roster/{rosterId}          public read   { nameEn,nameHi,school,block }
     teachers_private/{rosterId} admin only    { performanceScore }
     claims/{mobile}            public read    { rosterId }  (mobile uniqueness)
     submissions/{rosterId}     admin read     { name, post, mobile, present…, preferences[5] }
     results/{rosterId}         public-when-published
     config/app                 public read    { submissionsOpen, resultsPublished, … }

   Uses the Firebase v10 modular SDK from the gstatic CDN — no build step.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc,
  collection, writeBatch, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig, isConfigured } from "./firebase-config.js";

export { isConfigured };

let app = null, auth = null, db = null;
if (isConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}
export { app, auth, db };

/* ---------------- Auth ---------------- */
export function onAdminAuth(cb) { return auth ? onAuthStateChanged(auth, cb) : () => {}; }
export function adminLogin(email, password) { return signInWithEmailAndPassword(auth, email, password); }
export function adminLogout() { return signOut(auth); }

/* ---------------- Collections ---------------- */
const C = {
  config: "config",
  panchayats: "panchayats",
  roster: "roster",
  private: "teachers_private",
  claims: "claims",
  submissions: "submissions",
  results: "results",
};
const CONFIG_DOC = "app";

/* ---------------- Helpers ---------------- */
// Stable id derived from a teacher's identity, so re-importing the same
// roster updates rows instead of creating duplicates.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function slug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
}
export function rosterIdFor(nameEn, nameHi, school) {
  const base = slug(nameEn || nameHi) || "t";
  return `${base}-${djb2(`${nameEn || ""}|${nameHi || ""}|${school || ""}`)}`;
}

/* ---------------- Config ---------------- */
export async function getConfig() {
  const snap = await getDoc(doc(db, C.config, CONFIG_DOC));
  return snap.exists() ? snap.data() : { submissionsOpen: false, resultsPublished: false };
}
export async function setConfig(patch) {
  await setDoc(doc(db, C.config, CONFIG_DOC), patch, { merge: true });
}

/* ---------------- Panchayats ---------------- */
export async function listPanchayats() {
  const snap = await getDocs(collection(db, C.panchayats));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function savePanchayat(p) {
  const id = p.id || crypto.randomUUID();
  const data = {
    nameEn: p.nameEn || "", nameHi: p.nameHi || "",
    block: p.block || "", capacity: Math.max(1, parseInt(p.capacity, 10) || 1),
  };
  await setDoc(doc(db, C.panchayats, id), data, { merge: true });
  return { id, ...data };
}
export async function deletePanchayat(id) { await deleteDoc(doc(db, C.panchayats, id)); }
export async function bulkSavePanchayats(rows) {
  const batch = writeBatch(db);
  for (const p of rows) {
    batch.set(doc(db, C.panchayats, p.id || crypto.randomUUID()), {
      nameEn: p.nameEn || "", nameHi: p.nameHi || "",
      block: p.block || "", capacity: Math.max(1, parseInt(p.capacity, 10) || 1),
    }, { merge: true });
  }
  await batch.commit();
}

/* ---------------- Teacher roster ---------------- */
/** Public: names only (no scores) — used to build the name dropdown. */
export async function listRoster() {
  const snap = await getDocs(collection(db, C.roster));
  return snap.docs.map((d) => ({ rosterId: d.id, ...d.data() }));
}
/** Admin: roster joined with private performance scores. */
export async function listTeachers() {
  const [rosterSnap, privSnap] = await Promise.all([
    getDocs(collection(db, C.roster)),
    getDocs(collection(db, C.private)),
  ]);
  const priv = {};
  privSnap.docs.forEach((d) => (priv[d.id] = d.data()));
  return rosterSnap.docs.map((d) => ({
    rosterId: d.id, ...d.data(),
    performanceScore: priv[d.id]?.performanceScore ?? 0,
  }));
}
export async function saveTeacher(tch) {
  const id = tch.rosterId || rosterIdFor(tch.nameEn, tch.nameHi, tch.school);
  await setDoc(doc(db, C.roster, id), {
    nameEn: tch.nameEn || "", nameHi: tch.nameHi || "",
    school: tch.school || "", block: tch.block || "",
  }, { merge: true });
  await setDoc(doc(db, C.private, id), {
    performanceScore: Number(tch.performanceScore) || 0,
  }, { merge: true });
  return id;
}
export async function deleteTeacher(id) {
  await Promise.all([deleteDoc(doc(db, C.roster, id)), deleteDoc(doc(db, C.private, id))]);
}
export async function bulkSaveTeachers(rows) {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const tch of rows.slice(i, i + CHUNK)) {
      if (!tch.nameEn && !tch.nameHi) continue;
      const id = rosterIdFor(tch.nameEn, tch.nameHi, tch.school);
      batch.set(doc(db, C.roster, id), {
        nameEn: tch.nameEn || "", nameHi: tch.nameHi || "",
        school: tch.school || "", block: tch.block || "",
      }, { merge: true });
      batch.set(doc(db, C.private, id), {
        performanceScore: Number(tch.performanceScore) || 0,
      }, { merge: true });
    }
    await batch.commit();
  }
}

/* ---------------- Registration (public submit) ---------------- */
export async function isMobileUsed(mobile) {
  const snap = await getDoc(doc(db, C.claims, String(mobile).trim()));
  return snap.exists();
}
/**
 * Atomically create the submission + the mobile claim. The security rules
 * allow CREATE only (never public update), so this throws if the teacher
 * has already registered (submissions/{rosterId} exists) or the mobile is
 * already used (claims/{mobile} exists).
 */
export async function submitRegistration(reg) {
  const id = reg.rosterId;
  const mobile = String(reg.mobile).trim();
  const batch = writeBatch(db);
  batch.set(doc(db, C.submissions, id), {
    rosterId: id,
    nameEn: reg.nameEn || "", nameHi: reg.nameHi || "",
    post: reg.post || "",
    mobile,
    presentBlock: reg.presentBlock || "",
    presentPanchayat: reg.presentPanchayat || "",
    preferences: reg.preferences,
    submittedAt: serverTimestamp(),
  });
  batch.set(doc(db, C.claims, mobile), { rosterId: id, createdAt: serverTimestamp() });
  await batch.commit();
}

/* ---------------- Submissions (admin) ---------------- */
export async function listSubmissions() {
  const snap = await getDocs(collection(db, C.submissions));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
/** Admin: remove a registration so the teacher can submit again. */
export async function deleteSubmission(rosterId, mobile) {
  const ops = [deleteDoc(doc(db, C.submissions, rosterId))];
  if (mobile) ops.push(deleteDoc(doc(db, C.claims, String(mobile).trim())));
  await Promise.all(ops);
}

/* ---------------- Results ---------------- */
export async function publishResults(resultRows) {
  const CHUNK = 400;
  for (let i = 0; i < resultRows.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const r of resultRows.slice(i, i + CHUNK)) {
      batch.set(doc(db, C.results, r.rosterId), {
        rosterId: r.rosterId,
        nameEn: r.nameEn || "", nameHi: r.nameHi || "",
        panchayatId: r.panchayatId || "",
        panchayatNameEn: r.panchayatNameEn || "",
        panchayatNameHi: r.panchayatNameHi || "",
        block: r.block || "",
        prefIndex: r.prefIndex ?? null,
        allocated: !!r.panchayatId,
      });
    }
    await batch.commit();
  }
}
export async function getResultByRoster(rosterId) {
  const snap = await getDoc(doc(db, C.results, String(rosterId).trim()));
  return snap.exists() ? snap.data() : null;
}
export async function listResults() {
  const snap = await getDocs(collection(db, C.results));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function clearResults() {
  const snap = await getDocs(collection(db, C.results));
  const CHUNK = 400;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
