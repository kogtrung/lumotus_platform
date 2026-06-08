-- Chủ đề hệ thống mẫu (Admin có thể thêm/sửa sau)
INSERT INTO topics (id, name, slug, description, icon, color_hex, sort_order, created_at, updated_at)
VALUES
    ('a1000001-0000-4000-8000-000000000001', 'IELTS', 'ielts', 'Từ vựng luyện thi IELTS', '📘', '#5B8DEF', 1, NOW(), NOW()),
    ('a1000001-0000-4000-8000-000000000002', 'TOEIC', 'toeic', 'Từ vựng luyện thi TOEIC', '📗', '#34C759', 2, NOW(), NOW()),
    ('a1000001-0000-4000-8000-000000000003', 'Hàng ngày', 'daily', 'Từ vựng giao tiếp hằng ngày', '☀️', '#FF9500', 3, NOW(), NOW()),
    ('a1000001-0000-4000-8000-000000000004', 'Business', 'business', 'Tiếng Anh thương mại', '💼', '#5856D6', 4, NOW(), NOW()),
    ('a1000001-0000-4000-8000-000000000005', 'Du lịch', 'travel', 'Từ vựng du lịch', '✈️', '#00C7BE', 5, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
