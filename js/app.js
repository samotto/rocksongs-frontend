/**
 * app.js — Application logic for RockSongs.
 *
 * Manages: state, rendering, search/filter, pagination,
 *          modal, CRUD handlers, and auth UI.
 *
 * All backend calls go through js/api.js.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of songs shown per page. Change this to adjust page size. */
const PAGE_SIZE = 25;

/** API boundary: app.js only talks to api.js through this namespace. */
const api = window.RockSongsApi;

// ─── Application State ────────────────────────────────────────────────────────

const state = {
  /** Full list of songs loaded from the API. */
  songs: [],

  /** Songs that match the current search query. */
  filteredSongs: [],

  /** Current page number (1-based). */
  currentPage: 1,

  /** Current search query string. */
  searchQuery: "",

  /** User-facing catalog load error, or an empty string after a successful load. */
  songsLoadError: "",

  /** Current sort key: artist | song | album. */
  sortKey: "artist",

  /** Current sort direction: asc | desc. */
  sortDirection: "asc",

  /** Currently logged-in user object, or null if logged out. */
  currentUser: null,
  users: [],
  selectedUser: null,
  passwordTargetUser: null,
  lookupLists: [],
  selectedLookupList: null,
  lookupListItems: [],
  selectedLookupListItem: null,
  lookupListCache: new Map(),
  auditResults: null,

  /**
   * Which modal mode is active: "create" | "edit" | "view" | null
   * null means the modal is closed.
   */
  modalMode: null,

  /** The song currently open in the modal (for edit/view). */
  modalSong: null,
};

// ─── DOM References ───────────────────────────────────────────────────────────
// Cached once so we don't query the DOM on every render.

const els = {
  searchInput:    document.getElementById("searchInput"),
  resultSummary:  document.getElementById("resultSummary"),
  songTableBody:  document.getElementById("songTableBody"),
  emptyState:     document.getElementById("emptyState"),
  tableWrapper:   document.querySelector(".table-wrapper"),
  songTable:      document.getElementById("songTable"),
  sortableHeaders: document.querySelectorAll(".song-table thead th[data-sort-key]"),
  pagination:     document.getElementById("pagination"),
  apiModeBadge:   document.getElementById("apiModeBadge"),
  loginOverlay:   document.getElementById("loginOverlay"),
  loginForm:      document.getElementById("loginForm"),
  loginEmail:     document.getElementById("loginEmail"),
  loginPassword:  document.getElementById("loginPassword"),
  loginStatus:    document.getElementById("loginStatus"),
  loginSubmitBtn: document.getElementById("loginSubmitBtn"),
  passwordToggles: document.querySelectorAll("[data-password-toggle]"),
  authSubtitle:  document.getElementById("authSubtitle"),
  showLoginBtn:  document.getElementById("showLoginBtn"),
  showSignupBtn: document.getElementById("showSignupBtn"),
  signupForm:    document.getElementById("signupForm"),
  signupEmail:   document.getElementById("signupEmail"),
  signupConfirmEmail: document.getElementById("signupConfirmEmail"),
  signupPassword: document.getElementById("signupPassword"),
  signupConfirmPassword: document.getElementById("signupConfirmPassword"),
  signupStatus:  document.getElementById("signupStatus"),
  resendVerificationBtn: document.getElementById("resendVerificationBtn"),
  signupSubmitBtn: document.getElementById("signupSubmitBtn"),

  addSongBtn:     document.getElementById("addSongBtn"),
  adminBtn:       document.getElementById("adminBtn"),
  userSettingsBtn: document.getElementById("userSettingsBtn"),
  authIconBtn:    document.getElementById("authIconBtn"),
  catalogView:    document.getElementById("catalogView"),
  adminView:      document.getElementById("adminView"),
  userAdminView:  document.getElementById("userAdminView"),
  backToCatalogBtn: document.getElementById("backToCatalogBtn"),
  manageUsersBtn: document.getElementById("manageUsersBtn"),
  manageListsBtn: document.getElementById("manageListsBtn"),
  manageAuditBtn: document.getElementById("manageAuditBtn"),
  usersBackToAdminBtn: document.getElementById("usersBackToAdminBtn"),
  userTableBody:  document.getElementById("userTableBody"),
  listAdminView: document.getElementById("listAdminView"),
  listsBackToAdminBtn: document.getElementById("listsBackToAdminBtn"),
  lookupListTableBody: document.getElementById("lookupListTableBody"),
  lookupListEmptyState: document.getElementById("lookupListEmptyState"),
  listItemsView: document.getElementById("listItemsView"),
  listItemsTitle: document.getElementById("listItemsTitle"),
  listItemsSubtitle: document.getElementById("listItemsSubtitle"),
  newListItemBtn: document.getElementById("newListItemBtn"),
  itemsBackToListsBtn: document.getElementById("itemsBackToListsBtn"),
  lookupListItemTableBody: document.getElementById("lookupListItemTableBody"),
  lookupListItemEmptyState: document.getElementById("lookupListItemEmptyState"),
  auditAdminView: document.getElementById("auditAdminView"),
  auditBackToAdminBtn: document.getElementById("auditBackToAdminBtn"),
  auditSearchForm: document.getElementById("auditSearchForm"),
  auditDate: document.getElementById("auditDate"),
  auditUserName: document.getElementById("auditUserName"),
  auditUserEmail: document.getElementById("auditUserEmail"),
  auditTableName: document.getElementById("auditTableName"),
  auditSearchBtn: document.getElementById("auditSearchBtn"),
  auditStatus: document.getElementById("auditStatus"),
  auditTable: document.getElementById("auditTable"),
  auditTableBody: document.getElementById("auditTableBody"),
  auditEmptyState: document.getElementById("auditEmptyState"),
  auditPagination: document.getElementById("auditPagination"),
  userModalOverlay: document.getElementById("userModalOverlay"),
  userModalTitle: document.getElementById("userModalTitle"),
  userModalCloseX: document.getElementById("userModalCloseX"),
  userModalCancelBtn: document.getElementById("userModalCancelBtn"),
  userModalSaveBtn: document.getElementById("userModalSaveBtn"),
  userModalDeleteBtn: document.getElementById("userModalDeleteBtn"),
  resetPasswordBtn: document.getElementById("resetPasswordBtn"),
  userFieldId: document.getElementById("userFieldId"),
  userFieldName: document.getElementById("userFieldName"),
  userFieldEmail: document.getElementById("userFieldEmail"),
  userFieldRole: document.getElementById("userFieldRole"),
  userInitials: document.getElementById("userInitials"),
  userDisplayName: document.getElementById("userDisplayName"),
  userEmailDisplay: document.getElementById("userEmailDisplay"),
  passwordResetStatus: document.getElementById("passwordResetStatus"),
  settingsModalOverlay: document.getElementById("settingsModalOverlay"),
  settingsModalTitle: document.getElementById("settingsModalTitle"),
  settingsModalCloseX: document.getElementById("settingsModalCloseX"),
  settingsModalCancelBtn: document.getElementById("settingsModalCancelBtn"),
  settingsSaveBtn: document.getElementById("settingsSaveBtn"),
  settingsName: document.getElementById("settingsName"),
  settingsEmail: document.getElementById("settingsEmail"),
  settingsNewPassword: document.getElementById("settingsNewPassword"),
  settingsConfirmPassword: document.getElementById("settingsConfirmPassword"),
  settingsStatus: document.getElementById("settingsStatus"),
  lookupListModalOverlay: document.getElementById("lookupListModalOverlay"),
  lookupListModalTitle: document.getElementById("lookupListModalTitle"),
  lookupListModalCloseX: document.getElementById("lookupListModalCloseX"),
  lookupListCancelBtn: document.getElementById("lookupListCancelBtn"),
  lookupListSaveBtn: document.getElementById("lookupListSaveBtn"),
  lookupListId: document.getElementById("lookupListId"),
  lookupListName: document.getElementById("lookupListName"),
  lookupListDescription: document.getElementById("lookupListDescription"),
  lookupListSortMode: document.getElementById("lookupListSortMode"),
  lookupListDefaultValue: document.getElementById("lookupListDefaultValue"),
  lookupListDefaultHelp: document.getElementById("lookupListDefaultHelp"),
  lookupListStatus: document.getElementById("lookupListStatus"),
  lookupListItemModalOverlay: document.getElementById("lookupListItemModalOverlay"),
  lookupListItemModalTitle: document.getElementById("lookupListItemModalTitle"),
  lookupListItemModalCloseX: document.getElementById("lookupListItemModalCloseX"),
  lookupListItemCancelBtn: document.getElementById("lookupListItemCancelBtn"),
  lookupListItemSaveBtn: document.getElementById("lookupListItemSaveBtn"),
  deactivateListItemBtn: document.getElementById("deactivateListItemBtn"),
  lookupListItemValue: document.getElementById("lookupListItemValue"),
  lookupListItemText: document.getElementById("lookupListItemText"),
  lookupListItemSequence: document.getElementById("lookupListItemSequence"),
  lookupListItemActive: document.getElementById("lookupListItemActive"),
  lookupListItemStatus: document.getElementById("lookupListItemStatus"),

  modalOverlay:   document.getElementById("modalOverlay"),
  modalTitle:     document.getElementById("modalTitle"),
  songForm:       document.getElementById("songForm"),
  fieldId:        document.getElementById("fieldId"),
  fieldArtist:    document.getElementById("fieldArtist"),
  fieldSong:      document.getElementById("fieldSong"),
  fieldAlbum:     document.getElementById("fieldAlbum"),
  fieldOverplayed: document.getElementById("fieldOverplayed"),
  songAuditDetails: document.getElementById("songAuditDetails"),
  fieldCreateUser: document.getElementById("fieldCreateUser"),
  fieldCreateTime: document.getElementById("fieldCreateTime"),
  fieldUpdateUser: document.getElementById("fieldUpdateUser"),
  fieldUpdateTime: document.getElementById("fieldUpdateTime"),
  modalSaveBtn:   document.getElementById("modalSaveBtn"),
  modalDeleteBtn: document.getElementById("modalDeleteBtn"),
  modalCloseBtn:  document.getElementById("modalCloseBtn"),
  modalCloseX:    document.getElementById("modalCloseX"),

  deleteConfirmOverlay: document.getElementById("deleteConfirmOverlay"),
  deleteConfirmTitle: document.getElementById("deleteConfirmTitle"),
  deleteConfirmText: document.getElementById("deleteConfirmText"),
  deleteConfirmCancelBtn: document.getElementById("deleteConfirmCancelBtn"),
  deleteConfirmOkBtn: document.getElementById("deleteConfirmOkBtn"),
};

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * initApp — Entry point. Called once when the page loads.
 * Wires up events, checks auth, loads songs.
 */
async function initApp() {
  if (!api) {
    console.error("RockSongsApi is unavailable. Ensure js/api.js loads before js/app.js.");
    alert("App failed to start: API layer not found.");
    return;
  }

  updateApiModeBadge();
  wireEvents();
  if (await handleEmailVerificationFromUrl()) return;
  await checkAuthAndUpdateUI();
  if (state.currentUser) {
    hideLoginScreen();
    await loadSongs();
  } else {
    showLoginScreen();
    renderApp();
  }
}

/**
 * updateApiModeBadge — Shows whether app is using mock data or live backend.
 */
function updateApiModeBadge() {
  if (!els.apiModeBadge) return;

  const config = window.RockSongsApiConfig || {};
  const useMock = config.USE_MOCK_API !== false;

  els.apiModeBadge.classList.remove("is-mock", "is-live");

  if (useMock) {
    els.apiModeBadge.textContent = "API: Mock";
    els.apiModeBadge.classList.add("is-mock");
    els.apiModeBadge.title = "Using local mock data";
  } else {
    els.apiModeBadge.textContent = "API: Live";
    els.apiModeBadge.classList.add("is-live");
    els.apiModeBadge.title = `Using live backend: ${config.API_BASE_URL || "(no URL set)"}`;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * checkAuthAndUpdateUI — Asks the API who is logged in,
 * stores the result in state, and refreshes auth-dependent UI.
 */
async function checkAuthAndUpdateUI() {
  try {
    state.currentUser = await api.getCurrentUser();
  } catch {
    state.currentUser = null;
  }
  updateAuthUI();
}

/**
 * updateAuthUI — Shows/hides buttons based on login state.
 * Call this whenever login state changes.
 */
function updateAuthUI() {
  const loggedIn = !!state.currentUser;
  const isAdmin = loggedIn && state.currentUser.role === "Admin";
  els.addSongBtn.style.display  = isAdmin ? "inline-flex" : "none";
  els.adminBtn.style.display = isAdmin ? "inline-flex" : "none";
  els.userSettingsBtn.style.display = loggedIn ? "inline-flex" : "none";
  els.authIconBtn.title = loggedIn ? "Log out" : "Log in";
  els.authIconBtn.setAttribute("aria-label", loggedIn ? "Log out" : "Log in");
  els.authIconBtn.classList.toggle("is-login", !loggedIn);
}

function showLoginScreen() {
  switchAuthMode("login");
  els.loginStatus.textContent = "";
  els.loginPassword.value = "";
  els.loginOverlay.style.display = "flex";
  setTimeout(() => (els.loginEmail.value ? els.loginPassword : els.loginEmail).focus(), 50);
}

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  els.loginForm.style.display = isLogin ? "flex" : "none";
  els.signupForm.style.display = isLogin ? "none" : "flex";
  els.showLoginBtn.classList.toggle("active", isLogin);
  els.showSignupBtn.classList.toggle("active", !isLogin);
  els.showLoginBtn.setAttribute("aria-selected", String(isLogin));
  els.showSignupBtn.setAttribute("aria-selected", String(!isLogin));
  els.authSubtitle.textContent = isLogin
    ? "Log in to open the Rock Song Catalog."
    : "Create an account to start exploring the catalog.";
  els.loginStatus.textContent = "";
  els.signupStatus.textContent = "";
  els.signupStatus.classList.add("is-error");
  els.resendVerificationBtn.style.display = "none";
  setTimeout(() => {
    if (isLogin) (els.loginEmail.value ? els.loginPassword : els.loginEmail).focus();
    else els.signupEmail.focus();
  }, 25);
}

function hideLoginScreen() {
  els.loginOverlay.style.display = "none";
  els.loginStatus.textContent = "";
  els.loginPassword.value = "";
}

function resetCatalogSearch() {
  state.searchQuery = "";
  state.currentPage = 1;
  els.searchInput.value = "";
  state.auditResults = null;
  els.auditDate.value = "";
  els.auditUserName.value = "";
  els.auditUserEmail.value = "";
  els.auditTableName.value = "";
  els.auditStatus.textContent = "";
  els.auditTableBody.innerHTML = "";
  els.auditPagination.innerHTML = "";
}

async function handleLogin(event) {
  event.preventDefault();
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;
  if (!email || !password) {
    els.loginStatus.textContent = "Enter your email and password.";
    return;
  }

  els.loginSubmitBtn.disabled = true;
  els.loginSubmitBtn.textContent = "Logging in…";
  els.loginStatus.textContent = "";
  try {
    state.currentUser = await api.login(email, password);
    resetCatalogSearch();
    updateAuthUI();
    hideLoginScreen();
    await loadSongs();
  } catch (error) {
    console.error("Login failed:", error);
    state.currentUser = null;
    updateAuthUI();
    els.loginPassword.value = "";
    els.loginStatus.textContent = error.status === 401
      ? "Incorrect email or password."
      : error.status === 403
        ? (error.detail || "Verify your email address before logging in.")
        : `Could not reach the backend at ${window.RockSongsApiConfig?.API_BASE_URL || "the configured URL"}.`;
    els.loginPassword.focus();
  } finally {
    els.loginSubmitBtn.disabled = false;
    els.loginSubmitBtn.textContent = "Log in";
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const email = els.signupEmail.value.trim();
  const emailConfirmation = els.signupConfirmEmail.value.trim();
  const password = els.signupPassword.value;
  const confirmation = els.signupConfirmPassword.value;
  els.signupStatus.textContent = "";
  els.signupStatus.classList.add("is-error");
  els.resendVerificationBtn.style.display = "none";

  if (!email) {
    els.signupStatus.textContent = "Enter your email address.";
    return;
  }
  if (!emailConfirmation) {
    els.signupStatus.textContent = "Confirm your email address.";
    return;
  }
  if (email.toLowerCase() !== emailConfirmation.toLowerCase()) {
    els.signupStatus.textContent = "Email addresses do not match.";
    return;
  }
  if (password.length < 8 || password.length > 72) {
    els.signupStatus.textContent = "Password must be between 8 and 72 characters.";
    return;
  }
  if (password !== confirmation) {
    els.signupStatus.textContent = "Passwords do not match.";
    return;
  }

  els.signupSubmitBtn.disabled = true;
  els.signupSubmitBtn.textContent = "Creating account…";
  try {
    await api.register(email, password);
    els.signupPassword.value = "";
    els.signupConfirmPassword.value = "";
    els.signupStatus.classList.remove("is-error");
    els.signupStatus.textContent = `We sent a confirmation email to ${email}. Click its button to finish signing up.`;
    els.resendVerificationBtn.style.display = "inline-flex";
  } catch (error) {
    console.error("Sign-up failed:", error);
    els.signupStatus.textContent = error.status === 409
      ? "An account with this email already exists."
      : (error.detail || "Could not create the account. Please try again.");
    if (error.status === 409 || error.status === 502) {
      els.resendVerificationBtn.style.display = "inline-flex";
    }
  } finally {
    els.signupSubmitBtn.disabled = false;
    els.signupSubmitBtn.textContent = "Create account";
  }
}

async function resendSignupVerification() {
  const email = els.signupEmail.value.trim();
  if (!email) {
    els.signupStatus.classList.add("is-error");
    els.signupStatus.textContent = "Enter the email address you used to sign up.";
    return;
  }
  els.resendVerificationBtn.disabled = true;
  els.resendVerificationBtn.textContent = "Sending…";
  try {
    await api.resendVerification(email);
    els.signupStatus.classList.remove("is-error");
    els.signupStatus.textContent = "If that account is pending, a new verification email has been sent.";
  } catch (error) {
    els.signupStatus.classList.add("is-error");
    els.signupStatus.textContent = error.detail || "Could not resend the verification email.";
  } finally {
    els.resendVerificationBtn.disabled = false;
    els.resendVerificationBtn.textContent = "Resend verification email";
  }
}

async function handleEmailVerificationFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("verify_token");
  if (!token) return false;

  showLoginScreen();
  els.loginStatus.textContent = "Confirming your email address…";
  try {
    state.currentUser = await api.verifyEmail(token);
    resetCatalogSearch();
    url.searchParams.delete("verify_token");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    updateAuthUI();
    hideLoginScreen();
    await loadSongs();
    return true;
  } catch (error) {
    url.searchParams.delete("verify_token");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    state.currentUser = null;
    updateAuthUI();
    switchAuthMode("login");
    els.loginStatus.textContent = error.detail || "This verification link is invalid or has expired.";
    renderApp();
    return true;
  }
}

const applicationViews = () => [
  els.catalogView,
  els.adminView,
  els.userAdminView,
  els.listAdminView,
  els.listItemsView,
  els.auditAdminView,
];

function showApplicationView(view) {
  applicationViews().forEach(item => { item.style.display = item === view ? "block" : "none"; });
}

function openAdministration() {
  if (state.currentUser?.role !== "Admin") return;
  showApplicationView(els.adminView);
}

async function getCachedLookupList(listName, forceRefresh = false) {
  const cacheKey = listName.trim().toLowerCase();
  if (!forceRefresh && state.lookupListCache.has(cacheKey)) return state.lookupListCache.get(cacheKey);
  const lookupList = await api.getLookupList(listName);
  state.lookupListCache.set(cacheKey, lookupList);
  return lookupList;
}

/**
 * populateLookupSelect — Generic reusable dropdown loader.
 * The backend supplies both the visible text and the requested ordering.
 */
async function populateLookupSelect(selectElement, listName, options = {}) {
  const { selectedValue = "", placeholder = "", forceRefresh = false, useDefault = true } = options;
  selectElement.disabled = true;
  selectElement.innerHTML = placeholder
    ? `<option value="">${escapeHtml(placeholder)}</option>`
    : "";
  try {
    const lookupList = await getCachedLookupList(listName, forceRefresh);
    lookupList.items.forEach(item => {
      const option = document.createElement("option");
      option.value = item.list_item_value;
      option.textContent = item.list_item_text;
      selectElement.appendChild(option);
    });
    const effectiveValue = selectedValue || (useDefault ? lookupList.default_item_value || "" : "");
    if (effectiveValue && !lookupList.items.some(item => item.list_item_value === effectiveValue)) {
      const retained = document.createElement("option");
      retained.value = effectiveValue;
      retained.textContent = `${effectiveValue} (inactive)`;
      selectElement.appendChild(retained);
    }
    selectElement.value = effectiveValue;
    selectElement.disabled = false;
    return lookupList;
  } catch (error) {
    selectElement.innerHTML = "";
    if (selectedValue) {
      const fallback = document.createElement("option");
      fallback.value = selectedValue;
      fallback.textContent = selectedValue;
      selectElement.appendChild(fallback);
      selectElement.value = selectedValue;
    }
    selectElement.disabled = false;
    throw error;
  }
}

async function openUserAdministration() {
  if (!state.currentUser || state.currentUser.role !== "Admin") return;
  els.manageUsersBtn.disabled = true;
  try {
    state.users = await api.getUsers();
    renderUsers();
    showApplicationView(els.userAdminView);
  } catch (error) {
    console.error("Failed to load users:", error);
    if (error.status === 401) {
      state.currentUser = null;
      updateAuthUI();
      showLoginScreen();
    } else {
      alert(error.detail || "Could not load User Administration. Please try again.");
    }
  } finally {
    els.manageUsersBtn.disabled = false;
  }
}

function renderUsers() {
  els.userTableBody.innerHTML = "";
  state.users.forEach(user => {
    const row = document.createElement("tr");
    const role = user.role || "Basic";
    const roleClass = `role-${role.toLowerCase()}`;
    row.innerHTML = `<td><strong>${escapeHtml(user.name || "")}</strong></td><td>${escapeHtml(user.email)}</td><td><span class="role-badge ${roleClass}">${escapeHtml(role)}</span></td><td>${escapeHtml(user.lastLogin || "Never")}</td>`;
    row.addEventListener("click", () => openUserModal(user.id));
    els.userTableBody.appendChild(row);
  });
}

async function openUserModal(userId) {
  const user = state.users.find(item => String(item.id) === String(userId));
  if (!user) return;
  state.selectedUser = user;
  els.userModalTitle.textContent = `[${user.id}] User Information`;
  els.userFieldId.value = user.id;
  els.userFieldName.value = user.name;
  els.userFieldEmail.value = user.email;
  els.userFieldRole.innerHTML = '<option value="">Loading roles…</option>';
  els.userFieldRole.disabled = true;
  els.userDisplayName.textContent = user.name;
  els.userEmailDisplay.textContent = user.email;
  els.userInitials.textContent = user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
  els.passwordResetStatus.textContent = "";
  const isCurrentUser = String(user.id) === String(state.currentUser.id);
  els.userModalDeleteBtn.style.display = isCurrentUser ? "none" : "inline-flex";
  els.userModalOverlay.style.display = "flex";
  try {
    await populateLookupSelect(els.userFieldRole, "Role", { selectedValue: user.role || "Basic" });
  } catch (error) {
    console.error("Could not load Role lookup list:", error);
    els.passwordResetStatus.textContent = error.detail || "Could not load the Role list.";
    els.passwordResetStatus.classList.add("is-error");
  }
  setTimeout(() => els.userFieldName.focus(), 50);
}

function closeUserModal() {
  state.selectedUser = null;
  els.userModalOverlay.style.display = "none";
  els.passwordResetStatus.textContent = "";
}

async function saveUser() {
  const name = els.userFieldName.value.trim();
  const email = els.userFieldEmail.value.trim();
  if (!name || !email) return alert("Name and email are required.");
  els.userModalSaveBtn.disabled = true;
  els.passwordResetStatus.textContent = "";
  els.passwordResetStatus.classList.remove("is-error");
  try {
    const updatedUser = await api.updateUser(els.userFieldId.value, {
      name,
      email,
      role: els.userFieldRole.value,
    });
    if (String(updatedUser.id) === String(state.currentUser.id)) {
      state.currentUser = { ...state.currentUser, ...updatedUser };
      updateAuthUI();
    }
    state.users = await api.getUsers();
    renderUsers();
    closeUserModal();
    if (state.currentUser.role !== "Admin") {
      showApplicationView(els.catalogView);
    }
  } catch (error) {
    console.error("User update failed:", error);
    els.passwordResetStatus.textContent = error.status === 409
      ? (error.detail || "That name or email is already in use.")
      : (error.detail || "Could not save the user. Please try again.");
    els.passwordResetStatus.classList.add("is-error");
  } finally {
    els.userModalSaveBtn.disabled = false;
  }
}

async function resetSelectedUserPassword() {
  if (!state.selectedUser) return;
  const targetUser = state.selectedUser;
  closeUserModal();
  openUserSettings(targetUser);
}

async function deleteSelectedUser() {
  if (!state.selectedUser || state.currentUser?.role !== "Admin") return;
  const targetUser = state.selectedUser;
  if (String(targetUser.id) === String(state.currentUser.id)) return;

  const label = `user "${targetUser.name || targetUser.email}" (${targetUser.email})`;
  const confirmed = await confirmDeleteWarning(label, "User");
  if (!confirmed) return;

  els.userModalDeleteBtn.disabled = true;
  els.passwordResetStatus.textContent = "";
  els.passwordResetStatus.classList.remove("is-error");
  try {
    await api.deleteUser(targetUser.id);
    state.users = await api.getUsers();
    renderUsers();
    closeUserModal();
  } catch (error) {
    console.error("User deletion failed:", error);
    els.passwordResetStatus.textContent = error.detail || "Could not delete the user. Please try again.";
    els.passwordResetStatus.classList.add("is-error");
  } finally {
    els.userModalDeleteBtn.disabled = false;
  }
}

function openUserSettings(user = state.currentUser) {
  if (!user) return;
  state.passwordTargetUser = user;
  const isCurrentUser = String(user.id) === String(state.currentUser?.id);
  els.settingsModalTitle.textContent = isCurrentUser ? "User Settings" : "Reset User Password";
  els.settingsName.value = user.name || "";
  els.settingsEmail.value = user.email || "";
  els.settingsName.readOnly = !isCurrentUser;
  els.settingsEmail.readOnly = !isCurrentUser;
  els.settingsNewPassword.value = "";
  els.settingsConfirmPassword.value = "";
  els.settingsStatus.textContent = "";
  els.settingsStatus.classList.remove("is-error");
  els.settingsSaveBtn.textContent = isCurrentUser ? "Save changes" : "Update password";
  els.settingsModalOverlay.style.display = "flex";
  setTimeout(() => (isCurrentUser ? els.settingsName : els.settingsNewPassword).focus(), 50);
}

function closeUserSettings() {
  state.passwordTargetUser = null;
  els.settingsModalOverlay.style.display = "none";
  els.settingsNewPassword.value = "";
  els.settingsConfirmPassword.value = "";
  els.settingsStatus.textContent = "";
}

async function saveUserSettings() {
  if (!state.passwordTargetUser) return;
  const isCurrentUser = String(state.passwordTargetUser.id) === String(state.currentUser?.id);
  const name = els.settingsName.value.trim();
  const email = els.settingsEmail.value.trim();
  const password = els.settingsNewPassword.value;
  const confirmation = els.settingsConfirmPassword.value;
  const changingPassword = password.length > 0 || confirmation.length > 0;
  els.settingsStatus.classList.remove("is-error");

  if (isCurrentUser && (!name || !email)) {
    els.settingsStatus.textContent = "Name and email are required.";
    els.settingsStatus.classList.add("is-error");
    return;
  }
  if (!isCurrentUser && !changingPassword) {
    els.settingsStatus.textContent = "Enter a new password.";
    els.settingsStatus.classList.add("is-error");
    return;
  }
  if (changingPassword && (password.length < 8 || password.length > 72)) {
    els.settingsStatus.textContent = "Password must be between 8 and 72 characters.";
    els.settingsStatus.classList.add("is-error");
    return;
  }
  if (changingPassword && password !== confirmation) {
    els.settingsStatus.textContent = "Passwords do not match.";
    els.settingsStatus.classList.add("is-error");
    return;
  }

  const defaultButtonText = isCurrentUser ? "Save changes" : "Update password";
  els.settingsSaveBtn.disabled = true;
  els.settingsSaveBtn.textContent = "Saving…";
  try {
    if (isCurrentUser) {
      const updatedUser = await api.updateCurrentUser({ name, email });
      state.currentUser = { ...state.currentUser, ...updatedUser };
      state.users = state.users.map(user => String(user.id) === String(updatedUser.id)
        ? { ...user, ...updatedUser }
        : user);
      updateAuthUI();
      renderUsers();
    }
    if (changingPassword) {
      await api.resetUserPassword(state.passwordTargetUser.id, password);
    }
    els.settingsNewPassword.value = "";
    els.settingsConfirmPassword.value = "";
    els.settingsStatus.textContent = changingPassword
      ? (isCurrentUser ? "Settings and password updated." : "Password updated.")
      : "Settings updated.";
  } catch (error) {
    console.error("User settings update failed:", error);
    els.settingsStatus.textContent = error.status === 409
      ? (error.detail || "That name or email is already in use.")
      : (error.detail || "Could not update the user settings. Please try again.");
    els.settingsStatus.classList.add("is-error");
  } finally {
    els.settingsSaveBtn.disabled = false;
    els.settingsSaveBtn.textContent = defaultButtonText;
  }
}

// ─── Lightweight Audit Administration ──────────────────────────────────────

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function openAuditAdministration() {
  if (state.currentUser?.role !== "Admin") return;
  els.manageAuditBtn.disabled = true;
  els.auditStatus.textContent = "";
  if (!els.auditDate.value) els.auditDate.value = localDateValue();
  try {
    await populateLookupSelect(els.auditTableName, "DBTables", {
      selectedValue: els.auditTableName.value,
      placeholder: "All tables",
      useDefault: false,
    });
    showApplicationView(els.auditAdminView);
    await searchAuditEntries(1);
  } catch (error) {
    console.error("Failed to open audit administration:", error);
    els.auditStatus.textContent = error.detail || "Could not load the audit search.";
    els.auditStatus.classList.add("is-error");
    showApplicationView(els.auditAdminView);
  } finally {
    els.manageAuditBtn.disabled = false;
  }
}

async function searchAuditEntries(page = 1) {
  if (!els.auditDate.value) {
    els.auditStatus.textContent = "Select a date.";
    els.auditStatus.classList.add("is-error");
    return;
  }
  els.auditSearchBtn.disabled = true;
  els.auditSearchBtn.textContent = "Searching…";
  els.auditStatus.textContent = "";
  els.auditStatus.classList.remove("is-error");
  try {
    state.auditResults = await api.searchAuditEntries({
      date: els.auditDate.value,
      userName: els.auditUserName.value.trim(),
      userEmail: els.auditUserEmail.value.trim(),
      tableName: els.auditTableName.value,
      page,
    });
    renderAuditResults();
  } catch (error) {
    console.error("Audit search failed:", error);
    state.auditResults = null;
    renderAuditResults();
    els.auditStatus.textContent = error.detail || "Could not search audit activity.";
    els.auditStatus.classList.add("is-error");
  } finally {
    els.auditSearchBtn.disabled = false;
    els.auditSearchBtn.textContent = "Search";
  }
}

function formatAuditActivityTime(value, timezoneName) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return String(value || "");
  return timestamp.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: timezoneName || undefined,
  });
}

function renderAuditResults() {
  const result = state.auditResults;
  const items = result?.items || [];
  els.auditTableBody.innerHTML = "";
  els.auditTable.style.display = items.length ? "" : "none";
  els.auditEmptyState.style.display = items.length ? "none" : "block";
  if (result) {
    els.auditStatus.textContent = `${result.total} ${result.total === 1 ? "entry" : "entries"} · ${result.timezone}`;
  }
  items.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(formatAuditActivityTime(entry.activity_time, result.timezone))}</td>
      <td><strong>${escapeHtml(entry.user_name)}</strong><small class="audit-user-email">${escapeHtml(entry.user_email || "")}</small></td>
      <td><code>${escapeHtml(entry.table_name)}</code></td>
      <td>${escapeHtml(entry.record_id)}</td>
      <td><span class="audit-activity audit-activity--${entry.activity.toLowerCase()}">${escapeHtml(entry.activity)}</span></td>`;
    els.auditTableBody.appendChild(row);
  });
  renderAuditPagination();
}

function renderAuditPagination() {
  const result = state.auditResults;
  els.auditPagination.innerHTML = "";
  if (!result || result.total_pages <= 1) return;
  els.auditPagination.appendChild(makePaginationBtn("← Prev", result.page <= 1, () => {
    searchAuditEntries(result.page - 1);
  }));
  getPageNumbers(result.page, result.total_pages).forEach(page => {
    if (page === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-btn pagination-ellipsis";
      ellipsis.textContent = "…";
      els.auditPagination.appendChild(ellipsis);
      return;
    }
    const button = makePaginationBtn(String(page), false, () => searchAuditEntries(page));
    if (page === result.page) button.classList.add("active");
    els.auditPagination.appendChild(button);
  });
  els.auditPagination.appendChild(makePaginationBtn("Next →", result.page >= result.total_pages, () => {
    searchAuditEntries(result.page + 1);
  }));
}

// ─── Lookup List Administration ─────────────────────────────────────────────

async function openListAdministration() {
  if (state.currentUser?.role !== "Admin") return;
  els.manageListsBtn.disabled = true;
  try {
    state.lookupLists = await api.getLookupLists();
    renderLookupLists();
    showApplicationView(els.listAdminView);
  } catch (error) {
    console.error("Failed to load lookup lists:", error);
    alert(error.detail || "Could not load Lists. Please try again.");
  } finally {
    els.manageListsBtn.disabled = false;
  }
}

function renderLookupLists() {
  els.lookupListTableBody.innerHTML = "";
  els.lookupListEmptyState.style.display = state.lookupLists.length ? "none" : "block";
  state.lookupLists.forEach(lookupList => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(lookupList.list_name)}</strong></td>
      <td>${escapeHtml(lookupList.sort_mode)}</td>
      <td>${escapeHtml(lookupList.default_item_value || "—")}</td>
      <td>${lookupList.active ? "Yes" : "No"}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-secondary btn-compact" data-action="values">Values</button>
        <button type="button" class="btn btn-secondary btn-compact" data-action="edit">Edit</button>
      </td>`;
    row.querySelector('[data-action="values"]').addEventListener("click", () => openLookupListItems(lookupList.id));
    row.querySelector('[data-action="edit"]').addEventListener("click", () => openLookupListModal(lookupList));
    els.lookupListTableBody.appendChild(row);
  });
}

async function openLookupListModal(lookupList) {
  if (!lookupList) return;
  state.selectedLookupList = lookupList;
  els.lookupListModalTitle.textContent = `[${lookupList.id}] List Information`;
  els.lookupListId.value = lookupList.id;
  els.lookupListName.value = lookupList.list_name;
  els.lookupListDescription.value = lookupList.description || "";
  els.lookupListSortMode.value = lookupList.sort_mode;
  els.lookupListDefaultValue.innerHTML = '<option value="">No default</option>';
  els.lookupListDefaultValue.disabled = true;
  els.lookupListDefaultHelp.textContent = "Loading list values…";
  els.lookupListStatus.textContent = "";
  els.lookupListStatus.classList.remove("is-error");
  els.lookupListModalOverlay.style.display = "flex";
  try {
    const items = await api.getLookupListItems(lookupList.id);
    items.filter(item => item.active).forEach(item => {
      const option = document.createElement("option");
      option.value = item.list_item_value;
      option.textContent = item.list_item_text;
      els.lookupListDefaultValue.appendChild(option);
    });
    els.lookupListDefaultValue.value = lookupList.default_item_value || "";
    els.lookupListDefaultValue.disabled = false;
    els.lookupListDefaultHelp.textContent = "Used when a form has no existing selection.";
  } catch (error) {
    els.lookupListDefaultHelp.textContent = "Could not load values for this list.";
    showLookupListError(error.detail || "Could not load the default values.");
  }
  setTimeout(() => els.lookupListName.focus(), 50);
}

function closeLookupListModal() {
  state.selectedLookupList = null;
  els.lookupListModalOverlay.style.display = "none";
}

function invalidateLookupCache(...listNames) {
  listNames.filter(Boolean).forEach(name => state.lookupListCache.delete(name.trim().toLowerCase()));
}

async function saveLookupList() {
  const listName = els.lookupListName.value.trim();
  if (!listName) return showLookupListError("List name is required.");
  const payload = {
    list_name: listName,
    description: els.lookupListDescription.value.trim() || null,
    sort_mode: els.lookupListSortMode.value,
    default_item_value: els.lookupListDefaultValue.value || null,
    active: state.selectedLookupList.active,
  };
  const previousName = state.selectedLookupList?.list_name;
  els.lookupListSaveBtn.disabled = true;
  try {
    await api.updateLookupList(state.selectedLookupList.id, payload);
    invalidateLookupCache(previousName, listName);
    state.lookupLists = await api.getLookupLists();
    renderLookupLists();
    closeLookupListModal();
  } catch (error) {
    showLookupListError(error.detail || "Could not save the list.");
  } finally {
    els.lookupListSaveBtn.disabled = false;
  }
}

function showLookupListError(message) {
  els.lookupListStatus.textContent = message;
  els.lookupListStatus.classList.add("is-error");
}

async function openLookupListItems(listId) {
  const lookupList = state.lookupLists.find(item => String(item.id) === String(listId));
  if (!lookupList) return;
  state.selectedLookupList = lookupList;
  try {
    state.lookupListItems = await api.getLookupListItems(listId);
    els.listItemsTitle.textContent = `[${lookupList.id}] ${lookupList.list_name} Values`;
    els.listItemsSubtitle.textContent = lookupList.sort_mode === "Sequence"
      ? "Values are displayed by sequence number."
      : "Values are displayed alphabetically by text.";
    renderLookupListItems();
    showApplicationView(els.listItemsView);
  } catch (error) {
    alert(error.detail || "Could not load list values.");
  }
}

function renderLookupListItems() {
  els.lookupListItemTableBody.innerHTML = "";
  els.lookupListItemEmptyState.style.display = state.lookupListItems.length ? "none" : "block";
  state.lookupListItems.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(item.list_item_value)}</strong></td>
      <td>${escapeHtml(item.list_item_text)}</td>
      <td>${item.sequence ?? ""}</td>
      <td>${item.active ? "Yes" : "No"}</td>
      <td class="table-actions"><button type="button" class="btn btn-secondary btn-compact">Edit</button></td>`;
    row.querySelector("button").addEventListener("click", () => openLookupListItemModal(item));
    els.lookupListItemTableBody.appendChild(row);
  });
}

function openLookupListItemModal(item = null) {
  if (!state.selectedLookupList) return;
  state.selectedLookupListItem = item;
  const creating = !item;
  els.lookupListItemModalTitle.textContent = creating
    ? `New ${state.selectedLookupList.list_name} Value`
    : `${state.selectedLookupList.list_name}: ${item.list_item_value}`;
  els.lookupListItemValue.value = item?.list_item_value || "";
  els.lookupListItemValue.readOnly = !creating;
  els.lookupListItemText.value = item?.list_item_text || "";
  els.lookupListItemSequence.value = item?.sequence ?? "";
  els.lookupListItemSequence.required = state.selectedLookupList.sort_mode === "Sequence";
  els.lookupListItemActive.checked = item?.active ?? true;
  els.deactivateListItemBtn.style.display = creating || !item.active ? "none" : "inline-flex";
  els.lookupListItemStatus.textContent = "";
  els.lookupListItemStatus.classList.remove("is-error");
  els.lookupListItemModalOverlay.style.display = "flex";
  setTimeout(() => (creating ? els.lookupListItemValue : els.lookupListItemText).focus(), 50);
}

function closeLookupListItemModal() {
  state.selectedLookupListItem = null;
  els.lookupListItemModalOverlay.style.display = "none";
}

function showLookupListItemError(message) {
  els.lookupListItemStatus.textContent = message;
  els.lookupListItemStatus.classList.add("is-error");
}

async function saveLookupListItem() {
  const lookupList = state.selectedLookupList;
  if (!lookupList) return;
  const itemValue = els.lookupListItemValue.value.trim();
  const itemText = els.lookupListItemText.value.trim();
  const sequence = els.lookupListItemSequence.value === "" ? null : Number(els.lookupListItemSequence.value);
  if (!itemValue || !itemText) return showLookupListItemError("Value and text are required.");
  if (lookupList.sort_mode === "Sequence" && (!Number.isInteger(sequence) || sequence < 0)) {
    return showLookupListItemError("A sequence number of zero or greater is required for this list.");
  }
  const payload = { list_item_text: itemText, sequence, active: els.lookupListItemActive.checked };
  els.lookupListItemSaveBtn.disabled = true;
  try {
    if (state.selectedLookupListItem) {
      await api.updateLookupListItem(lookupList.id, state.selectedLookupListItem.list_item_value, payload);
    } else {
      await api.createLookupListItem(lookupList.id, { list_item_value: itemValue, ...payload });
    }
    invalidateLookupCache(lookupList.list_name);
    state.lookupListItems = await api.getLookupListItems(lookupList.id);
    renderLookupListItems();
    closeLookupListItemModal();
  } catch (error) {
    showLookupListItemError(error.detail || "Could not save the list value.");
  } finally {
    els.lookupListItemSaveBtn.disabled = false;
  }
}

async function deactivateSelectedLookupListItem() {
  const lookupList = state.selectedLookupList;
  const item = state.selectedLookupListItem;
  if (!lookupList || !item || !confirm(`Deactivate the ${item.list_item_text} value?`)) return;
  els.deactivateListItemBtn.disabled = true;
  try {
    await api.deactivateLookupListItem(lookupList.id, item.list_item_value);
    invalidateLookupCache(lookupList.list_name);
    state.lookupListItems = await api.getLookupListItems(lookupList.id);
    renderLookupListItems();
    closeLookupListItemModal();
  } catch (error) {
    showLookupListItemError(error.detail || "Could not deactivate the list value.");
  } finally {
    els.deactivateListItemBtn.disabled = false;
  }
}

// ─── Data Loading ─────────────────────────────────────────────────────────────

/**
 * loadSongs — Fetch the full song list from the API,
 * then reapply filter and re-render.
 */
async function loadSongs() {
  try {
    state.songs = await api.getSongs();
    state.songsLoadError = "";
  } catch (err) {
    console.error("Failed to load songs:", err);
    state.songs = [];
    state.songsLoadError = err.status === 401
      ? "Your session expired. Please log in again."
      : "Could not load the catalog. Please check your connection and try again.";
  }
  // Reset to page 1 after a full reload.
  state.currentPage = 1;
  renderApp();
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * filterSongs — Applies the current search query to state.songs
 * and stores matches in state.filteredSongs.
 *
 * Matching is case-insensitive partial match against artist and song fields.
 */
function filterSongs() {
  const query = state.searchQuery.trim().toLowerCase();

  if (!query) {
    state.filteredSongs = [...state.songs];
  } else {
    state.filteredSongs = state.songs.filter(s => {
      const artist = (s.artist || "").toLowerCase();
      const song   = (s.song   || "").toLowerCase();
      return artist.includes(query) || song.includes(query);
    });
  }

  sortFilteredSongs();
}

/**
 * sortFilteredSongs — Sorts filtered songs by current sort state.
 * Default order is Artist then Song.
 */
function sortFilteredSongs() {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const direction = state.sortDirection === "asc" ? 1 : -1;

  state.filteredSongs.sort((a, b) => {
    const primary = compareByKey(a, b, state.sortKey, collator) * direction;
    if (primary !== 0) return primary;

    // Tie-breakers keep ordering predictable and preserve Artist+Song intent.
    if (state.sortKey === "artist") {
      return compareByKey(a, b, "song", collator);
    }

    if (state.sortKey === "song") {
      const byArtist = compareByKey(a, b, "artist", collator);
      if (byArtist !== 0) return byArtist;
      return compareByKey(a, b, "album", collator);
    }

    const byArtist = compareByKey(a, b, "artist", collator);
    if (byArtist !== 0) return byArtist;
    return compareByKey(a, b, "song", collator);
  });
}

/**
 * compareByKey — Case-insensitive string comparison for a song field.
 */
function compareByKey(a, b, key, collator) {
  const aValue = String(a[key] || "");
  const bValue = String(b[key] || "");
  return collator.compare(aValue, bValue);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * renderApp — Top-level render. Filters songs, then renders table + pagination.
 * Call this whenever state changes that affects the displayed list.
 */
function renderApp() {
  filterSongs();
  renderSortHeaders();
  renderSongTable();
  renderPagination();
  renderResultSummary();
}

/**
 * renderSortHeaders — Updates sort indicators and ARIA metadata on headers.
 */
function renderSortHeaders() {
  els.sortableHeaders.forEach(header => {
    const key = header.dataset.sortKey;
    const indicator = header.querySelector(".sort-indicator");

    if (key === state.sortKey) {
      header.classList.add("is-sorted");
      header.setAttribute("aria-sort", state.sortDirection === "asc" ? "ascending" : "descending");
      if (indicator) indicator.textContent = state.sortDirection === "asc" ? "▲" : "▼";
    } else {
      header.classList.remove("is-sorted");
      header.setAttribute("aria-sort", "none");
      if (indicator) indicator.textContent = "↕";
    }
  });
}

/**
 * renderResultSummary — Updates the small text showing how many songs matched.
 */
function renderResultSummary() {
  if (state.songsLoadError) {
    els.resultSummary.textContent = state.songsLoadError;
    return;
  }

  const total    = state.songs.length;
  const filtered = state.filteredSongs.length;
  const query    = state.searchQuery.trim();

  if (!query) {
    els.resultSummary.textContent = `${total} song${total !== 1 ? "s" : ""} in catalog`;
  } else {
    els.resultSummary.textContent =
      `${filtered} match${filtered !== 1 ? "es" : ""} for "${query}" (${total} total)`;
  }
}

/**
 * renderSongTable — Renders the current page of filtered songs into the table.
 */
function renderSongTable() {
  const { filteredSongs, currentPage } = state;

  // Calculate slice for the current page.
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex   = startIndex + PAGE_SIZE;
  const pageSongs  = filteredSongs.slice(startIndex, endIndex);

  // Clear existing rows.
  els.songTableBody.innerHTML = "";

  if (pageSongs.length === 0) {
    els.songTable.style.display  = "none";
    els.emptyState.style.display = "block";
    els.emptyState.textContent = state.songsLoadError
      ? state.songsLoadError
      : "No songs match your search.";
    return;
  }

  els.songTable.style.display  = "";
  els.emptyState.style.display = "none";

  // Build one row per song.
  pageSongs.forEach(song => {
    const tr = document.createElement("tr");
    tr.dataset.songId = song.id;
    const canEditSong = state.currentUser?.role === "Admin";
    if (canEditSong) {
      tr.classList.add("is-clickable");
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-label", `Edit ${song.artist} – ${song.song}`);
    }

    const overplayedValue = song.overplayed === "Y"
      ? `<span class="badge-overplayed">Yes</span>`
      : "No";

    tr.innerHTML = `
      <td>${escapeHtml(song.artist)}</td>
      <td>${escapeHtml(song.song)}</td>
      <td>${escapeHtml(song.album || "")}</td>
      <td class="overplayed-column">${overplayedValue}</td>
    `;

    if (canEditSong) {
      tr.addEventListener("click", () => openViewOrEditModal(song.id));
      tr.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openViewOrEditModal(song.id);
        }
      });
    }
    els.songTableBody.appendChild(tr);
  });
}

/**
 * renderPagination — Renders Previous / page numbers / Next controls.
 */
function renderPagination() {
  const totalPages = Math.ceil(state.filteredSongs.length / PAGE_SIZE);
  els.pagination.innerHTML = "";

  // Nothing to paginate.
  if (totalPages <= 1) return;

  // Previous button.
  const prevBtn = makePaginationBtn("← Prev", state.currentPage === 1, () => {
    state.currentPage--;
    renderApp();
    window.scrollTo(0, 0);
  });
  els.pagination.appendChild(prevBtn);

  // Determine which page numbers to show (up to 7 around current).
  const pageNumbers = getPageNumbers(state.currentPage, totalPages);

  pageNumbers.forEach(p => {
    if (p === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-btn";
      ellipsis.textContent = "…";
      ellipsis.style.cursor = "default";
      ellipsis.style.opacity = "0.5";
      els.pagination.appendChild(ellipsis);
    } else {
      const btn = makePaginationBtn(String(p), false, () => {
        state.currentPage = p;
        renderApp();
        window.scrollTo(0, 0);
      });
      if (p === state.currentPage) btn.classList.add("active");
      els.pagination.appendChild(btn);
    }
  });

  // Next button.
  const nextBtn = makePaginationBtn("Next →", state.currentPage === totalPages, () => {
    state.currentPage++;
    renderApp();
    window.scrollTo(0, 0);
  });
  els.pagination.appendChild(nextBtn);
}

/**
 * makePaginationBtn — Creates a single pagination <button> element.
 * @param {string}   label    - Button label text.
 * @param {boolean}  disabled - Whether the button is disabled.
 * @param {function} onClick  - Click handler.
 */
function makePaginationBtn(label, disabled, onClick) {
  const btn = document.createElement("button");
  btn.className = "page-btn";
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}

/**
 * getPageNumbers — Returns an array of page numbers (and "..." ellipses)
 * to display in the pagination bar.
 */
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * openCreateModal — Opens the modal for creating a new song.
 */
function openCreateModal() {
  if (state.currentUser?.role !== "Admin") return;
  state.modalMode = "create";
  state.modalSong = null;

  els.modalTitle.textContent = "New Song";
  clearModalForm();
  setModalFieldsReadOnly(false);

  els.modalSaveBtn.style.display   = "inline-flex";
  els.modalDeleteBtn.style.display = "none";
  els.modalSaveBtn.textContent     = "Create";

  showModal();
}

/**
 * openViewOrEditModal — Opens the modal for viewing or editing a song.
 * If the user is logged in, they get edit + delete buttons.
 * If logged out, the form is read-only.
 *
 * @param {string|number} songId - The id of the song to open.
 */
function openViewOrEditModal(songId) {
  if (state.currentUser?.role !== "Admin") return;
  const song = state.songs.find(s => String(s.id) === String(songId));
  if (!song) return;

  state.modalMode = "edit";
  state.modalSong = song;

  els.modalTitle.textContent = `[${song.id}] Edit ${song.artist} Song`;

  // Populate form fields.
  els.fieldId.value              = song.id;
  els.fieldArtist.value          = song.artist  || "";
  els.fieldSong.value            = song.song    || "";
  els.fieldAlbum.value           = song.album   || "";
  els.fieldOverplayed.checked    = song.overplayed === "Y";
  populateSongAuditDetails(song);

  setModalFieldsReadOnly(false);

  els.modalSaveBtn.style.display   = "inline-flex";
  els.modalDeleteBtn.style.display = "inline-flex";
  els.modalSaveBtn.textContent     = "Update";

  showModal();
  void enrichSongAuditUsers(song.id);
}

/**
 * populateSongAuditDetails — Shows immutable record metadata for an existing song.
 * User ids remain visible even when the user list has not loaded yet.
 */
function populateSongAuditDetails(song) {
  if (!song) {
    els.songAuditDetails.style.display = "none";
    return;
  }

  els.fieldCreateUser.textContent = formatAuditUser(song.create_id ?? song.created_id);
  els.fieldCreateTime.textContent = formatAuditTime(song.create_time ?? song.created_time);
  els.fieldUpdateUser.textContent = formatAuditUser(song.update_id ?? song.updated_id);
  els.fieldUpdateTime.textContent = formatAuditTime(song.update_time ?? song.updated_time);
  els.songAuditDetails.style.display = "block";
}

function formatAuditUser(userId) {
  if (userId === null || userId === undefined || userId === "" || Number(userId) === 0) {
    return "Not recorded";
  }

  const user = state.users.find(item => String(item.id) === String(userId));
  if (!user) return `User ID ${userId}`;
  return `[${user.id}] ${user.name || user.email}`;
}

function formatAuditTime(value) {
  if (!value) return "Not recorded";
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? String(value) : timestamp.toLocaleString();
}

async function enrichSongAuditUsers(songId) {
  if (state.users.length === 0) {
    try {
      state.users = await api.getUsers();
    } catch (error) {
      // The numeric user ids already displayed are still valid audit details.
      console.warn("Could not load user names for song audit details:", error);
      return;
    }
  }

  if (state.modalMode === "edit" && String(state.modalSong?.id) === String(songId)) {
    populateSongAuditDetails(state.modalSong);
  }
}

// openEditModal is an alias used if called directly with a song id.
function openEditModal(songId) {
  openViewOrEditModal(songId);
}

/**
 * closeModal — Hides the modal and resets state.
 */
function closeModal() {
  state.modalMode = null;
  state.modalSong = null;
  els.modalOverlay.style.display = "none";
  clearModalForm();
}

function showModal() {
  els.modalOverlay.style.display = "flex";
  // Focus the first visible text field for accessibility.
  setTimeout(() => els.fieldArtist.focus(), 50);
}

function clearModalForm() {
  els.songForm.reset();
  els.fieldId.value = "";
  els.songAuditDetails.style.display = "none";
  els.fieldCreateUser.textContent = "";
  els.fieldCreateTime.textContent = "";
  els.fieldUpdateUser.textContent = "";
  els.fieldUpdateTime.textContent = "";
}

function setModalFieldsReadOnly(readOnly) {
  [els.fieldArtist, els.fieldSong, els.fieldAlbum].forEach(input => {
    input.readOnly = readOnly;
  });
  els.fieldOverplayed.disabled = readOnly;
}

// ─── CRUD Handlers ────────────────────────────────────────────────────────────

/**
 * handleSaveSong — Called when the Save/Create button in the modal is clicked.
 * Builds a song object from the form, calls the API, reloads songs.
 */
async function handleSaveSong() {
  if (state.currentUser?.role !== "Admin") return;
  const artist = els.fieldArtist.value.trim();
  const song   = els.fieldSong.value.trim();

  if (!artist || !song) {
    alert("Artist and Song fields are required.");
    return;
  }

  // Build the song payload using the full data shape.
  const payload = {
    id:           els.fieldId.value || undefined,
    artist:       artist,
    song:         song,
    album:        els.fieldAlbum.value.trim(),
    overplayed:   els.fieldOverplayed.checked ? "Y" : "N",
    // Fields not in the form — preserved from existing record or left blank.
    year:         state.modalSong?.year         ?? null,
    genre:        state.modalSong?.genre        ?? "",
    notes:        state.modalSong?.notes        ?? "",
    created_time: state.modalSong?.created_time ?? "",
    updated_time: state.modalSong?.updated_time ?? "",
    created_id:   state.modalSong?.created_id   ?? 0,
    updated_id:   state.modalSong?.updated_id   ?? 0,
  };

  els.modalSaveBtn.disabled = true;
  els.modalSaveBtn.textContent = "Saving…";

  try {
    if (state.modalMode === "create") {
      await api.createSong(payload);
    } else {
      await api.updateSong(payload.id, payload);
    }

    closeModal();
    // Always reload from the source of truth after a mutation.
    await loadSongs();
  } catch (err) {
    console.error("Save failed:", err);
    alert("Could not save song. Please try again.");
  } finally {
    els.modalSaveBtn.disabled = false;
    els.modalSaveBtn.textContent = state.modalMode === "create" ? "Create" : "Update";
  }
}

/**
 * handleDeleteSong — Called when the Delete button in the modal is clicked.
 * Confirms with the user, calls the API, reloads songs.
 *
 * @param {string|number} songId - The song id to delete.
 */
async function handleDeleteSong(songId) {
  if (state.currentUser?.role !== "Admin") return;
  const song = state.songs.find(s => String(s.id) === String(songId));
  const name = song ? `"${song.artist} – ${song.song}"` : "this song";

  const confirmed = await confirmDeleteWarning(name);
  if (!confirmed) return;

  els.modalDeleteBtn.disabled = true;
  els.modalDeleteBtn.textContent = "Deleting…";

  try {
    await api.deleteSong(songId);
    closeModal();
    // Reload from source of truth.
    await loadSongs();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Could not delete song. Please try again.");
  } finally {
    els.modalDeleteBtn.disabled = false;
    els.modalDeleteBtn.textContent = "Delete";
  }
}

/**
 * confirmDeleteWarning — Shows a custom warning dialog for delete actions.
 * Returns true only when the user explicitly confirms deletion.
 */
function confirmDeleteWarning(itemLabel, itemType = "Song") {
  if (!els.deleteConfirmOverlay) {
    return Promise.resolve(confirm(`Delete ${itemLabel}? This cannot be undone.`));
  }

  return new Promise(resolve => {
    els.deleteConfirmTitle.textContent = `Delete ${itemType}?`;
    els.deleteConfirmText.textContent =
      `You are about to permanently delete ${itemLabel}. This action cannot be undone.`;

    const finish = (result) => {
      els.deleteConfirmOverlay.style.display = "none";
      els.deleteConfirmOkBtn.removeEventListener("click", onConfirm);
      els.deleteConfirmCancelBtn.removeEventListener("click", onCancel);
      els.deleteConfirmOverlay.removeEventListener("click", onOverlayClick);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };

    const onConfirm = () => finish(true);
    const onCancel = () => finish(false);
    const onOverlayClick = (event) => {
      if (event.target === els.deleteConfirmOverlay) finish(false);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") finish(false);
    };

    els.deleteConfirmOkBtn.addEventListener("click", onConfirm);
    els.deleteConfirmCancelBtn.addEventListener("click", onCancel);
    els.deleteConfirmOverlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKeydown);

    els.deleteConfirmOverlay.style.display = "flex";
    els.deleteConfirmCancelBtn.focus();
  });
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

/**
 * wireEvents — Attaches all DOM event listeners.
 * Called once during initApp.
 */
function wireEvents() {
  els.passwordToggles.forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      const label = showPassword ? "Hide password" : "Show password";
      button.setAttribute("aria-label", label);
      button.title = label;
      button.classList.toggle("is-visible", showPassword);
      input.focus();
    });
  });
  els.loginForm.addEventListener("submit", handleLogin);
  els.signupForm.addEventListener("submit", handleSignup);
  els.resendVerificationBtn.addEventListener("click", resendSignupVerification);
  els.showLoginBtn.addEventListener("click", () => switchAuthMode("login"));
  els.showSignupBtn.addEventListener("click", () => switchAuthMode("signup"));
  // Search input — filter without hitting the API.
  els.searchInput.addEventListener("input", () => {
    state.searchQuery = els.searchInput.value;
    state.currentPage = 1; // Reset to first page on new search.
    renderApp();
  });

  // Click table headers to toggle sorting by that column.
  els.sortableHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const clickedKey = header.dataset.sortKey;
      if (!clickedKey) return;

      if (state.sortKey === clickedKey) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = clickedKey;
        state.sortDirection = "asc";
      }

      state.currentPage = 1;
      renderApp();
    });
  });

  // + New Song button.
  els.addSongBtn.addEventListener("click", openCreateModal);

  els.adminBtn.addEventListener("click", openAdministration);
  els.backToCatalogBtn.addEventListener("click", () => showApplicationView(els.catalogView));
  els.manageUsersBtn.addEventListener("click", openUserAdministration);
  els.manageListsBtn.addEventListener("click", openListAdministration);
  els.manageAuditBtn.addEventListener("click", openAuditAdministration);
  els.usersBackToAdminBtn.addEventListener("click", openAdministration);
  els.listsBackToAdminBtn.addEventListener("click", openAdministration);
  els.itemsBackToListsBtn.addEventListener("click", openListAdministration);
  els.auditBackToAdminBtn.addEventListener("click", openAdministration);
  els.auditSearchForm.addEventListener("submit", event => {
    event.preventDefault();
    searchAuditEntries(1);
  });
  els.newListItemBtn.addEventListener("click", () => openLookupListItemModal());
  els.userSettingsBtn.addEventListener("click", () => openUserSettings());
  els.authIconBtn.addEventListener("click", async () => {
    if (state.currentUser) {
      await api.logout();
      state.currentUser = null;
      showApplicationView(els.catalogView);
      closeUserModal();
      closeUserSettings();
      state.songs = [];
      state.filteredSongs = [];
      resetCatalogSearch();
      renderApp();
      showLoginScreen();
    } else {
      showLoginScreen();
    }
    updateAuthUI();
    closeModal();
    renderApp();
  });

  els.userModalCloseX.addEventListener("click", closeUserModal);
  els.userModalCancelBtn.addEventListener("click", closeUserModal);
  els.userModalSaveBtn.addEventListener("click", saveUser);
  els.userModalDeleteBtn.addEventListener("click", deleteSelectedUser);
  els.resetPasswordBtn.addEventListener("click", resetSelectedUserPassword);
  els.userModalOverlay.addEventListener("click", event => { if (event.target === els.userModalOverlay) closeUserModal(); });
  els.settingsModalCloseX.addEventListener("click", closeUserSettings);
  els.settingsModalCancelBtn.addEventListener("click", closeUserSettings);
  els.settingsSaveBtn.addEventListener("click", saveUserSettings);
  els.settingsModalOverlay.addEventListener("click", event => { if (event.target === els.settingsModalOverlay) closeUserSettings(); });
  els.lookupListModalCloseX.addEventListener("click", closeLookupListModal);
  els.lookupListCancelBtn.addEventListener("click", closeLookupListModal);
  els.lookupListSaveBtn.addEventListener("click", saveLookupList);
  els.lookupListModalOverlay.addEventListener("click", event => {
    if (event.target === els.lookupListModalOverlay) closeLookupListModal();
  });
  els.lookupListItemModalCloseX.addEventListener("click", closeLookupListItemModal);
  els.lookupListItemCancelBtn.addEventListener("click", closeLookupListItemModal);
  els.lookupListItemSaveBtn.addEventListener("click", saveLookupListItem);
  els.deactivateListItemBtn.addEventListener("click", deactivateSelectedLookupListItem);
  els.lookupListItemModalOverlay.addEventListener("click", event => {
    if (event.target === els.lookupListItemModalOverlay) closeLookupListItemModal();
  });

  // Modal — Save button.
  els.modalSaveBtn.addEventListener("click", handleSaveSong);

  // Modal — Delete button.
  els.modalDeleteBtn.addEventListener("click", () => {
    const id = els.fieldId.value || state.modalSong?.id;
    if (id) handleDeleteSong(id);
  });

  // Modal — Close (X button and Close button).
  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modalCloseX.addEventListener("click",   closeModal);

  // Close modal when clicking the dark overlay backdrop.
  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  // Close modal with Escape key.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.lookupListItemModalOverlay.style.display !== "none") closeLookupListItemModal();
    else if (e.key === "Escape" && els.lookupListModalOverlay.style.display !== "none") closeLookupListModal();
    else if (e.key === "Escape" && els.settingsModalOverlay.style.display !== "none") closeUserSettings();
    else if (e.key === "Escape" && els.userModalOverlay.style.display !== "none") closeUserModal();
    else if (e.key === "Escape" && state.modalMode !== null) closeModal();
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * escapeHtml — Prevents XSS when inserting user data into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Start the app when the DOM is ready.
document.addEventListener("DOMContentLoaded", initApp);
