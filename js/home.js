/* ============================================================
   home.js — Landing page. Just initialises chrome (lang toggle,
   i18n strings, active-nav link); no Firebase calls needed.
   ============================================================ */
import { initChrome } from "./common.js";

document.addEventListener("DOMContentLoaded", () => initChrome("home"));
