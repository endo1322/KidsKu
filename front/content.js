
/*
    warning/alertのスタイル設定
*/
let toggle = true;


function showPopup(message, type = "safe") {
  const div = document.createElement("div");
  div.className = "popup-toast";

  const text = document.createElement("span");
  text.textContent = message;

  const closeBtn = document.createElement("span");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    position: absolute;
    top: 3px;
    right: 10px;
    cursor: pointer;
    font-weight: bold;
    font-size: 30px;
  `;

  const progress = document.createElement("div");
  progress.className = "toast-progress";

  div.appendChild(text);
  div.appendChild(closeBtn);
  div.appendChild(progress);

  // 色設定
  let backgroundColor = "white";
  let textColor = "black";
  let borderColor = "black";

  if (type === "warning") {
    backgroundColor = "#ffc107";
    textColor = "#212529";
    borderColor = "#d39e00";
  } else if (type === "danger") {
    backgroundColor = "#dc3545";
    textColor = "#ffffff";
    borderColor = "#b02a37";
  }

  Object.assign(div.style, {
    maxWidth: "400px", 
    width: "fit-content",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: backgroundColor,
    color: textColor,
    padding: "1em 2.5em 1em 1.5em",
    border: `2px solid ${borderColor}`,
    zIndex: 9999,
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    fontWeight: "bold",
    overflow: "hidden",
    opacity: 0,
    transition: "opacity 0.3s ease, transform 0.3s ease",
    minWidth: "200px",
  });

  Object.assign(progress.style, {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "4px",
    width: "100%",
    backgroundColor: textColor,
    animation: "shrink 4s linear forwards",
    transformOrigin: "left",
  });

  // アニメーション定義（必要なら1回だけ作成）
  if (!document.getElementById("toast-style")) {
    const style = document.createElement("style");
    style.id = "toast-style";
    style.textContent = `
      @keyframes shrink {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity = 1;
    div.style.transform = "translateX(-50%) translateY(0)";
  });

  let timeoutId = setTimeout(() => fadeOut(), 4000);

  function fadeOut() {
    div.style.opacity = 0;
    div.style.transform = "translateX(-50%) translateY(-20px)";
    setTimeout(() => div.remove(), 300);
  }

  // 手動で閉じる
  closeBtn.addEventListener("click", () => {
    clearTimeout(timeoutId);
    fadeOut();
  });

  // ホバーで一時停止、離れたら再開
  div.addEventListener("mouseenter", () => {
    clearTimeout(timeoutId);
    progress.style.animationPlayState = "paused";
  });
  div.addEventListener("mouseleave", () => {
    progress.style.animationPlayState = "running";
    timeoutId = setTimeout(() => fadeOut(), getRemainingTime(progress));
  });

  // アニメーションの進行度から残り時間を計算
  function getRemainingTime(el) {
    const style = window.getComputedStyle(el);
    const duration = 4000;
    const matrix = new WebKitCSSMatrix(style.transform);
    const scaleX = matrix.a;
    return duration * scaleX;
  }
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
          showPopup("リスクのある内容です。投稿を見直してください。\n訂正案："+ corrected_text, level);
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
