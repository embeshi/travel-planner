<script setup>
/* Điều hướng chính — «cổng lên máy bay».
   ≤700px: thanh tab đáy 4 mục · ≥701px: sidebar trái 186px.
   Breakpoint DUY NHẤT của cả app là 701px (CLAUDE.md).

   Đây là điều hướng app, không phải widget tab, nên dùng <nav> + <button>
   chứ không phải role="tablist". Không cần thư viện headless. */
defineProps({
  tabs: { type: Array, required: true } // [{ ma, nhan, bieuTuong }]
})
const tab = defineModel({ default: '' })
</script>

<template>
  <nav class="tabs" aria-label="Điều hướng chính">
    <button
      v-for="t in tabs"
      :key="t.ma"
      class="tabs__nut"
      :class="{ 'tabs__nut--chon': tab === t.ma }"
      :aria-current="tab === t.ma ? 'page' : undefined"
      type="button"
      @click="tab = t.ma"
    >
      <span class="tabs__bt" aria-hidden="true">{{ t.bieuTuong }}</span>
      <span class="tabs__nhan">{{ t.nhan }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  background: var(--giay);
  border-top: var(--vien);
}

.tabs__nut {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--sp-2) var(--sp-1);
  background: transparent;
  border: 0;
  color: var(--muc-phu);
  cursor: pointer;
  transition: background-color var(--nhanh) var(--diu),
              color var(--nhanh) var(--diu);
}
.tabs__nut:focus-visible { outline: var(--focus); outline-offset: -3px; }

.tabs__bt { font-size: 18px; line-height: 1; }

.tabs__nhan {
  font-family: var(--font-nhan);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
}

/* Tab đang chọn: nền san hô, chữ kem */
.tabs__nut--chon { background: var(--san-ho); color: var(--giay); }

/* ---- Laptop: đổi thành sidebar trái ---- */
@media (min-width: 701px) {
  .tabs {
    flex-direction: column;
    width: 186px;
    border-top: 0;
    border-right: var(--vien);
    padding: var(--sp-3) var(--sp-2);
    gap: var(--sp-1);
  }
  .tabs__nut {
    flex: none;
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--sp-2);
    padding: 10px var(--sp-3);
    border-radius: var(--bo-nho);
  }
  .tabs__nhan { font-size: 11px; }
}
</style>
