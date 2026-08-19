<script setup>
import { ref, computed, onUnmounted } from 'vue'
import ThanhTab from './components/ThanhTab.vue'
import ConDau from './components/ConDau.vue'
import BangLichTrinh from './components/BangLichTrinh.vue'
import ManHomNay from './components/ManHomNay.vue'
import ManSoTay from './components/ManSoTay.vue'
import ManTongKet from './components/ManTongKet.vue'
import GhiChiNhanh from './components/GhiChiNhanh.vue'
import ToastHoanTac from './components/ToastHoanTac.vue'
import { kho, applyData, ruotCuaBackup } from './lib/kho.js'
import { baConSoVanTay } from './lib/tong-hop.js'
import { tabMoDau, giaiDoan, homNayISO } from './lib/giai-doan.js'
import { fmtVND, fmtFx, num } from './lib/dinh-dang.js'
import { rowTotal } from './lib/xep-dong.js'
import { danhMucCua } from './lib/kho.js'

const TABS = [
  { ma: 'hom-nay', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { ma: 'ke-hoach', nhan: 'Kế hoạch', bieuTuong: '🗓' },
  { ma: 'so-tay', nhan: 'Sổ tay', bieuTuong: '🧳' },
  { ma: 'tong-ket', nhan: 'Tổng kết', bieuTuong: '📊' }
]

/* Cho phép ép ngày qua ?ngay=2026-08-04 để thử được cả ba giai đoạn mà
   không phải vặn đồng hồ máy. Không có tham số thì lấy ngày thật. */
const homNay = ref(new URLSearchParams(location.search).get('ngay') || homNayISO())

const tab = ref(tabMoDau(kho, homNay.value))
const vanTay = computed(() => baConSoVanTay(kho))
const gd = computed(() => giaiDoan(kho, homNay.value))
const NHAN_GD = { 'chua-co': 'chưa có chuyến', truoc: 'trước chuyến', trong: 'trong chuyến', sau: 'sau chuyến' }

/* ---------------- Ghi chi nhanh + phanh an toàn ---------------- */
const moSheet = ref(false)

/* Giữ tham chiếu tới MediaQueryList trong một biến và gỡ listener khi rã
   linh kiện. MQL không được ai giữ thì có thể bị dọn cùng cả listener —
   đây là cách viết đúng, dù không phải nguyên nhân của triệu chứng dưới.

   LƯU Ý KHI THỬ: khung xem trước trong Claude Code đổi khổ màn hình mà
   KHÔNG phát sự kiện `resize` hay `change` cho trang (đã gắn máy dò để
   xác nhận: cả hai đếm được 0 lần). Nên ở đó phải TẢI LẠI TRANG sau khi
   đổi bề ngang mới thấy FAB ↔ panel đổi chỗ. Trên trình duyệt thật, xoay
   điện thoại hay kéo cửa sổ đều phát sự kiện bình thường. */
const mqDienThoai = window.matchMedia('(max-width: 700px)')
const laDienThoai = ref(mqDienThoai.matches)
const theoDoiBeNgang = (e) => { laDienThoai.value = e.matches }
mqDienThoai.addEventListener('change', theoDoiBeNgang)
onUnmounted(() => mqDienThoai.removeEventListener('change', theoDoiBeNgang))

const toast = ref(null)
function daGhi (d) {
  toast.value = {
    id: d.id,
    chiTiet: [fmtFx(rowTotal(d)) + ' ' + kho.currency, danhMucCua(d), d.pay || 'chưa chọn nguồn'].join(' · ')
  }
}
/* Hoàn tác trong 5 giây — mọi hành động ghi đều phải có phanh (PRD mục 05) */
function hoanTac () {
  if (!toast.value) return
  const i = kho.rows.findIndex((r) => r.id === toast.value.id)
  if (i >= 0) kho.rows.splice(i, 1)
  toast.value = null
}

function nhapBackup (e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const doc = new FileReader()
  doc.onload = () => {
    try {
      applyData(ruotCuaBackup(JSON.parse(doc.result)), kho)
      /* App tự mở đúng tab theo giai đoạn (PRD mục 03B) */
      tab.value = tabMoDau(kho, homNay.value)
    } catch (err) { alert('Không đọc được file: ' + err.message) }
  }
  doc.readAsText(f)
  e.target.value = ''
}
</script>

<template>
  <div class="ve">
    <div class="soc-ve" />

    <header class="ve__dau">
      <div class="ve__ten">
        <span class="nhan-mono">Sổ tay du lịch · {{ NHAN_GD[gd] }}</span>
        <h1 class="ve__tieu-de">{{ kho.title }} <span class="ve__ver">v10</span></h1>
      </div>
      <label class="ve__nhap">
        <span class="nhan-mono">Nhập backup</span>
        <input type="file" accept="application/json,.json" @change="nhapBackup">
      </label>
      <ConDau loai="canh-bao" />
    </header>

    <main class="ve__than">
      <ManHomNay v-if="tab === 'hom-nay'" :hom-nay="homNay" @sang-tab="tab = $event" />
      <BangLichTrinh v-else-if="tab === 'ke-hoach'" />
      <ManSoTay v-else-if="tab === 'so-tay'" />
      <ManTongKet v-else-if="tab === 'tong-ket'" />

      <!-- Panel ghi nhanh chỉ có ích ở hai màn đang sống trong chuyến -->
      <GhiChiNhanh v-if="!laDienThoai && (tab === 'hom-nay' || tab === 'ke-hoach')"
                   kieu="panel" :hom-nay="homNay" class="ve__panel" @da-ghi="daGhi" />

      <p class="ve__van-tay">
        {{ vanTay.soDongLichTrinh }} dòng ·
        {{ fmtVND(vanTay.tongChiPhiVnd) }} ·
        ví {{ fmtFx(vanTay.viTienMatConLai) }} {{ vanTay.donViVi }}
      </p>
    </main>

    <!-- FAB: chỉ ở điện thoại, và nằm TRÊN thanh tab để không che hàng dữ liệu -->
    <button v-if="laDienThoai" type="button" class="fab" aria-label="Ghi một khoản chi"
            @click="moSheet = true">＋</button>

    <GhiChiNhanh v-if="laDienThoai" kieu="sheet" :mo="moSheet" :hom-nay="homNay"
                 @dong="moSheet = false" @da-ghi="daGhi" />

    <div v-if="toast" class="ve__toast">
      <ToastHoanTac :hien="!!toast" noi-dung="Đã ghi ✓" :chi-tiet="toast.chiTiet"
                    :giay="5" @hoan-tac="hoanTac" @het-gio="toast = null" />
    </div>

    <ThanhTab v-model="tab" :tabs="TABS" class="ve__tabs" />
  </div>
</template>

<style scoped>
.ve { min-height: 100dvh; display: flex; flex-direction: column; background: var(--kem); }
.ve__dau {
  display: flex; align-items: flex-start; gap: var(--sp-4); flex-wrap: wrap;
  padding: var(--sp-4); background: var(--giay); border-bottom: var(--vien);
}
.ve__ten { min-width: 0; flex: 1; }
.ve__tieu-de { margin: var(--sp-1) 0 0; font-family: var(--font-nhan); font-size: 20px; font-weight: 600; }
.ve__ver { color: var(--san-ho); }
.ve__nhap .nhan-mono { display: block; margin-bottom: 2px; }
.ve__nhap input { font-size: 12px; max-width: 190px; }

.ve__than { flex: 1; padding: var(--sp-4); min-width: 0; }
.ve__cho { color: var(--muc-phu); }
.ve__van-tay {
  margin-top: var(--sp-4); font-family: var(--font-nhan);
  font-size: 11px; letter-spacing: .06em; color: var(--nhan);
}
.ve__tabs { position: sticky; bottom: 0; }
.ve__panel { margin-top: var(--sp-4); max-width: 420px; }

.fab {
  position: fixed; right: var(--sp-4); bottom: 76px; z-index: 30;
  width: 56px; height: 56px; border-radius: 50%;
  font-size: 26px; line-height: 1; color: var(--giay);
  background: var(--san-ho); border: var(--vien); box-shadow: var(--bong-the);
  cursor: pointer;
}
.fab:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--navy); }
.fab:focus-visible { outline: var(--focus); outline-offset: 3px; }

.ve__toast { position: fixed; left: var(--sp-3); right: var(--sp-3); bottom: 78px; z-index: 40; }
@media (min-width: 701px) {
  .ve__toast { left: auto; right: var(--sp-6); bottom: var(--sp-6); width: 380px; }
}

@media (max-width: 700px) {
  .ve__dau { align-items: center; gap: var(--sp-2); }
  .ve__ten { flex: 1 1 100%; }
  .ve__ten .nhan-mono { white-space: nowrap; }
  .ve__tieu-de { font-size: 18px; }
  .ve__nhap { flex: 1 1 100%; }
  .ve__nhap input { max-width: 100%; }
}

@media (min-width: 701px) {
  .ve { display: grid; grid-template-columns: 186px 1fr; grid-template-rows: auto auto 1fr; }
  .soc-ve { grid-column: 1 / -1; }
  .ve__tabs { grid-row: 2 / 4; grid-column: 1; position: static; }
  .ve__dau { grid-row: 2; grid-column: 2; }
  .ve__than { grid-row: 3; grid-column: 2; }
}
</style>
