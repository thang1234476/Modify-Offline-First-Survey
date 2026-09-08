const statusEl = document.querySelector("#network-status");

function updateNetworkStatus() {
    statusEl.textContent = navigator.onLine
        ? "Trạng thái: ONLINE"
        : "Trạng thái: OFFLINE";
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

updateNetworkStatus();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            console.log("Service Worker registered:", registration.scope);
        } catch (error) {
            console.error("Service Worker registration failed:", error);
        }
    });
}