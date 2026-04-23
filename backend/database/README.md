# Database package (MySQL + Excel)

Bo nay duoc tao theo contract frontend hien tai.

## Thu muc

- `mysql/01_schema.sql`: tao database + bang + khoa ngoai + index
- `mysql/02_seed.sql`: du lieu mau ban dau
- `excel/*.csv`: file de mo/chinh sua bang Excel, phu hop import du lieu

## Cach dung nhanh

1. Tao schema:
   - `mysql -u root -p < backend/database/mysql/01_schema.sql`
2. Nap seed:
   - `mysql -u root -p < backend/database/mysql/02_seed.sql`
3. Mo cac file trong `excel/` bang Excel de import/chuan hoa du lieu.

## Ghi chu

- Cac file CSV dung UTF-8.
- Truong khoa ngoai dung theo id hoac key nghiep vu (`card_number`, `room_code`) tuy workflow import.
