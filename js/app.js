import { getFirebaseConfig, saveFirebaseConfig, isConfigured } from "./firebase-config.js";
import { initFirebase, subscribeAuth, loginWithGoogle, logoutUser, startDemoMode, checkSavedDemoMode, isDemo } from "./auth.js";
import {
  syncUserProfile,
  subscribeUserLists,
  createList,
  joinListByShareCode,
  inviteCollaboratorByEmail,
  removeCollaborator,
  deleteList,
  subscribeTasks,
  addTask,
  toggleTaskComplete,
  deleteTask
} from "./db.js";

// 應用程式狀態 (State)
const state = {
  user: null,
  lists: [],
  activeListId: null,
  activeList: null,
  tasks: [],
  filter: "all", // 'all' | 'active' | 'completed'
  searchQuery: "",
  filterOnlyMine: false,
  unsubscribeLists: null,
  unsubscribeTasks: null,
  selectedIcon: "📝"
};

// DOM 元素快取
const elements = {
  configBanner: document.getElementById("config-banner"),
  btnOpenConfigBanner: document.getElementById("btn-open-config-banner"),
  btnOpenSettings: document.getElementById("btn-open-settings"),
  btnHeaderLogin: document.getElementById("btn-header-login"),
  btnLandingLogin: document.getElementById("btn-landing-login"),
  userMenuContainer: document.getElementById("user-menu-container"),
  userProfileBtn: document.getElementById("user-profile-btn"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  userDropdown: document.getElementById("user-dropdown"),
  userDropdownName: document.getElementById("user-dropdown-name"),
  userDropdownEmail: document.getElementById("user-dropdown-email"),
  btnLogout: document.getElementById("btn-logout"),

  landingView: document.getElementById("landing-view"),
  workspaceView: document.getElementById("workspace-view"),

  // 清單相關
  listsContainer: document.getElementById("lists-container"),
  listsLoading: document.getElementById("lists-loading"),
  listsEmpty: document.getElementById("lists-empty"),
  listsCountBadge: document.getElementById("lists-count-badge"),
  btnModalCreateList: document.getElementById("btn-modal-create-list"),
  btnModalJoinList: document.getElementById("btn-modal-join-list"),

  // 當前清單面板
  activeListTitle: document.getElementById("active-list-title"),
  activeListDesc: document.getElementById("active-list-desc"),
  activeListIcon: document.getElementById("active-list-icon"),
  activeListCode: document.getElementById("active-list-code"),
  btnCopyCode: document.getElementById("btn-copy-code"),
  activeListMembers: document.getElementById("active-list-members"),
  btnInviteCollaborator: document.getElementById("btn-invite-collaborator"),
  btnDeleteActiveList: document.getElementById("btn-delete-active-list"),

  // 任務表單
  formAddTask: document.getElementById("form-add-task"),
  taskInputTitle: document.getElementById("task-input-title"),
  taskInputPriority: document.getElementById("task-input-priority"),
  taskInputDue: document.getElementById("task-input-due"),
  taskInputAssignee: document.getElementById("task-input-assignee"),

  // 任務篩選與列表
  tasksContainer: document.getElementById("tasks-container"),
  tasksEmpty: document.getElementById("tasks-empty"),
  filterTabs: document.querySelectorAll(".filter-tab"),
  filterSearch: document.getElementById("filter-search"),
  filterAssignedMine: document.getElementById("filter-assigned-mine"),

  // 統計
  statsPercentage: document.getElementById("stats-percentage"),
  statsProgressBar: document.getElementById("stats-progress-bar"),
  statsPending: document.getElementById("stats-pending"),
  statsCompleted: document.getElementById("stats-completed"),
  statsTotal: document.getElementById("stats-total"),

  // Modals
  modalCreateList: document.getElementById("modal-create-list"),
  formCreateList: document.getElementById("form-create-list"),
  createListName: document.getElementById("create-list-name"),
  createListDesc: document.getElementById("create-list-desc"),
  createListIconSelector: document.getElementById("create-list-icon-selector"),

  modalJoinList: document.getElementById("modal-join-list"),
  formJoinList: document.getElementById("form-join-list"),
  joinListCode: document.getElementById("join-list-code"),

  modalInvite: document.getElementById("modal-invite"),
  modalInviteCode: document.getElementById("modal-invite-code"),
  btnModalCopyCode: document.getElementById("btn-modal-copy-code"),
  formInviteEmail: document.getElementById("form-invite-email"),
  inviteEmailInput: document.getElementById("invite-email-input"),
  modalMembersCount: document.getElementById("modal-members-count"),
  modalMembersList: document.getElementById("modal-members-list"),

  modalSettings: document.getElementById("modal-settings"),
  formFirebaseConfig: document.getElementById("form-firebase-config"),
  cfgApiKey: document.getElementById("cfg-apiKey"),
  cfgAuthDomain: document.getElementById("cfg-authDomain"),
  cfgProjectId: document.getElementById("cfg-projectId"),
  cfgAppId: document.getElementById("cfg-appId"),
  btnPasteFullConfig: document.getElementById("btn-paste-full-config"),
  btnStartDemo: document.getElementById("btn-start-demo"),

  toastContainer: document.getElementById("toast-container")
};

// 顯示 Toast 訊息
export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  const bgColors = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-600 text-white",
    warning: "bg-amber-500 text-white",
    error: "bg-rose-600 text-white"
  };

  toast.className = `toast px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center space-x-2 transition-all duration-300 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(0.5rem)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 檢查 Firebase 設定狀態
function checkConfigStatus() {
  const config = getFirebaseConfig();
  if (!isConfigured(config)) {
    elements.configBanner.classList.remove("hidden");
    return false;
  } else {
    elements.configBanner.classList.add("hidden");
    return true;
  }
}

// 初始化應用程式
function initApp() {
  // 檢查是否已設定 API Key
  checkConfigStatus();

  // 若曾記錄體驗模式，自動恢復
  checkSavedDemoMode();

  // 初始化 Firebase
  initFirebase();

  // 監聽 Auth 變化
  subscribeAuth((user) => {
    state.user = user;
    renderAuthState();
    if (user) {
      syncUserProfile(user);
      setupListsSubscription();
    } else {
      cleanupSubscriptions();
    }
  });

  setupEventListeners();
  refreshIcons();
}

// 刷新 Lucide 圖示
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 清理監聽器
function cleanupSubscriptions() {
  if (state.unsubscribeLists) {
    state.unsubscribeLists();
    state.unsubscribeLists = null;
  }
  if (state.unsubscribeTasks) {
    state.unsubscribeTasks();
    state.unsubscribeTasks = null;
  }
  state.lists = [];
  state.tasks = [];
  state.activeListId = null;
  state.activeList = null;
}

// 渲染 Auth 狀態
function renderAuthState() {
  if (state.user) {
    // 已登入
    elements.btnHeaderLogin.classList.add("hidden");
    elements.landingView.classList.add("hidden");
    elements.workspaceView.classList.remove("hidden");
    elements.userMenuContainer.classList.remove("hidden");

    elements.userName.textContent = state.user.displayName || "使用者";
    elements.userDropdownName.textContent = state.user.displayName || "使用者";
    elements.userDropdownEmail.textContent = state.user.email || "";

    const avatarUrl = state.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.displayName || "U")}&background=6366f1&color=fff`;
    elements.userAvatar.src = avatarUrl;

    const syncEl = document.getElementById("sync-status");
    if (state.user.isDemo) {
      syncEl.className = "flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200";
      syncEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-500 sync-dot"></span><span>✨ 免設定示範模式</span>`;
    } else {
      syncEl.className = "hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200";
      syncEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 sync-dot"></span><span>即時同步中</span>`;
    }
  } else {
    // 未登入
    elements.btnHeaderLogin.classList.remove("hidden");
    elements.landingView.classList.remove("hidden");
    elements.workspaceView.classList.add("hidden");
    elements.userMenuContainer.classList.add("hidden");
    elements.userDropdown.classList.add("hidden");
  }
  refreshIcons();
}

// 設定清單即時訂閱
function setupListsSubscription() {
  if (!state.user) return;
  elements.listsLoading.classList.remove("hidden");

  state.unsubscribeLists = subscribeUserLists(
    state.user,
    (lists) => {
      elements.listsLoading.classList.add("hidden");
      state.lists = lists;
      renderLists();

      // 如果有清單但未選取 activeList，預設選取第一個
      if (lists.length > 0) {
        if (!state.activeListId || !lists.some((l) => l.id === state.activeListId)) {
          selectList(lists[0].id);
        } else {
          // 更新目前選取清單的資料
          const current = lists.find((l) => l.id === state.activeListId);
          if (current) {
            state.activeList = current;
            renderActiveListHeader();
          }
        }
      } else {
        // 使用者尚無任何清單，自動協助建立一個預設「日常待辦」協作清單！
        createDefaultList();
      }
    },
    (err) => {
      elements.listsLoading.classList.add("hidden");
      console.error("載入清單錯誤:", err);
      showToast("載入清單時發生問題，請確認 Firestore 安全規則已啟用！", "error");
    }
  );
}

// 自動建立第一個預設協作清單
async function createDefaultList() {
  if (state.lists.length > 0) return;
  try {
    const list = await createList(state.user, {
      name: "🚀 專案協作起步走",
      description: "這是您的第一個多人協作待辦清單，可以邀請團隊成員一起加入！",
      color: "indigo",
      icon: "🚀"
    });
    // 新增幾項示範任務
    await addTask(list.id, {
      title: "👋 歡迎使用 MyToDoList！點擊核取方塊完成此項目",
      priority: "high"
    }, state.user);

    await addTask(list.id, {
      title: "👥 點擊上方「邀請協作者」分享 6 碼代碼給團隊成員",
      priority: "medium"
    }, state.user);

    selectList(list.id);
  } catch (err) {
    console.error("建立預設清單錯誤:", err);
  }
}

// 切換選取的清單
function selectList(listId) {
  state.activeListId = listId;
  state.activeList = state.lists.find((l) => l.id === listId) || null;

  renderLists();
  renderActiveListHeader();

  // 訂閱任務
  if (state.unsubscribeTasks) {
    state.unsubscribeTasks();
  }

  state.unsubscribeTasks = subscribeTasks(
    listId,
    (tasks) => {
      state.tasks = tasks;
      renderTasks();
      updateStats();
    },
    (err) => {
      console.error("載入任務失敗:", err);
    }
  );
}

// 渲染左側清單列表
function renderLists() {
  elements.listsCountBadge.textContent = state.lists.length;
  elements.listsContainer.innerHTML = "";

  if (state.lists.length === 0) {
    elements.listsEmpty.classList.remove("hidden");
    return;
  }
  elements.listsEmpty.classList.add("hidden");

  state.lists.forEach((list) => {
    const isActive = list.id === state.activeListId;
    const isOwner = list.ownerId === state.user.uid;
    const memberCount = (list.collaborators || []).length;

    const item = document.createElement("div");
    item.className = `group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
      isActive
        ? "bg-brand-50 border border-brand-200 text-brand-900 font-semibold shadow-xs"
        : "hover:bg-slate-50 text-slate-700 border border-transparent"
    }`;

    item.innerHTML = `
      <div class="flex items-center space-x-2.5 truncate flex-1 mr-2">
        <span class="text-lg flex-shrink-0">${list.icon || "📝"}</span>
        <div class="truncate">
          <p class="text-xs font-bold truncate">${escapeHTML(list.name)}</p>
          <p class="text-[10px] text-slate-400 font-normal truncate">${isOwner ? "擁有者" : "協作者"} · ${memberCount} 位成員</p>
        </div>
      </div>
      ${
        isActive
          ? `<span class="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0"></span>`
          : ""
      }
    `;

    item.addEventListener("click", () => selectList(list.id));
    elements.listsContainer.appendChild(item);
  });
}

// 渲染當前清單標題與協作者
function renderActiveListHeader() {
  if (!state.activeList) return;

  elements.activeListTitle.textContent = state.activeList.name;
  elements.activeListDesc.textContent = state.activeList.description || "無清單說明";
  elements.activeListIcon.textContent = state.activeList.icon || "📝";
  elements.activeListCode.textContent = state.activeList.shareCode || "------";

  // 渲染成員頭像堆疊
  const members = state.activeList.collaborators || [];
  elements.activeListMembers.innerHTML = "";

  members.slice(0, 4).forEach((m) => {
    const img = document.createElement("img");
    img.src = m.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || "U")}&background=6366f1&color=fff`;
    img.alt = m.displayName || m.email;
    img.title = `${m.displayName || m.email} (${m.role === "owner" ? "擁有者" : "協作者"})`;
    img.className = "w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer";
    elements.activeListMembers.appendChild(img);
  });

  if (members.length > 4) {
    const extra = document.createElement("div");
    extra.className = "w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center border-2 border-white";
    extra.textContent = `+${members.length - 4}`;
    elements.activeListMembers.appendChild(extra);
  }

  // 更新任務輸入欄的指派名單下拉選單
  elements.taskInputAssignee.innerHTML = `<option value="">指派給 (不限)</option>`;
  members.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.uid || m.email;
    opt.textContent = `${m.displayName || m.email}${m.uid === state.user.uid ? " (我)" : ""}`;
    elements.taskInputAssignee.appendChild(opt);
  });

  refreshIcons();
}

// 渲染任務列表
function renderTasks() {
  elements.tasksContainer.innerHTML = "";

  let filtered = [...state.tasks];

  // 1. 狀態篩選
  if (state.filter === "active") {
    filtered = filtered.filter((t) => !t.completed);
  } else if (state.filter === "completed") {
    filtered = filtered.filter((t) => t.completed);
  }

  // 2. 關鍵字搜尋
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // 3. 只看我的任務
  if (state.filterOnlyMine && state.user) {
    filtered = filtered.filter(
      (t) => t.assignedTo && (t.assignedTo.uid === state.user.uid || t.assignedTo.email === state.user.email)
    );
  }

  if (filtered.length === 0) {
    elements.tasksEmpty.classList.remove("hidden");
    return;
  }
  elements.tasksEmpty.classList.add("hidden");

  filtered.forEach((task) => {
    const card = createTaskElement(task);
    elements.tasksContainer.appendChild(card);
  });

  refreshIcons();
}

// 建立任務 DOM 元素
function createTaskElement(task) {
  const card = document.createElement("div");
  const isCompleted = !!task.completed;

  // 優先級樣式
  const priorityMap = {
    high: { label: "高優先", class: "bg-rose-50 text-rose-700 border-rose-200", icon: "🔥" },
    medium: { label: "中優先", class: "bg-amber-50 text-amber-700 border-amber-200", icon: "⚡" },
    low: { label: "低優先", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🌿" }
  };
  const pStyle = priorityMap[task.priority] || priorityMap.medium;

  card.className = `group bg-white rounded-2xl border p-4 shadow-xs transition hover:shadow-md ${
    isCompleted ? "border-slate-200 bg-slate-50/60" : "border-slate-200 hover:border-slate-300"
  }`;

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <!-- 核取方塊與任務標題 -->
      <div class="flex items-start space-x-3 flex-1 min-w-0">
        <label class="relative flex items-center justify-center cursor-pointer mt-0.5">
          <input type="checkbox" class="task-checkbox sr-only" ${isCompleted ? "checked" : ""}>
          <div class="task-checkbox-custom w-5 h-5 rounded-lg border-2 border-slate-300 flex items-center justify-center transition-all bg-white hover:border-brand-500">
            <svg class="w-3.5 h-3.5 text-white hidden pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </label>

        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 flex-wrap gap-y-1">
            <span class="text-sm font-semibold tracking-tight ${
              isCompleted ? "line-through text-slate-400 font-normal" : "text-slate-800"
            }">${escapeHTML(task.title)}</span>
            <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${pStyle.class}">
              <span>${pStyle.icon}</span>
              <span>${pStyle.label}</span>
            </span>
          </div>

          <!-- 協作附加資訊列 (指派給誰、截止日、建立/完成者) -->
          <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-2">
            ${
              task.dueDate
                ? `<span class="inline-flex items-center space-x-1 text-slate-500">
                    <i data-lucide="calendar" class="w-3 h-3"></i>
                    <span>${task.dueDate}</span>
                   </span>`
                : ""
            }

            ${
              task.assignedTo && task.assignedTo.displayName
                ? `<span class="inline-flex items-center space-x-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                    <i data-lucide="user" class="w-3 h-3"></i>
                    <span>指派給: ${escapeHTML(task.assignedTo.displayName)}</span>
                   </span>`
                : ""
            }

            ${
              task.createdBy && task.createdBy.displayName
                ? `<span>由 ${escapeHTML(task.createdBy.displayName)} 建立</span>`
                : ""
            }

            ${
              isCompleted && task.completedBy
                ? `<span class="text-emerald-600 font-medium">✓ 已由 ${escapeHTML(task.completedBy.displayName || "成員")} 完成</span>`
                : ""
            }
          </div>
        </div>
      </div>

      <!-- 操作工具列 (刪除) -->
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
        <button class="btn-delete-task p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="刪除任務">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;

  // 綁定核取切換事件
  const chk = card.querySelector(".task-checkbox");
  chk.addEventListener("change", async () => {
    try {
      await toggleTaskComplete(state.activeListId, task.id, chk.checked, state.user);
      showToast(chk.checked ? "已標記完成！🎉" : "已重新標記為進行中", "info");
    } catch (err) {
      console.error("更新任務狀態失敗:", err);
      showToast("更新狀態失敗", "error");
    }
  });

  // 綁定刪除事件
  const btnDel = card.querySelector(".btn-delete-task");
  btnDel.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm(`確定要刪除「${task.title}」嗎？`)) {
      try {
        await deleteTask(state.activeListId, task.id);
        showToast("已刪除任務", "info");
      } catch (err) {
        console.error("刪除任務失敗:", err);
        showToast("刪除任務失敗", "error");
      }
    }
  });

  return card;
}

// 更新任務進度統計
function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.statsTotal.textContent = total;
  elements.statsCompleted.textContent = completed;
  elements.statsPending.textContent = pending;
  elements.statsPercentage.textContent = `${pct}%`;
  elements.statsProgressBar.style.width = `${pct}%`;
}

// 綁定所有事件監聽
function setupEventListeners() {
  // 一鍵免設定示範模式按鈕
  if (elements.btnStartDemo) {
    elements.btnStartDemo.addEventListener("click", () => {
      startDemoMode();
      showToast("🎉 已進入免設定示範模式，所有多人協作功能可立即試用！", "success");
    });
  }

  // Google 登入按鈕
  const handleLogin = async () => {
    if (!checkConfigStatus()) {
      const chooseDemo = confirm(
        "您尚未在 Firebase Console 複製貼上 Web API Key。\n\n" +
        "【按確定】👉 直接進入「一鍵免設定示範模式」，馬上體驗完整多人協作！\n" +
        "【按取消】👉 開啟設定面板輸入 Firebase API Key。"
      );
      if (chooseDemo) {
        startDemoMode();
        showToast("🎉 已為您開啟免設定示範模式！", "success");
        return;
      }
      openSettingsModal();
      return;
    }
    try {
      await loginWithGoogle();
      showToast("Google 登入成功！", "success");
    } catch (error) {
      console.error("登入錯誤:", error);
      if (error.code === "auth/popup-closed-by-user") {
        showToast("已取消 Google 登入視窗", "info");
      } else if (error.code === "auth/unauthorized-domain") {
        showToast("此網域尚未在 Firebase Console 授權！請前往 Authentication -> Settings -> Authorized domains 新增 localhost", "error");
      } else {
        showToast(`登入失敗: ${error.message || error}`, "error");
      }
    }
  };

  elements.btnHeaderLogin.addEventListener("click", handleLogin);
  elements.btnLandingLogin.addEventListener("click", handleLogin);

  // 登出
  elements.btnLogout.addEventListener("click", async () => {
    await logoutUser();
    showToast("已安全登出", "info");
  });

  // 使用者選單下拉切換
  elements.userProfileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.userDropdown.classList.toggle("hidden");
  });
  document.addEventListener("click", () => {
    elements.userDropdown.classList.add("hidden");
  });

  // 設定 API Key 橫幅與按鈕
  elements.btnOpenConfigBanner.addEventListener("click", openSettingsModal);
  elements.btnOpenSettings.addEventListener("click", openSettingsModal);

  // 新增任務表單
  elements.formAddTask.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.activeListId) {
      showToast("請先選擇或建立清單", "warning");
      return;
    }

    const title = elements.taskInputTitle.value.trim();
    if (!title) return;

    const priority = elements.taskInputPriority.value;
    const dueDate = elements.taskInputDue.value;
    const assigneeVal = elements.taskInputAssignee.value;

    let assignedTo = null;
    if (assigneeVal && state.activeList) {
      const found = (state.activeList.collaborators || []).find(
        (m) => m.uid === assigneeVal || m.email === assigneeVal
      );
      if (found) assignedTo = found;
    }

    try {
      await addTask(state.activeListId, { title, priority, dueDate, assignedTo }, state.user);
      elements.taskInputTitle.value = "";
      showToast("已新增待辦事項", "success");
    } catch (err) {
      console.error("新增任務失敗:", err);
      showToast("新增任務失敗", "error");
    }
  });

  // 狀態篩選頁籤
  elements.filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      elements.filterTabs.forEach((t) => {
        t.className = "filter-tab px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800";
      });
      tab.className = "filter-tab px-3 py-1.5 rounded-lg bg-white text-slate-800 shadow-xs";
      state.filter = tab.dataset.filter;
      renderTasks();
    });
  });

  // 關鍵字搜尋
  elements.filterSearch.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderTasks();
  });

  // 只看我的任務切換
  elements.filterAssignedMine.addEventListener("click", () => {
    state.filterOnlyMine = !state.filterOnlyMine;
    if (state.filterOnlyMine) {
      elements.filterAssignedMine.classList.add("bg-brand-50", "text-brand-700", "border-brand-300");
    } else {
      elements.filterAssignedMine.classList.remove("bg-brand-50", "text-brand-700", "border-brand-300");
    }
    renderTasks();
  });

  // 複製分享碼
  const copyShareCode = () => {
    if (!state.activeList || !state.activeList.shareCode) return;
    navigator.clipboard.writeText(state.activeList.shareCode).then(() => {
      showToast(`已複製分享碼：${state.activeList.shareCode}`, "success");
    }).catch(() => {
      showToast(`分享碼為：${state.activeList.shareCode}`, "info");
    });
  };
  elements.btnCopyCode.addEventListener("click", copyShareCode);
  elements.btnModalCopyCode.addEventListener("click", copyShareCode);

  // 刪除目前清單
  elements.btnDeleteActiveList.addEventListener("click", async () => {
    if (!state.activeList) return;
    if (state.activeList.ownerId !== state.user.uid) {
      showToast("只有清單擁有者可以刪除此清單", "warning");
      return;
    }
    if (confirm(`確定要刪除清單「${state.activeList.name}」及其內的所有待辦事項嗎？此操作無法還原。`)) {
      try {
        await deleteList(state.activeListId);
        showToast("已刪除清單", "info");
        state.activeListId = null;
        state.activeList = null;
      } catch (err) {
        console.error("刪除清單失敗:", err);
        showToast("刪除清單失敗", "error");
      }
    }
  });

  // Modal 控制
  setupModalControls();
}

// 設定所有彈跳視窗邏輯
function setupModalControls() {
  // 關閉所有 Modal 通用處理
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.modalCreateList.classList.add("hidden");
      elements.modalJoinList.classList.add("hidden");
      elements.modalInvite.classList.add("hidden");
      elements.modalSettings.classList.add("hidden");
    });
  });

  // 1. 建立清單 Modal
  elements.btnModalCreateList.addEventListener("click", () => {
    elements.modalCreateList.classList.remove("hidden");
    elements.createListName.focus();
  });

  // 圖示選擇器
  elements.createListIconSelector.querySelectorAll(".icon-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.createListIconSelector.querySelectorAll(".icon-opt").forEach((b) => {
        b.className = "icon-opt px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-base";
      });
      btn.className = "icon-opt px-3 py-1.5 rounded-lg border-2 border-brand-500 bg-brand-50 text-base";
      state.selectedIcon = btn.dataset.icon;
    });
  });

  elements.formCreateList.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = elements.createListName.value.trim();
    const desc = elements.createListDesc.value.trim();
    if (!name) return;

    try {
      const newList = await createList(state.user, {
        name,
        description: desc,
        icon: state.selectedIcon
      });
      elements.modalCreateList.classList.add("hidden");
      elements.formCreateList.reset();
      showToast(`已建立清單「${name}」！`, "success");
      selectList(newList.id);
    } catch (err) {
      console.error("建立清單失敗:", err);
      showToast("建立清單失敗", "error");
    }
  });

  // 2. 加入清單 Modal
  elements.btnModalJoinList.addEventListener("click", () => {
    elements.modalJoinList.classList.remove("hidden");
    elements.joinListCode.focus();
  });

  elements.formJoinList.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = elements.joinListCode.value.trim();
    if (!code) return;

    try {
      const joined = await joinListByShareCode(state.user, code);
      elements.modalJoinList.classList.add("hidden");
      elements.formJoinList.reset();
      showToast(joined.alreadyJoined ? "您已在此協作清單中！" : "成功加入協作清單！🎉", "success");
      selectList(joined.id);
    } catch (err) {
      console.error("加入清單失敗:", err);
      showToast(err.message || "加入清單失敗", "error");
    }
  });

  // 3. 邀請協作者 Modal
  elements.btnInviteCollaborator.addEventListener("click", () => {
    if (!state.activeList) return;
    renderInviteModal();
    elements.modalInvite.classList.remove("hidden");
  });

  elements.formInviteEmail.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = elements.inviteEmailInput.value.trim();
    if (!email) return;

    try {
      await inviteCollaboratorByEmail(state.activeListId, email);
      elements.inviteEmailInput.value = "";
      showToast(`已將 ${email} 加入協作者名單！`, "success");
      renderInviteModal();
    } catch (err) {
      console.error("邀請協作者失敗:", err);
      showToast(err.message || "邀請失敗", "error");
    }
  });

  // 4. 設定 Modal
  elements.formFirebaseConfig.addEventListener("submit", (e) => {
    e.preventDefault();
    const newConfig = {
      apiKey: elements.cfgApiKey.value.trim(),
      authDomain: elements.cfgAuthDomain.value.trim() || "my-to-do-list-aab19.firebaseapp.com",
      projectId: "my-to-do-list-aab19",
      storageBucket: "my-to-do-list-aab19.appspot.com",
      messagingSenderId: "",
      appId: elements.cfgAppId.value.trim()
    };

    saveFirebaseConfig(newConfig);
    showToast("Firebase 設定已儲存！頁面即將重新載入以套用...", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  });

  elements.btnPasteFullConfig.addEventListener("click", () => {
    const raw = prompt("請貼上 Firebase 控制台中的 firebaseConfig 物件代碼：\n例如: const firebaseConfig = { apiKey: '...', ... };");
    if (!raw) return;

    try {
      // 提取 apiKey, appId
      const keyMatch = raw.match(/apiKey:\s*["']([^"']+)["']/);
      const appMatch = raw.match(/appId:\s*["']([^"']+)["']/);
      if (keyMatch) elements.cfgApiKey.value = keyMatch[1];
      if (appMatch) elements.cfgAppId.value = appMatch[1];
      showToast("已成功解析並帶入配置！請點擊下方儲存。", "info");
    } catch (e) {
      alert("解析失敗，請手動複製 apiKey 填入。");
    }
  });
}

// 打開設定 Modal
function openSettingsModal() {
  const cfg = getFirebaseConfig();
  elements.cfgApiKey.value = cfg.apiKey && cfg.apiKey !== "YOUR_FIREBASE_API_KEY" ? cfg.apiKey : "";
  elements.cfgAuthDomain.value = cfg.authDomain || "my-to-do-list-aab19.firebaseapp.com";
  elements.cfgProjectId.value = "my-to-do-list-aab19";
  elements.cfgAppId.value = cfg.appId && cfg.appId !== "YOUR_FIREBASE_APP_ID" ? cfg.appId : "";
  elements.modalSettings.classList.remove("hidden");
}

// 渲染邀請 Modal 內容
function renderInviteModal() {
  if (!state.activeList) return;
  elements.modalInviteCode.textContent = state.activeList.shareCode || "------";

  const members = state.activeList.collaborators || [];
  elements.modalMembersCount.textContent = members.length;
  elements.modalMembersList.innerHTML = "";

  const isOwner = state.activeList.ownerId === state.user.uid;

  members.forEach((m) => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs";
    const avatar = m.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || "U")}&background=6366f1&color=fff`;

    row.innerHTML = `
      <div class="flex items-center space-x-2 truncate">
        <img src="${avatar}" class="w-6 h-6 rounded-full object-cover">
        <div class="truncate">
          <p class="font-bold text-slate-800 truncate">${escapeHTML(m.displayName || m.email)}</p>
          <p class="text-[10px] text-slate-400 truncate">${escapeHTML(m.email || "")}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
          m.role === "owner" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
        }">
          ${m.role === "owner" ? "擁有者" : "協作者"}
        </span>
        ${
          isOwner && m.role !== "owner"
            ? `<button class="btn-remove-member text-slate-400 hover:text-rose-600 p-1" title="移除成員">
                <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
               </button>`
            : ""
        }
      </div>
    `;

    if (isOwner && m.role !== "owner") {
      const btnRem = row.querySelector(".btn-remove-member");
      btnRem.addEventListener("click", async () => {
        if (confirm(`確定要將 ${m.displayName || m.email} 從此清單中移除嗎？`)) {
          try {
            await removeCollaborator(state.activeListId, m.uid, m.email);
            showToast("已移除該協作者", "info");
            renderInviteModal();
          } catch (err) {
            console.error("移除成員失敗:", err);
            showToast("移除成員失敗", "error");
          }
        }
      });
    }

    elements.modalMembersList.appendChild(row);
  });

  refreshIcons();
}

// 轉義 HTML 防止 XSS
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 啟動 App
document.addEventListener("DOMContentLoaded", initApp);
