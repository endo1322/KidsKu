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


function hookButton(selector) {
  const existing = document.querySelector(selector);
  if (!existing) {
    return;
  }
  if (existing && !existing.dataset.hooked) {
    existing.dataset.hooked = "true";

    existing.addEventListener("click", async (e) => {
    const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
    const text = editor?.innerText || "";

      e.preventDefault(); // デフォルト動作のキャンセル
      e.stopImmediatePropagation(); // 他のイベントリスナーを実行させない
      showPopup(text + " リスクのある内容です。投稿を見直してください。");
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
