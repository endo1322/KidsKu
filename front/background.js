// 環境変数の設定
const config = {
  API_URL: "http://127.0.0.1:2024",
  ASSISTANT_ID: "c1ee8685-d317-4085-9bc9-11643e1e1df0"
};

// 設定をストレージに保存
chrome.storage.local.set({ config });

chrome.runtime.onInstalled.addListener(async () => {
    const response = await fetch(`${config.API_URL}/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    const threadId = data.thread_id;

    // スレッドIDをストレージに保存
    chrome.storage.local.set({ threadId });
  });
  