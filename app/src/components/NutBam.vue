<script setup>
defineProps({
  /* chinh | phu | vien | pha-huy */
  kieu: { type: String, default: 'chinh' },
  khoa: { type: Boolean, default: false },
  rong: { type: Boolean, default: false }
})
</script>

<template>
  <button
    class="nut"
    :class="[`nut--${kieu}`, { 'nut--rong': rong }]"
    :disabled="khoa"
    type="button"
  >
    <slot />
  </button>
</template>

<style scoped>
.nut {
  font-family: var(--font-nhan);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  padding: 10px var(--sp-4);
  border: var(--vien);
  border-radius: var(--bo-nho);
  box-shadow: var(--bong-chip);
  cursor: pointer;
  /* Mục 05 bảng thiết kế: nút bấm 90ms, chỉ transform + màu nền */
  transition: transform 90ms var(--diu),
              box-shadow 90ms var(--diu),
              background-color 90ms var(--diu);
}
.nut--rong { width: 100%; }

/* Nhấn giữ: lùi 2px, bóng khối co còn 1px */
.nut:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--navy);
}
.nut:focus-visible { outline: var(--focus); outline-offset: 2px; }

.nut--chinh { background: var(--san-ho); color: var(--giay); }
.nut--chinh:hover:not(:disabled) { background: var(--san-ho-hover); }
.nut--chinh:active:not(:disabled) { background: var(--san-ho-press); }

.nut--phu { background: var(--nghe); color: var(--navy); }
.nut--phu:hover:not(:disabled) { background: var(--nghe-hover); }

.nut--vien { background: var(--giay); color: var(--navy); }
.nut--vien:hover:not(:disabled) { background: var(--kem); }

.nut--pha-huy { background: var(--loi); color: var(--giay); }
.nut--pha-huy:hover:not(:disabled) { background: #97201A; }

.nut:disabled {
  background: var(--khoa);
  color: var(--khoa-muc);
  border-color: var(--vach);
  box-shadow: none;
  cursor: not-allowed;
}
</style>
