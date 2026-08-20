<script setup>
import { ref } from 'vue'
import { khoaAI, luuKhoaAI, xoaKhoaAI } from '../lib/ai.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

/* Quản lý chìa khoá API — «cách c»: chủ dự án tự cầm SIM.
   Khoá chỉ nằm trong localStorage máy này. Không kho, không backup,
   không Supabase, không repo. */
const dang = ref('')
const che = () => {
  const k = khoaAI.value
  return k.length > 10 ? k.slice(0, 10) + '…' + k.slice(-4) : '•••'
}
function luu () {
  if (!dang.value.trim()) return
  luuKhoaAI(dang.value)
  dang.value = ''
}
</script>

<template>
  <div class="ka">
    <template v-if="khoaAI">
      <p class="ka__co">
        Khoá API: <code>{{ che() }}</code> — nằm trên máy này, không vào backup hay tài khoản.
      </p>
      <button type="button" class="ka__xoa" @click="xoaKhoaAI">Gỡ khoá khỏi máy</button>
    </template>
    <template v-else>
      <label class="nhan-mono" for="ka-o">Dán khoá API của OpenRouter</label>
      <div class="ka__hang">
        <ONhap id="ka-o" v-model="dang" type="password" placeholder="sk-or-…" @enter="luu" />
        <NutBam kieu="phu" :khoa="!dang.trim()" @click="luu">Lưu vào máy</NutBam>
      </div>
      <p class="ka__ghi">
        Lấy khoá ở openrouter.ai → Keys. Khoá chỉ lưu trong trình duyệt máy này;
        mỗi lần bấm ✦ tốn vài chục đồng, trừ vào credit OpenRouter của khoá.
      </p>
    </template>
  </div>
</template>

<style scoped>
.ka { display: flex; flex-direction: column; gap: var(--sp-2); }
.ka__hang { display: flex; gap: var(--sp-2); align-items: flex-start; }
.ka__hang > :first-child { flex: 1; min-width: 0; }
.ka__co { margin: 0; font-size: 13px; color: var(--muc-phu); }
.ka__co code { font-family: var(--font-nhan); font-size: 11px; }
.ka__xoa {
  align-self: flex-start; font-size: 12px; color: var(--muc-phu);
  background: transparent; border: 0; cursor: pointer; padding: 0;
  text-decoration: underline;
}
.ka__xoa:hover { color: var(--loi); }
.ka__ghi { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muc-phu); }
</style>
