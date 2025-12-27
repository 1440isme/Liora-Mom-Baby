package vn.liora.service;

import vn.liora.dto.response.ChatRoomInfo;
import vn.liora.entity.Message;

import java.util.List;

public interface MessageService {

    Message save(Message message);

    List<Message> findRecentByRoom(String roomId, int limit);

    List<String> findAllRooms();
    
    List<ChatRoomInfo> findAllRoomsWithUserInfo();
}
