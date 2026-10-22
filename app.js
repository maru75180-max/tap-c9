import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
  CONFIGURATION:
  1) Replace the two placeholders below with your Supabase Project URL and publishable key.
  2) These browser-side values are intended to be public.
  NEVER paste a service_role key, secret key, database password, or admin password here.
*/
const SUPABASE_URL = "https://hhjgmnasanywweomljgn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x7JOQuB15Osgo2TpxbvBDg_PTI1m6kK";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const $ = id => document.getElementById(id);
let profiles = [];
let selectedProfileId = null;
let toastTimer;

$("year").textContent = new Date().getFullYear();

function notify(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}
function setStatus(id, message, error = false) {
  const el = $(id); el.textContent = message; el.style.color = error ? "#b42318" : "#087443";
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function validWebUrl(value) {
  if (!value) return "";
  try { const u = new URL(value); return ["https:","http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; }
}
function makeMapUrl(address) {
  return address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address) : "";
}
function phoneLink(phone) { return phone ? "tel:" + phone.replace(/[^\d+*#]/g, "") : ""; }
function waLink(number) { const digits = (number || "").replace(/\D/g, ""); return digits ? "https://wa.me/" + digits : ""; }
function linksFor(p) {
  return [
    ["Call", phoneLink(p.phone)], ["Email", p.email ? "mailto:" + p.email : ""],
    ["WhatsApp", waLink(p.whatsapp)], ["Facebook", validWebUrl(p.facebook_url)],
    ["Instagram", validWebUrl(p.instagram_url)], ["TikTok", validWebUrl(p.tiktok_url)],
    ["Website", validWebUrl(p.website_url)], ["Directions", makeMapUrl(p.address)]
  ].filter(item => item[1]);
}
function cardHtml(p) {
  const photo = validWebUrl(p.photo_url);
  const initials = (p.full_name || "C9").split(/\s+/).map(x => x[0]).slice(0,2).join("").toUpperCase();
  const url = "./?p=" + encodeURIComponent(p.slug);
  return `<article class="client-card">
    <div class="client-photo">${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.full_name)}" loading="lazy" referrerpolicy="no-referrer">` : `<span>${escapeHtml(initials)}</span>`}</div>
    <div class="client-card-body"><h3>${escapeHtml(p.full_name)}</h3>
    <div class="role">${escapeHtml([p.job_title,p.company].filter(Boolean).join(" · "))}</div>
    <p>${escapeHtml(p.bio || p.category || "Connect with this business professional.")}</p>
    <div class="card-links"><a href="${url}">View profile</a>${linksFor(p).slice(0,3).map(([label,href]) => `<a href="${escapeHtml(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label)}</a>`).join("")}</div></div></article>`;
}
function renderProfiles() {
  const requestedSlug = new URLSearchParams(location.search).get("p");
  const search = $("directory-search").value.trim().toLowerCase();
  const published = profiles.filter(p => p.is_published);
  if (requestedSlug) {
    const p = published.find(item => item.slug === requestedSlug);
    if (p) {
      document.title = `${p.full_name} | Tap C9`;
      $("profile-grid").innerHTML = `<div class="public-profile-view">${cardHtml(p)}<p class="muted">This is the public profile. Use the contact buttons to connect.</p></div>`;
      return;
    }
  }
  document.title = "Tap C9 | Digital Business Cards";
  const filtered = published.filter(p => [p.full_name,p.company,p.category,p.job_title,p.bio].some(v => (v || "").toLowerCase().includes(search)));
  $("profile-grid").innerHTML = filtered.length ? filtered.map(cardHtml).join("") :
    `<div class="empty-state">${configured ? "No published profiles found. Try another search." : "Connect Supabase to load your published client profiles. See README.md."}</div>`;
}
async function loadPublicProfiles() {
  if (!supabase) { renderProfiles(); return; }
  const { data, error } = await supabase.from("client_profiles").select("*").eq("is_published", true).order("full_name");
  if (error) { console.error(error); $("profile-grid").innerHTML = `<div class="empty-state">Profiles could not load. Check the Supabase URL, key, SQL setup, and RLS policies.</div>`; return; }
  profiles = data || []; renderProfiles();
}
function resetEditor() {
  selectedProfileId = null; $("profile-form").reset(); $("profile-id").value = "";
  $("editor-heading").textContent = "Create profile"; $("delete-profile").hidden = true;
  setStatus("admin-status", ""); renderAdminList();
}
function fillEditor(p) {
  selectedProfileId = p.id; $("profile-id").value = p.id;
  const fields = {
    "p-name":p.full_name, "p-title":p.job_title, "p-company":p.company, "p-category":p.category,
    "p-slug":p.slug, "p-phone":p.phone, "p-email":p.email, "p-whatsapp":p.whatsapp,
    "p-facebook":p.facebook_url, "p-instagram":p.instagram_url, "p-tiktok":p.tiktok_url,
    "p-website":p.website_url, "p-address":p.address, "p-bio":p.bio, "p-photo":p.photo_url
  };
  Object.entries(fields).forEach(([id,value]) => $(id).value = value || "");
  $("profile-published").checked = !!p.is_published; $("editor-heading").textContent = "Edit profile";
  $("delete-profile").hidden = false; setStatus("admin-status", ""); renderAdminList();
}
function renderAdminList() {
  $("admin-profile-list").innerHTML = profiles.length ? profiles.map(p =>
    `<button type="button" class="admin-profile-item ${p.id === selectedProfileId ? "active" : ""}" data-id="${escapeHtml(p.id)}"><strong>${escapeHtml(p.full_name)}</strong><small>${p.is_published ? "Published" : "Draft"} · /${escapeHtml(p.slug)}</small></button>`
  ).join("") : `<p class="muted">No profiles yet. Create your first profile.</p>`;
  $("admin-profile-list").querySelectorAll("[data-id]").forEach(btn => btn.addEventListener("click", () => {
    const p = profiles.find(item => item.id === btn.dataset.id); if (p) fillEditor(p);
  }));
}
async function loadAdminProfiles() {
  const { data, error } = await supabase.from("client_profiles").select("*").order("updated_at", {ascending:false});
  if (error) { setStatus("admin-status", error.message, true); return; }
  profiles = data || []; renderAdminList(); renderProfiles();
}
function collectForm() {
  const value = id => $(id).value.trim();
  const slug = value("p-slug").toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and single hyphens.");
  for (const id of ["p-facebook","p-instagram","p-tiktok","p-website","p-photo"]) {
    const v = value(id); if (v && !validWebUrl(v)) throw new Error("Social, website, and photo URLs must begin with http:// or https://.");
  }
  const email = value("p-email");
  return {
    full_name:value("p-name"), job_title:value("p-title") || null, company:value("p-company") || null,
    category:value("p-category") || null, slug, phone:value("p-phone") || null, email:email || null,
    whatsapp:value("p-whatsapp") || null, facebook_url:value("p-facebook") || null,
    instagram_url:value("p-instagram") || null, tiktok_url:value("p-tiktok") || null,
    website_url:value("p-website") || null, address:value("p-address") || null,
    bio:value("p-bio") || null, photo_url:value("p-photo") || null,
    is_published:$("profile-published").checked
  };
}
function showDashboard(session) {
  $("auth-panel").hidden = !!session; $("dashboard-panel").hidden = !session;
  if (session) { $("signed-in-label").textContent = `Signed in: ${session.user.email}`; }
}
async function restoreSession() {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  showDashboard(session);
  if (session) await loadAdminProfiles();
}
$("admin-open").addEventListener("click", async () => {
  $("admin-dialog").showModal();
  if (!configured) setStatus("auth-status", "First configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in app.js.", true);
  else await restoreSession();
});
$("admin-close").addEventListener("click", () => dialog.close());
$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!supabase) return setStatus("auth-status", "Add your Supabase Project URL and publishable key to app.js first.", true);
  setStatus("auth-status", "Signing in…");
  const { data, error } = await supabase.auth.signInWithPassword({email:$("admin-email").value.trim(), password:$("admin-password").value});
  if (error) return setStatus("auth-status", error.message, true);
  showDashboard(data.session); setStatus("auth-status", ""); await loadAdminProfiles(); notify("Signed in successfully.");
});
$("logout-button").addEventListener("click", async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) return notify(error.message);
  profiles = []; showDashboard(null); resetEditor(); await loadPublicProfiles(); notify("Signed out.");
});
$("new-profile-button").addEventListener("click", resetEditor);
$("profile-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!supabase) return setStatus("admin-status", "Supabase is not configured.", true);
  try {
    const payload = collectForm(); setStatus("admin-status", "Saving…");
    let query;
    if (selectedProfileId) query = supabase.from("client_profiles").update(payload).eq("id", selectedProfileId).select().single();
    else query = supabase.from("client_profiles").insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    selectedProfileId = data.id; await loadAdminProfiles(); fillEditor(data);
    setStatus("admin-status", "Saved. Published changes are now available to clients."); notify("Profile saved.");
  } catch (err) { setStatus("admin-status", err.message || "Could not save profile.", true); }
});
$("delete-profile").addEventListener("click", async () => {
  if (!selectedProfileId || !confirm("Delete this profile permanently? This cannot be undone.")) return;
  const { error } = await supabase.from("client_profiles").delete().eq("id", selectedProfileId);
  if (error) return setStatus("admin-status", error.message, true);
  resetEditor(); await loadAdminProfiles(); notify("Profile deleted.");
});
$("preview-profile").addEventListener("click", () => {
  const slug = $("p-slug").value.trim();
  if (!slug) return setStatus("admin-status", "Enter a profile slug first.", true);
  window.open("./?p=" + encodeURIComponent(slug), "_blank", "noopener");
});
$("search-button").addEventListener("click", renderProfiles);
$("directory-search").addEventListener("input", renderProfiles);
if (!configured) {
  $("profile-grid").innerHTML = `<div class="empty-state">Website design is ready. Add your Supabase URL and publishable key in app.js, then run the SQL in README.md to activate the database and admin features.</div>`;
} else {
  loadPublicProfiles();
  supabase.auth.onAuthStateChange((_event, session) => showDashboard(session));
}
