document.getElementById("checkBtn").addEventListener("click", async () => {
  const text = document.getElementById("postText").value;
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = "チェック中...";

  try {
    // Get API key from storage
    chrome.storage.sync.get('openaiApiKey', async (data) => {
      const apiKey = data.openaiApiKey;

      if (!apiKey) {
        resultDiv.textContent = "エラー: OpenAI APIキーが設定されていません。拡張機能のオプションページで設定してください。";
        return;
      }

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "ユーザーの投稿内容をチェックし、問題点があれば指摘してください。" },
              { role: "user", content: text }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`APIエラー: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        resultDiv.textContent = data.choices[0].message.content;
      } catch (fetchError) {
        resultDiv.textContent = "API呼び出し中にエラーが発生しました: " + fetchError.message;
      }
    });
  } catch (storageError) {
    resultDiv.textContent = "ストレージからのAPIキー取得中にエラーが発生しました: " + storageError.message;
  }
});
