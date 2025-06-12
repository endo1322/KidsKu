/*
    warning/alertのスタイル設定
*/


let toggle = true; // このtoggle変数は現在使用されていませんが、将来的に必要であれば残しておきます。

// triggerPopup 関数は、APIからの結果を受け取ることを想定してメッセージパッシングを実装する予定なので、
// ここでは仮のシンプルな呼び出しにとどめます。
// 修正: type引数を追加し、showPopupに渡す
function triggerPopup(message, type = "warn") {
  showPopup(message, type);
}

function showPopup(message, type = "info") {
  // 既存のポップアップを削除して、新しいものを作成する
  const existingPopup = document.querySelector(".popup-toast");
  if (existingPopup) {
    existingPopup.remove();
  }

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

  if (type === "warn") {
    backgroundColor = "#ffc107";
    textColor = "#212529";
    borderColor = "#d39e00";
  } else if (type === "alert") {
    backgroundColor = "#dc3545";
    textColor = "#ffffff";
    borderColor = "#b02a37";
  } else { // info (default)
    backgroundColor = "#007bff"; // Blue for info
    textColor = "#ffffff";
    borderColor = "#0056b3";
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


/*
    ボタン押下時の機能
*/
/**
 * ボタンにイベントリスナーをフックする汎用関数
 * @param {HTMLElement} button - 監視対象のボタン要素
 * @param {string} textareaSelector - 投稿テキストを取得するtextareaまたはcontenteditable divのCSSセレクタ
 */
// 修正: hookButtonが引数としてbutton要素とtextareaSelectorを受け取るように変更
function hookButton(button, textareaSelector) {
  // 既にフックされているかチェック（多重フック防止）
  if (button.dataset.snsCheckerHooked === "true") {
    return;
  }
  button.dataset.snsCheckerHooked = "true"; // フック済みマークをセット

  button.addEventListener("click", async (e) => {
    const editor = document.querySelector(textareaSelector);
    let text = "";
    if (editor) {
      // textareaの場合は.value、contenteditableのdivの場合は.innerTextを使う
      text = editor.value !== undefined ? editor.value : editor.innerText || "";
    }

    e.preventDefault(); // デフォルト動作のキャンセル
    e.stopImmediatePropagation(); // 他のイベントリスナーを実行させない

    // ここでLLMチェックのロジックを呼び出す
    // 現状はpopup.jsにLLM呼び出しがあるため、メッセージパッシングでpopup.jsにテキストを渡すのが理想的
    // 簡単のため、ここでは仮のチェック処理を直接呼び出す
    if (text.trim() === '') {
        triggerPopup('投稿内容が空です。', 'warn');
    } else if (text.includes("禁止ワード")) { // 仮の禁止ワードチェック
        triggerPopup('投稿内容に不適切な表現が含まれている可能性があります。投稿を見直してください。', 'alert');
    } else {
        triggerPopup('投稿内容に問題は見つかりませんでした。', 'info'); // 問題ない場合の表示
    }
  }, true); // capture: true でより確実にイベントを捕捉
}

/**
 * 監視対象のボタンとテキストエリアのセレクタペアを定義し、DOM変更を監視してフックするメイン関数
 */
// 修正: observeButtonsは引数なしで、内部でtargetsを定義・処理するように変更
function observeButtons() {
  // 監視対象のボタンとテキストエリアのペアを定義
  const observationTargets = [
    // X (旧Twitter) のボタン
    { buttonSelector: '[data-testid="tweetButton"]', textareaSelector: '[data-testid="tweetTextarea_0"]' },
    { buttonSelector: '[data-testid="tweetButtonInline"]', textareaSelector: '[data-testid="tweetTextarea_0"]' },

    // YouTube のコメント投稿ボタン
    // スクリーンショットから特定したセレクタを使用
    { buttonSelector: 'button[aria-label="コメント"]', textareaSelector: 'yt-formatted-string[id="contenteditable-root"]' },
    { buttonSelector: 'button[aria-label="返信"]', textareaSelector: 'yt-formatted-string[id="contenteditable-root"]' },
    { buttonSelector: '#submit-button', textareaSelector: 'yt-formatted-string[id="contenteditable-root"]' }, // 一般的なYouTubeコメントのセレクタ
  ];

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // 要素ノードの場合
            observationTargets.forEach(target => {
              // 追加されたノードがボタン自身であるか
              if (node.matches(target.buttonSelector) && !node.dataset.snsCheckerHooked) {
                hookButton(node, target.textareaSelector);
              }
              // 追加されたノードの子孫にボタンが含まれるか
              const foundButtons = node.querySelectorAll(target.buttonSelector);
              foundButtons.forEach(button => {
                if (!button.dataset.snsCheckerHooked) {
                  hookButton(button, target.textareaSelector);
                }
              });
            });
          }
        });
      }
    });
  });

  // ページの初期ロード時に存在するボタンもフックする
  observationTargets.forEach(target => {
      const initialButtons = document.querySelectorAll(target.buttonSelector);
      initialButtons.forEach(button => {
          if (!button.dataset.snsCheckerHooked) {
              hookButton(button, target.textareaSelector);
          }
      });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 監視を開始
observeButtons();
