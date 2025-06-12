/*
    warning/alertのスタイル設定
*/


// ポップアップ用のコンテナを1回だけ作成
function ensureToastContainer() {
  let container = document.getElementById("popup-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "popup-toast-container";
    Object.assign(container.style, {
      position: "fixed",
      width: "400px",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 9999,
      pointerEvents: "none",
    });
    document.body.appendChild(container);
  }
  return container;
}

function showPopup(message, type = "safe") {
  const container = ensureToastContainer();

  const div = document.createElement("div");
  div.className = "popup-toast";
  div.style.pointerEvents = "auto"; 

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
    width: "100%",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    position: "relative",
    background: backgroundColor,
    color: textColor,
    padding: "1em 2.5em 1em 1.5em",
    border: `2px solid ${borderColor}`,
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

  container.appendChild(div);

  requestAnimationFrame(() => {
    div.style.opacity = 1;
    div.style.transform = "translateY(0)";
  });

  let timeoutId = setTimeout(() => fadeOut(), 4000);

  function fadeOut() {
    div.style.opacity = 0;
    div.style.transform = "translateY(-20px)";
    setTimeout(() => div.remove(), 300);
  }

  closeBtn.addEventListener("click", () => {
    clearTimeout(timeoutId);
    fadeOut();
  });

  div.addEventListener("mouseenter", () => {
    clearTimeout(timeoutId);
    progress.style.animationPlayState = "paused";
  });
  div.addEventListener("mouseleave", () => {
    progress.style.animationPlayState = "running";
    timeoutId = setTimeout(() => fadeOut(), getRemainingTime(progress));
  });

  function getRemainingTime(el) {
    const style = window.getComputedStyle(el);
    const duration = 4000;
    const matrix = new WebKitCSSMatrix(style.transform);
    const scaleX = matrix.a;
    return duration * scaleX;
  }

  return div; // 必要なら制御用に返す
}
/*
  進捗表示
*/
function showLoadingPopup(message = "判定中です...") {
  const container = ensureToastContainer();

  const div = document.createElement("div");
  div.className = "popup-toast";
  div.style.pointerEvents = "auto";

  const icon = document.createElement("span");
  icon.className = "popup-icon";
  icon.style.marginRight = "0.5em";
  icon.style.display = "inline-block";
  Object.assign(icon.style, {
    width: "1em",
    height: "1em",
    border: "2px solid rgba(0,0,0,0.2)",
    borderTop: "2px solid black",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    verticalAlign: "middle"
  });

  const text = document.createElement("span");
  text.textContent = message;
  text.prepend(icon);

  const divStyle = {
    background: "white",
    color: "black",
    borderColor: "black",
  };

  Object.assign(div.style, {
    maxWidth: "400px",
    width: "100%",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    position: "relative",
    background: divStyle.background,
    color: divStyle.color,
    padding: "1em 2.5em 1em 1.5em",
    border: `2px solid ${divStyle.borderColor}`,
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    fontWeight: "bold",
    opacity: 0,
    transition: "opacity 0.3s ease, transform 0.3s ease",
    minWidth: "200px",
  });

  if (!document.getElementById("spin-style")) {
    const style = document.createElement("style");
    style.id = "spin-style";
    style.textContent = `
      @keyframes spin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  div.appendChild(text);
  container.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity = 1;
    div.style.transform = "translateY(0)";
  });

  return div;
}


/*
  進捗表示の更新
*/
function resolveLoadingPopup(popup, message, status = "success") {
  const icon = document.createElement("span");
  icon.style.fontWeight = "bold";
  icon.style.marginRight = "0.5em";

  let color = "green";
  if (status === "success") {
    icon.textContent = "✔ ";
    color = "green";
  } else if (status === "fail" || status === "error") {
    icon.textContent = "✖ ";
    color = "#dc3545";
  } else if (status === "warning") {
    icon.textContent = "⚠ ";
    color = "#ffc107";
  }

  icon.style.color = color;

  const text = popup.querySelector("span");
  if (text) {
    text.textContent = message;
    text.prepend(icon);
  }

  popup.style.border = `2px solid`;
  popup.style.color = color;

  let progress = popup.querySelector(".toast-progress");
  if (!progress) {
    progress = document.createElement("div");
    progress.className = "toast-progress";
    popup.appendChild(progress);
  }

  Object.assign(progress.style, {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "4px",
    width: "100%",
    backgroundColor: color,
    animation: "shrink 2s linear forwards",
    transformOrigin: "left",
  });

  setTimeout(() => {
    popup.style.opacity = 0;
    popup.style.transform = "translateY(-20px)";
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}


/*
  button click時の処理
*/
async function hookButton(selector) {
  const existing = document.querySelector(selector);
  if (!existing) {
    return;
  }
  const { threadId, config } = await chrome.storage.local.get(["threadId", "config"]);
  if (existing && !existing.dataset.hooked) {
    existing.dataset.hooked = "true";

    existing.addEventListener("click", async (e) => {
      // synthetic（プログラム発行）クリックは無視
      if (!e.isTrusted) {
        return;
      }

      // 本物のユーザークリック時のみキャンセルして検査
      e.preventDefault();
      e.stopImmediatePropagation();

      const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
      const text = editor?.innerText || "";
      
      const popup = showLoadingPopup("AIが内容をチェック中...");
      try {
        const response = await fetch(`${config.API_URL}/threads/${threadId}/runs/wait`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assistant_id: config.ASSISTANT_ID,
            input: { user_request: text }
          })
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        const { level, corrected_text, reason, suggestion } = data.response;
        popup.remove(); //ポップアップの削除
        if (level !== 'safe') {
          showPopup(
            `リスクのある内容です。投稿を見直してください。`,
            level
          );
          showPopup(
            `訂正案：${corrected_text}`, "safe"
          );
        } else {
          showPopup("安全な内容です。投稿を続行します。", level);

          const tweetButton = document.querySelector(selector);
          if (tweetButton) {
            // 訂正案があれば反映
            editor.innerText = corrected_text || text;
            // synthetic click（プログラム発行）
            tweetButton.click();
          } else {
            console.error("Tweet button not found.");
          }
        }
      } catch (error) {
        console.error('Error:', error);
        resolveLoadingPopup(popup, "エラーが発生しました", "fail");
      }
    }, true); // capture モード
  }
}

// observerを起動して監視する
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
