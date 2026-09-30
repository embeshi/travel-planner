/* ============================================================
   ENTER THÔNG MINH HAI CHẾ ĐỘ — dùng chung cho các bảng nhỏ
   (gói bay, đổi tiền). Cùng luật với BangLichTrinh (vết sẹo 1):

   · Laptop (≥701px): Enter nhảy xuống ĐÚNG CỘT ở dòng dưới.
   · Điện thoại (≤700px): Enter đi TUẦN TỰ trong thẻ, hết thẻ mới sang
     thẻ dưới.
   Dòng cuối mà bấm Enter thì tự đẻ dòng mới (themDong nhận dòng hiện
   tại để dòng mới thừa hưởng ngày nếu muốn).
   ============================================================ */
export function taoEnterHop ({ danhSach, cot, roiVao, themDong,
  laDienThoai = () => window.matchMedia('(max-width: 700px)').matches }) {
  return async function enterHop (id, c) {
    const ds = danhSach()
    const i = ds.findIndex((r) => r.id === id)
    if (i === -1) return
    if (laDienThoai()) {
      const k = cot.indexOf(c)
      if (k >= 0 && k < cot.length - 1) return roiVao(id, cot[k + 1])
      const sau = ds[i + 1]
      if (sau) return roiVao(sau.id, cot[0])
      const moi = await themDong(ds[i])
      return roiVao(moi.id, cot[0])
    }
    const sau = ds[i + 1]
    if (sau) return roiVao(sau.id, c)
    const moi = await themDong(ds[i])
    roiVao(moi.id, c)
  }
}
