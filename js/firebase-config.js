/* ============================================================
   firebase-config.js — YOUR Firebase project settings.
   ------------------------------------------------------------
   1. Create a free Firebase project at https://console.firebase.google.com
   2. Add a Web App (</>) to it.
   3. Copy the "firebaseConfig" object Firebase shows you and paste
      the values below, replacing every "PASTE_..." placeholder.
   4. See README.md for the full step-by-step guide.

   NOTE: These values are NOT secret — Firebase web config is meant
   to be public. Your data is protected by the Firestore security
   rules in firestore.rules and by Admin authentication, NOT by
   hiding these keys.
   ============================================================ */

export const firebaseConfig = {
  apiKey: "AIzaSyBK7aKg4A_SJ2lBgwFa5U3pn7ilSfJhQH8",
  authDomain: "saharsa-teacher-allocation.firebaseapp.com",
  projectId: "saharsa-teacher-allocation",
  storageBucket: "saharsa-teacher-allocation.firebasestorage.app",
  messagingSenderId: "874393243165",
  appId: "1:874393243165:web:0ec689865cefdc2c07c0f4",
};

/** Returns true once the placeholders above have been replaced. */
export function isConfigured() {
  return (
    !!firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("PASTE_") &&
    !!firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("PASTE_")
  );
}
