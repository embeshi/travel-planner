<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { kho, dongMoi, danhMucCua, danhMucKeTiep, CHUA_PHAN_LOAI, KENH_THANH_TOAN } from '../lib/kho.js'
import { sortByDate, chuyenDong, rowTotal } from '../lib/xep-dong.js'
import { nhomTheoNgay, nhomCaoNhat, traiPhang } from '../lib/nhom-ngay.js'
import { fmtFx, fmtVND, num } from '../lib/dinh-dang.js'
import ONhap from './ONhap.vue'
import ThanhTong from './ThanhTong.vue'

const emit = defineEmits(['doi'])
const baoDoi = () => emit('doi')

/* ============================================================
   `kho.rows` LUÔN được giữ đúng thứ tự đang hiển thị.
   v9.6 cũng vậy: sortRowsByDate() xếp tại chỗ trên chính mảng gốc.
   Nhờ thế «thứ tự nhìn thấy» và «thứ tự trong mảng» là một — Enter và
   kéo thả không phải dịch qua lại giữa hai hệ toạ độ, chỗ này mà lệch
   là sinh đúng loại lỗi đấu tréo dây mà dự án từng dính.
   ============================================================ */
function xepLai () { return sortByDate(kho.rows) }
onMounted(xepLai)

const nhom = computed(() => nhomTheoNgay(kho.rows))
const ngayCaoNhat = computed(() => nhomCaoNhat(nhom.value))
const phang = computed(() => traiPhang(nhom.value))
const tongNgoaiTe = computed(() => kho.rows.reduce((s, r) => s + rowTotal(r), 0))
const tongVnd = computed(() => kho.rate ? tongNgoaiTe.value * kho.rate : null)

/* ---------------- Con trỏ: giữ tham chiếu tới từng ô ---------------- */
const COT = ['activity', 'tripCost', 'pay']
const oRef = new Map()
const datRef = (id, cot) => (el) => {
  if (el) oRef.set(id + '|' + cot, el)
  else oRef.delete(id + '|' + cot)
}
function roiVao (id, cot) {
  const el = oRef.get(id + '|' + cot)
  if (el && el.focus) el.focus()
}

/* ============================================================
   VẾT SẸO 1 · ENTER THÔNG MINH HAI CHẾ ĐỘ
   Bê nguyên enterHop() của v9.6 (dòng 1624–1647).

   · Laptop (≥701px): Enter nhảy xuống ĐÚNG CỘT ở dòng dưới. Nhập một
     cột từ trên xuống dưới là nhịp làm việc của bảng rộng.
   · Điện thoại (≤700px): Enter đi TUẦN TỰ trong thẻ, qua cả menu Thanh
     toán, hết thẻ mới sang thẻ dưới. Trên màn hẹp thì mỗi thẻ là một
     đơn vị, nhảy cột không có nghĩa gì.

   Dòng cuối mà bấm Enter thì tự đẻ dòng mới.
   ============================================================ */
const laDienThoai = () => window.matchMedia('(max-width: 700px)').matches

async function enterHop (id, cot) {
  const ds = phang.value
  const i = ds.findIndex((r) => r.id === id)
  if (i === -1) return

  if (laDienThoai()) {
    const c = COT.indexOf(cot)
    if (c >= 0 && c < COT.length - 1) return roiVao(id, COT[c + 1])
    const sau = ds[i + 1]
    if (sau) return roiVao(sau.id, COT[0])
    const moi = await themDong(ds[i].date)
    return roiVao(moi.id, COT[0])
  }

  const sau = ds[i + 1]
  if (sau) return roiVao(sau.id, cot)
  const moi = await themDong(ds[i].date)
  roiVao(moi.id, cot)
}

/* Dòng mới nhận NGÀY của dòng vừa bấm Enter.
   Khác v9.6 một chút, và cố ý: v9.6 là bảng phẳng có cột Ngày nên dòng
   trống ngày nằm yên tại chỗ. v10 gom theo ngày, nên một dòng trống ngày
   sẽ nhảy tuột xuống cụm «chưa ghi ngày» ở đáy — bấm Enter mà con trỏ
   biến mất khỏi tầm mắt thì hỏng nhịp nhập liệu. */
async function themDong (date = '') {
  const moi = dongMoi()
  moi.date = date
  kho.rows.push(moi)
  xepLai()
  baoDoi()
  await nextTick()
  return moi
}

/* ============================================================
   VẾT SẸO 3 · DÒNG BAY VỀ CỤM NGÀY, CON TRỎ BAY THEO
   Bê nguyên nhánh `key === "date"` của bindCell() (dòng 1740–1750).

   Thứ tự không đổi thì ĐỨNG YÊN — vẽ lại vô cớ làm con trỏ giật.
   Thứ tự có đổi thì phải chủ động đưa con trỏ theo dòng sang chỗ mới,
   vì dòng nhảy sang cụm ngày khác là sang một nhánh DOM khác, Vue tháo
   ô cũ dựng ô mới nên tiêu điểm không tự đi theo được.
   ============================================================ */
async function doiNgay (row, giaTri) {
  row.date = giaTri
  baoDoi()
  if (!xepLai()) return
  await nextTick()
  roiVao(row.id, 'activity')
}

function xoaDong (row) {
  const i = kho.rows.indexOf(row)
  if (i >= 0) kho.rows.splice(i, 1)
  baoDoi()
}

function xoayDanhMuc (row) {
  row.cat = danhMucKeTiep(row.cat || '')
  baoDoi()
}

/* ============================================================
   KÉO THẢ KIỂU NOTION — bê luật của enableRowDrag() (dòng 1663–1709).
   Việc dời chỗ và luật «nhận ngày của hàng xóm» nằm ở chuyenDong()
   trong xep-dong.js, đã có test riêng.

   Ở đây chỉ làm phần chuột: dòng nào đang nằm dưới con trỏ.
   Dời chỗ ngay trong lúc kéo (không đợi thả) để mắt thấy được nó sẽ
   rơi vào đâu — và vì chuyenDong tự gán ngày theo hàng xóm nên mảng
   luôn còn đúng thứ tự ngày, không cần tạm ngưng việc xếp.
   ============================================================ */
const keo = ref(null)
const khung = ref(null)
let anhChup = null

function batDauKeo (e, row) {
  const i = kho.rows.indexOf(row)
  if (i < 0) return
  e.preventDefault()
  anhChup = kho.rows.map((r) => ({ r, date: r.date }))
  keo.value = { id: row.id, tai: i }
  try { e.target.setPointerCapture(e.pointerId) } catch (err) {}
}

function dangKeo (e) {
  if (!keo.value || !khung.value) return
  e.preventDefault()
  const cac = [...khung.value.querySelectorAll('[data-dong]')]
  let den = cac.length - 1
  for (let i = 0; i < cac.length; i++) {
    const h = cac[i].getBoundingClientRect()
    if (e.clientY < h.top + h.height / 2) { den = i; break }
  }
  if (den === keo.value.tai) return
  chuyenDong(kho.rows, keo.value.tai, den)
  keo.value.tai = den
}

function thaKeo (giu) {
  if (!keo.value) return
  if (!giu && anhChup) {
    /* Huỷ giữa chừng: trả cả thứ tự lẫn ngày về nguyên trạng */
    kho.rows.splice(0, kho.rows.length, ...anhChup.map((x) => x.r))
    anhChup.forEach((x) => { x.r.date = x.date })
  } else {
    baoDoi()
  }
  keo.value = null
  anhChup = null
}
</script>

<template>
  <section class="lt">
    <div class="lt__dau">
      <h2 class="lt__ten">Lịch trình &amp; chi phí</h2>
      <span class="lt__meo">Kéo ⠿ để đổi thứ tự · Enter để xuống dòng</span>
    </div>

    <div ref="khung" class="bang" @pointermove="dangKeo"
         @pointerup="thaKeo(true)" @pointercancel="thaKeo(false)">

      <!-- Hàng nhãn cột: chỉ có ở laptop -->
      <div class="bang__nhan">
        <span /><span>Hoạt động</span><span class="phai">Chi phí</span>
        <span>Danh mục</span><span>Thanh toán</span><span />
      </div>

      <div v-for="g in nhom" :key="g.key" class="nhom">
        <div class="nhom__dau">
          <span class="nhom__ngay">
            <template v-if="g.thu">{{ g.thu }} · </template>{{ g.nhan }}
            <span v-if="g.key === ngayCaoNhat" title="Ngày tiêu nhiều nhất">🔥</span>
          </span>
          <span class="nhom__tong">{{ fmtFx(g.tong) }} {{ kho.currency }}</span>
        </div>

        <div v-for="row in g.dong" :key="row.id" :data-dong="row.id"
             class="dong" :class="{ 'dong--keo': keo && keo.id === row.id }">

          <span class="dong__grip" title="Kéo để sắp xếp" aria-hidden="true"
                @pointerdown="batDauKeo($event, row)">⠿</span>

          <ONhap :ref="datRef(row.id, 'activity')" v-model="row.activity"
                 placeholder="Tên hoạt động" @update:model-value="baoDoi"
                 @enter="enterHop(row.id, 'activity')" />

          <ONhap :ref="datRef(row.id, 'tripCost')" v-model="row.tripCost"
                 type="number" placeholder="0" can-phai
                 @update:model-value="baoDoi"
                 @enter="enterHop(row.id, 'tripCost')" />

          <button type="button" class="chip-dm"
                  :class="{ 'chip-dm--trong': !row.cat }"
                  :title="danhMucCua(row) + ' — bấm để đổi'"
                  @click="xoayDanhMuc(row)">
            {{ row.cat || CHUA_PHAN_LOAI }}
          </button>

          <select :ref="datRef(row.id, 'pay')" v-model="row.pay" class="chon-kenh"
                  aria-label="Thanh toán" @change="baoDoi"
                  @keydown.enter.prevent="enterHop(row.id, 'pay')">
            <option value="">—</option>
            <option v-for="k in KENH_THANH_TOAN" :key="k" :value="k">{{ k }}</option>
          </select>

          <div class="dong__cuoi">
            <input class="dong__ngay" type="date" :value="row.date"
                   aria-label="Đổi ngày" @change="doiNgay(row, $event.target.value)">
            <button type="button" class="dong__xoa" title="Xoá dòng này"
                    @click="xoaDong(row)">×</button>
          </div>

          <span v-if="kho.rate && num(row.tripCost) > 0" class="dong__vnd">
            ≈ {{ fmtVND(num(row.tripCost) * kho.rate) }}
          </span>
        </div>

        <button type="button" class="them" @click="themDong(g.ngayGoc)">
          ＋ Thêm hoạt động
        </button>
      </div>

      <p v-if="!kho.rows.length" class="trong">
        Chưa có dòng nào. Bấm ＋ bên dưới để thêm hoạt động đầu tiên.
      </p>
      <button v-if="!kho.rows.length" type="button" class="them" @click="themDong('')">
        ＋ Thêm hoạt động
      </button>
    </div>

    <ThanhTong :so="fmtFx(tongNgoaiTe) + ' ' + kho.currency"
               :phu="tongVnd !== null ? fmtVND(tongVnd) : 'thiếu tỷ giá ' + kho.currency" />
  </section>
</template>

<style scoped>
.lt { display: flex; flex-direction: column; gap: var(--sp-3); }
.lt__dau { display: flex; align-items: baseline; gap: var(--sp-3); flex-wrap: wrap; }
.lt__ten {
  margin: 0; font-family: var(--font-nhan); font-size: 13px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
}
.lt__meo { font-size: 13px; color: var(--muc-phu); }

.bang {
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the); overflow: hidden;
}

/* minmax(0,1fr) + không khoá min-width ⇒ không đẻ cuộn ngang ở 1280px */
.bang__nhan, .dong {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 108px 132px 132px 76px;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
}

.bang__nhan {
  font-family: var(--font-nhan); font-size: 10px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
  border-bottom: 1.5px solid var(--navy);
}
.bang__nhan .phai { text-align: right; }

.nhom__dau {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  background: var(--kem); border-block: 1px solid var(--vach);
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
}
.nhom__tong { color: var(--san-ho); }

/* Hàng dữ liệu: nền giấy trơn, KHÔNG bóng, không vân (luật 01B) */
.dong { border-bottom: 1px solid var(--vach); background: var(--giay); }
.dong:last-of-type { border-bottom: 0; }
.dong--keo {
  transform: rotate(-0.6deg);
  box-shadow: 0 6px 14px rgba(31, 58, 95, .18);
  border-left: 3px solid var(--san-ho);
  position: relative; z-index: 2;
}

.dong__grip {
  cursor: grab; color: var(--khoa-muc); font-size: 15px; user-select: none;
  touch-action: none; text-align: center;
}
.dong__grip:active { cursor: grabbing; }

.chip-dm {
  font-family: var(--font-nhan); font-size: 10px; font-weight: 600;
  letter-spacing: .06em; color: var(--navy); background: var(--giay);
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 6px 8px; cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.chip-dm--trong { color: var(--khoa-muc); border-color: var(--vach); border-style: dashed; }
.chip-dm:focus-visible, .chon-kenh:focus-visible { outline: var(--focus); outline-offset: 2px; }

.chon-kenh {
  font-family: var(--font-noi-dung); font-size: 13px; color: var(--navy);
  background: var(--giay); border: 1.5px solid var(--navy);
  border-radius: var(--bo-nho); padding: 7px 6px; min-width: 0;
}

.dong__cuoi { display: flex; align-items: center; gap: 2px; justify-content: flex-end; }
.dong__ngay {
  width: 26px; border: 0; background: transparent; color: transparent;
  cursor: pointer; padding: 0;
}
.dong__ngay::-webkit-calendar-picker-indicator { opacity: .45; cursor: pointer; }
.dong__ngay:hover::-webkit-calendar-picker-indicator { opacity: 1; }
.dong__xoa {
  border: 0; background: transparent; color: var(--khoa-muc);
  font-size: 17px; line-height: 1; cursor: pointer; padding: 0 4px;
}
.dong__xoa:hover { color: var(--loi); }

.dong__vnd { display: none; }

.them {
  display: block; width: 100%; text-align: left;
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--san-ho); background: transparent;
  border: 0; border-top: 1px dashed var(--vach);
  padding: var(--sp-2) var(--sp-3); cursor: pointer;
}
.them:hover { background: var(--kem); }
.trong { margin: 0; padding: var(--sp-4); color: var(--muc-phu); font-size: 14px; }

/* ---------------- Điện thoại: thẻ dọc nén ---------------- */
@media (max-width: 700px) {
  .bang__nhan { display: none; }

  .dong {
    /* Chip và menu kênh phải có Ô RIÊNG. Cho chung một ô rồi đẩy hai đầu
       thì ở 375px chúng đè lên nhau và chữ bị cắt cụt. */
    grid-template-columns: 22px minmax(0, 1fr) 118px;
    grid-template-areas:
      'grip ten  tien'
      '.    chip kenh'
      '.    vnd  cuoi';
    row-gap: var(--sp-1);
    padding: var(--sp-3);
  }
  .dong__grip { grid-area: grip; align-self: start; padding-top: 9px; }
  .dong > :nth-child(2) { grid-area: ten; }
  .dong > :nth-child(3) { grid-area: tien; }
  .chip-dm {
    grid-area: chip; justify-self: start;
    max-width: 100%; white-space: nowrap;
  }
  /* chừa chỗ cho mũi tên xổ xuống của select, không thì chữ bị nó đè */
  .chon-kenh { grid-area: kenh; width: 100%; padding-right: 18px; }
  .dong__cuoi { grid-area: cuoi; align-self: center; }
  .dong__vnd {
    grid-area: vnd; display: block;
    font-family: var(--font-nhan); font-size: 11px; color: var(--nhan);
  }
}
</style>
