// popupHandler.js

let toggle = true;

export function triggerPopup(message) {
  const type = toggle ? "warn" : "alert";
  showPopup(message, type);
  toggle = !toggle;
}

export function showPopup(message, type = "info") {
  if (document.querySelector("#my-popup")) return;

  const div = document.createElement("div");
  div.id = "my-popup";
  div.textContent = message;

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
  }

  Object.assign(div.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: backgroundColor,
    color: textColor,
    padding: "1em",
    border: `2px solid ${borderColor}`,
    zIndex: 9999,
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    fontWeight: "bold",
  });

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}
