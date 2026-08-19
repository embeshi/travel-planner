<script setup>
import { ref } from 'vue'
import { PHIEN_BAN } from '../lib/cau-hinh.js'

/* Nút ⟳ trị cache lì lợm — bê nguyên ý của v9.6. Xoá sạch kho đệm, gỡ
   service worker rồi tải lại, để tem phiên bản mới chịu hiện ra.
   KHÔNG đụng tới localStorage: dữ liệu người dùng nằm ở đó. */
const dangLam = ref(false)
async function lamMoi () {
  dangLam.value = true
  try {
    if ('caches' in window) {
      const ten = await caches.keys()
      await Promise.all(ten.map((k) => caches.delete(k)))
    }
    if (navigator.serviceWorker) {
      const ds = await navigator.serviceWorker.getRegistrations()
      await Promise.all(ds.map((r) => r.unregister()))
    }
  } catch (e) { /* không xoá được thì vẫn cứ tải lại */ }
  location.reload()
}
</script>

<template>
  <span class="tem">
    <span class="tem__so">{{ PHIEN_BAN }}</span>
    <button type="button" class="tem__nut" :disabled="dangLam"
            title="Làm mới app · trị cache lì lợm" aria-label="Làm mới app"
            @click="lamMoi">⟳</button>
  </span>
</template>

<style scoped>
.tem { display: inline-flex; align-items: center; gap: 6px; }
.tem__so {
  font-family: var(--font-nhan); font-size: 10px; font-weight: 600;
  letter-spacing: var(--nhan-gian); color: var(--nhan);
  border: 1px solid var(--vach); border-radius: var(--bo-nho); padding: 2px 6px;
}
.tem__nut {
  width: 22px; height: 22px; padding: 0; cursor: pointer; line-height: 1;
  color: var(--muc-phu); background: var(--giay);
  border: 1px solid var(--vach); border-radius: 50%;
}
.tem__nut:hover:not(:disabled) { color: var(--san-ho); border-color: var(--san-ho); }
.tem__nut:disabled { opacity: .5; cursor: wait; }
.tem__nut:focus-visible { outline: var(--focus); outline-offset: 2px; }
</style>
