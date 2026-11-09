import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFirebaseApp, isDemo } from "./auth.js";

let db = null;

export function getDB() {
  if (!db) {
    const app = getFirebaseApp();
    if (app) {
      db = getFirestore(app);
    }
  }
  return db;
}

// 產生 6 碼隨機分享碼
export function generateShareCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/* ========================================================
   DEMO 體驗模式本地模擬資料存儲 (Zero-Config Local Store)
   ======================================================== */
const DEMO_STORAGE_KEY = "mytodolist_demo_data_v1";

function getDemoStore() {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }
  // 初始示範資料
  const initial = {
    lists: [
      {
        id: "demo-list-1",
        name: "🚀 專案起步與協作展示",
        description: "體驗多人即時指派、狀態同步與分享代碼！",
        color: "indigo",
        icon: "🚀",
        ownerId: "demo-user-iris",
        ownerEmail: "irischao@example.com",
        ownerName: "Iris (您)",
        ownerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Iris",
        collaboratorIds: ["demo-user-iris", "demo-user-alex", "demo-user-sarah"],
        collaboratorEmails: ["irischao@example.com", "alex@example.com", "sarah@example.com"],
        collaborators: [
          {
            uid: "demo-user-iris",
            email: "irischao@example.com",
            displayName: "Iris (您)",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Iris",
            role: "owner"
          },
          {
            uid: "demo-user-alex",
            email: "alex@example.com",
            displayName: "Alex Chen",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            role: "editor"
          },
          {
            uid: "demo-user-sarah",
            email: "sarah@example.com",
            displayName: "Sarah Lin",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            role: "editor"
          }
        ],
        shareCode: "DEMO88",
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 }
      },
      {
        id: "demo-list-2",
        name: "🛒 團隊採購清單",
        description: "辦公室零食與開會設備準備清單",
        color: "emerald",
        icon: "🛒",
        ownerId: "demo-user-alex",
        ownerEmail: "alex@example.com",
        ownerName: "Alex Chen",
        ownerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        collaboratorIds: ["demo-user-iris", "demo-user-alex"],
        collaboratorEmails: ["irischao@example.com", "alex@example.com"],
        collaborators: [
          {
            uid: "demo-user-alex",
            email: "alex@example.com",
            displayName: "Alex Chen",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            role: "owner"
          },
          {
            uid: "demo-user-iris",
            email: "irischao@example.com",
            displayName: "Iris (您)",
            photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Iris",
            role: "editor"
          }
        ],
        shareCode: "SNACK9",
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 }
      }
    ],
    tasks: {
      "demo-list-1": [
        {
          id: "task-1",
          title: "👋 歡迎使用 MyToDoList！點擊核取方塊試試看",
          description: "完成後會即時記錄是由誰完成的",
          completed: false,
          priority: "high",
          dueDate: new Date().toISOString().split("T")[0],
          assignedTo: { uid: "demo-user-iris", displayName: "Iris (您)" },
          createdBy: { displayName: "系統" },
          completedBy: null,
          createdAt: { seconds: Math.floor(Date.now() / 1000) - 1000 }
        },
        {
          id: "task-2",
          title: "👥 點擊上方「邀請協作者」查看分享代碼與成員名單",
          description: "其他人輸入代碼即可加入協作",
          completed: true,
          priority: "medium",
          dueDate: "",
          assignedTo: { uid: "demo-user-alex", displayName: "Alex Chen" },
          createdBy: { displayName: "Iris (您)" },
          completedBy: { displayName: "Alex Chen" },
          createdAt: { seconds: Math.floor(Date.now() / 1000) - 2000 }
        },
        {
          id: "task-3",
          title: "🔥 測試新增自己的待辦事項並指派隊友",
          description: "",
          completed: false,
          priority: "high",
          dueDate: "",
          assignedTo: { uid: "demo-user-sarah", displayName: "Sarah Lin" },
          createdBy: { displayName: "Iris (您)" },
          completedBy: null,
          createdAt: { seconds: Math.floor(Date.now() / 1000) - 500 }
        }
      ],
      "demo-list-2": [
        {
          id: "task-4",
          title: "採買每週開會零食與精品咖啡豆",
          completed: false,
          priority: "medium",
          dueDate: "",
          assignedTo: { uid: "demo-user-iris", displayName: "Iris (您)" },
          createdBy: { displayName: "Alex Chen" },
          completedBy: null,
          createdAt: { seconds: Math.floor(Date.now() / 1000) - 1500 }
        }
      ]
    }
  };
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveDemoStore(data) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("demo_data_changed"));
}

/* ========================================================
   業務邏輯：支援正式 Firestore 與 Demo 模式無縫切換
   ======================================================== */

// 同步個人資料
export async function syncUserProfile(user) {
  if (isDemo() || !user) return;
  const firestore = getDB();
  if (!firestore) return;

  try {
    const userRef = doc(firestore, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: (user.email || "").toLowerCase(),
        displayName: user.displayName || "匿名使用者",
        photoURL: user.photoURL || "",
        lastSeen: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("同步使用者資料錯誤:", error);
  }
}

// 監聽使用者的清單
export function subscribeUserLists(user, callback, onError) {
  if (isDemo()) {
    const emit = () => {
      const store = getDemoStore();
      const myLists = store.lists.filter(
        (l) => l.collaboratorIds.includes(user.uid) || l.ownerId === user.uid
      );
      callback(myLists);
    };
    emit();
    const handler = () => emit();
    window.addEventListener("demo_data_changed", handler);
    return () => window.removeEventListener("demo_data_changed", handler);
  }

  const firestore = getDB();
  if (!firestore || !user) return () => {};

  const listsRef = collection(firestore, "lists");
  const q = query(
    listsRef,
    where("collaboratorIds", "array-contains", user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lists = [];
      snapshot.forEach((docSnap) => {
        lists.push({ id: docSnap.id, ...docSnap.data() });
      });
      lists.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(lists);
    },
    (error) => {
      console.error("監聽待辦清單失敗:", error);
      if (onError) onError(error);
    }
  );
}

// 建立新清單
export async function createList(user, { name, description = "", color = "indigo", icon = "📝" }) {
  const shareCode = generateShareCode();
  const listData = {
    name: name.trim(),
    description: description.trim(),
    color,
    icon,
    ownerId: user.uid,
    ownerEmail: (user.email || "").toLowerCase(),
    ownerName: user.displayName || "使用者",
    ownerPhoto: user.photoURL || "",
    collaboratorIds: [user.uid],
    collaboratorEmails: user.email ? [user.email.toLowerCase()] : [],
    collaborators: [
      {
        uid: user.uid,
        email: (user.email || "").toLowerCase(),
        displayName: user.displayName || "使用者",
        photoURL: user.photoURL || "",
        role: "owner"
      }
    ],
    shareCode,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    updatedAt: { seconds: Math.floor(Date.now() / 1000) }
  };

  if (isDemo()) {
    const store = getDemoStore();
    const id = "demo-list-" + Date.now();
    const created = { id, ...listData };
    store.lists.unshift(created);
    store.tasks[id] = [];
    saveDemoStore(store);
    return created;
  }

  const firestore = getDB();
  if (!firestore) throw new Error("資料庫未連接");
  const docRef = await addDoc(collection(firestore, "lists"), {
    ...listData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...listData };
}

// 透過分享碼加入清單
export async function joinListByShareCode(user, shareCode) {
  const cleanCode = shareCode.trim().toUpperCase();

  if (isDemo()) {
    const store = getDemoStore();
    const list = store.lists.find((l) => (l.shareCode || "").toUpperCase() === cleanCode);
    if (!list) {
      throw new Error(`找不到分享碼為「${cleanCode}」的清單，示範碼可試試 DEMO88 或 SNACK9`);
    }
    if (!list.collaboratorIds.includes(user.uid)) {
      list.collaboratorIds.push(user.uid);
      list.collaborators.push({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "editor"
      });
      saveDemoStore(store);
      return { id: list.id, alreadyJoined: false, ...list };
    }
    return { id: list.id, alreadyJoined: true, ...list };
  }

  const firestore = getDB();
  if (!firestore || !user) throw new Error("尚未登入");

  const listsRef = collection(firestore, "lists");
  const q = query(listsRef, where("shareCode", "==", cleanCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("找不到對應的分享碼，請確認是否輸入正確！");
  }

  const listDoc = querySnapshot.docs[0];
  const listData = listDoc.data();

  if (listData.collaboratorIds && listData.collaboratorIds.includes(user.uid)) {
    return { id: listDoc.id, alreadyJoined: true, ...listData };
  }

  const newCollaborator = {
    uid: user.uid,
    email: (user.email || "").toLowerCase(),
    displayName: user.displayName || "匿名使用者",
    photoURL: user.photoURL || "",
    role: "editor"
  };

  await updateDoc(doc(firestore, "lists", listDoc.id), {
    collaboratorIds: arrayUnion(user.uid),
    collaboratorEmails: user.email ? arrayUnion(user.email.toLowerCase()) : [],
    collaborators: arrayUnion(newCollaborator),
    updatedAt: serverTimestamp()
  });

  return { id: listDoc.id, alreadyJoined: false, ...listData };
}

// 透過 Email 邀請協作者
export async function inviteCollaboratorByEmail(listId, email) {
  const cleanEmail = email.trim().toLowerCase();

  if (isDemo()) {
    const store = getDemoStore();
    const list = store.lists.find((l) => l.id === listId);
    if (!list) throw new Error("清單不存在");
    if (list.collaboratorEmails && list.collaboratorEmails.includes(cleanEmail)) {
      throw new Error("此成員已在名單中！");
    }
    const fakeMember = {
      uid: "user-" + Date.now(),
      email: cleanEmail,
      displayName: cleanEmail.split("@")[0],
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      role: "editor"
    };
    list.collaboratorEmails.push(cleanEmail);
    list.collaboratorIds.push(fakeMember.uid);
    list.collaborators.push(fakeMember);
    saveDemoStore(store);
    return fakeMember;
  }

  const firestore = getDB();
  if (!firestore) throw new Error("資料庫未連接");

  const listRef = doc(firestore, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("清單不存在");

  const listData = listSnap.data();
  if (listData.collaboratorEmails && listData.collaboratorEmails.includes(cleanEmail)) {
    throw new Error("此成員已在協作名單中！");
  }

  const newMember = {
    uid: null,
    email: cleanEmail,
    displayName: cleanEmail.split("@")[0],
    photoURL: "",
    role: "editor"
  };

  await updateDoc(listRef, {
    collaboratorEmails: arrayUnion(cleanEmail),
    collaborators: arrayUnion(newMember),
    updatedAt: serverTimestamp()
  });
  return newMember;
}

// 移除協作者
export async function removeCollaborator(listId, memberUid, memberEmail) {
  if (isDemo()) {
    const store = getDemoStore();
    const list = store.lists.find((l) => l.id === listId);
    if (list) {
      list.collaborators = list.collaborators.filter(
        (m) => (memberUid && m.uid !== memberUid) || (memberEmail && m.email !== memberEmail)
      );
      if (memberUid) list.collaboratorIds = list.collaboratorIds.filter((id) => id !== memberUid);
      if (memberEmail) list.collaboratorEmails = list.collaboratorEmails.filter((e) => e !== memberEmail);
      saveDemoStore(store);
    }
    return;
  }

  const firestore = getDB();
  if (!firestore) return;
  const listRef = doc(firestore, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) return;

  const listData = listSnap.data();
  const updatedMembers = (listData.collaborators || []).filter(
    (m) => (memberUid && m.uid !== memberUid) || (memberEmail && m.email !== memberEmail)
  );

  const payload = {
    collaborators: updatedMembers,
    updatedAt: serverTimestamp()
  };
  if (memberUid) payload.collaboratorIds = arrayRemove(memberUid);
  if (memberEmail) payload.collaboratorEmails = arrayRemove(memberEmail);

  await updateDoc(listRef, payload);
}

// 刪除清單
export async function deleteList(listId) {
  if (isDemo()) {
    const store = getDemoStore();
    store.lists = store.lists.filter((l) => l.id !== listId);
    delete store.tasks[listId];
    saveDemoStore(store);
    return;
  }

  const firestore = getDB();
  if (!firestore) return;
  await deleteDoc(doc(firestore, "lists", listId));
}

// 監聽任務清單
export function subscribeTasks(listId, callback, onError) {
  if (isDemo()) {
    const emit = () => {
      const store = getDemoStore();
      const listTasks = store.tasks[listId] || [];
      callback([...listTasks]);
    };
    emit();
    const handler = () => emit();
    window.addEventListener("demo_data_changed", handler);
    return () => window.removeEventListener("demo_data_changed", handler);
  }

  const firestore = getDB();
  if (!firestore || !listId) return () => {};

  const tasksRef = collection(firestore, `lists/${listId}/tasks`);
  const q = query(tasksRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(tasks);
    },
    (error) => {
      console.error(`監聽任務失敗:`, error);
      if (onError) onError(error);
    }
  );
}

// 新增待辦事項
export async function addTask(listId, { title, priority = "medium", dueDate = "", assignedTo = null }, user) {
  const taskData = {
    title: title.trim(),
    completed: false,
    priority,
    dueDate: dueDate || null,
    assignedTo: assignedTo ? {
      uid: assignedTo.uid || "",
      displayName: assignedTo.displayName || assignedTo.email || "成員",
      email: assignedTo.email || "",
      photoURL: assignedTo.photoURL || ""
    } : null,
    createdBy: {
      uid: user.uid,
      displayName: user.displayName || "使用者",
      email: user.email || "",
      photoURL: user.photoURL || ""
    },
    completedBy: null,
    createdAt: { seconds: Math.floor(Date.now() / 1000) }
  };

  if (isDemo()) {
    const store = getDemoStore();
    if (!store.tasks[listId]) store.tasks[listId] = [];
    const id = "task-" + Date.now();
    const created = { id, ...taskData };
    store.tasks[listId].unshift(created);
    saveDemoStore(store);
    return created;
  }

  const firestore = getDB();
  if (!firestore) throw new Error("資料庫未連接");
  const docRef = await addDoc(collection(firestore, `lists/${listId}/tasks`), {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...taskData };
}

// 切換待辦事項完成狀態
export async function toggleTaskComplete(listId, taskId, isCompleted, user) {
  if (isDemo()) {
    const store = getDemoStore();
    const tasks = store.tasks[listId] || [];
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      t.completed = isCompleted;
      t.completedBy = isCompleted ? { displayName: user.displayName } : null;
      saveDemoStore(store);
    }
    return;
  }

  const firestore = getDB();
  if (!firestore) return;
  const taskRef = doc(firestore, `lists/${listId}/tasks`, taskId);
  const updateData = {
    completed: isCompleted,
    updatedAt: serverTimestamp(),
    completedBy: isCompleted ? {
      uid: user.uid,
      displayName: user.displayName || "成員"
    } : null
  };
  await updateDoc(taskRef, updateData);
}

// 刪除待辦事項
export async function deleteTask(listId, taskId) {
  if (isDemo()) {
    const store = getDemoStore();
    if (store.tasks[listId]) {
      store.tasks[listId] = store.tasks[listId].filter((t) => t.id !== taskId);
      saveDemoStore(store);
    }
    return;
  }

  const firestore = getDB();
  if (!firestore) return;
  await deleteDoc(doc(firestore, `lists/${listId}/tasks`, taskId));
}
