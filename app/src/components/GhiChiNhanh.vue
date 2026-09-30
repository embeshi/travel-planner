<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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
  /* 'sheet' điện thoại · 'panel' laptop (L2, tab Kế hoạch) · 'l1' laptop Hôm nay:
     thanh ✦ ở đầu + thẻ gọn Teleport vào cột trái của ManHomNay */
  kieu: { type: String, default: 'sheet' }
})
const emit = defineEmits(['dong', 'da-ghi', 'den-ty-gia'])

const tien = ref('')
const ten = ref('')
const cat = ref('')
const pay = ref('')
const hopThoai = ref(null)
const oTen = ref(null)
const oTien = ref(null)
const oKenh = ref(null)
const oCau = ref(null)

/* ============================================================
   PANEL LAPTOP — bảng thiết kế L2: «Enter nhảy theo cột».
   Hoạt động ⏎ → Chi phí · Chi phí ⏎ → lưu (có số) hoặc → Thanh toán ·
   Thanh toán ⏎ → lưu. Cùng họ với vết sẹo Enter hai chế độ của bảng.
   ⌘K / Ctrl+K đưa con trỏ vào ô ✦ (thanh lệnh của L1/L2).
   ============================================================ */
function enterTen () { oTien.value?.focus() }
function enterTien () { if (luuDuoc.value) return luu(); oKenh.value?.focus() }
function phimTat (e) {
  if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
    e.preventDefault(); oCau.value?.focus()
  }
}
onMounted(() => { if (props.kieu !== 'sheet') window.addEventListener('keydown', phimTat) })
onUnmounted(() => window.removeEventListener('keydown', phimTat))

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
      <p class="tien__quy">
        <template v-if="quyDoi">≈ {{ quyDoi }}</template>
        <template v-else-if="kho.rate">—</template>
        <button v-else type="button" class="tien__thieu" @click="emit('den-ty-gia')">
          chưa có tỷ giá {{ kho.currency }} — điền ngay →
        </button>
      </p>

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

  <!-- LAPTOP · bảng thiết kế L2: dải ngang đầu vùng nội dung, mở sẵn,
       KHÔNG che nội dung. Bốn ô một hàng, chip + Lưu góc phải, ✦ là thẻ riêng. -->
  <section v-else class="panel-khu">
    <div v-if="kieu === 'panel'" class="panel">
      <div class="panel__dau">
        <span class="nhan-mono panel__ten">Panel ghi nhanh · mở sẵn, không che nội dung</span>
        <span class="panel__meo">Enter nhảy theo cột</span>
      </div>

      <div class="panel__hang">
        <div class="panel__o">
          <label class="nhan-mono">Hoạt động</label>
          <ONhap ref="oTen" v-model="ten" placeholder="Tên khoản chi" @enter="enterTen" />
        </div>
        <div class="panel__o">
          <label class="nhan-mono">Chi phí</label>
          <ONhap ref="oTien" v-model="tien" type="number" :placeholder="'0 ' + kho.currency"
                 can-phai @enter="enterTien" />
        </div>
        <div class="panel__o">
          <span class="nhan-mono">Quy đổi</span>
          <div class="panel__quy" :class="{ 'panel__quy--co': quyDoi }">
            <template v-if="quyDoi">{{ quyDoi }}</template>
            <template v-else-if="kho.rate">—</template>
            <button v-else type="button" class="tien__thieu" @click="emit('den-ty-gia')">
              chưa có tỷ giá {{ kho.currency }} — điền ngay →
            </button>
          </div>
        </div>
        <div class="panel__o">
          <label class="nhan-mono" for="panel-kenh">Thanh toán</label>
          <select id="panel-kenh" ref="oKenh" v-model="pay" class="panel__chon"
                  @keydown.enter.prevent="luu">
            <option value="">—</option>
            <option v-for="k in KENH_THANH_TOAN" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
      </div>

      <div class="panel__chip">
        <Chip v-for="d in DANH_MUC" :key="d.ma" :bieu-tuong="d.bt" :chon="cat === d.ma"
              @click="cat = cat === d.ma ? '' : d.ma">{{ d.ten }}</Chip>
        <span class="panel__cach" />
        <NutBam kieu="chinh" :khoa="!luuDuoc" @click="luu">Lưu · Enter</NutBam>
      </div>
    </div>

    <!-- ✦ thẻ riêng (L2): thanh câu + ⌘K, bản xem trước bốn ô ngang -->
    <div class="panel-ai">
      <div class="panel-ai__dau">
        <span class="panel-ai__sao" aria-hidden="true">✦</span>
        <ONhap ref="oCau" v-model="cauTuNhien" class="panel-ai__o"
               placeholder="Hoặc gõ một câu: «bolt về khách sạn 120 baht tiền mặt»"
               @enter="docCau" />
        <kbd class="panel-ai__phim" title="Ctrl/⌘ + K">⌘K</kbd>
      </div>
      <div v-if="banXemTruoc" class="ai__xem ai__xem--ngang">
        <p class="ai__nhan">Bản xem trước — sửa được từng ô trước khi ghi</p>
        <dl class="ai__bang ai__bang--o">
          <div class="ai__o"><dt>Hoạt động</dt><dd>{{ banXemTruoc.activity || '—' }}</dd></div>
          <div class="ai__o"><dt>Chi phí</dt><dd>{{ banXemTruoc.tripCost || '—' }} {{ kho.currency }}</dd></div>
          <div class="ai__o"><dt>Thanh toán</dt><dd>{{ banXemTruoc.pay || 'chưa đọc ra' }}</dd></div>
          <div class="ai__o" :class="{ 'ai__o--doan': banXemTruoc.cat }">
            <dt>Danh mục · đoán</dt><dd>{{ banXemTruoc.cat || 'chưa đoán được' }}</dd></div>
        </dl>
        <div class="ai__nut">
          <NutBam kieu="chinh" :khoa="!duDeGhi(banXemTruoc)" @click="xacNhanGhi">Xác nhận ghi</NutBam>
          <NutBam kieu="vien" @click="suaTay">Sửa tay</NutBam>
          <NutBam v-if="!duDeGhi(banXemTruoc) && khoaAI" kieu="phu"
                  :khoa="dangHoiAI" @click="hoiAI">
            {{ dangHoiAI ? '✦ Đang đọc…' : '✦ Hỏi AI câu này' }}
          </NutBam>
          <span class="ai__ghi">Không có mạng thì bộ tách nội bộ vẫn chạy, chỉ kém linh hoạt hơn với câu lạ.</span>
        </div>
        <p v-if="!duDeGhi(banXemTruoc) && !khoaAI" class="ai__meo">
          Bộ tách chưa đọc đủ. Dán khoá API ở tab Tổng kết thì hỏi được AI, hoặc bấm Sửa tay.
        </p>
        <p v-if="loiAI" class="ai__loi">{{ loiAI }}</p>
      </div>
    </div>

    <!-- L1 · thẻ «Ghi nhanh · luôn mở» — cùng một linh kiện với thanh ✦ ở trên
         (để «Sửa tay» đổ đúng ô), nhưng dời vào cột trái của ManHomNay.
         `defer`: đích được vẽ SAU thẻ này trong cùng một lượt (Vue 3.5). -->
    <Teleport v-if="kieu === 'l1'" defer to="#hn-ghi-nhanh">
      <div class="gon">
        <span class="nhan-mono gon__ten">Ghi nhanh · luôn mở</span>
        <div class="gon__hang">
          <ONhap ref="oTen" v-model="ten" placeholder="Tên khoản chi…" @enter="enterTen" />
          <ONhap ref="oTien" v-model="tien" type="number" :placeholder="'0 ' + kho.currency"
                 can-phai @enter="enterTien" />
        </div>
        <div class="gon__chip">
          <Chip v-for="d in DANH_MUC" :key="d.ma" :bieu-tuong="d.bt" :chon="cat === d.ma"
                :title="d.ten" @click="cat = cat === d.ma ? '' : d.ma">{{ cat === d.ma ? d.ten : '' }}</Chip>
          <Chip v-for="k in KENH_THANH_TOAN" :key="k" :chon="pay === k"
                @click="pay = pay === k ? '' : k">{{ k }}</Chip>
        </div>
        <div class="gon__cuoi">
          <NutBam kieu="chinh" :khoa="!luuDuoc" @click="luu">Lưu · Enter</NutBam>
          <span class="gon__ghi">
            <template v-if="quyDoi">≈ {{ quyDoi }} · </template>Ngày giờ và quy đổi VNĐ tự điền.
          </span>
        </div>
      </div>
    </Teleport>
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
.sheet::backdrop { background: var(--phu-man); }
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
.tien__thieu { font: inherit; font-weight: 600; color: var(--san-ho); background: transparent;
  border: 0; padding: 0; cursor: pointer; text-decoration: underline dotted; }
.tien__thieu:focus-visible { outline: var(--focus); outline-offset: 2px; }

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

/* ---------------- Panel laptop (L2) ---------------- */
.panel-khu { display: flex; flex-direction: column; gap: var(--sp-3); }
.panel {
  display: flex; flex-direction: column; gap: var(--sp-3);
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3) var(--sp-4);
}
.panel__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); }
.panel__ten { color: var(--san-ho); }
.panel__meo { font-family: var(--font-nhan); font-size: 10px; font-weight: 600; color: var(--nhan); }

/* Bốn ô một hàng — đúng tỷ lệ bản vẽ L2 */
.panel__hang {
  display: grid; grid-template-columns: minmax(0, 1.6fr) 130px minmax(0, 1fr) 150px;
  gap: var(--sp-2); align-items: end;
}
.panel__o { display: flex; flex-direction: column; gap: var(--sp-1); min-width: 0; }
.panel__quy {
  border: 1.5px dashed var(--vach); border-radius: var(--bo-nho); background: var(--kem);
  padding: 9px var(--sp-3); min-height: 41px; box-sizing: border-box;
  font-family: var(--font-nhan); font-size: 13px; font-weight: 600; color: var(--muc-phu);
  text-align: right; display: flex; align-items: center; justify-content: flex-end;
}
.panel__quy--co { color: var(--navy); }
.panel__chon {
  font-family: var(--font-noi-dung); font-size: 14px; color: var(--navy);
  background: var(--giay); border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 9px 8px; min-width: 0; width: 100%;
}
.panel__chon:focus-visible { outline: var(--focus); outline-offset: 2px; }
.panel__chip { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; }
.panel__cach { flex: 1; }

/* ✦ thẻ riêng */
.panel-ai {
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); overflow: hidden;
}
.panel-ai__dau {
  display: flex; align-items: center; gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3); background: var(--kem); border-bottom: 1.5px solid var(--vach);
}
.panel-ai__sao { color: var(--san-ho); font-weight: 600; }
.panel-ai__o { flex: 1; min-width: 0; }
.panel-ai__phim {
  font-family: var(--font-nhan); font-size: 10px; font-weight: 600;
  border: 1.5px solid var(--navy); border-radius: 3px; padding: 2px 6px; background: var(--giay);
}
.ai__xem--ngang { border: 0; border-radius: 0; padding: var(--sp-3); }
.ai__bang--o { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sp-2); }
.ai__o { border: 1.5px solid var(--vach); border-radius: var(--bo-nho); padding: 8px 10px; background: var(--giay); min-width: 0; }
.ai__o--doan { border-color: var(--san-ho); border-style: dashed; background: var(--san-ho-nhat); }
.ai__o dt { font-size: 9px; }
.ai__o dd { margin: 3px 0 0; }
.ai__ghi { font-size: 12.5px; color: var(--muc-phu); align-self: center; }

/* ---------------- Thẻ gọn L1 (Hôm nay laptop) ---------------- */
.gon { display: flex; flex-direction: column; gap: var(--sp-2); background: var(--giay);
  border: var(--vien); border-radius: var(--bo-the); box-shadow: var(--bong-the-con); padding: var(--sp-3); }
.gon__ten { color: var(--san-ho); }
.gon__hang { display: grid; grid-template-columns: minmax(0, 1fr) 118px; gap: var(--sp-2); }
.gon__chip { display: flex; flex-wrap: wrap; gap: 6px; }
.gon__cuoi { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
.gon__ghi { font-size: 12.5px; color: var(--muc-phu); }
</style>
