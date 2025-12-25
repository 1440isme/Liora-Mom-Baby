package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vn.liora.service.ChatbotDataService;


@Controller
public class ChatbotController {

    @Autowired
    private ChatbotDataService dataService;

    @GetMapping("/api/chatbot/data")
    @ResponseBody
    public ResponseEntity<String> getDatabaseData() {
        try {
            String data = dataService.getCompleteDatabaseContext();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.ok("Lỗi khi load dữ liệu: " + e.getMessage());
        }
    }

    @GetMapping("/api/chatbot/products")
    @ResponseBody
    public ResponseEntity<String> getProductsData() {
        try {
            String data = dataService.getProductsSummary();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.ok("Lỗi khi load sản phẩm: " + e.getMessage());
        }
    }

}
