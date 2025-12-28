# 🛒 Liora Mom & Baby - E-Commerce Platform

<div align="center">

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-blue.svg)](https://maven.apache.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Nền tảng thương mại điện tử chuyên về sản phẩm mẹ và bé được xây dựng với Spring Boot**

[Giới thiệu](#-giới-thiệu) • [Tính năng](#-tính-năng) • [Cài đặt](#-cài-đặt) • [Tài liệu](#-tài-liệu) • [Đóng góp](#-đóng-góp)

</div>

---

## 📖 Giới thiệu

**Liora Mom & Baby** là nền tảng thương mại điện tử toàn diện chuyên cung cấp các sản phẩm chăm sóc sức khỏe và làm đẹp cho mẹ và bé. Dự án được xây dựng bằng **Spring Boot Framework** sử dụng kiến trúc 3 lớp (Controller-Service-Repository), tích hợp đầy đủ các cổng thanh toán, dịch vụ vận chuyển và hỗ trợ khách hàng bằng AI.

## ⚡ Tính năng

### 🛒 Module Người dùng (User Module)

| Tính năng | Mô tả |
|-----------|-------|
| 🛍️ **Mua sắm trực tuyến** | Giao diện thân thiện với thiết kế UX/UI hiện đại |
| 🔍 **Tìm kiếm & Lọc** | Tìm kiếm thông minh với bộ lọc đa tiêu chí (giá, thương hiệu, danh mục) |
| 🛒 **Giỏ hàng & Thanh toán** | Quy trình thanh toán được tối ưu với xác thực toàn diện |
| 💳 **Nhiều phương thức thanh toán** | Hỗ trợ COD, VNPay, MOMO |
| 📦 **Theo dõi đơn hàng** | Theo dõi thời gian thực với cập nhật trạng thái tự động |
| ⭐ **Đánh giá & Xếp hạng** | Hệ thống đánh giá sản phẩm với bình luận và hình ảnh |
| 🤖 **AI Chatbot** | Hỗ trợ khách hàng 24/7 với Google Gemini AI |
| 🔐 **OAuth 2.0** | Đăng nhập xã hội với Google |
| 💰 **Ví tiền & Điểm tích lũy (Xu)** | Hệ thống tích điểm 0.1% giá trị đơn hàng, sử dụng Xu để thanh toán |
| 🔄 **Yêu cầu đổi trả** | Tạo và quản lý yêu cầu đổi trả hàng |
| 📍 **Quản lý địa chỉ** | Lưu nhiều địa chỉ giao hàng, đặt địa chỉ mặc định |
| 👁️ **Sản phẩm đã xem** | Lưu lịch sử sản phẩm đã xem |
| 📄 **Trang tĩnh** | Xem các trang thông tin như "Về chúng tôi", "Chính sách" |

### ⚙️ Module Quản trị (Admin Module)

| Tính năng | Mô tả |
|-----------|-------|
| 📊 **Bảng điều khiển Analytics** | Thống kê doanh thu và đơn hàng với biểu đồ trực quan |
| 📈 **Báo cáo đa chiều** | Xuất báo cáo chi tiết theo thời gian, sản phẩm, khách hàng |
| 🎯 **Quản lý sản phẩm** | CRUD với tự động upload ảnh, quản lý biến thể, tối ưu hình ảnh |
| 👥 **Quản lý người dùng** | Quản lý khách hàng với quyền chi tiết |
| 🚚 **Tích hợp GHN** | Tự động tạo đơn vận chuyển với GHN Express |
| 🎨 **Quản lý Banner** | Tạo và chỉnh sửa banner quảng cáo |
| 💰 **Quản lý Mã giảm giá** | Tạo, áp dụng và theo dõi mã giảm giá |
| 🔐 **Kiểm soát truy cập dựa trên vai trò** | Hệ thống phân quyền chi tiết với Spring Security |
| 📝 **Quản lý Đánh giá** | Duyệt, ẩn/hiện đánh giá sản phẩm |
| 🔄 **Quản lý Yêu cầu đổi trả** | Xử lý yêu cầu đổi trả hàng từ khách hàng |
| 💳 **Quản lý Ví tiền** | Xem và quản lý ví tiền của khách hàng |
| 🏠 **Quản lý Header/Footer** | Tùy chỉnh menu điều hướng và footer |
| 📄 **Quản lý Trang tĩnh** | Tạo và quản lý các trang thông tin |

## 🛠️ Công nghệ sử dụng

### Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Spring Boot | 3.5.6 | Framework chính |
| Spring Security | 6.x | Xác thực & Phân quyền |
| Spring Data JPA | 3.x | ORM Database |
| Thymeleaf | 3.x | Template Engine phía server |
| MapStruct | 1.6.3 | Mapping DTO |
| Lombok | Latest | Giảm boilerplate code |
| OAuth2 Client | 3.x | Đăng nhập xã hội |
| Spring Mail | 3.x | Dịch vụ Email |
| JWT | - | Xác thực token |

### Frontend

- **Bootstrap 5** - Framework CSS responsive
- **JavaScript ES6+** - Logic phía client
- **Chart.js** - Trực quan hóa dữ liệu
- **Material Design Icons** - Thư viện icon
- **Custom CSS** - Styling theo theme

### Database

- **Microsoft SQL Server 2019+** - Database sản xuất
- **H2 Database** - Phát triển & Testing

### Tích hợp bên thứ ba

- **💳 VNPay** - Tích hợp cổng thanh toán
- **💳 MOMO** - Thanh toán di động
- **🚚 GHN Express** - Tích hợp vận chuyển
- **🤖 Google Gemini AI** - AI Chatbot
- **🔐 Google OAuth** - Xác thực xã hội

## 🚀 Cài đặt

### Yêu cầu hệ thống

- ☕ **Java** 21 trở lên
- 🛠️ **Maven** 3.6+
- 🗄️ **SQL Server** 2019+ hoặc SQL Server Express
- 💻 **IDE** (IntelliJ IDEA / Eclipse / VS Code)

### Hướng dẫn cài đặt

#### 1. Clone Repository

```bash
git clone https://github.com/1440isme/Liora.git
cd Liora
```

#### 2. Cấu hình Database

Tạo database mới trong SQL Server:

```sql
CREATE DATABASE LioraDB;
```

Cập nhật thông tin kết nối trong `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=LioraDB
spring.datasource.username=your_username
spring.datasource.password=your_password
```

#### 3. Cấu hình API Keys

Cập nhật API keys trong `application.properties`:

**VNPay:**
```properties
vnpay.tmnCode=your_tmn_code
vnpay.hashSecret=your_hash_secret
```

**MOMO:**
```properties
momo.partnerCode=your_partner_code
momo.accessKey=your_access_key
momo.secretKey=your_secret_key
```

**GHN Express:**
```properties
ghn.api.token=your_ghn_token
ghn.api.shop-id=your_shop_id
ghn.api.service-id=your_service_id
ghn.api.from-district-id=your_district_id
ghn.api.from-ward-code=your_ward_code
```

**Google Services:**
```properties
spring.security.oauth2.client.registration.google.client-id=your_google_client_id
spring.security.oauth2.client.registration.google.client-secret=your_google_client_secret
google.gemini.api.key=your_gemini_api_key
```

**Email:**
```properties
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

**JWT:**
```properties
jwt.signerKey=${JWT_SIGNER_KEY}
```

> 💡 **Lưu ý:** Các giá trị cấu hình như API keys, mật khẩu nên được đặt trong file `.env` hoặc biến môi trường trong môi trường sản xuất.

#### 4. Build và Chạy

```bash
# Build project
mvn clean install

# Chạy ứng dụng
mvn spring-boot:run

# Hoặc chạy trực tiếp từ IDE
# Chạy LioraApplication.java
```

### 📱 Truy cập hệ thống

- **🌐 Website chính:** http://localhost:8080
- **⚙️ Admin Panel:** http://localhost:8080/admin
- **📊 Dashboard:** http://localhost:8080/admin/dashboard

### 👤 Tài khoản mặc định

Sau lần chạy đầu tiên, bạn có thể tạo tài khoản admin thông qua giao diện đăng ký hoặc truy vấn trực tiếp database.

## 📚 Tài liệu

- 📖 [Chính sách hoạt động](docs/CHINH_SACH_HOAT_DONG.md) - Tài liệu chính sách và quy định chi tiết
- 📄 [Về chúng tôi](docs/VE_CHUNG_TOI.md) - Giới thiệu về Liora Mom & Baby
- 🔧 [Hướng dẫn cài đặt](INSTALLATION_GUIDE.md) - Hướng dẫn cài đặt chi tiết
- 🔌 [API Documentation](docs/api.md) - Tài liệu API endpoints
- 🗄️ [Database Schema](docs/database.md) - Sơ đồ database

## 🏗️ Kiến trúc hệ thống

Dự án được tổ chức theo mô hình **Layered Architecture** chuẩn:

```
src/main/java/vn/liora/
├── annotation/          # Custom Annotations (@RequirePermission, etc.)
├── config/              # Spring Configuration Classes
│   ├── SecurityConfig.java
│   ├── WebMvcConfig.java
│   └── StorageProperties.java
├── controller/          # Web Controllers (REST & MVC)
│   ├── admin/           # Admin Controllers (20+ controllers)
│   ├── user/            # User Controllers (15+ controllers)
│   ├── auth/            # Authentication Controllers
│   └── api/             # REST API Controllers
├── dto/                 # Data Transfer Objects (80+ DTOs)
├── entity/              # JPA Entities (29 entities)
├── enums/               # Enum Classes
├── exception/           # Custom Exceptions
├── mapper/              # MapStruct Mappers (16 mappers)
├── repository/          # JPA Repositories (29 repos)
├── service/             # Business Logic Layer (58 services)
├── util/                # Utility Classes
└── validator/           # Custom Validators
```

### Tổng quan kiến trúc

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                 │
│  (Thymeleaf Templates + JavaScript + CSS)   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Controller Layer                  │
│    (Spring MVC + REST Controllers)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Service Layer                    │
│          (Business Logic)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Repository Layer                    │
│          (Spring Data JPA)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Database Layer                     │
│       (Microsoft SQL Server)                │
└─────────────────────────────────────────────┘
```

## ⚙️ Cấu hình

### File cấu hình chính

File `src/main/resources/application.properties` chứa tất cả cấu hình của dự án:

```properties
# ==================== Database ====================
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=LioraDB
spring.datasource.username=sa
spring.datasource.password=your_password

# ==================== JPA Configuration ====================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# ==================== File Upload ====================
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
storage.location=./uploads

# ==================== Image Optimization ====================
image.optimization.max-width=1200
image.optimization.max-height=1200
image.optimization.thumbnail-size=300
image.optimization.quality=0.8

# ==================== Email Configuration ====================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# ==================== Security ====================
jwt.signerKey=${JWT_SIGNER_KEY}
jwt.valid-duration=3600
jwt.refreshable-duration=36000

# ==================== Payment Gateways ====================
# VNPay
vnpay.tmnCode=your_tmn_code
vnpay.hashSecret=your_hash_secret
vnpay.payUrl=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# MOMO
momo.partnerCode=your_partner_code
momo.accessKey=your_access_key
momo.secretKey=your_secret_key

# ==================== Shipping ====================
# GHN Express
ghn.api.base-url=https://dev-online-gateway.ghn.vn/shiip/public-api
ghn.api.token=your_ghn_token
ghn.api.shop-id=your_shop_id
ghn.api.service-id=your_service_id
ghn.api.from-district-id=your_district_id
ghn.api.from-ward-code=your_ward_code

# ==================== OAuth2 ====================
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}

# ==================== AI Integration ====================
google.gemini.api.key=${GOOGLE_GEMINI_API_KEY}
```

## 📊 Thống kê dự án

### Thống kê mã nguồn

| Loại | Số lượng | Mô tả |
|------|----------|-------|
| 📦 **Entities** | 29 | JPA Entities với relationships |
| 🔧 **Repositories** | 29 | Spring Data JPA Repositories |
| ⚙️ **Services** | 58 | Business Logic Layer |
| 🎮 **Controllers** | 53+ | REST & Web Controllers |
| 🔄 **DTOs** | 80+ | Data Transfer Objects |
| 🗺️ **Mappers** | 16 | MapStruct Mappers |
| 📄 **Templates** | 100+ | Thymeleaf HTML Templates |
| 🎨 **CSS Files** | 17+ | Custom Styling |
| 📜 **JavaScript** | 49+ | Client-side Logic |
| 🗄️ **Database Tables** | 29+ | Tables với relationships |

### Tính năng chính

- ✅ **Tích hợp Thanh toán:** VNPay, MOMO
- ✅ **Tích hợp Vận chuyển:** GHN Express
- ✅ **Tích hợp AI:** Google Gemini Chatbot
- ✅ **Đăng nhập xã hội:** Google OAuth 2.0
- ✅ **Kiểm soát truy cập:** Role-Based Access Control với Spring Security
- ✅ **Upload File:** Hệ thống lưu trữ file với tối ưu hình ảnh tự động
- ✅ **Dịch vụ Email:** Tích hợp Spring Mail
- ✅ **Bảng điều khiển Analytics:** Tích hợp Chart.js
- ✅ **Hệ thống Ví tiền:** Tích điểm và thanh toán bằng Xu
- ✅ **Quản lý Đổi trả:** Xử lý yêu cầu đổi trả hàng
- ✅ **Quản lý Nội dung:** Header/Footer, Banner, Trang tĩnh

## 🧪 Testing

### Chạy Tests

```bash
# Chạy tất cả unit tests
mvn test

# Chạy test với code coverage
mvn test jacoco:report
# Xem báo cáo tại: target/site/jacoco/index.html

# Chạy integration tests
mvn verify

# Chạy test cho một class cụ thể
mvn test -Dtest=ProductServiceTest
```

### Test Coverage

Dự án sử dụng **JaCoCo** để theo dõi code coverage. Báo cáo coverage được tự động tạo sau khi chạy tests.

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! Các bước để đóng góp:

1. **Fork** repository này
2. Tạo **feature branch** mới (`git checkout -b feature/AmazingFeature`)
3. **Commit** các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. **Push** lên branch (`git push origin feature/AmazingFeature`)
5. Mở một **Pull Request** mới

### 📋 Hướng dẫn

- Tuân theo quy ước coding của dự án
- Viết unit tests cho code mới
- Cập nhật tài liệu nếu cần
- Sử dụng commit message rõ ràng

## 📄 License

Dự án này được phân phối dưới **MIT License**. Xem file [LICENSE](LICENSE) để biết chi tiết.

## 👥 Tác giả

| Tên | Mã số sinh viên |
|-----|----------------|
| **Trương Công Bình** | 23110184 |
| **Trần Lê Quốc Đại** | 23110201 |
| **Ninh Thị Mỹ Hạnh** | 23110210 |
| **Đoàn Quang Khôi** | 23110244 |

## 📞 Liên hệ

<div align="center">

| Kênh | Liên kết |
|------|----------|
| 📧 **Email** | support@liora.com |
| 🌐 **Website** | [liora.azurewebsites.net](https://liora.azurewebsites.net/) |
| 💻 **GitHub** | [github.com/1440isme/Liora](https://github.com/1440isme/Liora) |

</div>

---

<div align="center">

### Made with ❤️ by Liora Mom & Baby Team

![Spring Boot](https://img.shields.io/badge/Built%20with-Spring%20Boot-brightgreen)
![Java](https://img.shields.io/badge/Powered%20by-Java-orange)
![Stars](https://img.shields.io/github/stars/1440isme/Liora?style=social)

⭐ **Star** dự án này nếu bạn thấy hữu ích!

</div>
