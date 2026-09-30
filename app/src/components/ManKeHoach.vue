<script setup>
import BangLichTrinh from './BangLichTrinh.vue'
import TheTyGia from './TheTyGia.vue'
import TheGoiBay from './TheGoiBay.vue'
import TheDoiTien from './TheDoiTien.vue'

/* ============================================================
   🗓 KẾ HOẠCH — bảng thiết kế M3/L3.
   Điện thoại: lịch trình rồi ba thẻ xếp dọc bên dưới.
   Laptop: hai pane minmax(0,1.7fr) minmax(0,1fr) — lịch trình bên
   trái, ba thẻ (💱 · ✈️🏨 · 💵) bên phải.

   Ba thẻ này là ba khu của v9.6 (sec-fx, sec-book, sec-cash) từng bị
   rơi lúc dựng v10 dù kho vẫn giữ đủ dữ liệu — v10.6 trả nợ.
   ============================================================ */
const emit = defineEmits(['doi'])
const baoDoi = () => emit('doi')
</script>

<template>
  <section class="kh">
    <div class="kh__trai"><BangLichTrinh @doi="baoDoi" /></div>
    <aside class="kh__phai">
      <TheTyGia @doi="baoDoi" />
      <TheGoiBay @doi="baoDoi" />
      <TheDoiTien @doi="baoDoi" />
    </aside>
  </section>
</template>

<style scoped>
.kh { display: flex; flex-direction: column; gap: var(--sp-4); }
.kh__phai { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }
.kh__trai { min-width: 0; }
@media (min-width: 701px) {
  .kh { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); align-items: start; }
}
</style>
