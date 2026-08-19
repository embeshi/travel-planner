<script setup>
import { ref, computed } from 'vue'
import ThanhTab from './components/ThanhTab.vue'
import ConDau from './components/ConDau.vue'
import BangLichTrinh from './components/BangLichTrinh.vue'
import ManHomNay from './components/ManHomNay.vue'
import { kho, applyData, ruotCuaBackup } from './lib/kho.js'
import { baConSoVanTay } from './lib/tong-hop.js'
import { tabMoDau, giaiDoan, homNayISO } from './lib/giai-doan.js'
import { fmtVND, fmtFx } from './lib/dinh-dang.js'

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
const dangXem = computed(() => TABS.find((t) => t.ma === tab.value))
const vanTay = computed(() => baConSoVanTay(kho))
const gd = computed(() => giaiDoan(kho, homNay.value))
const NHAN_GD = { 'chua-co': 'chưa có chuyến', truoc: 'trước chuyến', trong: 'trong chuyến', sau: 'sau chuyến' }

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
      <p v-else class="ve__cho">
        Tab <strong>{{ dangXem.nhan }}</strong> sẽ có nội dung ở lô sau.
      </p>

      <p class="ve__van-tay">
        {{ vanTay.soDongLichTrinh }} dòng ·
        {{ fmtVND(vanTay.tongChiPhiVnd) }} ·
        ví {{ fmtFx(vanTay.viTienMatConLai) }} {{ vanTay.donViVi }}
      </p>
    </main>

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
