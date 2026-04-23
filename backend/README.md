# Backend (Spring Boot)

Thư mục `backend/` được dựng theo cấu trúc mẫu trong `demo_cau_truc_backend` để kết hợp với frontend `src/` hiện tại.

## Cấu trúc chính

- `backend/src/main/java/com/springmasterclass/study/controller`: nhận request API
- `backend/src/main/java/com/springmasterclass/study/service`: xử lý nghiệp vụ
- `backend/src/main/java/com/springmasterclass/study/repository`: truy cập dữ liệu
- `backend/src/main/java/com/springmasterclass/study/entity`: mô hình DB
- `backend/src/main/java/com/springmasterclass/study/dto`: request/response DTO
- `backend/src/main/java/com/springmasterclass/study/mapper`: map entity <-> dto
- `backend/src/main/java/com/springmasterclass/study/config`: cấu hình hệ thống
- `backend/src/main/java/com/springmasterclass/study/exception`: xử lý lỗi tập trung
- `backend/src/main/resources`: cấu hình app (`application.yml`, migration...)
- `backend/src/test`: test backend

## Mapping với frontend `src/`

- Frontend `src/pages/dashboard/*` <-> backend `controller` + `service` cho tài sản/thống kê
- Frontend `src/pages/profile/*` <-> backend `controller` + `service` cho user/profile
- Frontend `src/assets/scripts/*` gọi API thông qua module trong `src/api/`

## Bước tiếp theo

1. Khởi tạo Spring Boot thật trong `backend/` (Gradle hoặc Maven).
2. Cấu hình DB trong `application.yml`.
3. Định nghĩa API contract theo các trang đã có ở frontend.
