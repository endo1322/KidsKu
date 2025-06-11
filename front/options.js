document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('openaiApiKey');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');

  // Load saved API key
  chrome.storage.sync.get('openaiApiKey', (data) => {
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }
  });

  // Save API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      statusDiv.textContent = 'APIキーを保存しました。';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
