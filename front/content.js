// ボタンに機能を追加
function showPopup(message) {
  if (document.querySelector("#my-popup")) return;
  const div = document.createElement("div");
  div.id = "my-popup";
  div.textContent = message;
  Object.assign(div.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "white",
    color: "black",
    padding: "1em",
    border: "1px solid black",
    zIndex: 9999,
    borderRadius: "8px",
    boxShadow: "0 0 8px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}


async function hookButton(selector) {
  const existing = document.querySelector(selector);
  if (!existing) {
    return;
  }
  const { threadId, config } = await chrome.storage.local.get(["threadId", "config"]);
  if (existing && !existing.dataset.hooked) {
    existing.dataset.hooked = "true";

    existing.addEventListener("click", async (e) => {
      // 先にデフォルト動作をキャンセル
      e.preventDefault();
      e.stopImmediatePropagation();

      const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
      const text = editor?.innerText || "";

      try {
        const response = await fetch(`${config.API_URL}/threads/${threadId}/runs/wait`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assistant_id: config.ASSISTANT_ID,
            input: {
              user_request: text
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        const res = data.response

        // 判定の結果（safe, warning, danger）
        const level = res.level;
        // 訂正文
        const corrected_text = res.corrected_text;
        // 判断理由
        const reason = res.reason;
        // 投稿文におけるアドバイス
        const suggestion = res.suggestion;

        // TODO:levelがwarning, dangerで表示されるpopupのスタイルが分岐できるようにする
        if (level != 'safe') {
          // TODO:訂正案を別のpopupで表示できるようにする
          showPopup("リスクのある内容です。投稿を見直してください。\n訂正案："+ corrected_text);
        } else {
          // TODO:安全な場合は本来の投稿処理を続行
        }
      } catch (error) {
        console.error('Error:', error);
        showPopup("エラーが発生しました。もう一度お試しください。");
      }
    }, true);
  }
}

// observerを起動して監視する
// 読み込まれるタイミングがバラバラのため
function observeButtons() {
  const observer = new MutationObserver(() => {
    hookButton('[data-testid="tweetButton"]');
    hookButton('[data-testid="tweetButtonInline"]');
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

}

observeButtons();
