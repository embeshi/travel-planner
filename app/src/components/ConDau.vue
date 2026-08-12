<script setup>
/* Con dấu cao su xoay nhẹ. Luật 01B: TỐI ĐA MỘT con dấu mỗi màn,
   và luôn đặt ở header — không rải xuống thẻ con. */
defineProps({
  /* duyet | canh-bao | hoan-tat */
  loai: { type: String, default: 'duyet' }
})

const CHU = {
  duyet: 'Đã đồng bộ',
  'canh-bao': 'Ngoại tuyến',
  'hoan-tat': 'Hoàn tất'
}
</script>

<template>
  <span class="dau" :class="`dau--${loai}`" role="status">
    {{ CHU[loai] }}
  </span>
</template>

<style scoped>
.dau {
  display: inline-block;
  font-family: var(--font-nhan);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  padding: 5px 10px;
  border: 2px solid currentColor;
  border-radius: var(--bo-nho);
  transform: rotate(-5deg);
  white-space: nowrap;
}

.dau--duyet { color: var(--duyet); background: var(--duyet-nhat); }
.dau--canh-bao { color: #8A5A00; background: var(--nghe-nhat); }
.dau--hoan-tat { color: var(--san-ho); background: var(--san-ho-nhat); }
</style>
