<script setup>
import { ref, computed } from 'vue'
import ThanhTab from './components/ThanhTab.vue'
import ConDau from './components/ConDau.vue'
import BangLichTrinh from './components/BangLichTrinh.vue'
import { kho, applyData, ruotCuaBackup } from './lib/kho.js'
import { baConSoVanTay } from './lib/tong-hop.js'
import { fmtVND, fmtFx } from './lib/dinh-dang.js'

const TABS = [
  { ma: 'hom-nay', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { ma: 'ke-hoach', nhan: 'Kế hoạch', bieuTuong: '🗓' },
  { ma: 'so-tay', nhan: 'Sổ tay', bieuTuong: '🧳' },
  { ma: 'tong-ket', nhan: 'Tổng kết', bieuTuong: '📊' }
]
const tab = ref('ke-hoach')
const dangXem = computed(() => TABS.find((t) => t.ma === tab.value))
const vanTay = computed(() => baConSoVanTay(kho))

/* Nhập backup — tạm đặt ở đây cho lô 4 thử được với dữ liệu thật.
   Lô 9 sẽ dời nó về khu Backup cho đúng chỗ.
   Chỉ đọc file trong bộ nhớ tạm: không đăng nhập, không gọi máy chủ. */
function nhapBackup (e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  const doc = new FileReader()
  doc.onload = () => {
    try { applyData(ruotCuaBackup(JSON.parse(doc.result)), kho) } catch (err) { alert('Không đọc được file: ' + err.message) }
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
        <span class="nhan-mono">Sổ tay du lịch</span>
        <h1 class="ve__tieu-de">{{ kho.title }} <span class="ve__ver">v10</span></h1>
      </div>
      <label class="ve__nhap">
        <span class="nhan-mono">Nhập backup</span>
        <input type="file" accept="application/json,.json" @change="nhapBackup">
      </label>
      <ConDau loai="canh-bao" />
    </header>

    <main class="ve__than">
      <BangLichTrinh v-if="tab === 'ke-hoach'" />
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
.ve__tieu-de {
  margin: var(--sp-1) 0 0; font-family: var(--font-nhan);
  font-size: 20px; font-weight: 600;
}
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

/* Điện thoại: xếp dọc, tiêu đề một dòng — không để nhãn mono vỡ thành
   bốn dòng như bản đầu. Ô nhập backup xuống hàng riêng cho khỏi chen. */
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
