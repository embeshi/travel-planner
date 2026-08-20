<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { kho, dongMoi, DANH_MUC, KENH_THANH_TOAN } from '../lib/kho.js'
import { sortByDate } from '../lib/xep-dong.js'
import { bam, deLuu, deHien, PHIM } from '../lib/ban-phim-so.js'
import { tachCau, duDeGhi } from '../lib/tach-cau.js'
import { khoaAI, tachCauBangAI } from '../lib/ai.js'
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

/* ============================================================
   Ô ✦ GÕ TỰ NHIÊN — luồng F2, chạy hoàn toàn offline.

   LUẬT KHÔNG ĐƯỢC PHÁ: bộ tách KHÔNG BAO GIỜ ghi thẳng. Nó chỉ dựng một
   bản xem trước bốn ô; người dùng nhìn, sửa được, rồi mới bấm xác nhận.
   PRD mục 05: «không tự ghi dữ liệu từ AI khi chưa xác nhận».

   Bên cạnh nó luôn có đường làm tay nhìn thấy được — bàn phím số và các
   chip vẫn nằm nguyên đó, không ai bị ép đi qua cửa này.
   ============================================================ */
const cauTuNhien = ref('')
const banXemTruoc = ref(null)

function docCau () {
  const c = cauTuNhien.value.trim()
  if (!c) return
  loiAI.value = ''
  banXemTruoc.value = tachCau(c)
}

/* Câu khó: bộ tách offline chịu thua thì mới tới lượt AI (PRD F2 —
   «bộ tách nội bộ lo mẫu phổ biến; câu khó chuyển AI khi có mạng»).
   Kết quả AI đổ vào ĐÚNG bản xem trước đó — vẫn phải bấm xác nhận. */
const dangHoiAI = ref(false)
const loiAI = ref('')

async function hoiAI () {
  const c = cauTuNhien.value.trim()
  if (!c || dangHoiAI.value) return
  loiAI.value = ''; dangHoiAI.value = true
  try {
    banXemTruoc.value = await tachCauBangAI(c)
  } catch (e) {
    loiAI.value = e.message || 'Không hỏi được AI.'
  } finally {
    dangHoiAI.value = false
  }
}
function suaTay () {
  const b = banXemTruoc.value
  if (!b) return
  if (b.tripCost) tien.value = b.tripCost
  ten.value = b.activity
  cat.value = b.cat
  pay.value = b.pay
  banXemTruoc.value = null
  cauTuNhien.value = ''
}
function xacNhanGhi () {
  const b = banXemTruoc.value
  if (!duDeGhi(b)) return
  suaTay()
  luu()
}

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

      <div class="ai">
        <span class="nhan-mono">✦ Hoặc gõ một câu</span>
        <ONhap v-model="cauTuNhien" placeholder="bolt về khách sạn 120 baht tiền mặt"
               @enter="docCau" />
        <div v-if="banXemTruoc" class="ai__xem">
          <p class="ai__nhan">Đọc được — sửa được trước khi ghi</p>
          <dl class="ai__bang">
            <dt>Hoạt động</dt><dd>{{ banXemTruoc.activity || '—' }}</dd>
            <dt>Chi phí</dt><dd>{{ banXemTruoc.tripCost || '—' }} {{ kho.currency }}</dd>
            <dt>Thanh toán</dt><dd>{{ banXemTruoc.pay || 'chưa đọc ra' }}</dd>
            <dt>Danh mục</dt><dd>{{ banXemTruoc.cat || 'chưa đoán được' }}</dd>
          </dl>
          <div class="ai__nut">
            <NutBam kieu="chinh" :khoa="!duDeGhi(banXemTruoc)" @click="xacNhanGhi">Xác nhận ghi</NutBam>
            <NutBam kieu="vien" @click="suaTay">Sửa tay</NutBam>
            <NutBam v-if="!duDeGhi(banXemTruoc) && khoaAI" kieu="phu"
                    :khoa="dangHoiAI" @click="hoiAI">
              {{ dangHoiAI ? '✦ Đang đọc…' : '✦ Hỏi AI câu này' }}
            </NutBam>
          </div>
          <p v-if="!duDeGhi(banXemTruoc) && !khoaAI" class="ai__meo">
            Bộ tách chưa đọc đủ. Dán khoá API ở tab Tổng kết thì hỏi được AI, hoặc bấm Sửa tay.
          </p>
          <p v-if="loiAI" class="ai__loi">{{ loiAI }}</p>
        </div>
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

    <div class="ai">
        <span class="nhan-mono">✦ Hoặc gõ một câu</span>
        <ONhap v-model="cauTuNhien" placeholder="bolt về khách sạn 120 baht tiền mặt"
               @enter="docCau" />
        <div v-if="banXemTruoc" class="ai__xem">
          <p class="ai__nhan">Đọc được — sửa được trước khi ghi</p>
          <dl class="ai__bang">
            <dt>Hoạt động</dt><dd>{{ banXemTruoc.activity || '—' }}</dd>
            <dt>Chi phí</dt><dd>{{ banXemTruoc.tripCost || '—' }} {{ kho.currency }}</dd>
            <dt>Thanh toán</dt><dd>{{ banXemTruoc.pay || 'chưa đọc ra' }}</dd>
            <dt>Danh mục</dt><dd>{{ banXemTruoc.cat || 'chưa đoán được' }}</dd>
          </dl>
          <div class="ai__nut">
            <NutBam kieu="chinh" :khoa="!duDeGhi(banXemTruoc)" @click="xacNhanGhi">Xác nhận ghi</NutBam>
            <NutBam kieu="vien" @click="suaTay">Sửa tay</NutBam>
            <NutBam v-if="!duDeGhi(banXemTruoc) && khoaAI" kieu="phu"
                    :khoa="dangHoiAI" @click="hoiAI">
              {{ dangHoiAI ? '✦ Đang đọc…' : '✦ Hỏi AI câu này' }}
            </NutBam>
          </div>
          <p v-if="!duDeGhi(banXemTruoc) && !khoaAI" class="ai__meo">
            Bộ tách chưa đọc đủ. Dán khoá API ở tab Tổng kết thì hỏi được AI, hoặc bấm Sửa tay.
          </p>
          <p v-if="loiAI" class="ai__loi">{{ loiAI }}</p>
        </div>
      </div>

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

/* ---------------- Khối ✦ ---------------- */
.ai {
  display: flex; flex-direction: column; gap: var(--sp-2);
  border: 1.5px dashed var(--vach); border-radius: var(--bo-the);
  padding: var(--sp-3); background: var(--dien-tin);
}
.ai__xem { background: var(--giay); border: 1.5px solid var(--navy);
  border-radius: var(--bo-nho); padding: var(--sp-2) var(--sp-3); }
.ai__nhan { margin: 0 0 var(--sp-2); font-size: 12px; color: var(--muc-phu); }
.ai__bang { display: grid; grid-template-columns: auto minmax(0, 1fr);
  gap: 2px var(--sp-3); margin: 0 0 var(--sp-2); }
.ai__bang dt { font-family: var(--font-nhan); font-size: 10px;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--nhan); align-self: center; }
.ai__bang dd { margin: 0; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; }
.ai__nut { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.ai__meo { margin: var(--sp-1) 0 0; font-size: 12px; color: var(--muc-phu); }
.ai__loi { margin: var(--sp-1) 0 0; font-size: 12.5px; font-weight: 600; color: var(--loi); }

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
