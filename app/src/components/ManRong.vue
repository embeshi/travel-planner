<script setup>
import { ref } from 'vue'
import { kho } from '../lib/kho.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

const emit = defineEmits(['xong'])
const ten = ref('')
const di = ref('')
const ve = ref('')
const duoc = () => ten.value.trim() && di.value

function tao () {
  if (!duoc()) return
  kho.title = ten.value.trim()
  kho.hotel.checkin = di.value
  kho.hotel.checkout = ve.value || di.value
  emit('xong')
}
</script>

<template>
  <section class="rong">
    <div class="rong__chibi" aria-hidden="true">
      <span>[ Ảnh chibi ]</span>
      <small>Nhân viên mặt đất đội mũ phi công</small>
    </div>

    <h2 class="rong__ten">Cuống vé chưa in.</h2>
    <p class="rong__mo">
      Đặt tên chuyến và chọn ngày đi — ngày về. App sẽ tự biết bạn đang ở giai đoạn nào
      để mở đúng tab: trước chuyến vào Kế hoạch, giữa chuyến vào Hôm nay, sau chuyến
      vào Tổng kết.
    </p>

    <div class="rong__o">
      <label class="nhan-mono">Tên chuyến</label>
      <ONhap v-model="ten" placeholder="Ví dụ: Bangkok 2026" @enter="tao" />
    </div>
    <div class="rong__hang">
      <div class="rong__o">
        <label class="nhan-mono">Ngày đi</label>
        <ONhap v-model="di" type="date" />
      </div>
      <div class="rong__o">
        <label class="nhan-mono">Ngày về</label>
        <ONhap v-model="ve" type="date" />
      </div>
    </div>

    <NutBam kieu="chinh" :khoa="!duoc()" @click="tao">Tạo chuyến</NutBam>
    <p class="rong__ghi">Chưa có ngày về cũng tạo được — điền sau cũng kịp.</p>
  </section>
</template>

<style scoped>
.rong {
  display: flex; flex-direction: column; gap: var(--sp-3);
  max-width: 460px; margin: 0 auto; padding: var(--sp-6) 0;
}
.rong__chibi {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: 2px dashed var(--vach); border-radius: var(--bo-the);
  padding: var(--sp-6); color: var(--khoa-muc);
  font-family: var(--font-nhan); font-size: 11px; letter-spacing: var(--nhan-gian);
}
.rong__chibi small { font-family: var(--font-noi-dung); font-size: 11px; letter-spacing: 0; }
.rong__ten { margin: 0; font-family: var(--font-nhan); font-size: 20px; font-weight: 600; }
.rong__mo { margin: 0; color: var(--muc-phu); font-size: 14px; }
.rong__o { display: flex; flex-direction: column; gap: var(--sp-1); flex: 1; min-width: 0; }
.rong__hang { display: flex; gap: var(--sp-3); }
.rong__ghi { margin: 0; font-size: 12px; color: var(--muc-phu); }
</style>
