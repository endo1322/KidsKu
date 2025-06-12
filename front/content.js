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


const hookConfigs = [
  // X (旧Twitter) 用
  {
    platform: "x",
    buttonSelector: '[data-testid="tweetButton"]',
    textareaSelector: '[data-testid="tweetTextarea_0"]'
  },
  {
    platform: "x",
    buttonSelector: '[data-testid="tweetButtonInline"]',
    textareaSelector: '[data-testid="tweetTextarea_0"]'
  },
  // YouTube のコメント投稿用
  {
    platform: "youtube",
    buttonSelector: 'button[aria-label="コメント"]',
    textareaSelector: 'div#contenteditable-root[contenteditable="true"]'
  },
  {
    platform: "youtube",
    buttonSelector: 'button[aria-label="返信"]',
    textareaSelector: 'div#contenteditable-root[contenteditable="true"]'
  },
  {
    platform: "youtube",
    buttonSelector: '#submit-button',
    textareaSelector: 'div#contenteditable-root[contenteditable="true"]'
  }
];


async function hookButton({ platform, buttonSelector, textareaSelector }) {
  const btn = document.querySelector(buttonSelector);
  if (!btn || btn.dataset.hooked) return;
  btn.dataset.hooked = "true";

  btn.addEventListener("click", async (e) => {
    if (!e.isTrusted) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    let editor;
    // プラットフォームごとに「コメント入力欄を探す」ロジックを切り替え
    if (platform === "youtube") {
      const formRoot = btn.closest("ytd-commentbox, ytd-comment-dialog-renderer");
      editor = formRoot
        ? formRoot.querySelector(textareaSelector)
        : document.querySelector(textareaSelector);
    } else {
      // X 用（従来どおり）
      editor = document.querySelector(textareaSelector);
    }

    const text = editor?.innerText.trim() || "";
    const popup = showLoadingPopup("AIが内容をチェックするね…");

    try {
      const { threadId, config } = await chrome.storage.local.get([
        "threadId",
        "config",
      ]);
      const res = await fetch(`${config.API_URL}/threads/${threadId}/runs/wait`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_id: config.ASSISTANT_ID,
          input: { user_request: text },
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      popup.remove();

      // --- 以下、既存のレベル判定・投稿ロジック ---
      const { level, response } = data;
      if (level === "danger") {
        showPopup("この投稿、あとで後悔しないかな？\nいったん落ち着いて考えてみよう", level);
      } else if (level === "warning") {
        showPopup("この投稿、本当に大丈夫かな？\nこう直すともっとよくなるかも!", level);
      } else {
        showPopup("いい内容だね！投稿するね！", level);
        // 本来のクリックを再発行
        btn.click();
      }
    } catch (err) {
      resolveLoadingPopup(popup, "エラーが発生しました", "fail");
      console.error(err);
    }
  }, true);
}

function observeButtons() {
  const observer = new MutationObserver(() => {
    hookConfigs.forEach(cfg => hookButton(cfg));
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

observeButtons();
