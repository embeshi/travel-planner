<script setup>
import { ref } from 'vue'

defineProps({
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  /* thuong | loi | thanh-cong */
  trangThai: { type: String, default: 'thuong' },
  thongBao: { type: String, default: '' },
  khoa: { type: Boolean, default: false },
  canPhai: { type: Boolean, default: false }
})

const emit = defineEmits(['enter'])
const model = defineModel({ default: '' })
const el = ref(null)

/* ============================================================
   GIÁP BỘ GÕ TIẾNG VIỆT — vết sẹo, đừng gỡ.

   Khi người dùng đang nặn chữ (gõ "phowr" để ra "phở"), bộ gõ dùng
   phím Enter để CHỐT chữ. Nếu app cũng bắt Enter làm phím nhảy ô thì
   nó cướp mất phím đó, chữ nằm lại dở dang.
   `keyCode === 229` là tín hiệu cũ "phím này thuộc về bộ gõ, không
   thuộc về app" — vẫn cần cho vài bộ gõ trên Android.

   Bản v9.6 có 7 chỗ vá tay y hệt nhau. Ở v10 nó nằm gọn đúng tại đây,
   nên không màn nào quên được nữa. Mọi ô nhập trong app phải đi qua
   linh kiện này, không dùng <input> trần.

   Phần giá trị thì Vue lo sẵn: v-model không cập nhật khi đang nặn chữ,
   nên dòng không bị xếp lại giữa lúc người dùng đang gõ dở tên.
   ============================================================ */
function onKeydown (e) {
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === 'Enter') emit('enter', e)
}

defineExpose({
  focus: () => el.value?.focus(),
  select: () => el.value?.select()
})
</script>

<template>
  <div class="o">
    <input
      ref="el"
      v-model="model"
      class="o__nhap"
      :class="[`o__nhap--${trangThai}`, { 'o__nhap--phai': canPhai }]"
      :type="type"
      :placeholder="placeholder"
      :disabled="khoa"
      :aria-invalid="trangThai === 'loi' || undefined"
      @keydown="onKeydown"
    >
    <p v-if="thongBao" class="o__bao" :class="`o__bao--${trangThai}`">{{ thongBao }}</p>
  </div>
</template>

<style scoped>
.o { display: flex; flex-direction: column; gap: var(--sp-1); }

.o__nhap {
  width: 100%;
  font-family: var(--font-noi-dung);
  font-size: 15px;
  color: var(--navy);
  /* Vùng dữ liệu phải sạch: nền giấy trơn, không vân, không sọc (luật 01B) */
  background: var(--giay);
  border: 1.5px solid var(--navy);
  border-radius: var(--bo-nho);
  padding: 9px var(--sp-3);
  transition: border-color var(--nhanh) var(--diu),
              background var(--nhanh) var(--diu);
}

/* Số tiền và mọi con số dùng mono, canh phải */
.o__nhap--phai {
  font-family: var(--font-nhan);
  font-size: var(--so-hang);
  font-weight: 600;
  text-align: right;
}

.o__nhap::placeholder { color: var(--khoa-muc); }
.o__nhap:focus-visible { outline: var(--focus); outline-offset: 2px; }

.o__nhap--loi { border-color: var(--loi); background: var(--san-ho-nhat); }
.o__nhap--thanh-cong { border-color: var(--duyet); background: var(--duyet-nhat); }

.o__nhap:disabled {
  background: var(--khoa);
  color: var(--khoa-muc);
  border-color: var(--vach);
  cursor: not-allowed;
}

.o__bao { margin: 0; font-size: 13px; line-height: 1.45; color: var(--muc-phu); }
.o__bao--loi { color: var(--loi); }
.o__bao--thanh-cong { color: var(--duyet); }
</style>
