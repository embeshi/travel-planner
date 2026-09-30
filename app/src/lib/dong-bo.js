import { khoMacDinh, applyData } from './kho.js'
import { chupSo, catChuyenLenKe, coGiDeCat } from './ke-ve.js'
import { pad2 } from './ngay.js'

/* ============================================================
   ĐỒNG BỘ SUPABASE — bê từ index.html v9.6 (dòng 1527–1561, 3170–3195).
   Được khoi-dong.js gọi từ lô 9b (đăng nhập/đăng ký). Cấu hình Supabase
   nằm ở cau-hinh.js, chép máy từ v9.6.
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

/* ============================================================
   HOÀ GIẢI MÁY CHỦ VỚI BẢN TRÊN MÁY — v10.7 siết lại luật v9.6.

   v9.6: «ai mới hơn thì thắng» (updated_at máy chủ so với _updatedAt cục
   bộ). Lỗ hổng thật: máy mới, chưa đăng nhập, gõ MỘT dòng rồi mới đăng
   nhập → bản trên máy «mới hơn» sổ thật trên mây → thắng → tự lưu đè.
   Đúng kịch bản ghi-đè-trang-trắng, chỉ khác là trang có một dòng.

   Luật mới, theo thứ tự:
   1. Chỉ MỘT bên có dữ liệu → bên đó thắng, bất kể giờ.
   2. Cả hai có dữ liệu và KHÔNG chung id dòng nào (hai sổ khác nhau) →
      KHÔNG tự chọn theo giờ: sổ của TÀI KHOẢN (máy chủ) là sổ chính,
      bản trên máy được CẤT thành một vé «Bản trên máy · ngày giờ» trên
      Kệ vé — không nhánh nào mất dữ liệu.
   3. Chung id (cùng một sổ sửa ở hai nơi) → luật cũ, ai mới hơn thắng.
   Và trong MỌI trường hợp: kệ vé hai bên HỢP NHẤT theo id — kệ nằm trong
   sổ, «ai thắng lấy hết» sẽ làm bay kệ của bên thua.
   ============================================================ */
export function hopNhatKe (a, b) {
  const kq = [...(Array.isArray(a) ? a : [])]
  const co = new Set(kq.map((v) => v && v.id))
  for (const v of (Array.isArray(b) ? b : [])) if (v && !co.has(v.id)) { kq.push(v); co.add(v.id) }
  return kq
}

function chungIdDong (a, b) {
  const ids = new Set((a.rows || []).map((r) => r && r.id))
  return (b.rows || []).some((r) => r && ids.has(r.id))
}

/* Vé cất bản trên máy — dựng qua đúng đường catChuyenLenKe để số liệu
   chốt trên vé cùng một công thức với mọi vé khác. */
function veBanTrenMay (state) {
  const tam = applyData(chupSo(state), khoMacDinh())
  const ve = catChuyenLenKe(tam)
  const d = new Date()
  ve.ten = 'Bản trên máy · ' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + ' ' +
    pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  return ve
}

export async function hoaGiaiVoiMayChu (sb, user, state, { apDung, ghiXuong }) {
  const res = await sb.from('trips')
    .select('data, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (res.error) throw res.error

  const row = res.data
  if (!row || !row.data) return { viec: 'may-chu-trong' }

  const tamMay = applyData(row.data, khoMacDinh())
  const mayCoDL = coGiDeCat(tamMay)
  const cucBoCoDL = coGiDeCat(state)
  const keCucBo = state.chuyenDaCat
  const keMay = row.data.chuyenDaCat

  const layMayChu = async (viec, veThem) => {
    apDung(row.data)
    state.chuyenDaCat = hopNhatKe(keMay, keCucBo)
    if (veThem) state.chuyenDaCat.unshift(veThem)
    danhDauDaDocXong()
    await ghiXuong()
    return { viec, ve: veThem }
  }
  const giuCucBo = (viec) => {
    state.chuyenDaCat = hopNhatKe(keCucBo, keMay)
    danhDauDaDocXong()
    return { viec }
  }

  /* 1 · chỉ một bên có dữ liệu */
  if (mayCoDL && !cucBoCoDL) return layMayChu('lay-ban-may-chu')
  if (!mayCoDL && cucBoCoDL) return giuCucBo('ban-cuc-bo-moi-hon')

  /* 2 · hai sổ khác nhau → cất bản trên máy, mây là sổ chính */
  if (mayCoDL && cucBoCoDL && !chungIdDong(tamMay, state)) {
    return layMayChu('xung-dot-cat-ban-may', veBanTrenMay(state))
  }

  /* 3 · cùng một sổ (hoặc cả hai trống) → luật cũ: ai mới hơn thắng */
  const gioMayChu = Date.parse(row.updated_at) || 0
  const gioCucBo = state._updatedAt || 0
  if (gioMayChu >= gioCucBo) return layMayChu('lay-ban-may-chu')
  return giuCucBo('ban-cuc-bo-moi-hon')
}
