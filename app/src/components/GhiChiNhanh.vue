<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { kho, dongMoi, DANH_MUC, KENH_THANH_TOAN } from '../lib/kho.js'
import { sortByDate } from '../lib/xep-dong.js'
import { bam, deLuu, deHien, PHIM } from '../lib/ban-phim-so.js'
import { danhDauVuaGhi } from '../lib/vua-ghi.js'
import { fmtVND, num } from '../lib/dinh-dang.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'
import Chip from './Chip.vue'

const props = defineProps({
  mo: { type: Boolean, default: false },
  homNay: { type: String, required: true },
  /* 'sheet' cho điện thoại · 'panel' cho laptop */
  kieu: { type: String, default: 'sheet' }
})
const emit = defineEmits(['dong', 'da-ghi'])

const tien = ref('')
const ten = ref('')
const cat = ref('')
const pay = ref('')
const hopThoai = ref(null)
const oTen = ref(null)

const quyDoi = computed(() => {
  const n = num(deLuu(tien.value))
  return kho.rate && n > 0 ? fmtVND(n * kho.rate) : ''
})
const luuDuoc = computed(() => num(deLuu(tien.value)) > 0)

watch(() => props.mo, async (v) => {
  if (props.kieu !== 'sheet' || !hopThoai.value) return
  if (v) { hopThoai.value.showModal(); await nextTick(); }
  else if (hopThoai.value.open) hopThoai.value.close()
})

function goPhim (p) { tien.value = bam(tien.value, p) }

function donDep () { tien.value = ''; ten.value = ''; cat.value = ''; pay.value = '' }

function luu () {
  if (!luuDuoc.value) return
  const d = dongMoi()
  d.date = props.homNay
  d.activity = ten.value.trim()
  d.tripCost = deLuu(tien.value)
  d.cat = cat.value
  d.pay = pay.value
  kho.rows.push(d)
  sortByDate(kho.rows)
  danhDauVuaGhi(d.id)
  emit('da-ghi', d)
  donDep()
  if (props.kieu === 'sheet') emit('dong')
}
</script>

<template>
  <!-- ĐIỆN THOẠI · bottom sheet dùng <dialog> gốc của trình duyệt:
       bẫy tiêu điểm, Escape để đóng, lớp phủ — có sẵn, không cần thư viện. -->
  <dialog v-if="kieu === 'sheet'" ref="hopThoai" class="sheet" @close="emit('dong')">
    <form method="dialog" class="sheet__form" @submit.prevent>
      <div class="sheet__dau">
        <span class="nhan-mono">Ghi chi tiêu · ba chạm</span>
        <button type="button" class="sheet__dong" aria-label="Đóng"
                @click="emit('dong')">×</button>
      </div>

      <div class="tien">
        <span class="tien__so">{{ deHien(tien) }}</span>
        <span class="tien__dv">{{ kho.currency }}</span>
      </div>
      <p class="tien__quy">{{ quyDoi ? '≈ ' + quyDoi : 'chưa có tỷ giá ' + kho.currency }}</p>

      <ONhap v-model="ten" placeholder="Tên khoản chi (không bắt buộc)" />

      <div class="hang">
        <Chip v-for="d in DANH_MUC" :key="d.ma" :bieu-tuong="d.bt" :chon="cat === d.ma"
              @click="cat = cat === d.ma ? '' : d.ma">{{ d.ten }}</Chip>
      </div>
      <div class="hang">
        <Chip v-for="k in KENH_THANH_TOAN" :key="k" :chon="pay === k"
              @click="pay = pay === k ? '' : k">{{ k }}</Chip>
      </div>

      <div class="phim">
        <button v-for="p in PHIM" :key="p" type="button" class="phim__o"
                :class="{ 'phim__o--phu': p === '⌫' || p === ',' }"
                @click="goPhim(p)">{{ p }}</button>
      </div>

      <NutBam kieu="chinh" rong :khoa="!luuDuoc" @click="luu">Lưu khoản chi</NutBam>
      <p class="sheet__ghi">Ngày và quy đổi VNĐ tự điền.</p>
    </form>
  </dialog>

  <!-- LAPTOP · panel mở sẵn, KHÔNG che nội dung (PRD F1) -->
  <section v-else class="panel">
    <div class="panel__dau">
      <span class="nhan-mono">Ghi nhanh · luôn mở</span>
      <span class="panel__meo">Enter để lưu</span>
    </div>

    <div class="panel__o">
      <label class="nhan-mono">Hoạt động</label>
      <ONhap ref="oTen" v-model="ten" placeholder="Tên khoản chi" @enter="luu" />
    </div>
    <div class="panel__o">
      <label class="nhan-mono">Chi phí ({{ kho.currency }})</label>
      <ONhap v-model="tien" type="number" placeholder="0" can-phai @enter="luu" />
    </div>
    <p class="panel__quy">{{ quyDoi ? '≈ ' + quyDoi : '—' }}</p>

    <div class="hang">
      <Chip v-for="d in DANH_MUC" :key="d.ma" :bieu-tuong="d.bt" :chon="cat === d.ma"
            @click="cat = cat === d.ma ? '' : d.ma">{{ d.ten }}</Chip>
    </div>
    <div class="hang">
      <Chip v-for="k in KENH_THANH_TOAN" :key="k" :chon="pay === k"
            @click="pay = pay === k ? '' : k">{{ k }}</Chip>
    </div>

    <NutBam kieu="chinh" rong :khoa="!luuDuoc" @click="luu">Lưu · Enter</NutBam>
  </section>
</template>

<style scoped>
/* ---------------- Bottom sheet ---------------- */
.sheet {
  width: 100%; max-width: 100%; margin: 0 auto auto; padding: 0;
  border: 0; border-top: var(--vien);
  border-radius: var(--bo-the) var(--bo-the) 0 0;
  background: var(--giay); color: var(--navy);
  position: fixed; inset: auto 0 0 0;
}
.sheet::backdrop { background: rgba(31, 58, 95, .55); }
.sheet[open] { animation: truot 220ms var(--diu); }
@keyframes truot { from { transform: translateY(100%) } to { transform: translateY(0) } }

.sheet__form { display: flex; flex-direction: column; gap: var(--sp-3); padding: var(--sp-4); }
.sheet__dau { display: flex; align-items: center; justify-content: space-between; }
.sheet__dong {
  border: 0; background: transparent; font-size: 24px; line-height: 1;
  color: var(--muc-phu); cursor: pointer; padding: 0 4px;
}

.tien { display: flex; align-items: baseline; gap: var(--sp-2); }
.tien__so { font-family: var(--font-nhan); font-size: 40px; font-weight: 600; line-height: 1; }
.tien__dv { font-family: var(--font-nhan); font-size: 16px; color: var(--muc-phu); }
.tien__quy { margin: 0; font-size: 13px; color: var(--muc-phu); }

.hang { display: flex; flex-wrap: wrap; gap: var(--sp-2); }

.phim { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-2); }
.phim__o {
  font-family: var(--font-nhan); font-size: 20px; font-weight: 600;
  padding: 14px 0; background: var(--giay);
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  box-shadow: var(--bong-chip); cursor: pointer;
}
.phim__o:active { transform: translate(2px, 2px); box-shadow: none; }
.phim__o--phu { background: var(--kem); }
.phim__o:focus-visible { outline: var(--focus); outline-offset: 2px; }

.sheet__ghi { margin: 0; font-size: 12px; color: var(--muc-phu); text-align: center; }

/* ---------------- Panel laptop ---------------- */
.panel {
  display: flex; flex-direction: column; gap: var(--sp-3);
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-4);
}
.panel__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); }
.panel__meo { font-size: 12px; color: var(--muc-phu); }
.panel__o { display: flex; flex-direction: column; gap: var(--sp-1); }
.panel__quy { margin: 0; font-family: var(--font-nhan); font-size: 12px; color: var(--nhan); }
</style>
