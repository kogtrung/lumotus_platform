# Tài liệu Thiết kế: Vòng đời Hệ thống Quiz & Tracking Điểm số
**Mô hình:** Thi đua bất đồng bộ (Asynchronous Competition) với cơ chế Auto-save.

---

## 1. Kiến trúc Dữ liệu Cốt lõi (Core Entities)

* **`Quiz_Deck`**: Chứa thông tin chung (Tiêu đề, ảnh bìa, XP gốc, trạng thái Public/Draft).
* **`Question` & `Answer`**: Dữ liệu câu hỏi trắc nghiệm và các lựa chọn đáp án.
* **`Quiz_Session`**: Phiên làm bài của user (Chứa `sessionId`, `user_id`, `start_time`, `end_time`, trạng thái `In_Progress` / `Completed`).
* **`Session_Answer`**: (Lưu trên Cache) Chi tiết từng câu trả lời theo thời gian thực phục vụ Auto-save.

---

## 2. Vòng đời chi tiết (Quiz Lifecycle)

### Giai đoạn 1: Quản trị & Tạo mới (Admin)
| Bước | Thao tác | Xử lý Hệ thống (Backend & DB) |
| :--- | :--- | :--- |
| **1. Khởi tạo** | Điền meta data (Tên, XP cơ bản). | Insert `Quiz_Deck` $\rightarrow$ Trạng thái: `Draft`. |
| **2. Nhập liệu** | Thêm câu hỏi và đáp án (Thủ công / Import CSV). | Insert `Question`, liên kết khóa ngoại với `Quiz_Deck`. |
| **3. Phát hành** | Duyệt nội dung và Publish. | Cập nhật trạng thái `Published`. Hiển thị lên trang **Khám phá**. |

### Giai đoạn 2: Khởi tạo Phiên làm bài (Session Init)
| Bước | Frontend (Client) | Backend & Cache (Redis) |
| :--- | :--- | :--- |
| **1. Kích hoạt** | Bấm "Bắt đầu". Gọi `POST /api/quizzes/{id}/start` | Kiểm tra điều kiện hợp lệ của User và Quiz. |
| **2. Tạo Session**| Hiển thị màn hình Loading. | Tạo `Quiz_Session` (trạng thái `In_Progress`). Lưu vào Redis. |
| **3. Trả đề** | Nhận đề, render câu 1, bắt đầu `QuizTimer`. | Lấy câu hỏi, **xáo trộn (shuffle)** thứ tự, ẩn đáp án. Trả data + `sessionId`. |

### Giai đoạn 3: Thực thi & Lưu tự động (Execution & Auto-save)
| Bước | Frontend (Client) | Backend (Redis Cache) |
| :--- | :--- | :--- |
| **1. Chọn đáp án**| Chuyển sang câu tiếp theo ngay lập tức (Optimistic UI). | Chờ tín hiệu từ API. |
| **2. Auto-save** | Bắn API ngầm `POST /api/sessions/{sessionId}/answers`. | Lưu đáp án vào Redis Hash. Đặt lại bộ đếm giờ cho câu tiếp theo. |
| **3. Rớt mạng** | Bắn API lỗi $\rightarrow$ Lưu tạm vào `localStorage`. Cảnh báo UI. | Nếu quá 15s không nhận được đáp án $\rightarrow$ Đánh dấu Bỏ qua/Sai. |
| **4. Đồng bộ** | Khi có mạng, bắn API `POST /.../sync-answers`. | Cập nhật lại các đáp án bị sót vào Redis. |

### Giai đoạn 4: Nộp bài & Tính điểm (Finalization)
| Bước | Kích hoạt | Xử lý Hệ thống (Backend DB & Logic) |
| :--- | :--- | :--- |
| **1. Chốt Session** | User nộp bài hoặc Hết giờ (Timeout). | Khóa Session trong Redis. Đổi trạng thái thành `Completed`. Chặn mọi request sửa đổi. |
| **2. Đối chiếu** | Backend nhận lệnh hoàn thành. | Lấy toàn bộ đáp án từ Redis đối chiếu với Database gốc. Tính số câu Đúng/Sai. |
| **3. Trả thưởng** | Có kết quả Đối chiếu. | Tính Tỉ lệ đúng. Cộng Streak hiện tại. Tính tổng XP nhận được (Bao gồm Bonus). |
| **4. Lưu trữ** | Tính toán xong logic Game. | Dump dữ liệu từ Redis vào Database vĩnh viễn (PostgreSQL/MySQL). Trả kết quả về Frontend. |

### Giai đoạn 5: Hậu kỳ & Tương tác (Post-Quiz Actions)
| Luồng tính năng | Nguồn cấp dữ liệu & Luồng xử lý |
| :--- | :--- |
| **Trang Kết quả** | Fetch chi tiết `sessionId` vừa làm. Hiển thị XP, Streak mới, danh sách đúng/sai. |
| **Heatmap Tiến độ**| Query `Quiz_Session` group theo ngày $\rightarrow$ Render lên biểu đồ hoạt động. |
| **Trang Ôn tập** | Lọc câu trả lời Sai từ `Session_Answer` $\rightarrow$ Đưa vào luồng Spaced Repetition. |
| **Bảng Xếp hạng** | Query User có XP/Streak cao nhất $\rightarrow$ Cache bằng Redis, refetch mỗi 5 phút. |

---

> **Lưu ý Kỹ thuật Hàng đầu:**
> * **Bảo mật:** Không bao giờ tin tưởng Client. Việc chấm điểm và tính thời gian bắt buộc phải do Server quyết định. Client chỉ truyền hành động (Event).
> * **Hiệu suất:** Tận dụng tối đa Redis cho giai đoạn 2 và 3 để tránh làm sập Database chính khi có nhiều user spam click nộp đáp án liên tục.