// ===== MOCK DATA =====
const rooms = [
    {
        roomId: "room_101",
        lastMessage: "Khách hỏi về đơn hàng",
        unreadCount: 3,
        online: true
    },
    {
        roomId: "room_102",
        lastMessage: "Cần hỗ trợ thanh toán",
        unreadCount: 0,
        online: false
    },
    {
        roomId: "room_103",
        lastMessage: "Xin tư vấn sản phẩm",
        unreadCount: 1,
        online: true
    }
];

// ===== RENDER =====
function renderRooms() {
    const list = document.getElementById("roomList");
    list.innerHTML = "";

    rooms.forEach(room => {
        const li = document.createElement("li");
        li.className = "room-item";
        li.onclick = () => openRoom(room.roomId);

        li.innerHTML = `
            <div class="room-info">
                <span class="room-name">Room: ${room.roomId}</span>
                <span class="last-message">${room.lastMessage}</span>
            </div>

            <div class="room-meta">
                ${room.unreadCount > 0 ? `<span class="unread">${room.unreadCount}</span>` : ""}
                <span class="status ${room.online ? "online" : "offline"}"></span>
            </div>
        `;

        list.appendChild(li);
    });
}

// ===== NAVIGATE =====
function openRoom(roomId) {
    // JSP / Spring MVC có thể đổi thành:
    // window.location.href = `/admin/chat/room?room=${roomId}`;
    window.location.href = `chat-room.html?room=${roomId}`;
}

// Init
renderRooms();
