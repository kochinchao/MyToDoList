// Firebase 配置設定
// 專案: my-to-do-list-aab19
export const defaultFirebaseConfig = {
  apiKey: "AIzaSyDF22Ay9F_RhsIczIPwkyW_P6lop6AG9cA",
  authDomain: "my-to-do-list-aab19.firebaseapp.com",
  projectId: "my-to-do-list-aab19",
  storageBucket: "my-to-do-list-aab19.firebasestorage.app",
  messagingSenderId: "410467872644",
  appId: "1:410467872644:web:a69bc2ff011ef31c72f7d1"
};

// 支援從 LocalStorage 讀取自定義設定（若有快取則以設定優先，否則使用預設配置）
export function getFirebaseConfig() {
  const saved = localStorage.getItem("my_todolist_firebase_config");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.apiKey.startsWith("AIzaSy")) {
        return parsed;
      }
    } catch (e) {
      console.warn("無法解析儲存的 Firebase 設定:", e);
    }
  }
  return defaultFirebaseConfig;
}

export function saveFirebaseConfig(config) {
  localStorage.setItem("my_todolist_firebase_config", JSON.stringify(config));
}

export function isConfigured(config = getFirebaseConfig()) {
  return config && config.apiKey && config.apiKey.startsWith("AIzaSy");
}
