# Week 4 — Offline-First Data

## Mô tả

Nâng cấp ứng dụng PWA từ Week 3 thành mô hình **Offline-First**, cho phép người dùng nhập và lưu dữ liệu ngay cả khi không có mạng. Dữ liệu được lưu cục bộ bằng IndexedDB và tự động đồng bộ với API khi kết nối mạng trở lại.

## Các thay đổi chính

* **Dynamic Form**

  * Form được render từ `survey-schema.js`.
  * Hỗ trợ các field `text`, `textarea` và `radio`.
  * Hỗ trợ `required` validation.

* **Skip Logic**

  * Field được hiển thị hoặc ẩn dựa trên giá trị của field khác.
  * Ví dụ: chọn `Hư hỏng` sẽ hiển thị `Mô tả hư hỏng` và `Mức độ ưu tiên`.

* **IndexedDB**

  * Thêm database `vku-field-survey-db`.
  * Sử dụng store `submissions` để lưu dữ liệu khảo sát.
  * Mỗi submission có trạng thái `pending` hoặc `synced`.

* **Offline-First**

  * Submission được lưu vào IndexedDB trước khi gửi lên server.
  * Người dùng vẫn có thể nhập dữ liệu khi Offline.
  * Dữ liệu local vẫn tồn tại sau khi reload trang.

* **Data Sync**

  * Khi Online trở lại, các submission `pending` được gửi tới `/api/submissions`.
  * Sau khi đồng bộ thành công, trạng thái chuyển thành `synced`.
  * Lưu `syncAttempts`, `lastError` và `syncedAt` để theo dõi quá trình đồng bộ.

* **Idempotency**

  * Mỗi submission sử dụng UUID riêng.
  * Server kiểm tra `id` để tránh tạo duplicate khi request được gửi lại.

* **Service Worker / PWA**

  * Cache App Shell để ứng dụng có thể mở khi Offline.
  * Có Offline fallback.
  * API `/api/*` không được cache.
  * Hỗ trợ runtime caching cho các tài nguyên GET.

