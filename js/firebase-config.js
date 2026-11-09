// Firebase 配置設定
// 預設填入專案: my-to-do-list-aab19
export const defaultFirebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY", // 請替換為 Firebase Console 中的 Web API Key
  authDomain: "my-to-do-list-aab19.firebaseapp.com",
  projectId: "my-to-do-list-aab19",
  storageBucket: "my-to-do-list-aab19.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

// 支援從 LocalStorage 讀取自定義設定（方便在介面中直接設定與即時測試）
export function getFirebaseConfig() {
  const saved = localStorage.getItem("my_todolist_firebase_config");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId) {
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
  return config && config.apiKey && config.apiKey !== "YOUR_FIREBASE_API_KEY" && config.apiKey.trim() !== "";
}
