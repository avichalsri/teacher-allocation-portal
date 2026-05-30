/* ============================================================
   home.js — Landing page. Initialises chrome and keeps the
   data-label on placeholder image containers in sync with
   the active language (used by the Saharsa Administration
   photo box if no image is available yet).
   ============================================================ */
import { initChrome } from "./common.js";
import { t } from "./i18n.js";

function updateDataLabels() {
  document.querySelectorAll("[data-label-key]").forEach((el) => {
    el.setAttribute("data-label", t(el.dataset.labelKey));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initChrome("home");
  updateDataLabels();
  document.addEventListener("langchange", updateDataLabels);
});
