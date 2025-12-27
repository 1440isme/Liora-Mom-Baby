package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.service.MessageService;

import java.util.List;

@Controller
@RequestMapping("/api/admin/websocket")
@RequiredArgsConstructor
public class AdminChatController {

    private final MessageService messageService;

    @GetMapping("/chat-list")
    public String chatList(Model model) {
        List<String> rooms = messageService.findAllRooms();
        model.addAttribute("rooms", rooms);
        // addCurrentUserToModel(model); // nếu cần
        return "admin/websocket/chat-list";
    }

    // Nếu vẫn cần API, giữ lại:
    // @RestController hoặc tạo controller riêng cho API
    // @GetMapping("/api/admin/chat/rooms")
    // public @ResponseBody List<String> getRooms() {
    //     return messageService.findAllRooms();
    // }
}
