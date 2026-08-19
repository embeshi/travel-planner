<script setup>
import { ref } from 'vue'
import { dangNhap, dangKy } from '../lib/khoi-dong.js'
import { PHIEN_BAN } from '../lib/cau-hinh.js'
import TemPhienBan from './TemPhienBan.vue'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

/* ============================================================
   MÀN ĐĂNG NHẬP — dựng theo M7 · L7 bảng thiết kế.
   «Tấm vé chưa đóng dấu — vẫn dùng được ngoại tuyến trước khi đăng nhập.»

   Một form, hai chế độ: Đăng nhập ↔ Tạo tài khoản mới. Lối «Tạo mới» là
   điều kiện để thử luồng đồng bộ bằng TÀI KHOẢN PHỤ thay vì tài khoản
   thật (luật 7). Lối «dùng không cần tài khoản» luôn nhìn thấy được —
   đăng nhập không phải cửa bắt buộc.
   ============================================================ */
const emit = defineEmits(['xong', 'bo-qua'])

const che = ref('vao')          /* 'vao' đăng nhập · 'tao' tạo tài khoản */
const email = ref('')
const mk = ref('')
const loi = ref('')
const bao = ref('')
const dangGui = ref(false)

async function gui () {
  if (!email.value.trim() || !mk.value || dangGui.value) return
  loi.value = ''; bao.value = ''; dangGui.value = true
  try {
    if (che.value === 'tao') {
      const kq = await dangKy(email.value.trim(), mk.value)
      if (kq.xong) { emit('xong'); return }
      /* Tài khoản đã tạo nhưng còn chờ xác nhận email: quay về chế độ
         đăng nhập và nói rõ việc phải làm — không để người dùng bấm lại
         «Tạo tài khoản» lần nữa rồi nhận lỗi «đã tồn tại». */
      bao.value = kq.chu
      che.value = 'vao'
    } else {
      await dangNhap(email.value.trim(), mk.value)
      emit('xong')
    }
  } catch (e) {
    loi.value = (e && e.message) || 'Không vào được.'
  } finally {
    dangGui.value = false
    mk.value = ''
  }
}

function doiChe () {
  che.value = che.value === 'tao' ? 'vao' : 'tao'
  loi.value = ''; bao.value = ''
}
</script>

<template>
  <section class="dn">
    <!-- Nửa chào — laptop bày lời giới thiệu + ba con số của L7,
         điện thoại chỉ giữ tiêu đề cho gọn (M7) -->
    <div class="dn__chao">
      <span class="dn__bt" aria-hidden="true">✈</span>
      <h2 class="dn__ten">Kế hoạch du lịch</h2>
      <p class="dn__phu">Sổ tay chuyến đi thời AI · {{ PHIEN_BAN }}</p>
      <p class="dn__mo">
        Vé, khách sạn, lịch trình, đổi tiền, hành lý và mọi khoản chi giữa chuyến
        nằm chung một cuống vé. Mất sóng vẫn ghi được, có sóng thì tự đồng bộ.
      </p>
      <dl class="dn__so">
        <div><dt>4</dt><dd>Tab</dd></div>
        <div><dt>3</dt><dd>Chạm để ghi</dd></div>
        <div><dt>0</dt><dd>Vạch sóng cần có</dd></div>
      </dl>
    </div>

    <!-- Nửa form -->
    <div class="dn__form">
      <h3 class="dn__che">{{ che === 'tao' ? 'Tạo tài khoản mới' : 'Đăng nhập' }}</h3>

      <div class="dn__o">
        <label class="nhan-mono" for="dn-email">Email</label>
        <ONhap id="dn-email" v-model="email" type="email" placeholder="anh@vidu.com" @enter="gui" />
      </div>
      <div class="dn__o">
        <label class="nhan-mono" for="dn-mk">Mật khẩu</label>
        <ONhap id="dn-mk" v-model="mk" type="password" placeholder="••••••••" @enter="gui" />
      </div>

      <p v-if="loi" class="dn__loi">{{ loi }}</p>
      <p v-if="bao" class="dn__bao">{{ bao }}</p>

      <NutBam kieu="chinh" rong :khoa="dangGui" @click="gui">
        {{ dangGui ? 'Đang xử lý…' : (che === 'tao' ? 'Tạo tài khoản' : 'Lên máy bay') }}
      </NutBam>

      <button type="button" class="dn__lien-ket" @click="doiChe">
        {{ che === 'tao' ? '← Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Tạo mới' }}
      </button>

      <p class="dn__ghi">
        Không đăng nhập vẫn dùng được: dữ liệu nằm trên máy, đăng nhập sau sẽ đẩy lên tài khoản.
      </p>
      <button type="button" class="dn__lien-ket" @click="emit('bo-qua')">
        Dùng không cần tài khoản →
      </button>

      <div class="dn__chan"><TemPhienBan /></div>
    </div>
  </section>
</template>

<style scoped>
.dn {
  display: grid; gap: var(--sp-6);
  max-width: 400px; margin: 0 auto; padding: var(--sp-6) 0;
}
.dn__chao { text-align: center; }
.dn__bt { font-size: 32px; }
.dn__ten { margin: var(--sp-1) 0 0; font-family: var(--font-nhan); font-size: 22px; font-weight: 600; }
.dn__phu { margin: 2px 0 0; font-size: 13px; color: var(--muc-phu); }
.dn__mo, .dn__so { display: none; }

.dn__form {
  display: flex; flex-direction: column; gap: var(--sp-3);
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the); padding: var(--sp-4);
}
.dn__che {
  margin: 0; font-family: var(--font-nhan); font-size: 12px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
}
.dn__o { display: flex; flex-direction: column; gap: var(--sp-1); }
.dn__loi { margin: 0; color: var(--loi); font-size: 13px; font-weight: 600; }
.dn__bao {
  margin: 0; font-size: 13px; line-height: 1.55; color: #8A5A00;
  background: var(--nghe-nhat); border-radius: var(--bo-nho); padding: var(--sp-2) var(--sp-3);
}
.dn__lien-ket {
  font-size: 13px; color: var(--san-ho); background: transparent;
  border: 0; cursor: pointer; padding: 0; text-align: center;
}
.dn__lien-ket:hover { text-decoration: underline; }
.dn__lien-ket:focus-visible { outline: var(--focus); outline-offset: 2px; }
.dn__ghi { margin: 0; font-size: 12.5px; color: var(--muc-phu); text-align: center; }
.dn__chan { display: flex; justify-content: center; margin-top: var(--sp-2); }

/* Laptop: hai cột theo L7 — lời chào bên trái, form bên phải */
@media (min-width: 701px) {
  .dn {
    grid-template-columns: minmax(0, 1fr) 360px;
    max-width: 860px; align-items: center; gap: var(--sp-8);
  }
  .dn__chao { text-align: left; }
  .dn__mo { display: block; margin: var(--sp-3) 0 0; color: var(--muc-phu); font-size: 14.5px; }
  .dn__so { display: flex; gap: var(--sp-6); margin: var(--sp-4) 0 0; }
  .dn__so div { display: flex; flex-direction: column; }
  .dn__so dt { font-family: var(--font-nhan); font-size: 26px; font-weight: 600; }
  .dn__so dd {
    margin: 0; font-family: var(--font-nhan); font-size: 10px;
    letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--nhan);
  }
}
</style>
