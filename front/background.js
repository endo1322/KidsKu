// 環境変数の設定
const config = {
  API_URL: "http://127.0.0.1:2024",
  // バックエンド起動のたび変更してください
  ASSISTANT_ID: "fe096781-5601-53d2-b2f6-0d3403f7e9ca"
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
