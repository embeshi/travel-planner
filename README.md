# Kế hoạch du lịch ✈️

Công cụ lập kế hoạch du lịch cá nhân, chạy hoàn toàn trên trình duyệt, không cần server.

## Tính năng

- **Lịch trình & chi phí**: hoạt động, ngày, địa điểm, ghi chú, chi phí, tự động quy đổi sang VNĐ theo tỷ giá
- **Tỷ giá tự động**: lấy tỷ giá thị trường (mid-market) chỉ với một nút bấm, hoặc nhập tay
- **Gói vé máy bay + khách sạn**: theo dõi khoản đã thanh toán (GBP) với tỷ giá riêng, kèm thông tin khách sạn (tên, địa chỉ, check-in/check-out, tự tính số ngày lưu trú)
- **Tiền mặt dự trù**: ghi lại các lần đổi VNĐ sang ngoại tệ, tự tính tỷ giá thực tế và trung bình
- **Hành lý**: checklist skincare và makeup với thanh tiến độ đóng gói

## Lưu trữ dữ liệu

Dữ liệu được lưu tự động vào trình duyệt của bạn (localStorage), không gửi đi đâu cả. Lưu ý: dữ liệu gắn với từng trình duyệt trên từng thiết bị.

## Triển khai

Đây là một file HTML tĩnh duy nhất (`index.html`), có thể host trên GitHub Pages hoặc bất kỳ dịch vụ static hosting nào.
