<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  hien: { type: Boolean, default: false },
  noiDung: { type: String, default: 'Đã ghi ✓' },
  chiTiet: { type: String, default: '' },
  giay: { type: Number, default: 5 }
})
const emit = defineEmits(['hoan-tac', 'het-gio'])

const conLai = ref(100)
let dongHo = null

/* Vạch đếm ngược chạy bằng JS chứ không bằng CSS animation.
   Lý do: khối `prefers-reduced-motion` trong tokens.css ép mọi animation
   về 0.01ms — nếu vẽ vạch bằng animation thì ở chế độ giảm chuyển động
   nó biến mất tức thì thay vì đếm.
   Mục 05 bảng thiết kế yêu cầu: giảm chuyển động thì vạch đi theo
   từng bước 1 giây, không phải biến mất. */
const giamChuyenDong = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function batDau () {
  dungLai()
  conLai.value = 100
  const buoc = giamChuyenDong() ? 1000 : 50
  const batDauLuc = Date.now()
  const tong = props.giay * 1000
  dongHo = setInterval(() => {
    const troi = Date.now() - batDauLuc
    conLai.value = Math.max(0, 100 - (troi / tong) * 100)
    if (troi >= tong) { dungLai(); emit('het-gio') }
  }, buoc)
}
function dungLai () { if (dongHo) { clearInterval(dongHo); dongHo = null } }

watch(() => props.hien, (v) => (v ? batDau() : dungLai()), { immediate: true })
onUnmounted(dungLai)
</script>

<template>
  <div v-if="hien" class="toast" role="status" aria-live="polite">
    <div class="toast__than">
      <div class="toast__chu">
        <strong class="toast__tieu-de">{{ noiDung }}</strong>
        <span v-if="chiTiet" class="toast__chi-tiet">{{ chiTiet }}</span>
      </div>
      <button class="toast__hoan-tac" type="button" @click="emit('hoan-tac')">
        Hoàn tác
      </button>
    </div>
    <div class="toast__vach" :style="{ width: conLai + '%' }" />
  </div>
</template>

<style scoped>
.toast {
  background: var(--navy);
  color: var(--kem);
  border-radius: var(--bo-the);
  overflow: hidden;
  box-shadow: var(--bong-the);
  /* Trồi lên 8px trong 160ms (mục 05 bảng thiết kế) */
  animation: troi 160ms var(--diu);
}
@keyframes troi {
  from { transform: translateY(8px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}

.toast__than {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
}
.toast__chu { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.toast__tieu-de {
  font-family: var(--font-nhan);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
}
.toast__chi-tiet { font-size: 13px; opacity: .85; }

.toast__hoan-tac {
  margin-left: auto;
  flex: none;
  font-family: var(--font-nhan);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  color: var(--nghe);
  background: transparent;
  border: 1.5px solid var(--nghe);
  border-radius: var(--bo-nho);
  padding: 6px var(--sp-3);
  cursor: pointer;
}
.toast__hoan-tac:focus-visible { outline: var(--focus); outline-offset: 2px; }

.toast__vach { height: 3px; background: var(--nghe); }
</style>
