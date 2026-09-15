# Lab 03 - PWA Foundation
## Run
npm install
npm run dev
## Production test
npm run build
npm run preview
## Implemented
- Web App Manifest
- Service Worker
- App Shell precache
- Cache First
- Offline fallback
- Cache versioning
## Challenge
Giải thích vì sao campus.png không hiển thị ở lần Offline test đầu tiên?
Ở lần xây dựng App Shell đầu tiên, /images/campus.png cố tình không được thêm vào danh sách APP_SHELL.

Trong khi đó, library.png và classroom.png được thêm vào App Shell nên hai hình ảnh này đã được Service Worker lưu vào Cache Storage trong quá trình install.

Khi ứng dụng chuyển sang Offline và reload:

HTML, CSS và JavaScript vẫn hoạt động vì đã được cache.
library.png và classroom.png vẫn hiển thị vì chúng đã có trong cache.
campus.png không hiển thị vì file này chưa được precache.

Khi trình duyệt yêu cầu campus.png ở trạng thái Offline, Service Worker không tìm thấy file này trong cache và cũng không thể lấy file từ network. Vì vậy, hình ảnh không thể tải và bị mất.

# Modify-Offline-First-Survey
