/* ============================================================
   Lấy tỷ giá thị trường (mid-market, loại wise.com hiển thị).
   Bê từ index.html v9.6 (dòng 2354–2364) — CHỈ giữ cách 1.

   v10.6 bỏ hẳn «cách 2» (hỏi Claude kèm tìm kiếm web): nhánh đó chỉ
   chạy khi app được mở bên trong Claude.ai, còn trên GitHub Pages thì
   luôn hỏng — giữ lại chỉ làm người dùng chờ thêm một lượt lỗi vô ích.
   ============================================================ */

/* Đọc tỷ giá ra khỏi câu trả lời của open.er-api.com.
   Trả null khi câu trả lời không dùng được. */
export function docTyGiaTuApiCongKhai (pub) {
  if (pub && pub.result === 'success' && pub.rates &&
      isFinite(pub.rates.VND) && pub.rates.VND > 0) {
    return pub.rates.VND
  }
  return null
}

export async function layTyGiaThiTruong (cur) {
  const res = await fetch('https://open.er-api.com/v6/latest/' + encodeURIComponent(cur))
  if (!res.ok) throw new Error('Không lấy được tỷ giá (mã ' + res.status + ')')
  const r = docTyGiaTuApiCongKhai(await res.json())
  if (r === null) throw new Error('Câu trả lời tỷ giá không dùng được')
  return r
}
