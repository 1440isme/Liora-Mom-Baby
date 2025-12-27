package vn.liora.service.impl;

import org.springframework.data.domain.PageRequest;
import vn.liora.entity.Message;
import vn.liora.repository.MessageRepository;
import vn.liora.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;

    @Override
    public Message save(Message message) {
        return messageRepository.save(message);
    }

    @Override
    public List<Message> findRecentByRoom(String roomId, int limit) {
        return messageRepository.findByRoomIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(0, limit)
        );
    }

    @Override
    public List<String> findAllRooms() {
        return messageRepository.findDistinctRoomIds();
    }
}
