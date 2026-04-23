# MySQL Scripts

## Cần làm

- Duy trì `01_schema.sql` đồng bộ với entity.
- Duy trì `02_seed.sql` đồng bộ với CSV trong `../excel`.
- Thêm script migration cho thay đổi schema theo từng đợt.
- Kiểm tra khóa ngoại/index sau mỗi thay đổi.
- Lưu ý thứ tự chạy script: schema -> seed.
