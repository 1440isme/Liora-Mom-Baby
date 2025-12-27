package vn.liora.repository;

import org.springframework.data.domain.Pageable;
import vn.liora.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m FROM Message m
        WHERE m.roomId = :roomId
        ORDER BY m.createdAt DESC
    """)
    List<Message> findRecentByRoom(String roomId);

    List<Message> findByRoomIdOrderByCreatedAtDesc(
            String roomId,
            Pageable pageable
    );

    @Query("SELECT m.roomId FROM Message m GROUP BY m.roomId ORDER BY MAX(m.createdAt) DESC")
    List<String> findDistinctRoomIds();
    
}
