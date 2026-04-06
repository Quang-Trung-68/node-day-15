# node-day-15

Monorepo 3 dịch vụ: **frontend** (HTML tĩnh + Nginx), **backend** (Node.js + Express), **db** (MySQL 8 qua image). Không cần cài Node.js hay MySQL trên máy host.

## Cấu trúc repo (theo đề bài)

```
node-day-15/
└── my-docker-app/
    ├── frontend/                 # HTML tĩnh + Dockerfile (nginx:alpine)
    │   ├── Dockerfile
    │   └── ... (source code)
    ├── backend/                  # Node.js + Express
    │   ├── Dockerfile
    │   └── ... (source code)
    ├── database/                 # (không tạo thư mục — dùng image mysql:8 trong Compose)
    └── docker-compose.yml        # điều phối cả 3 dịch vụ
```

## Chạy dự án (đúng 2 bước)

```bash
git clone <your-repo-url>
cd node-day-15/my-docker-app
docker-compose up --build
```

Sau khi clone, vào thư mục `my-docker-app` (chứa `docker-compose.yml`) rồi chạy Compose. Nếu máy bạn dùng Docker Compose V2 plugin, có thể thay bằng: `docker compose up --build`.

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend: [http://localhost:3000](http://localhost:3000)
- Health: [http://localhost:3000/health](http://localhost:3000/health) → `{ "db": "connected" }`
- Items: [http://localhost:3000/items](http://localhost:3000/items)

Dừng: `Ctrl+C` hoặc `docker compose down`. Dữ liệu MySQL lưu trong volume `db_data`.

## Biến môi trường

- Chạy local (không Docker): sao chép `backend/.env.example` → `backend/.env`.
- Không commit file `.env` chứa mật khẩu thật; trong Docker, biến được khai báo trong `docker-compose.yml`.

## API

| Method | Path      | Mô tả |
|--------|-----------|--------|
| GET    | `/`       | `{ "message": "Backend is running" }` |
| GET    | `/health` | Trạng thái kết nối DB |
| GET    | `/items`  | Danh sách items |
| POST   | `/items`  | Body `{ "name": "..." }` — 201 khi tạo thành công |
