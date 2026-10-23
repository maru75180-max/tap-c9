import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Tap C9 — Dark Mode / Neon Blue
const SUPABASE_URL = "https://hhjgmnasanywweomljgn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x7JOQuB15Osgo2TpxbvBDg_PTI1m6kK";
const STORAGE_BUCKET = "client-photos";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);

let profiles = [];
let selectedProfileId = null;
let toastTimer;

const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[ch]));

function webUrl(value) {
  if (!value) return "";
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

function phoneHref(value) {
  return value ? `tel:${String(value).replace(/[^\d+*#]/g, "")}` : "";
}

function smsHref(value) {
  return value ? `sms:${String(value).replace(/[^\d+*#]/g, "")}` : "";
}

function mapHref(address) {
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "";
}

function setStatus(id, message, error = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = error ? "#ff8a9a" : "#56e7ff";
}

function notify(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

function icon(name) {
  const paths = {
    contact: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.1 10.4a16 16 0 0 0 6 6l1.9-1.9a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 2.2 2.5Z"/>',
    sms: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/>',
    map: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    facebook: '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    tiktok: '<path d="M14 3v11.2a4.2 4.2 0 1 1-4-4.2M14 3c.6 3.2 2.5 5 6 5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.globe}</svg>`;
}

function initials(name) {
  return String(name || "Tap C9")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function actionButton(label, href, iconName, extra = "") {
  if (!href) return "";

  const external = href.startsWith("https://") || href.startsWith("http://");

  return `<a class="action-button ${extra}"
    href="${safe(href)}"
    ${external ? 'target="_blank" rel="noopener noreferrer"' : ""}>
    ${icon(iconName)}
    <span>${safe(label)}</span>
    <span class="action-arrow" aria-hidden="true">›</span>
  </a>`;
}

function socialButton(label, href, iconName, extra = "") {
  if (!href) return "";

  return `<a class="social-button ${extra}"
    href="${safe(href)}"
    target="_blank" rel="noopener noreferrer">
    ${icon(iconName)}
    <span>${safe(label)}</span>
  </a>`;
}

function cardHtml(p) {
  const photo = webUrl(p.photo_url);
  const profileUrl = `./?p=${encodeURIComponent(p.slug)}`;

  return `
    <article class="client-card">
      <div class="client-photo">
        ${photo
          ? `<img src="${safe(photo)}" alt="${safe(p.full_name)}" loading="lazy">`
          : `<span>${safe(initials(p.full_name))}</span>`}
      </div>
      <div class="client-card-body">
        <span class="eyebrow">${safe(p.category || "DIGITAL BUSINESS CARD")}</span>
        <h3>${safe(p.full_name)}</h3>
        <div class="role">${safe([p.job_title, p.company].filter(Boolean).join(" · "))}</div>
        <p>${safe(p.bio || "Connect with this business professional.")}</p>
        <div class="card-links">
          <a class="view-profile-link"
             href="${profileUrl}"
             target="_blank"
             rel="noopener noreferrer">
            View Profile <span>↗</span>
          </a>
        </div>
      </div>
    </article>`;
}

function downloadVCard(p) {
  const clean = value => String(value || "").replace(/[\r\n]/g, " ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${clean(p.full_name)}`
  ];

  if (p.company) lines.push(`ORG:${clean(p.company)}`);
  if (p.job_title) lines.push(`TITLE:${clean(p.job_title)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${clean(p.phone)}`);
  if (p.email) lines.push(`EMAIL:${clean(p.email)}`);
  if (p.address) lines.push(`ADR;TYPE=WORK:;;${clean(p.address)}`);
  if (p.website_url) lines.push(`URL:${clean(p.website_url)}`);

  lines.push("END:VCARD");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/vcard;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${clean(p.full_name || "contact").replace(/[^a-z0-9_-]+/gi, "-")}.vcf`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderProfilePage(p) {
  document.body.classList.add("profile-mode");
  document.title = `${p.full_name} | Tap C9`;

  const grid = $("profile-grid");
  const photo = webUrl(p.photo_url);
  const role = [p.job_title, p.company].filter(Boolean).join(" · ");

  const profileImage = photo
    ? `<img class="profile-hero-photo" src="${safe(photo)}" alt="${safe(p.full_name)}">`
    : `<div class="profile-hero-placeholder">${safe(initials(p.full_name))}</div>`;

  const messenger = webUrl(p.messenger_url) ||
    (webUrl(p.facebook_url) ? p.facebook_url : "");

  const quick = [
    actionButton("Save Contact", "#save-contact", "contact", "save-contact-action"),
    actionButton("Call", phoneHref(p.phone), "phone"),
    actionButton("Text / SMS", smsHref(p.phone), "sms"),
    actionButton("Send Email", p.email ? `mailto:${p.email}` : "", "mail"),
    actionButton("Messenger", messenger, "chat"),
    actionButton("Google Maps", mapHref(p.address), "map", "maps-action")
  ].filter(Boolean).join("");

  const social = [
    socialButton("Facebook", webUrl(p.facebook_url), "facebook", "facebook"),
    socialButton("Instagram", webUrl(p.instagram_url), "instagram", "instagram"),
    socialButton("TikTok", webUrl(p.tiktok_url), "tiktok", "tiktok"),
    socialButton("Website", webUrl(p.website_url), "globe", "website")
  ].filter(Boolean).join("");

  const contactDetails = [
    p.phone
      ? `<div class="detail-row"><span class="detail-label">PHONE</span><a href="${safe(phoneHref(p.phone))}">${safe(p.phone)}</a></div>`
      : "",
    p.email
      ? `<div class="detail-row"><span class="detail-label">EMAIL</span><a href="mailto:${safe(p.email)}">${safe(p.email)}</a></div>`
      : "",
    p.address
      ? `<div class="detail-row"><span class="detail-label">LOCATION</span><a href="${safe(mapHref(p.address))}" target="_blank" rel="noopener noreferrer">${safe(p.address)}</a></div>`
      : ""
  ].filter(Boolean).join("");

  grid.innerHTML = `
    <div class="profile-page-wrap">
      <a class="back-directory" href="./">← Back to directory</a>

      <article class="digital-card">
        <div class="digital-card-top">
          <div class="brand-mark">
            <span class="brand-orb">C9</span>
            <span>Tap C9</span>
          </div>
          <span class="digital-label">DIGITAL BUSINESS CARD</span>
        </div>

        <div class="profile-hero">
          ${profileImage}
          <div class="profile-orbit"></div>
        </div>

        <div class="profile-intro">
          <span class="profile-category">${safe(p.category || "BUSINESS PROFILE")}</span>
          <h1>${safe(p.full_name)}</h1>
          ${role ? `<p class="profile-role">${safe(role)}</p>` : ""}
          ${p.bio ? `<p class="profile-bio">${safe(p.bio)}</p>` : ""}
        </div>

        ${contactDetails
          ? `<section class="contact-details">${contactDetails}</section>`
          : ""}

        ${quick
          ? `<section class="profile-section">
               <h2><span class="section-icon">✦</span> QUICK ACTIONS</h2>
               <div class="quick-actions">${quick}</div>
             </section>`
          : ""}

        ${social
          ? `<section class="profile-section social-section">
               <h2><span class="section-icon">↗</span> SOCIAL MEDIA &amp; LINKS</h2>
               <div class="social-grid">${social}</div>
             </section>`
          : ""}

        <footer class="digital-card-footer">
          TAP C9 <span>•</span> DIGITAL BUSINESS CARD
        </footer>
      </article>
    </div>`;

  grid.querySelector(".save-contact-action")?.addEventListener("click", event => {
    event.preventDefault();
    downloadVCard(p);
  });
}

function renderDirectory() {
  document.body.classList.remove("profile-mode");
  document.title = "Tap C9 | Digital Business Cards";

  const search = $("directory-search")?.value.trim().toLowerCase() || "";

  const filtered = profiles.filter(p =>
    p.is_published &&
    [p.full_name, p.company, p.category, p.job_title, p.bio]
      .some(value => String(value || "").toLowerCase().includes(search))
  );

  $("profile-grid").innerHTML = filtered.length
    ? filtered.map(cardHtml).join("")
    : `<div class="empty-state">
         <span class="empty-orb">C9</span>
         <h3>No profiles found</h3>
         <p>Try another search, or check back soon.</p>
       </div>`;
}

async function loadPublicProfiles() {
  const grid = $("profile-grid");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get("p");

  grid.innerHTML = `<div class="loading-state">
    <span class="loader"></span>
    <p>Loading ${slug ? "business card" : "profiles"}…</p>
  </div>`;

  if (slug) {
    document.body.classList.add("profile-mode");

    const wantsPreview = params.get("preview") === "1";
    let profile = null;
    let error = null;

    if (wantsPreview) {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const result = await supabase
          .from("client_profiles")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        profile = result.data;
        error = result.error;
      }
    }

    if (!profile) {
      const result = await supabase
        .from("client_profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      profile = result.data;
      error = result.error;
    }

    if (error || !profile) {
      grid.innerHTML = `<div class="profile-error">
        <h2>Profile unavailable</h2>
        <p>This profile may not exist or may not be published yet.</p>
        <a class="back-directory" href="./">← Back to directory</a>
      </div>`;
      return;
    }

    renderProfilePage(profile);
    return;
  }

  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("is_published", true)
    .order("full_name");

  if (error) {
    console.error(error);
    grid.innerHTML = `<div class="empty-state">
      <h3>Couldn't load profiles</h3>
      <p>Check your Supabase table, public SELECT policy, and connection settings.</p>
    </div>`;
    return;
  }

  profiles = data || [];
  renderDirectory();
}

/* ADMIN */
function resetEditor() {
  selectedProfileId = null;
  $("profile-form")?.reset();

  if ($("profile-id")) $("profile-id").value = "";
  if ($("editor-heading")) $("editor-heading").textContent = "Create profile";
  if ($("delete-profile")) $("delete-profile").hidden = true;

  setStatus("admin-status", "");
  renderAdminList();
}

function fillEditor(p) {
  selectedProfileId = p.id;

  if ($("profile-id")) $("profile-id").value = p.id;

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

  if ($("profile-published")) $("profile-published").checked = !!p.is_published;
  if ($("editor-heading")) $("editor-heading").textContent = "Edit profile";
  if ($("delete-profile")) $("delete-profile").hidden = false;

  setStatus("admin-status", "");
  renderAdminList();
}

function renderAdminList() {
  const list = $("admin-profile-list");
  if (!list) return;

  list.innerHTML = profiles.length
    ? profiles.map(p => `
        <button type="button"
          class="admin-profile-item ${String(p.id) === String(selectedProfileId) ? "active" : ""}"
          data-id="${safe(p.id)}">
          <strong>${safe(p.full_name)}</strong>
          <small>${p.is_published ? "Published" : "Draft"} · /${safe(p.slug)}</small>
        </button>`).join("")
    : `<p class="muted">No profiles yet. Create your first profile.</p>`;

  list.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = profiles.find(item => String(item.id) === btn.dataset.id);
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

async function uploadPhotoIfSelected() {
  const input = $("p-photo-file");
  const file = input?.files?.[0];

  if (!file) return $("p-photo")?.value.trim() || null;

  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be 5 MB or smaller.");
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}. Check Storage policies.`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  $("p-photo").value = data.publicUrl;
  input.value = "";

  return data.publicUrl;
}

function collectForm(photoUrl) {
  const value = id => $(id)?.value.trim() || "";
  const slug = value("p-slug").toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens.");
  }

  for (const id of ["p-facebook", "p-instagram", "p-tiktok", "p-website"]) {
    const link = value(id);
    if (link && !webUrl(link)) {
      throw new Error("Social and website links must start with https:// or http://.");
    }
  }

  const photo = photoUrl || value("p-photo");
  if (photo && !webUrl(photo)) {
    throw new Error("Photo URL must start with https:// or http://.");
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
    photo_url: photo || null,
    is_published: !!$("profile-published")?.checked
  };
}

function showDashboard(session) {
  if ($("auth-panel")) $("auth-panel").hidden = !!session;
  if ($("dashboard-panel")) $("dashboard-panel").hidden = !session;

  if (session && $("signed-in-label")) {
    $("signed-in-label").textContent = `Signed in: ${session.user.email}`;
  }
}

async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession();
  showDashboard(session);
  if (session) await loadAdminProfiles();
}

function setupAdmin() {
  $("admin-open")?.addEventListener("click", async () => {
    $("admin-dialog")?.showModal();
    await restoreSession();
  });

  $("admin-close")?.addEventListener("click", () => $("admin-dialog")?.close());

  $("login-form")?.addEventListener("submit", async event => {
    event.preventDefault();
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

  $("logout-button")?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return notify(error.message);

    profiles = [];
    showDashboard(null);
    resetEditor();
    await loadPublicProfiles();
    notify("Signed out.");
  });

  $("new-profile-button")?.addEventListener("click", resetEditor);

  $("profile-form")?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      setStatus("admin-status", "Uploading photo and saving…");

      const photoUrl = await uploadPhotoIfSelected();
      const payload = collectForm(photoUrl);

      const query = selectedProfileId
        ? supabase.from("client_profiles").update(payload).eq("id", selectedProfileId).select().single()
        : supabase.from("client_profiles").insert(payload).select().single();

      const { data, error } = await query;
      if (error) throw error;

      selectedProfileId = data.id;
      await loadAdminProfiles();
      fillEditor(data);

      setStatus("admin-status", "Saved successfully.");
      notify("Profile saved.");
    } catch (error) {
      setStatus("admin-status", error.message || "Could not save profile.", true);
    }
  });

  $("delete-profile")?.addEventListener("click", async () => {
    if (!selectedProfileId || !confirm("Delete this profile permanently? This cannot be undone.")) return;

    const { error } = await supabase
      .from("client_profiles")
      .delete()
      .eq("id", selectedProfileId);

    if (error) return setStatus("admin-status", error.message, true);

    resetEditor();
    await loadAdminProfiles();
    notify("Profile deleted.");
  });

  $("preview-profile")?.addEventListener("click", () => {
    const slug = $("p-slug")?.value.trim();

    if (!slug) {
      return setStatus("admin-status", "Enter a profile slug first.", true);
    }

    window.open(`./?p=${encodeURIComponent(slug)}&preview=1`, "_blank", "noopener,noreferrer");
  });

  $("search-button")?.addEventListener("click", renderDirectory);
  $("directory-search")?.addEventListener("input", renderDirectory);

  supabase.auth.onAuthStateChange((_event, session) => showDashboard(session));
}

if ($("year")) $("year").textContent = new Date().getFullYear();

setupAdmin();
loadPublicProfiles();
