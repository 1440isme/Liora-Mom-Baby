package vn.liora.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CheckoutController {

    @GetMapping("/checkout")
    public String showCheckoutPage() {
      return "user/checkout/view-checkout";
    }
}
