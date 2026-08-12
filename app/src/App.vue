<script setup>
import { ref } from 'vue'
import ThanhTab from './components/ThanhTab.vue'
import ConDau from './components/ConDau.vue'

/* Lô 1 chỉ dựng khung. Nội dung từng tab sẽ mọc dần ở các lô sau:
   Kế hoạch (lô 4) · Hôm nay (lô 5) · Sổ tay (lô 7) · Tổng kết (lô 8). */
const TABS = [
  { ma: 'hom-nay', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { ma: 'ke-hoach', nhan: 'Kế hoạch', bieuTuong: '🗓' },
  { ma: 'so-tay', nhan: 'Sổ tay', bieuTuong: '🧳' },
  { ma: 'tong-ket', nhan: 'Tổng kết', bieuTuong: '📊' }
]
const tab = ref('hom-nay')
const dangXem = () => TABS.find((t) => t.ma === tab.value)
</script>

<template>
  <div class="ve">
    <!-- Một dải sọc DUY NHẤT, ở mép trên khung app (luật 01B) -->
    <div class="soc-ve" />

    <header class="ve__dau">
      <div class="ve__ten">
        <span class="nhan-mono">Sổ tay du lịch</span>
        <h1 class="ve__tieu-de">Kế hoạch du lịch <span class="ve__ver">v10</span></h1>
      </div>
      <!-- Một con dấu DUY NHẤT, ở header -->
      <ConDau loai="duyet" />
    </header>

    <main class="ve__than">
      <p class="ve__cho">
        Khung v10 đã dựng. Tab <strong>{{ dangXem().nhan }}</strong> sẽ có nội dung ở lô sau.
      </p>
      <p class="ve__cho ve__cho--phu">
        Muốn soi linh kiện thì mở <a href="linh-kien.html">bảng linh kiện</a>.
      </p>
    </main>

    <ThanhTab v-model="tab" :tabs="TABS" class="ve__tabs" />
  </div>
</template>

<style scoped>
.ve {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--kem);
}

.ve__dau {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-4);
  padding: var(--sp-4);
  background: var(--giay);
  border-bottom: var(--vien);
}
.ve__ten { min-width: 0; }

.ve__tieu-de {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-nhan);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -.01em;
}
.ve__ver { color: var(--san-ho); }

.ve__than { flex: 1; padding: var(--sp-6) var(--sp-4); }
.ve__cho { margin: 0 0 var(--sp-2); color: var(--muc-phu); }
.ve__cho--phu { font-size: 14px; }
.ve__cho a { color: var(--san-ho); }

.ve__tabs { position: sticky; bottom: 0; }

@media (min-width: 701px) {
  .ve {
    display: grid;
    grid-template-columns: 186px 1fr;
    grid-template-rows: auto auto 1fr;
  }
  .soc-ve { grid-column: 1 / -1; }
  .ve__tabs { grid-row: 2 / 4; grid-column: 1; position: static; }
  .ve__dau { grid-row: 2; grid-column: 2; }
  .ve__than { grid-row: 3; grid-column: 2; }
}
</style>
