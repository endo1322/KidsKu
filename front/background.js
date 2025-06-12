chrome.runtime.onInstalled.addListener(async () => {
    const response = await fetch("http://127.0.0.1:2024/threads", {
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
  