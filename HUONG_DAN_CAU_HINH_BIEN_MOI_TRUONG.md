# 🔧 Hướng Dẫn Cấu Hình Biến Môi Trường

## ❌ Lỗi Gặp Phải

```
Could not resolve placeholder 'JWT_SIGNER_KEY' in value "${JWT_SIGNER_KEY}"
```

## ✅ Giải Pháp

### Cách 1: Đặt Biến Môi Trường trong IntelliJ IDEA (Khuyến nghị)

1. **Mở Run Configuration:**
   - Click vào dropdown bên cạnh nút Run (hoặc Debug)
   - Chọn **"Edit Configurations..."**

2. **Thêm Environment Variables:**
   - Trong cửa sổ Run/Debug Configurations
   - Tìm phần **"Environment variables"**
   - Click vào biểu tượng **"..."** để mở editor

3. **Thêm các biến sau:**
   ```
   JWT_SIGNER_KEY=LioraSecretKey123456789012345678901234567890
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_app_password
   ```

4. **Lưu và chạy lại ứng dụng**

### Cách 2: Đặt Biến Môi Trường Hệ Thống (Windows)

#### Tạm thời (chỉ cho session hiện tại):
```cmd
set JWT_SIGNER_KEY=LioraSecretKey123456789012345678901234567890
set GOOGLE_CLIENT_ID=your_google_client_id
set GOOGLE_CLIENT_SECRET=your_google_client_secret
set MAIL_USERNAME=your_email@gmail.com
set MAIL_PASSWORD=your_app_password
```

#### Vĩnh viễn:
1. Mở **System Properties** → **Environment Variables**
2. Thêm các biến vào **User variables** hoặc **System variables**
3. Khởi động lại IntelliJ IDEA

### Cách 3: Tạo File .env (Nếu dùng spring-dotenv)

Tạo file `.env` trong thư mục gốc của project:

```env
JWT_SIGNER_KEY=LioraSecretKey123456789012345678901234567890
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

## 📝 Lưu Ý

- **JWT_SIGNER_KEY**: Nên là chuỗi dài ít nhất 32 ký tự để đảm bảo bảo mật
- **GOOGLE_CLIENT_ID/SECRET**: Chỉ cần nếu bạn muốn dùng Google OAuth login
- **MAIL_USERNAME/PASSWORD**: Chỉ cần nếu bạn muốn gửi email. Với Gmail, cần dùng **App Password**, không phải mật khẩu thường.

## 🔒 Bảo Mật

⚠️ **QUAN TRỌNG**: 
- Không commit file `.env` hoặc `application.properties` có chứa thông tin nhạy cảm lên Git
- Sử dụng giá trị mặc định chỉ cho môi trường development
- Production nên dùng biến môi trường hoặc secret management service





