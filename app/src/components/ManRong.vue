<script setup>
import { ref } from 'vue'
import { kho } from '../lib/kho.js'
import { TIEN_TE, nhanTienTe } from '../lib/tien-te.js'
import { layTyGiaThiTruong } from '../lib/ty-gia.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

const emit = defineEmits(['xong', 'xem-ke'])
const ten = ref('')
const di = ref('')
const ve = ref('')
/* Tiền tệ hỏi ngay ở đây (v10.6) — không có tỷ giá thì mọi tổng là 0 ₫.
   Mặc định là tiền của chuyến trước, đổi được bằng một cú chọn. */
const tien = ref(TIEN_TE.some((t) => t.ma === kho.currency) ? kho.currency : 'THB')
const duoc = () => ten.value.trim() && di.value

function tao () {
  if (!duoc()) return
  kho.title = ten.value.trim()
  kho.hotel.checkin = di.value
  kho.hotel.checkout = ve.value || di.value
  kho.currency = tien.value
  kho.rate = null
  emit('xong')
  /* Tự lấy tỷ giá SAU khi đã mở app — không bắt chờ mạng. Hỏng thì thôi,
     các chỗ báo «thiếu tỷ giá» sẽ dẫn người dùng tới thẻ 💱. */
  layTyGiaThiTruong(tien.value).then((r) => { kho.rate = r }).catch(() => {})
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
    <div class="rong__o">
      <label class="nhan-mono" for="rong-tien">Tiền tệ của chuyến</label>
      <select id="rong-tien" v-model="tien" class="rong__chon">
        <option v-for="t in TIEN_TE" :key="t.ma" :value="t.ma">{{ nhanTienTe(t.ma) }}</option>
      </select>
      <span class="rong__ghi">Tỷ giá sẽ được lấy tự động sau khi tạo chuyến.</span>
    </div>

    <NutBam kieu="chinh" :khoa="!duoc()" @click="tao">Tạo chuyến</NutBam>
    <p class="rong__ghi">Chưa có ngày về cũng tạo được — điền sau cũng kịp.</p>

    <button v-if="kho.chuyenDaCat.length" type="button" class="rong__ke"
            @click="emit('xem-ke')">
      🎫 Kệ vé đang giữ {{ kho.chuyenDaCat.length }} chuyến cũ — xem lại →
    </button>
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
.rong__chon { font-family: var(--font-noi-dung); font-size: 15px; color: var(--navy);
  background: var(--giay); border: 1.5px solid var(--navy); border-radius: var(--bo-nho); padding: 9px var(--sp-3); }
.rong__chon:focus-visible { outline: var(--focus); outline-offset: 2px; }
.rong__ke { font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
  background: transparent; border: 0; cursor: pointer; padding: 0; text-align: left; }
.rong__ke:focus-visible { outline: var(--focus); outline-offset: 2px; }
</style>
