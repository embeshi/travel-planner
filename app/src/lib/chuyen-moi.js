/* ============================================================
   BẮT ĐẦU CHUYẾN MỚI — dọn sổ cho chuyến kế tiếp.

   Đây là thao tác XOÁ DỮ LIỆU, nên luật của nó nằm ở giao diện:
   KHÔNG được gọi hàm này khi chưa xuất backup chuyến cũ. Sau khi dọn,
   chuyến cũ CHỈ còn trong file backup — muốn xem lại thì Nhập backup.

   Cái gì bị dọn, cái gì được giữ — nghĩ từ nỗi sợ gốc của dự án
   («không muốn gõ tay lại»):

   DỌN (đồ của riêng chuyến cũ):
   · rows, cash, bookings, hotel, budget, title
   · rate, bkRate — chuyến mới có thể nước khác, tỷ giá cũ là bẫy
   · shopping, places, food — sổ tay gắn với ĐIỂM ĐẾN cũ

   GIỮ (đồ của riêng NGƯỜI ĐI, không phải của chuyến):
   · skincare, makeup, essentials — GIỮ NGUYÊN DANH SÁCH MÓN, chỉ bỏ
     tick. Gần 40 món này gõ tay qua nhiều chuyến; dọn mất là bắt người
     dùng gõ lại — đúng điều dự án thề không làm.
   · currency, bkCurrency — thói quen, sửa được trong mười giây
   · activePack, activeNote, packSeed1/2 — trạng thái giao diện vô hại
   ============================================================ */
export function donSoChoChuyenMoi (kho) {
  kho.title = 'Chuyến đi của mình'
  kho.rows = []
  kho.cash = []
  kho.bookings = []
  kho.hotel.name = ''
  kho.hotel.address = ''
  kho.hotel.checkin = ''
  kho.hotel.checkout = ''
  kho.budget = ''
  kho.rate = null
  kho.bkRate = null
  kho.shopping = []
  kho.places = []
  kho.food = []
  for (const khoa of ['skincare', 'makeup', 'essentials']) {
    for (const mon of kho[khoa]) mon.packed = false
  }
  return kho
}
