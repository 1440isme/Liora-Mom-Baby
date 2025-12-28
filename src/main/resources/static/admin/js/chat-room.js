let socket;
let roomId;

// ===== INIT =====
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    roomId = params.get("room");
    document.getElementById("roomId").innerText = roomId;

    connectWebSocket(roomId);
};

// ===== WEBSOCKET =====
function connectWebSocket(roomId) {
    socket = new WebSocket(`ws://localhost:8080/ws/chat/${roomId}`);

    socket.onopen = () => {
        console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    socket.onclose = () => {
        console.log("WebSocket disconnected");
    };
}

// ===== HANDLE MESSAGE =====
function handleMessage(data) {
    switch (data.type) {
        case "HISTORY":
            data.messages.forEach(renderMessage);
            break;
        case "CHAT":
            renderMessage(data);
            break;
        case "JOIN":
            renderSystem(`${data.senderName} đã tham gia`);
            break;
        case "LEAVE":
            renderSystem(`${data.senderName} đã rời phòng`);
            break;
    }
}

// ===== SEND MESSAGE =====
function sendMessage() {
    const input = document.getElementById("messageInput");
    const content = input.value.trim();
    if (!content) return;

    socket.send(JSON.stringify({
        content: content,
        imageUrl: ""
    }));

    input.value = "";
}

// ===== RENDER =====
function renderMessage(msg) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");

    const isAdmin = msg.role && msg.role.includes("ADMIN");

    div.className = `mb-2 ${isAdmin ? "text-right" : ""}`;
    div.innerHTML = `
        <div class="p-2 ${isAdmin ? "bg-primary text-white" : "bg-light"}"
             style="display:inline-block; border-radius:6px; max-width:70%;">
            <strong>${msg.senderName}</strong><br>
            ${msg.content || ""}
        </div>
    `;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function renderSystem(text) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "text-center text-muted mb-2";
    div.innerText = text;
    box.appendChild(div);
}
