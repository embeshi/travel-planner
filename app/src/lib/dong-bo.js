/* ============================================================
   ĐỒNG BỘ SUPABASE — bê từ index.html v9.6 (dòng 1527–1561, 3170–3195).

   ⚠️ LÔ 3 KHÔNG GỌI MODULE NÀY. ⚠️
   Code nằm đây để lô sau dùng, nhưng chưa có màn nào import nó, và chủ
   dự án chưa đăng nhập lần nào vào v10. Đó là chủ ý: nghi thức giữ dữ
   liệu (mục 04) nói cách thử an toàn nhất là mở app mà KHÔNG đăng nhập.

   Cấu hình Supabase cố tình KHÔNG chép vào đây. Địa chỉ và khoá công khai
   là điều kiện số 1 trong «bốn thứ giữ cho dữ liệu cũ tự hiện ra» — chúng
   sẽ được đưa vào ở lô nối mạng thật, đúng nguyên văn từ index.html v9.6,
   không gõ lại bằng tay.
   ============================================================ */

/* ------------------------------------------------------------
   LUẬT VÀNG: ĐỌC TRƯỚC — GHI SAU.

   Nghi thức mục 03: chỉ có ĐÚNG MỘT kịch bản thật sự xoá được dữ liệu —
   app khởi động, chưa kịp đọc sổ cũ (mạng chậm, chưa đăng nhập xong),
   liền dựng một sổ trắng tinh rồi tự động lưu đè lên bản chính.

   v9.6 chặn bằng biến `booting`. Ở đây em siết thêm một nấc: cổng này
   NÉM LỖI thay vì im lặng bỏ qua. Đây là phần THÊM, không đổi hành vi —
   nó chỉ chặn một lệnh ghi mà lẽ ra không bao giờ được phép chạy.
   Thà hỏng ồn ào còn hơn ghi đè một trang trắng.
   ------------------------------------------------------------ */
let daDocXong = false

export function danhDauDaDocXong () { daDocXong = true }
export function datLaiCongDoc () { daDocXong = false }
export function coDuocGhiChua () { return daDocXong }

export async function ghiLenMayChu (sb, user, state) {
  if (!daDocXong) {
    throw new Error(
      'CHẶN GHI: chưa đọc xong sổ cũ. Đây là luật đọc-trước-ghi-sau ' +
      '(docs/nghi-thuc-giu-du-lieu-v10.html mục 03). Gọi danhDauDaDocXong() ' +
      'sau khi đã dựng đủ dữ liệu, không gọi trước.'
    )
  }
  const res = await sb.from('trips').upsert(
    {
      user_id: user.id,
      title: state.title,
      data: state,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  )
  if (res.error) throw res.error
  return true
}

/* Hoà giải máy chủ với bản trên máy — nguyên văn v9.6 dòng 3170.
   Ai mới hơn thì thắng, so bằng updated_at của máy chủ với _updatedAt cục bộ.
   Trả về mô tả việc đã làm để bên gọi biết đường xử lý giao diện. */
export async function hoaGiaiVoiMayChu (sb, user, state, { apDung, ghiXuong }) {
  const res = await sb.from('trips')
    .select('data, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (res.error) throw res.error

  const row = res.data
  if (!row || !row.data) return { viec: 'may-chu-trong' }

  const gioMayChu = Date.parse(row.updated_at) || 0
  const gioCucBo = state._updatedAt || 0

  if (gioMayChu >= gioCucBo) {
    apDung(row.data)
    danhDauDaDocXong()
    await ghiXuong()
    return { viec: 'lay-ban-may-chu' }
  }
  danhDauDaDocXong()
  return { viec: 'ban-cuc-bo-moi-hon' }
}
