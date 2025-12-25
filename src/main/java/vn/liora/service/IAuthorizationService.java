package vn.liora.service;

import vn.liora.entity.User;

import java.util.List;
import java.util.Set;

public interface IAuthorizationService {

    /**
     * Kiểm tra xem user có quyền thực hiện action không
     * 
     * @param user       User cần kiểm tra
     * @param permission Tên quyền cần kiểm tra
     * @return true nếu có quyền, false nếu không
     */
    boolean hasPermission(User user, String permission);

    /**
     * Kiểm tra xem user có bất kỳ quyền nào trong danh sách không
     * 
     * @param user        User cần kiểm tra
     * @param permissions Danh sách quyền cần kiểm tra
     * @return true nếu có ít nhất 1 quyền, false nếu không có quyền nào
     */
    boolean hasAnyPermission(User user, String... permissions);

    /**
     * Kiểm tra xem user có tất cả quyền trong danh sách không
     * 
     * @param user        User cần kiểm tra
     * @param permissions Danh sách quyền cần kiểm tra
     * @return true nếu có tất cả quyền, false nếu thiếu ít nhất 1 quyền
     */
    boolean hasAllPermissions(User user, String... permissions);

    /**
     * Lấy tất cả quyền của user (từ role + quyền trực tiếp)
     * 
     * @param user User cần lấy quyền
     * @return Set các quyền của user
     */
    Set<String> getUserPermissions(User user);

    /**
     * Lấy tất cả quyền của user theo danh mục
     * 
     * @param user User cần lấy quyền
     * @return Map với key là category, value là danh sách quyền
     */
    java.util.Map<vn.liora.enums.PermissionCategory, List<String>> getUserPermissionsByCategory(User user);
}
