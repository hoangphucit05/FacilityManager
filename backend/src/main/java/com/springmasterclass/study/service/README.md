# Service

## Cần làm

- Implement nghiệp vụ chính: user, room, category, asset, transfer, rating, liquidation, request.
- Tách rõ create/update/delete/list/detail.
- Kiểm tra rule nghiệp vụ (status hợp lệ, ràng buộc số lượng, quyền thao tác).
- Gọi repository và mapper, không phụ thuộc trực tiếp vào controller.
- Thêm transaction cho các use-case cập nhật nhiều bảng.
