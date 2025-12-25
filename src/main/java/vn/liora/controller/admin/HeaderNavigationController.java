package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.HeaderNavigationItemRequest;
import vn.liora.dto.response.StaticPageResponse;
import vn.liora.entity.HeaderNavigationItem;
import vn.liora.enums.FooterLinkType;
import vn.liora.mapper.HeaderNavigationItemMapper;
import vn.liora.service.HeaderNavigationService;
import vn.liora.service.StaticPageService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin/header-bottom")
@PreAuthorize("hasAuthority('header.manage')")
public class HeaderNavigationController {

    @Autowired
    private HeaderNavigationService headerNavigationService;

    @Autowired
    private StaticPageService staticPageService;

    @Autowired
    private HeaderNavigationItemMapper headerNavigationItemMapper;

    @GetMapping
    public String headerBottomManagement(Model model) {
        List<HeaderNavigationItem> navigationItems = headerNavigationService.getAllActiveItems();
        List<StaticPageResponse> staticPages = staticPageService.getActiveStaticPages();

        model.addAttribute("navigationItems", navigationItems);
        model.addAttribute("staticPages", staticPages);
        model.addAttribute("headerNavigationRequest", new HeaderNavigationItemRequest());

        return "admin/header-bottom/manage";
    }

    @PostMapping("/save")
    @PreAuthorize("hasAuthority('header.manage')")
    public String saveHeaderNavigation(HttpServletRequest request) {
        try {
            List<HeaderNavigationItemRequest> navigationItems = new ArrayList<>();

            // Parse form parameters manually
            Map<String, String[]> parameterMap = request.getParameterMap();

            // Find max index
            int maxIndex = 0;
            for (String paramName : parameterMap.keySet()) {
                if (paramName.startsWith("navigationItems[") && paramName.contains("].title")) {
                    String indexStr = paramName.substring("navigationItems[".length(), paramName.indexOf("].title"));
                    try {
                        int index = Integer.parseInt(indexStr);
                        maxIndex = Math.max(maxIndex, index);
                    } catch (NumberFormatException e) {
                        // Skip invalid indices
                    }
                }
            }

            // Parse each item
            for (int i = 0; i <= maxIndex; i++) {
                String title = request.getParameter("navigationItems[" + i + "].title");

                if (title != null && !title.trim().isEmpty()) {
                    HeaderNavigationItemRequest item = new HeaderNavigationItemRequest();
                    item.setTitle(title);
                    item.setUrl(request.getParameter("navigationItems[" + i + "].url"));
                    item.setItemOrder(parseInt(request.getParameter("navigationItems[" + i + "].itemOrder"), 0));
                    item.setLinkType(parseLinkType(request.getParameter("navigationItems[" + i + "].linkType")));
                    item.setStaticPageId(parseLong(request.getParameter("navigationItems[" + i + "].staticPageId")));
                    item.setIsCategoryParent(
                            parseBoolean(request.getParameter("navigationItems[" + i + "].isCategoryParent"), false));
                    item.setParentItemId(parseLong(request.getParameter("navigationItems[" + i + "].parentItemId")));

                    // Parse sub-items for this item
                    List<HeaderNavigationItemRequest> subItems = parseSubItems(request, i);
                    item.setSubItems(subItems);

                    navigationItems.add(item);
                }
            }

            // Convert to entities using mapper
            List<HeaderNavigationItem> entities = headerNavigationItemMapper.toEntityList(navigationItems);

            // Save using service
            headerNavigationService.saveOrUpdateNavigationItems(entities);

            return "redirect:/admin/header-bottom";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/admin/header-bottom";
        }
    }

    private Integer parseInt(String value, Integer defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private Long parseLong(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean parseBoolean(String value, Boolean defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(value);
    }

    private FooterLinkType parseLinkType(String value) {
        if (value == null || value.trim().isEmpty()) {
            return FooterLinkType.INTERNAL;
        }
        try {
            return FooterLinkType.valueOf(value);
        } catch (IllegalArgumentException e) {
            return FooterLinkType.INTERNAL;
        }
    }

    @GetMapping("/preview")
    public String previewHeaderNavigation(Model model) {
        List<HeaderNavigationItem> navigationItems = headerNavigationService.getAllActiveItems();
        model.addAttribute("navigationItems", navigationItems);
        return "admin/header-bottom/preview";
    }

    @GetMapping("/init")
    public String initializeDefaultHeaderNavigation() {
        try {
            headerNavigationService.initializeDefaultNavigation();
            return "redirect:/admin/header-bottom";
        } catch (Exception e) {
            e.printStackTrace();
            return "redirect:/admin/header-bottom";
        }
    }

    private List<HeaderNavigationItemRequest> parseSubItems(HttpServletRequest request, int parentIndex) {
        List<HeaderNavigationItemRequest> subItems = new ArrayList<>();

        // Find max sub-item index for this parent
        int maxSubIndex = 0;
        Map<String, String[]> parameterMap = request.getParameterMap();

        for (String paramName : parameterMap.keySet()) {
            if (paramName.startsWith("navigationItems[" + parentIndex + "].subItems[")
                    && paramName.contains("].title")) {
                String indexStr = paramName.substring(
                        ("navigationItems[" + parentIndex + "].subItems[").length(),
                        paramName.indexOf("].title"));
                try {
                    int subIndex = Integer.parseInt(indexStr);
                    maxSubIndex = Math.max(maxSubIndex, subIndex);
                } catch (NumberFormatException e) {
                    // Skip invalid indices
                }
            }
        }

        // Parse each sub-item
        for (int j = 0; j <= maxSubIndex; j++) {
            String subTitle = request.getParameter("navigationItems[" + parentIndex + "].subItems[" + j + "].title");

            if (subTitle != null && !subTitle.trim().isEmpty()) {
                HeaderNavigationItemRequest subItem = new HeaderNavigationItemRequest();
                subItem.setTitle(subTitle);
                subItem.setUrl(request.getParameter("navigationItems[" + parentIndex + "].subItems[" + j + "].url"));
                subItem.setItemOrder(parseInt(
                        request.getParameter("navigationItems[" + parentIndex + "].subItems[" + j + "].itemOrder"),
                        j + 1));
                subItem.setLinkType(parseLinkType(
                        request.getParameter("navigationItems[" + parentIndex + "].subItems[" + j + "].linkType")));
                subItem.setStaticPageId(parseLong(
                        request.getParameter("navigationItems[" + parentIndex + "].subItems[" + j + "].staticPageId")));
                subItem.setIsCategoryParent(false);
                subItem.setParentItemId((long) parentIndex); // Temporary parent index

                subItems.add(subItem);
            }
        }

        return subItems;
    }
}
