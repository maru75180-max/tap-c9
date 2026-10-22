
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://hhjgmnasanywweomljgn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x7JOQuB15Osgo2TpxbvBDg_PTI1m6kK";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);

let profiles = [];
let selectedProfileId = null;
let toastTimer;

$("year").textContent = new Date().getFullYear();

function notify(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

function setStatus(id, message, error = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = error ? "#b42318" : "#087443";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function validWebUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function makeMapUrl(address) {
  return address
    ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)
    : "";
}

function phoneLink(phone) {
  return phone ? "tel:" + phone.replace(/[^\d+*#]/g, "") : "";
}

function waLink(number) {
  const digits = (number || "").replace(/\D/g, "");
  return digits ? "https://wa.me/" + digits : "";
}

function linksFor(p) {
  return [
    ["Call", phoneLink(p.phone)],
    ["Email", p.email ? "mailto:" + p.email : ""],
    ["WhatsApp", waLink(p.whatsapp)],
    ["Facebook", validWebUrl(p.facebook_url)],
    ["Instagram", validWebUrl(p.instagram_url)],
    ["TikTok", validWebUrl(p.tiktok_url)],
    ["Website", validWebUrl(p.website_url)],
    ["Directions", makeMapUrl(p.address)]
  ].filter(item => item[1]);
}

function cardHtml(p) {
  const photo = validWebUrl(p.photo_url);
  const initials = (p.full_name || "C9")
    .split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();

  return `
    <article class="client-card">
      <div class="client-photo">
        ${photo
          ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.full_name)}" loading="lazy">`
          : `<span>${escapeHtml(initials)}</span>`}
      </div>
      <div class="client-card-body">
        <h3>${escapeHtml(p.full_name)}</h3>
        <div class="role">${escapeHtml([p.job_title, p.company].filter(Boolean).join(" · "))}</div>
        <p>${escapeHtml(p.bio || p.category || "Connect with this business professional.")}</p>
        <div class="card-links">
          <a href="./?p=${encodeURIComponent(p.slug)}">View Profile</a>
          ${linksFor(p).slice(0, 3).map(([label, href]) =>
            `<a href="${escapeHtml(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(label)}</a>`
          ).join("")}
        </div>
      </div>
    </article>`;
}

function renderSingleProfile(p, isPreview = false) {
  document.title = `${p.full_name} | Tap C9`;

  const photo = validWebUrl(p.photo_url);
  const initials = (p.full_name || "C9")
    .split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();

  const contactLinks = linksFor(p).map(([label, href]) => `
    <a href="${escapeHtml(href)}"
       ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}
       style="display:inline-flex;padding:10px 14px;background:#edf6ff;color:#0756a8;border-radius:10px;font-weight:750;font-size:13px;">
       ${escapeHtml(label)}
    </a>
  `).join("");

  $("profile-grid").innerHTML = `
    <section class="public-profile-view" style="max-width:760px;margin:0 auto;">
      <p style="margin:0 0 20px;">
        <a href="./" style="color:#0756a8;font-weight:750;">← Back to directory</a>
        ${isPreview ? '<span style="margin-left:12px;color:#b45309;font-size:12px;">Preview mode</span>' : ""}
      </p>

      <article class="client-card">
        <div class="client-photo" style="height:260px;">
          ${photo
            ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.full_name)}">`
            : `<span style="font-size:54px;">${escapeHtml(initials)}</span>`}
        </div>

        <div class="client-card-body" style="padding:28px;">
          <h1 style="font-size:clamp(30px,5vw,44px);letter-spacing:-1.5px;line-height:1.15;">
            ${escapeHtml(p.full_name)}
          </h1>

          <p class="role" style="font-size:15px;margin:10px 0;">
            ${escapeHtml([p.job_title, p.company].filter(Boolean).join(" · "))}
          </p>

          ${p.category ? `<p><strong>Category:</strong> ${escapeHtml(p.category)}</p>` : ""}
          ${p.bio ? `<p style="font-size:15px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(p.bio)}</p>` : ""}
          ${p.address ? `<p><strong>Address</strong><br>${escapeHtml(p.address)}</p>` : ""}

          <div class="card-links" style="gap:10px;margin-top:22px;">
            ${contactLinks || '<span class="muted">No contact links have been added yet.</span>'}
          </div>
        </div>
      </article>
    </section>`;
}

async function renderProfiles() {
  const grid = $("profile-grid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const requestedSlug = params.get("p");
  const previewMode = params.get("preview") === "1";

  if (requestedSlug) {
    grid.innerHTML = `<div class="empty-state">Loading profile…</div>`;

    if (previewMode) {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        grid.innerHTML = `
          <div class="empty-state">
            Preview is only available while signed in.
            <p><a href="./">Back to directory</a></p>
          </div>`;
        return;
      }

      const { data, error } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("slug", requestedSlug)
        .maybeSingle();

      if (error || !data) {
        grid.innerHTML = `
          <div class="empty-state">
            Profile not found, or you do not have permission to preview it.
            <p><a href="./">Back to directory</a></p>
          </div>`;
        return;
      }

      renderSingleProfile(data, true);
      return;
    }

    const { data, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("slug", requestedSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      document.title = "Profile not found | Tap C9";
      grid.innerHTML = `
        <div class="empty-state">
          This profile could not be found or has not been published.
          <p><a href="./">Back to directory</a></p>
        </div>`;
      return;
    }

    renderSingleProfile(data);
    return;
  }

  document.title = "Tap C9 | Digital Business Cards";
  grid.innerHTML = `<div class="empty-state">Loading profiles…</div>`;

  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("is_published", true)
    .order("full_name");

  if (error) {
    console.error(error);
    grid.innerHTML = `<div class="empty-state">Profiles could not load. Check your Supabase database and RLS policies.</div>`;
    return;
  }

  profiles = data || [];

  const search = $("directory-search").value.trim().toLowerCase();
  const filtered = profiles.filter(p =>
    [p.full_name, p.company, p.category, p.job_title, p.bio]
      .some(v => (v || "").toLowerCase().includes(search))
  );

  grid.innerHTML = filtered.length
    ? filtered.map(cardHtml).join("")
    : `<div class="empty-state">No published profiles found. Try another search.</div>`;
}

async function uploadProfilePhoto() {
  const file = $("p-photo-file")?.files?.[0];

  if (!file) return $("p-photo").value.trim();

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be 5 MB or smaller.");
  }

  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("client-photos").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) throw error;

  return supabase.storage.from("client-photos").getPublicUrl(path).data.publicUrl;
}

function resetEditor() {
  selectedProfileId = null;
  $("profile-form").reset();
  $("profile-id").value = "";
  $("editor-heading").textContent = "Create profile";
  $("delete-profile").hidden = true;
  setStatus("admin-status", "");
  renderAdminList();
}

function fillEditor(p) {
  selectedProfileId = p.id;
  $("profile-id").value = p.id;

  const fields = {
    "p-name": p.full_name,
    "p-title": p.job_title,
    "p-company": p.company,
    "p-category": p.category,
    "p-slug": p.slug,
    "p-phone": p.phone,
    "p-email": p.email,
    "p-whatsapp": p.whatsapp,
    "p-facebook": p.facebook_url,
    "p-instagram": p.instagram_url,
    "p-tiktok": p.tiktok_url,
    "p-website": p.website_url,
    "p-address": p.address,
    "p-bio": p.bio,
    "p-photo": p.photo_url
  };

  Object.entries(fields).forEach(([id, value]) => {
    if ($(id)) $(id).value = value || "";
  });

  if ($("p-photo-file")) $("p-photo-file").value = "";
  $("profile-published").checked = !!p.is_published;
  $("editor-heading").textContent = "Edit profile";
  $("delete-profile").hidden = false;
  setStatus("admin-status", "");
  renderAdminList();
}

function renderAdminList() {
  $("admin-profile-list").innerHTML = profiles.length
    ? profiles.map(p => `
      <button type="button"
        class="admin-profile-item ${p.id === selectedProfileId ? "active" : ""}"
        data-id="${escapeHtml(p.id)}">
        <strong>${escapeHtml(p.full_name)}</strong>
        <small>${p.is_published ? "Published" : "Draft"} · /${escapeHtml(p.slug)}</small>
      </button>`).join("")
    : `<p class="muted">No profiles yet. Create your first profile.</p>`;

  $("admin-profile-list").querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = profiles.find(item => item.id === btn.dataset.id);
      if (p) fillEditor(p);
    });
  });
}

async function loadAdminProfiles() {
  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    setStatus("admin-status", error.message, true);
    return;
  }

  profiles = data || [];
  renderAdminList();
}

function collectForm() {
  const value = id => $(id).value.trim();
  const slug = value("p-slug").toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens.");
  }

  for (const id of ["p-facebook", "p-instagram", "p-tiktok", "p-website", "p-photo"]) {
    const v = value(id);
    if (v && !validWebUrl(v)) {
      throw new Error("Social, website, and photo URLs must begin with http:// or https://.");
    }
  }

  return {
    full_name: value("p-name"),
    job_title: value("p-title") || null,
    company: value("p-company") || null,
    category: value("p-category") || null,
    slug,
    phone: value("p-phone") || null,
    email: value("p-email") || null,
    whatsapp: value("p-whatsapp") || null,
    facebook_url: value("p-facebook") || null,
    instagram_url: value("p-instagram") || null,
    tiktok_url: value("p-tiktok") || null,
    website_url: value("p-website") || null,
    address: value("p-address") || null,
    bio: value("p-bio") || null,
    photo_url: value("p-photo") || null,
    is_published: $("profile-published").checked
  };
}

function showDashboard(session) {
  $("auth-panel").hidden = !!session;
  $("dashboard-panel").hidden = !session;
  if (session) $("signed-in-label").textContent = `Signed in: ${session.user.email}`;
}

async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession();
  showDashboard(session);
  if (session) await loadAdminProfiles();
}

$("admin-open").addEventListener("click", async () => {
  $("admin-dialog").showModal();
  await restoreSession();
});

$("admin-close").addEventListener("click", () => $("admin-dialog").close());

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  setStatus("auth-status", "Signing in…");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: $("admin-email").value.trim(),
    password: $("admin-password").value
  });

  if (error) return setStatus("auth-status", error.message, true);

  showDashboard(data.session);
  setStatus("auth-status", "");
  await loadAdminProfiles();
  notify("Signed in successfully.");
});

$("logout-button").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return notify(error.message);

  profiles = [];
  showDashboard(null);
  resetEditor();
  notify("Signed out.");
});

$("new-profile-button").addEventListener("click", resetEditor);

$("profile-form").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const payload = collectForm();
    setStatus("admin-status", "Uploading photo and saving profile…");
    payload.photo_url = await uploadProfilePhoto() || null;

    const query = selectedProfileId
      ? supabase.from("client_profiles").update(payload).eq("id", selectedProfileId).select().single()
      : supabase.from("client_profiles").insert(payload).select().single();

    const { data, error } = await query;
    if (error) throw error;

    selectedProfileId = data.id;
    await loadAdminProfiles();
    fillEditor(data);
    setStatus("admin-status", "Profile saved successfully.");
    notify("Profile saved.");
  } catch (err) {
    setStatus("admin-status", err.message || "Could not save profile.", true);
  }
});

$("delete-profile").addEventListener("click", async () => {
  if (!selectedProfileId || !confirm("Delete this profile permanently? This cannot be undone.")) return;

  const { error } = await supabase.from("client_profiles").delete().eq("id", selectedProfileId);
  if (error) return setStatus("admin-status", error.message, true);

  resetEditor();
  await loadAdminProfiles();
  notify("Profile deleted.");
});

$("preview-profile").addEventListener("click", async () => {
  const slug = $("p-slug").value.trim();

  if (!slug) {
    setStatus("admin-status", "Enter a profile slug first.", true);
    return;
  }

  const url = new URL("./", location.href);
  url.searchParams.set("p", slug);
  url.searchParams.set("preview", "1");
  window.open(url.href, "_blank", "noopener,noreferrer");
});

$("search-button").addEventListener("click", () => renderProfiles());
$("directory-search").addEventListener("input", () => renderProfiles());

supabase.auth.onAuthStateChange((_event, session) => showDashboard(session));

const requestedSlug = new URLSearchParams(location.search).get("p");
if (requestedSlug) {
  renderProfiles();
} else {
  renderProfiles();
}
