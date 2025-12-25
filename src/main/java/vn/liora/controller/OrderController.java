package vn.liora.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.service.IOrderService;

import java.util.List;

@Controller
@RequestMapping
@Slf4j
public class OrderController {

    @Autowired
    private IOrderService orderService;

    @GetMapping("/orders")
    public String listOrders() {
        return "admin/orders/list";
    }

    @GetMapping("/orders/detail/{id}")
    public String orderDetail(@PathVariable("id") Long id, Model model) {
        model.addAttribute("orderId", id);
        return "admin/orders/detail";
    }

    @GetMapping("/api/orders/{orderId}/items")
    public ResponseEntity<List<OrderProductResponse>> getOrderItems(@PathVariable Long orderId) {
        try {
            List<OrderProductResponse> responses = orderService.getProductsByOrderId(orderId);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error loading order items: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
