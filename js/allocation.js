/* ============================================================
   allocation.js — Pure allocation engine (no Firebase, no DOM).

   Algorithm: teacher-proposing DEFERRED ACCEPTANCE (Gale–Shapley).
   - Teachers "propose" to panchayats down their preference list.
   - Each panchayat tentatively holds its highest-PRIORITY proposers
     up to its capacity and rejects the rest, who then propose to
     their next preference.
   - PRIORITY = performance score (higher is better). Exact ties are
     broken by a value drawn from a SEEDED random generator, so the
     same seed always yields the same result (reproducible & auditable).

   Because every panchayat ranks teachers the same way (by performance),
   this is provably equivalent to a performance-priority serial
   dictatorship — but written as deferred acceptance so it stays correct
   even if per-panchayat priorities are introduced later.

   This module is deliberately framework-free so it can be unit-tested
   and reasoned about on its own.
   ============================================================ */

/* ---------- Seeded RNG (mulberry32) + string seed hashing ---------- */
function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) return seed >>> 0;
  const str = String(seed ?? "");
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Run the allocation.
 *
 * @param {Array<{teacherId:string, performanceScore:number}>} teachers
 * @param {Array<{id:string, capacity:number}>} panchayats
 * @param {Object<string, string[]>} submissions  teacherId -> [panchayatId,...]
 * @param {number|string} seed
 * @returns {{
 *   assignments: Object<string,{panchayatId:string, prefIndex:number}>,
 *   byPanchayat: Object<string, string[]>,
 *   unassigned: string[],          // submitted but got none of their prefs
 *   noSubmission: string[],        // teachers who never submitted
 *   freeSeats: Object<string,number>,
 *   seed: number
 * }}
 */
export function runAllocation(teachers, panchayats, submissions, seed) {
  const seedNum = hashSeed(seed);
  const rng = mulberry32(seedNum);

  const capacity = {};
  const validPanchayat = new Set();
  for (const p of panchayats) {
    capacity[p.id] = Math.max(1, parseInt(p.capacity, 10) || 1);
    validPanchayat.add(p.id);
  }

  // Build teacher state. A random tiebreak is assigned in a STABLE order
  // (sorted by teacherId) so the RNG sequence is deterministic regardless
  // of input ordering.
  const sortedTeachers = [...teachers].sort((a, b) =>
    String(a.teacherId).localeCompare(String(b.teacherId)),
  );

  const state = new Map();      // teacherId -> { score, tiebreak, prefs, ptr }
  const noSubmission = [];

  for (const t of sortedTeachers) {
    const id = String(t.teacherId);
    const tiebreak = rng(); // consume RNG for every teacher → stable & reproducible
    const rawPrefs = submissions[id];
    if (!Array.isArray(rawPrefs) || rawPrefs.length === 0) {
      noSubmission.push(id);
      continue;
    }
    // Keep only valid panchayats, dedupe, but remember original 1-based rank.
    const seen = new Set();
    const prefs = [];
    rawPrefs.forEach((pid, idx) => {
      if (pid && validPanchayat.has(pid) && !seen.has(pid)) {
        seen.add(pid);
        prefs.push({ pid, prefIndex: idx + 1 });
      }
    });
    state.set(id, {
      score: Number(t.performanceScore) || 0,
      tiebreak,
      prefs,
      ptr: 0,
    });
  }

  // Higher score wins; on a tie, smaller tiebreak wins.
  const isBetter = (a, b) =>
    a.score !== b.score ? a.score > b.score : a.tiebreak < b.tiebreak;

  const held = {};          // panchayatId -> [teacherId, ...]
  for (const p of panchayats) held[p.id] = [];

  const queue = [...state.keys()];
  const assignments = {};   // teacherId -> { panchayatId, prefIndex }
  const unassigned = [];

  while (queue.length) {
    const id = queue.shift();
    const st = state.get(id);

    if (st.ptr >= st.prefs.length) { unassigned.push(id); continue; }

    const choice = st.prefs[st.ptr];
    st.ptr += 1;
    const pid = choice.pid;

    assignments[id] = { panchayatId: pid, prefIndex: choice.prefIndex };
    held[pid].push(id);

    if (held[pid].length > capacity[pid]) {
      // Evict the lowest-priority teacher currently held here.
      let worst = held[pid][0];
      for (const cand of held[pid]) {
        const sw = state.get(worst), sc = state.get(cand);
        if (isBetter({ score: sw.score, tiebreak: sw.tiebreak },
                     { score: sc.score, tiebreak: sc.tiebreak })) {
          worst = cand;
        }
      }
      held[pid] = held[pid].filter((x) => x !== worst);
      delete assignments[worst];
      queue.push(worst); // rejected teacher proposes to its next preference
    }
  }

  const byPanchayat = {};
  const freeSeats = {};
  for (const p of panchayats) {
    byPanchayat[p.id] = [...held[p.id]];
    freeSeats[p.id] = capacity[p.id] - held[p.id].length;
  }

  return { assignments, byPanchayat, unassigned, noSubmission, freeSeats, seed: seedNum };
}
