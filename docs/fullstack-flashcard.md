# Đề tài: FlashCard English FULLSTACK

**Backend:** Spring Boot 4 | **Frontend:** React | **Năm biên soản:** 2026

---

# I. ĐỊNH HƯỚNG TRIỂN KHAI FULLSTACK

Bộ tài liệu này mô tả đề tài phát triển ứng dụng fullstack, trong đó backend được xây dựng bằng **Spring Boot 4** và frontend được triển khai bằng **React**.

Mỗi đề tài bao gồm: giới thiệu, mục tiêu đào tạo, chuẩn đầu ra, phạm vi chức năng, yêu cầu backend, yêu cầu frontend và sản phẩm bàn giao tổng hợp cả hai phần.

---

# II. YÊU CẦU KỸ THUẬT CHUNG

## 1. Backend

**Công nghệ và yêu cầu kỹ thuật:**

- Spring Boot 4, Spring Web, Spring Security, Spring Data JPA và PostgreSQL
- JWT Access Token kết hợp Refresh Token cho xác thực và phân quyền RBAC
- Bean Validation cho request body, request param và path variable
- Chuẩn hóa phản hồi lỗi bằng `@ControllerAdvice` và mã lỗi nghiệp vụ rõ ràng
- Tài liệu hóa API bằng Swagger/OpenAPI
- Kiểm thử bằng JUnit, MockMvc hoặc Testcontainers
- Flyway để quản lý migration
- MapStruct/Lombok để chuẩn hóa tầng DTO
- Hỗ trợ phân trang, lọc và sắp xếp cho các API danh sách

## 2. Frontend

**Công nghệ và yêu cầu kỹ thuật:**

- React 18 + TypeScript, Vite, TailwindCSS làm nền tảng giao diện
- React Router v6 cho client-side routing có bảo vệ route theo vai trò
- Axios kết hợp interceptor để tự động đính kèm JWT và xử lý refresh token
- React Query (TanStack Query) để quản lý server state, caching và invalidation
- React Hook Form hoặc tương đương cho form có validation phía client
- Xử lý lỗi toàn cục và hiển thị thông báo thân thiện với người dùng
- Responsive design: tương thích tốt trên desktop, tablet và mobile

## 3. Sản phẩm đầu ra chung

---

# III. ĐỀ TÀI FULLSTACK: Xây dựng Nền tảng Học Ngoại ngữ bằng Flashcard

## 1. Giới thiệu đề tài

Đề tài xây dựng hệ thống hỗ trợ học từ vựng theo bộ thẻ, bài kiểm tra ngắn và cơ chế ôn tập lặp lại ngắt quãng (SRS).

## 2. Phần Backend (Spring Boot 4)

**Yêu cầu kỹ thuật:**

- Spring Boot 4, Spring Web, Spring Security, Spring Data JPA, PostgreSQL, Flyway, Bean Validation, Swagger/OpenAPI, JUnit/MockMvc

**Yêu cầu chức năng:**

- Xác thực JWT + Refresh Token, phân quyền RBAC
- Phân trang/lọc/sắp xếp, xử lý lỗi tập trung

**Yêu cầu sản phẩm:**

- Thiết kế đầy đủ các nhóm API nghiệp vụ
- Lược đồ CSDL chuẩn hóa
- Bộ test API tối thiểu **8 trường hợp** kiểm thử chính
- Tài liệu Swagger/OpenAPI

## 3. Phần Frontend (React 18 + TypeScript)

### 3.1 Mô tả giao diện

Giao diện tập trung vào trải nghiệm học mượt mà: flip card animation, review session tương tác và dashboard hiển thị tiến độ học tập hàng ngày. Cần hỗ trợ chế độ offline cơ bản cho học theo batch.

### 3.2 Công nghệ Frontend

- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion (flip card)
- React Query
- React Router v6
- Axios
- Chart.js

### 3.3 Các trang và màn hình cần xây dựng

| Trang | Mô tả |
|-------|-------|
| **Trang thư viện Deck** | Danh sách bộ từ với số card, tiến độ và ngày ôn tiếp theo |
| **Trang học Flashcard** | Flip card animation, nút Again/Hard/Good/Easy |
| **Trang Quiz** | Câu hỏi trắc nghiệm, đếm giờ, nộp bài và xem điểm |
| **Trang tiến độ** | Biểu đồ heatmap hoạt động học theo ngày, streak hiện tại |
| **Trang bảng xếp hạng** | Top người học theo điểm quiz và streak |
| **Admin** | Quản lý deck, card, câu hỏi quiz và thống kê deck phổ biến |

### 3.4 Các component chính cần hiện thực

| Component | Mô tả |
|-----------|-------|
| **FlashCard** | Component lật thẻ 3D với Framer Motion, hiển thị mặt trước/sau |
| **ReviewRatingButtons** | Bốn nút Again/Hard/Good/Easy với màu sắc phân biệt và tooltip |
| **StreakCalendar** | Lịch heatmap hiển thị ngày hoạt động học trong tháng |
| **DeckProgressBar** | Thanh tiến độ số card đã mastered / tổng card trong deck |
| **QuizTimer** | Đồng hồ đếm ngược cho mỗi câu hỏi quiz |
| **LeaderboardTable** | Bảng xếp hạng có avatar, điểm và thứ hạng |

### 3.5 Sản phẩm frontend bàn giao

- Mã nguồn frontend với animation mượt mà và UX học tập trực quan
- Tích hợp đầy đủ API review SRS và quiz
- Responsive trên mọi thiết bị
- README frontend đầy đủ

---

# IV. TIÊU CHÍ ĐÁNH GIÁ FULLSTACK

*(Nội dung tiếp theo cần bổ sung từ file gốc)*
