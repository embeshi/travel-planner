<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ThanhTab from './components/ThanhTab.vue'
import ConDau from './components/ConDau.vue'
import TemPhienBan from './components/TemPhienBan.vue'
import BangLichTrinh from './components/BangLichTrinh.vue'
import ManHomNay from './components/ManHomNay.vue'
import ManSoTay from './components/ManSoTay.vue'
import ManTongKet from './components/ManTongKet.vue'
import ManRong from './components/ManRong.vue'
import ManDangNhap from './components/ManDangNhap.vue'
import BangRon from './components/BangRon.vue'
import GhiChiNhanh from './components/GhiChiNhanh.vue'
import ToastHoanTac from './components/ToastHoanTac.vue'
import { kho, applyData, ruotCuaBackup, danhMucCua } from './lib/kho.js'
import { rowTotal } from './lib/xep-dong.js'
import { fmtVND, fmtFx } from './lib/dinh-dang.js'
import { tabMoDau, giaiDoan, homNayISO, mocChuyenDi } from './lib/giai-doan.js'
import { khoiDong, henLuu, trangThai, nguoiDung, dongBoOk, chuTrangThaiLuu, dangXuat } from './lib/khoi-dong.js'

const TABS = [
  { ma: 'hom-nay', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { ma: 'ke-hoach', nhan: 'Kế hoạch', bieuTuong: '🗓' },
  { ma: 'so-tay', nhan: 'Sổ tay', bieuTuong: '🧳' },
  { ma: 'tong-ket', nhan: 'Tổng kết', bieuTuong: '📊' }
]
const homNay = ref(new URLSearchParams(location.search).get('ngay') || homNayISO())
const tab = ref('ke-hoach')
const hienDangNhap = ref(false)

const gd = computed(() => giaiDoan(kho, homNay.value))
const chuaCoChuyen = computed(() => mocChuyenDi(kho).tu === 'chua-co' && !kho.rows.length)
const vanTay = computed(() => ({
  dong: kho.rows.length,
  tong: fmtVND(kho.rows.reduce((s, r) => s + rowTotal(r), 0) * (kho.rate || 0))
}))

/* ---------------- Băng-rôn hoàn tất: hiện ĐÚNG MỘT LẦN ---------------- */
const KHOA_BANG_RON = 'ke-hoach-du-lich-v10-bangron'
const hienBangRon = ref(false)
function xetBangRon () {
  if (gd.value !== 'sau' || chuaCoChuyen.value) return
  try {
    const dau = kho.title + '|' + (kho.hotel.checkout || '')
    if (localStorage.getItem(KHOA_BANG_RON) === dau) return
    hienBangRon.value = true
  } catch (e) { /* không đọc được thì thôi, không chặn app */ }
}
function dongBangRon () {
  hienBangRon.value = false
  try { localStorage.setItem(KHOA_BANG_RON, kho.title + '|' + (kho.hotel.checkout || '')) } catch (e) {}
}

/* ---------------- Khởi động: ĐỌC TRƯỚC, GHI SAU ---------------- */
onMounted(async () => {
  await khoiDong()
  tab.value = tabMoDau(kho, homNay.value)
  xetBangRon()
  /* Chỉ bật tự-lưu SAU khi khởi động xong. Bật sớm là mở đúng cánh cửa
     dẫn tới kịch bản ghi đè trang trắng. */
  watch(kho, () => henLuu(), { deep: true })
})

/* ---------------- Ghi chi nhanh + phanh ---------------- */
const moSheet = ref(false)
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

    <!-- ĐANG ĐỌC: chưa dựng xong dữ liệu thì KHÔNG cho thao tác gì.
         Thà hiện «đang tải» mãi còn hơn ghi đè một trang trắng. -->
    <div v-if="trangThai === 'dang-doc'" class="cho">
      <p class="nhan-mono">Đang mở sổ…</p>
    </div>
    <div v-else-if="trangThai === 'loi'" class="cho cho--loi">
      <p class="nhan-mono">Không đọc được sổ trên máy</p>
      <p>App đã dừng lại thay vì ghi đè. Bấm ⟳ rồi thử lại, đừng gõ gì thêm.</p>
      <TemPhienBan />
    </div>

    <template v-else>
      <header class="ve__dau">
        <div class="ve__ten">
          <span class="nhan-mono">Sổ tay du lịch · {{ chuTrangThaiLuu() }}</span>
          <h1 class="ve__tieu-de">{{ kho.title }}</h1>
        </div>
        <label class="ve__nhap">
          <span class="nhan-mono">Nhập backup</span>
          <input type="file" accept="application/json,.json" @change="nhapBackup">
        </label>
        <div class="ve__phai">
          <ConDau :loai="nguoiDung && dongBoOk ? 'duyet' : 'canh-bao'" />
          <TemPhienBan />
          <button v-if="!nguoiDung" type="button" class="ve__dn" @click="hienDangNhap = true">Đăng nhập</button>
          <button v-else type="button" class="ve__dn" @click="dangXuat()">Đăng xuất</button>
        </div>
      </header>

      <main class="ve__than">
        <ManDangNhap v-if="hienDangNhap" @xong="hienDangNhap = false" @bo-qua="hienDangNhap = false" />

        <template v-else>
          <BangRon v-if="hienBangRon" class="ve__bang-ron"
                   @dong="dongBangRon" @xem="dongBangRon(); tab = 'tong-ket'" />

          <ManRong v-if="chuaCoChuyen" @xong="tab = tabMoDau(kho, homNay)" />
          <ManHomNay v-else-if="tab === 'hom-nay'" :hom-nay="homNay" @sang-tab="tab = $event" />
          <BangLichTrinh v-else-if="tab === 'ke-hoach'" />
          <ManSoTay v-else-if="tab === 'so-tay'" />
          <ManTongKet v-else-if="tab === 'tong-ket'" />

          <GhiChiNhanh v-if="!laDienThoai && !chuaCoChuyen && (tab === 'hom-nay' || tab === 'ke-hoach')"
                       kieu="panel" :hom-nay="homNay" class="ve__panel" @da-ghi="daGhi" />

          <p class="ve__van-tay">{{ vanTay.dong }} dòng · {{ vanTay.tong }}</p>
        </template>
      </main>

      <button v-if="laDienThoai && !chuaCoChuyen && !hienDangNhap" type="button" class="fab"
              aria-label="Ghi một khoản chi" @click="moSheet = true">＋</button>

      <GhiChiNhanh v-if="laDienThoai" kieu="sheet" :mo="moSheet" :hom-nay="homNay"
                   @dong="moSheet = false" @da-ghi="daGhi" />

      <div v-if="toast" class="ve__toast">
        <ToastHoanTac :hien="!!toast" noi-dung="Đã ghi ✓" :chi-tiet="toast.chiTiet"
                      :giay="5" @hoan-tac="hoanTac" @het-gio="toast = null" />
      </div>

      <ThanhTab v-model="tab" :tabs="TABS" class="ve__tabs" />
    </template>
  </div>
</template>

<style scoped>
.ve { min-height: 100dvh; display: flex; flex-direction: column; background: var(--kem); }
.cho { padding: var(--sp-8) var(--sp-4); text-align: center; color: var(--muc-phu); }
.cho--loi { color: var(--loi); }
.cho p + p { margin-top: var(--sp-2); font-size: 14px; }

.ve__dau {
  display: flex; align-items: flex-start; gap: var(--sp-4); flex-wrap: wrap;
  padding: var(--sp-4); background: var(--giay); border-bottom: var(--vien);
}
.ve__ten { min-width: 0; flex: 1; }
.ve__tieu-de { margin: var(--sp-1) 0 0; font-family: var(--font-nhan); font-size: 20px; font-weight: 600; }
.ve__nhap .nhan-mono { display: block; margin-bottom: 2px; }
.ve__nhap input { font-size: 12px; max-width: 180px; }
.ve__phai { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.ve__dn {
  font-family: var(--font-nhan); font-size: 10px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--san-ho); background: transparent; border: 0; cursor: pointer;
}
.ve__dn:focus-visible { outline: var(--focus); outline-offset: 2px; }

.ve__than { flex: 1; padding: var(--sp-4); min-width: 0; }
.ve__bang-ron { margin-bottom: var(--sp-4); }
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
  background: var(--san-ho); border: var(--vien); box-shadow: var(--bong-the); cursor: pointer;
}
.fab:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--navy); }
.fab:focus-visible { outline: var(--focus); outline-offset: 3px; }

.ve__toast { position: fixed; left: var(--sp-3); right: var(--sp-3); bottom: 78px; z-index: 40; }
@media (min-width: 701px) { .ve__toast { left: auto; right: var(--sp-6); bottom: var(--sp-6); width: 380px; } }

@media (max-width: 700px) {
  .ve__dau { align-items: center; gap: var(--sp-2); }
  .ve__ten { flex: 1 1 100%; }
  .ve__ten .nhan-mono { white-space: nowrap; }
  .ve__tieu-de { font-size: 18px; }
  .ve__nhap { flex: 1 1 60%; }
  .ve__nhap input { max-width: 100%; }
}
@media (min-width: 701px) {
  .ve { display: grid; grid-template-columns: 186px 1fr; grid-template-rows: auto auto 1fr; }
  .soc-ve { grid-column: 1 / -1; }
  .ve__tabs { grid-row: 2 / 4; grid-column: 1; position: static; }
  .ve__dau { grid-row: 2; grid-column: 2; }
  .ve__than { grid-row: 3; grid-column: 2; }
  .cho { grid-column: 1 / -1; }
}
</style>
