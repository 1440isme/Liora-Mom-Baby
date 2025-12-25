# 💅 Liora Beauty - E-Commerce Platform

<div align="center">

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-blue.svg)](https://maven.apache.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**An e-commerce platform specializing in beauty and skincare products built with Spring Boot**

[Introduction](#-introduction) • [Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Introduction

**Liora Beauty** is a comprehensive e-commerce platform specializing in beauty and skincare products. The project is built with **Spring Boot Framework** using a 3-layer architecture (Controller-Service-Repository), fully integrated with payment gateways, shipping services, and AI-powered customer support.

## ⚡ Features

### 🛒 User Module
| Feature | Description |
|-----------|-------|
| 🛍️ **Online Shopping** | User-friendly interface with modern UX/UI design |
| 🔍 **Search & Filter** | Smart search with multi-criteria filtering (price, brand, category) |
| 🛒 **Cart & Checkout** | Optimized checkout process with comprehensive validation |
| 💳 **Multiple Payment Methods** | Support for COD, VNPay, MOMO Integration |
| 📦 **Order Tracking** | Real-time tracking with automatic status updates |
| ⭐ **Reviews & Ratings** | Product rating system with comments |
| 🤖 **AI Chatbot** | 24/7 customer support with Google Gemini AI |
| 🔐 **OAuth 2.0** | Social login with Google |

### ⚙️ Admin Module
| Feature | Description |
|-----------|-------|
| 📊 **Analytics Dashboard** | Revenue and order statistics with visual charts |
| 📈 **Multi-dimensional Reports** | Detailed report export by time, product, customer |
| 🎯 **Product Management** | CRUD operations with auto image upload, variant management |
| 👥 **User Management** | Customer management with detailed permissions |
| 🚚 **GHN Integration** | Automatic shipping order creation with GHN Express |
| 🎨 **Banner Management** | Create and edit advertising banners |
| 💰 **Discount Management** | Create, apply and track discount codes |
| 🔐 **Role-Based Access Control** | Detailed permission system with Spring Security |

## 🛠️ Technologies

### Backend
<div align="left">

| Technology | Version | Purpose |
|-----------|-----------|----------|
| Spring Boot | 3.5.6 | Core Framework |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data JPA | 3.x | Database ORM |
| Thymeleaf | 3.x | Server-side Template Engine |
| MapStruct | 1.6.3 | DTO Mapping |
| Lombok | Latest | Boilerplate Reduction |
| OAuth2 Client | 3.x | Social Login |
| Spring Mail | 3.x | Email Service |

</div>

### Frontend
- **Bootstrap 5** - Responsive CSS Framework
- **JavaScript ES6+** - Client-side Logic
- **Chart.js** - Data Visualization
- **Material Design Icons** - Icon Library
- **Custom CSS** - Themed Styling

### Database
- **Microsoft SQL Server 2019+** - Production Database
- **H2 Database** - Development & Testing

### Third-party Integrations
- **💳 VNPay** - Payment Gateway Integration
- **💳 MOMO** - Mobile Payment
- **🚚 GHN Express** - Shipping Integration
- **🤖 Google Gemini AI** - AI Chatbot
- **🔐 Google OAuth** - Social Authentication

## 🚀 Installation

### System Requirements
- ☕ **Java** 21 or higher
- 🛠️ **Maven** 3.6+
- 🗄️ **SQL Server** 2019+ or SQL Server Express
- 💻 **IDE** (IntelliJ IDEA / Eclipse / VS Code)

### Installation Guide

#### 1. Clone Repository
```bash
git clone https://github.com/1440isme/Liora.git
cd Liora
```

#### 2. Database Configuration
Create a new database in SQL Server:
```sql
CREATE DATABASE LioraDB;
```

Update connection information in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=LioraDB
spring.datasource.username=your_username
spring.datasource.password=your_password
```

#### 3. Configure API Keys
Update API keys in `application.properties`:

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
```

**Google Services:**
```properties
spring.security.oauth2.client.registration.google.client-id=your_google_client_id
spring.security.oauth2.client.registration.google.client-secret=your_google_client_secret
google.gemini.api.key=your_gemini_api_key
```

#### 4. Build and Run
```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Or run directly from IDE
# Run LioraApplication.java
```

### 📱 Access System
- **🌐 Main Website:** http://localhost:8080
- **⚙️ Admin Panel:** http://localhost:8080/admin
- **📊 Dashboard:** http://localhost:8080/admin/dashboard


### 👤 Default Account
After the first run, you can create an admin account through the registration interface or directly query the database.

## 📚 Documentation

- 📖 [User Manual](User_Manual_Liora_Beauty.md) - Detailed user guide
- 🔧 [Installation Guide](INSTALLATION_GUIDE.md) - Detailed installation guide
- 🔌 [API Documentation](docs/api.md) - API endpoints documentation
- 🗄️ [Database Schema](docs/database.md) - Database schema

## 🏗️ System Architecture

The project is organized using standard **Layered Architecture** pattern:

```
src/main/java/vn/liora/
├── annotation/          # Custom Annotations (@RequirePermission, etc.)
├── config/              # Spring Configuration Classes
│   ├── SecurityConfig.java
│   ├── WebMvcConfig.java
│   └── CloudStorageConfig.java
├── controller/          # Web Controllers (REST & MVC)
│   ├── admin/           # Admin Controllers
│   ├── user/            # User Controllers
│   └── api/             # REST API Controllers
├── dto/                 # Data Transfer Objects
├── entity/              # JPA Entities (26 entities)
├── enums/               # Enum Classes
├── exception/           # Custom Exceptions
├── mapper/              # MapStruct Mappers
├── repository/          # JPA Repositories (26 repos)
├── service/             # Business Logic Layer (54 services)
├── util/                # Utility Classes
└── validator/          # Custom Validators
```

### Architecture Overview
```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│  (Thymeleaf Templates + JavaScript + CSS)   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Controller Layer                 │
│    (Spring MVC + REST Controllers)          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│             Service Layer                   │
│          (Business Logic)                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Repository Layer                  │
│          (Spring Data JPA)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│             Database Layer                  │
│         (Microsoft SQL Server)              │
└─────────────────────────────────────────────┘
```

## ⚙️ Configuration

### Main Configuration File
File `src/main/resources/application.properties` contains all project configurations:

```properties
# ==================== Database ====================
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=LioraDB
spring.datasource.username=sa
spring.datasource.password=your_password

# ==================== JPA Configuration ====================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# ==================== File Upload ====================
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# ==================== Email Configuration ====================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_password

# ==================== Security ====================
app.jwt.secret=your_jwt_secret_key
app.jwt.expiration=86400000

# ==================== Payment Gateways ====================
# VNPay
vnpay.tmnCode=your_tmn_code
vnpay.hashSecret=your_hash_secret

# MOMO
momo.partnerCode=your_partner_code
momo.accessKey=your_access_key
momo.secretKey=your_secret_key

# ==================== Shipping ====================
# GHN Express
ghn.api.token=your_ghn_token
ghn.api.shop-id=your_shop_id
ghn.api.service-id=your_service_id

# ==================== AI Integration ====================
google.gemini.api.key=your_gemini_api_key
```

> 💡 **Note:** Configuration values such as API keys, passwords should be placed in `.env` file or environment variables in production environment.

## 🧪 Testing

### Running Tests
```bash
# Run all unit tests
mvn test

# Run test with code coverage
mvn test jacoco:report
# View report at: target/site/jacoco/index.html

# Run integration tests
mvn verify

# Run tests for a specific class
mvn test -Dtest=ProductServiceTest
```

### Test Coverage
The project uses **JaCoCo** to track code coverage. Coverage reports are automatically generated after running tests.

## 📊 Project Statistics

### Code Statistics
| Type | Count | Description |
|------|----------|-------|
| 📦 **Entities** | 26 | JPA Entities with relationships |
| 🔧 **Repositories** | 26 | Spring Data JPA Repositories |
| ⚙️ **Services** | 54 | Business Logic Layer |
| 🎮 **Controllers** | 48 | REST & Web Controllers |
| 🔄 **DTOs** | 75 | Data Transfer Objects |
| 🗺️ **Mappers** | 14 | MapStruct Mappers |
| 📄 **Templates** | 91+ | Thymeleaf HTML Templates |
| 🎨 **CSS Files** | 17 | Custom Styling |
| 📜 **JavaScript** | 49+ | Client-side Logic |
| 🗄️ **Database Tables** | 26+ | Tables with relationships |

### Key Features
- ✅ **Payment Integration:** VNPay, MOMO
- ✅ **Shipping Integration:** GHN Express
- ✅ **AI Integration:** Google Gemini Chatbot
- ✅ **Social Login:** Google OAuth 2.0
- ✅ **Role-Based Access Control:** Spring Security
- ✅ **File Upload:** Cloud Storage (Azure/AWS ready)
- ✅ **Email Service:** Spring Mail Integration
- ✅ **Analytics Dashboard:** Chart.js Integration

## 🤝 Contributing

We welcome contributions from the community! Steps to contribute:

1. **Fork** this repository
2. Create a new **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a new **Pull Request**

### 📋 Guidelines
- Follow the project's coding conventions
- Write unit tests for new code
- Update documentation if needed
- Use clear commit messages

## 📄 License

This project is distributed under the **MIT License**. See [LICENSE](LICENSE) file for details.

## 👥 Authors

| Name | Student ID |
|-----|------------|
| **Truong Cong Binh** | 23110184 |
| **Tran Le Quoc Dai** | 23110201 |
| **Ninh Thi My Hanh** | 23110210 |
| **Doan Quang Khoi** | 23110244 |

## 📞 Contact

<div align="center">

| Channel | Link |
|---------|------|
| 📧 **Email** | support@liora.com |
| 🌐 **Website** | [liora.azurewebsites.net](https://liora.azurewebsites.net/) |
| 💻 **GitHub** | [github.com/1440isme/Liora](https://github.com/1440isme/Liora) |

</div>

---

<div align="center">

### Made with ❤️ by Liora Beauty Team

![Spring Boot](https://img.shields.io/badge/Built%20with-Spring%20Boot-brightgreen)
![Java](https://img.shields.io/badge/Powered%20by-Java-orange)
![Stars](https://img.shields.io/github/stars/1440isme/Liora?style=social)

⭐ **Star** this project if you find it useful!

</div>

