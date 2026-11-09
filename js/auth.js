import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirebaseConfig, isConfigured } from "./firebase-config.js";

let app = null;
let auth = null;
let currentUser = null;
let isDemoMode = false;
const authListeners = [];

export function isDemo() {
  return isDemoMode;
}

export function initFirebase() {
  const config = getFirebaseConfig();
  if (!isConfigured(config)) {
    return { app: null, auth: null, configured: false };
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    onAuthStateChanged(auth, (user) => {
      if (!isDemoMode) {
        currentUser = user;
        notifyAuthListeners(user);
      }
    });

    return { app, auth, configured: true };
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
    return { app: null, auth: null, configured: false, error };
  }
}

function notifyAuthListeners(user) {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (err) {
      console.error("Auth listener error:", err);
    }
  });
}

export function subscribeAuth(listener) {
  authListeners.push(listener);
  if (currentUser !== undefined) {
    listener(currentUser);
  }
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

// 啟用免設定體驗模式 (Demo Mode)
export function startDemoMode() {
  isDemoMode = true;
  currentUser = {
    uid: "demo-user-iris",
    displayName: "Iris (體驗模式)",
    email: "irischao@example.com",
    photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Iris",
    isDemo: true
  };
  localStorage.setItem("my_todolist_demo_mode", "true");
  notifyAuthListeners(currentUser);
  return currentUser;
}

export function checkSavedDemoMode() {
  if (localStorage.getItem("my_todolist_demo_mode") === "true") {
    startDemoMode();
    return true;
  }
  return false;
}

export async function loginWithGoogle() {
  const config = getFirebaseConfig();
  if (!isConfigured(config)) {
    throw new Error("NOT_CONFIGURED");
  }

  if (!auth) {
    const init = initFirebase();
    if (!init.auth) {
      throw new Error("NOT_CONFIGURED");
    }
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    isDemoMode = false;
    localStorage.removeItem("my_todolist_demo_mode");
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    console.error("Google 登入失敗:", error);
    throw error;
  }
}

export async function logoutUser() {
  if (isDemoMode) {
    isDemoMode = false;
    currentUser = null;
    localStorage.removeItem("my_todolist_demo_mode");
    notifyAuthListeners(null);
    return;
  }

  if (auth) {
    try {
      await signOut(auth);
      currentUser = null;
    } catch (error) {
      console.error("登出失敗:", error);
      throw error;
    }
  }
}

export function getCurrentUser() {
  return currentUser;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseApp() {
  return app;
}
