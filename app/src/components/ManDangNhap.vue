<script setup>
import { ref } from 'vue'
import { dangNhap } from '../lib/khoi-dong.js'
import { PHIEN_BAN } from '../lib/cau-hinh.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

const emit = defineEmits(['xong', 'bo-qua'])
const email = ref('')
const mk = ref('')
const loi = ref('')
const dangGui = ref(false)

async function vao () {
  if (!email.value.trim() || !mk.value) return
  loi.value = ''; dangGui.value = true
  try { await dangNhap(email.value.trim(), mk.value); emit('xong') }
  catch (e) { loi.value = e.message || 'Không đăng nhập được.' }
  finally { dangGui.value = false; mk.value = '' }
}
</script>

<template>
  <section class="dn">
    <div class="dn__ve">
      <span class="dn__bt" aria-hidden="true">✈</span>
      <h2 class="dn__ten">Kế hoạch du lịch</h2>
      <p class="dn__mo">Sổ tay chuyến đi · {{ PHIEN_BAN }}</p>
    </div>

    <div class="dn__o">
      <label class="nhan-mono" for="dn-email">Email</label>
      <ONhap id="dn-email" v-model="email" type="email" placeholder="anh@vidu.com" @enter="vao" />
    </div>
    <div class="dn__o">
      <label class="nhan-mono" for="dn-mk">Mật khẩu</label>
      <ONhap id="dn-mk" v-model="mk" type="password" placeholder="••••••••" @enter="vao" />
    </div>

    <p v-if="loi" class="dn__loi">{{ loi }}</p>

    <NutBam kieu="chinh" rong :khoa="dangGui" @click="vao">
      {{ dangGui ? 'Đang vào…' : 'Lên máy bay' }}
    </NutBam>

    <p class="dn__ghi">
      Không đăng nhập vẫn dùng được: dữ liệu nằm trên máy, đăng nhập sau sẽ đẩy lên tài khoản.
    </p>
    <button type="button" class="dn__bo-qua" @click="emit('bo-qua')">
      Dùng không cần tài khoản →
    </button>
  </section>
</template>

<style scoped>
.dn {
  display: flex; flex-direction: column; gap: var(--sp-3);
  max-width: 360px; margin: 0 auto; padding: var(--sp-6) 0;
}
.dn__ve { text-align: center; margin-bottom: var(--sp-2); }
.dn__bt { font-size: 30px; }
.dn__ten { margin: var(--sp-1) 0 0; font-family: var(--font-nhan); font-size: 20px; font-weight: 600; }
.dn__mo { margin: 2px 0 0; font-size: 13px; color: var(--muc-phu); }
.dn__o { display: flex; flex-direction: column; gap: var(--sp-1); }
.dn__loi { margin: 0; color: var(--loi); font-size: 13px; font-weight: 600; }
.dn__ghi { margin: 0; font-size: 12.5px; color: var(--muc-phu); text-align: center; }
.dn__bo-qua {
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--san-ho); background: transparent; border: 0; cursor: pointer;
}
.dn__bo-qua:focus-visible { outline: var(--focus); outline-offset: 2px; }
</style>
