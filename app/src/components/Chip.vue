<script setup>
defineProps({
  chon: { type: Boolean, default: false },
  khoa: { type: Boolean, default: false },
  bieuTuong: { type: String, default: '' }
})
</script>

<!--
  Chip danh mục và chip kênh thanh toán — «vé con».
  Dùng <button aria-pressed> thay vì checkbox: đúng ngữ nghĩa cho một
  nút bật/tắt, và không cần thư viện headless nào cho việc này.
-->
<template>
  <button
    class="chip"
    :class="{ 'chip--chon': chon, 'chip--khoa': khoa }"
    :aria-pressed="chon"
    :disabled="khoa"
    type="button"
  >
    <span v-if="bieuTuong" class="chip__bt" aria-hidden="true">{{ bieuTuong }}</span>
    <slot />
  </button>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-nhan);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  color: var(--navy);
  background: var(--giay);
  border: 1.5px solid var(--navy);
  border-radius: var(--bo-nho);
  padding: 7px var(--sp-3);
  cursor: pointer;
  transition: transform 90ms var(--diu),
              box-shadow 90ms var(--diu),
              background-color 90ms var(--diu);
}
.chip__bt { font-size: 13px; letter-spacing: 0; }

.chip:hover:not(:disabled) { background: var(--kem); }
.chip:active:not(:disabled) { transform: translate(1px, 1px); box-shadow: none; }
.chip:focus-visible { outline: var(--focus); outline-offset: 2px; }

.chip--chon {
  background: var(--san-ho);
  color: var(--giay);
  box-shadow: var(--bong-chip);
}
.chip--chon:hover:not(:disabled) { background: var(--san-ho-hover); }

.chip--khoa {
  background: var(--khoa);
  color: var(--khoa-muc);
  border-color: var(--vach);
  border-style: dashed;
  cursor: not-allowed;
}
</style>
