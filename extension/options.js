const input = document.getElementById("server");
const status = document.getElementById("status");

chrome.storage.sync.get("server").then(({ server }) => {
  input.value = server || "http://localhost:4610";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({ server: input.value.trim().replace(/\/$/, "") });
  status.textContent = "saved";
  setTimeout(() => { status.textContent = ""; }, 1500);
});
