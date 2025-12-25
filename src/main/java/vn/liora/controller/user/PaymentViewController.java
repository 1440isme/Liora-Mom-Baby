package vn.liora.controller.user;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/payment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentViewController {

    @GetMapping("/result")
    public String paymentResult(@RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "orderRef", required = false) String orderRef,
            @RequestParam(name = "orderId", required = false) String orderId,
            @RequestParam(name = "bank", required = false) String bank,
            @RequestParam(name = "amount", required = false) String amount,
            @RequestParam(name = "message", required = false) String message,
            @RequestParam(name = "transId", required = false) String transId,
            Model model) {
        model.addAttribute("code", code);
        model.addAttribute("orderRef", orderRef);
        model.addAttribute("orderId", orderId);
        model.addAttribute("bank", bank);
        model.addAttribute("amount", amount);
        model.addAttribute("message", message);
        model.addAttribute("transId", transId);
        return "user/payment/payment-result";
    }
}
