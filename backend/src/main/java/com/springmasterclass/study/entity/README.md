# Entity

## Cần làm

- Tạo entity mapping theo schema trong `backend/database/mysql/01_schema.sql`.
- Khai báo quan hệ `@ManyToOne`, `@OneToMany` đúng với khóa ngoại.
- Chuẩn hóa enum cho role, status, priority.
- Thêm auditing field (`createdAt`, `updatedAt`) và lifecycle callback nếu cần.
- Tránh đặt logic nghiệp vụ phức tạp trong entity.
