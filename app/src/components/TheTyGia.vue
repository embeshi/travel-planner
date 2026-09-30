<script setup>
import { ref, watch, computed } from 'vue'
import { kho } from '../lib/kho.js'
import { TIEN_TE, nhanTienTe, docTyGia } from '../lib/tien-te.js'
import { layTyGiaThiTruong } from '../lib/ty-gia.js'
import { fmtVND } from '../lib/dinh-dang.js'
import ONhap from './ONhap.vue'
import NutBam from './NutBam.vue'

/* ============================================================
   💱 TIỀN TỆ & TỶ GIÁ — bê từ sec-fx (và mini-fx trong sec-book) của
   v9.6. Dùng cho CẢ HAI cặp: chuyến (currency/rate) và gói bay
   (bkCurrency/bkRate) — chọn bằng hai prop khoá.

   Tỷ giá trong sổ là SỐ hoặc null (v9.6). Ô nhập là chuỗi, nên ở đây
   giữ một bản chuỗi riêng và dịch qua docTyGia() mỗi lần gõ: rỗng/rác/0
   → null, không bao giờ là 0.
   ============================================================ */
const props = defineProps({
  khoaTien: { type: String, default: 'currency' },
  khoaTyGia: { type: String, default: 'rate' },
  nhanTien: { type: String, default: 'Loại ngoại tệ' },
  tieuDe: { type: String, default: '💱 Tiền tệ & tỷ giá' },
  /* gọn: không vỏ thẻ, để nhúng vào thẻ gói bay */
  gon: { type: Boolean, default: false },
  id: { type: String, default: 'the-ty-gia' }
})
const emit = defineEmits(['doi'])

const chuoi = ref(kho[props.khoaTyGia] ? String(kho[props.khoaTyGia]) : '')
/* Tỷ giá đổi từ nơi khác (nạp backup, tự lấy) thì ô hiện theo */
watch(() => kho[props.khoaTyGia], (v) => {
  if (docTyGia(chuoi.value) !== v) chuoi.value = v ? String(v) : ''
})

const trangThai = ref(null)
const dangLay = ref(false)

function nhapTyGia (v) {
  chuoi.value = v
  kho[props.khoaTyGia] = docTyGia(v)
  trangThai.value = null
  emit('doi')
}
function doiTien (e) {
  kho[props.khoaTien] = e.target.value
  trangThai.value = null
  emit('doi')
}

/* Lời trạng thái nguyên văn v9.6 (wireRateFetch) */
async function layTuDong () {
  if (dangLay.value) return
  dangLay.value = true
  trangThai.value = null
  try {
    const r = await layTyGiaThiTruong(kho[props.khoaTien])
    kho[props.khoaTyGia] = r
    chuoi.value = String(r)
    const gio = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    trangThai.value = {
      loai: 'ok',
      chu: 'Đã cập nhật lúc ' + gio + ' theo tỷ giá thị trường (mid-market, loại Wise dùng). ' +
        'Con số có thể chênh nhẹ so với wise.com, bạn vẫn sửa tay được nhé.'
    }
    emit('doi')
  } catch (e) {
    trangThai.value = {
      loai: 'err',
      chu: 'Không lấy được tỷ giá tự động lúc này. Bạn xem trên wise.com rồi nhập tay giúp mình nhé.'
    }
  } finally {
    dangLay.value = false
  }
}

const dangThuc = computed(() =>
  '1 ' + kho[props.khoaTien] + ' = ' + (kho[props.khoaTyGia] ? fmtVND(kho[props.khoaTyGia]) : '? ₫'))
const maLa = computed(() => !TIEN_TE.some((t) => t.ma === kho[props.khoaTien]))
</script>

<template>
  <section :id="id" class="tg" :class="gon ? 'tg--gon' : 'the'">
    <div v-if="!gon" class="the__dau">
      <h3 class="the__ten">{{ tieuDe }}</h3>
      <span class="tg__eq">{{ dangThuc }}</span>
    </div>

    <div class="tg__hang">
      <label class="tg__o">
        <span class="nhan-mono">{{ nhanTien }}</span>
        <select class="tg__chon" :value="kho[khoaTien]" @change="doiTien">
          <option v-if="maLa" :value="kho[khoaTien]">{{ kho[khoaTien] }}</option>
          <option v-for="t in TIEN_TE" :key="t.ma" :value="t.ma">{{ nhanTienTe(t.ma) }}</option>
        </select>
      </label>
      <div class="tg__o tg__o--ty-gia">
        <span class="nhan-mono">Tỷ giá → VNĐ</span>
        <ONhap :model-value="chuoi" type="number" placeholder="Ví dụ: 26000" can-phai
               @update:model-value="nhapTyGia" />
      </div>
      <NutBam kieu="phu" :khoa="dangLay" class="tg__nut" @click="layTuDong">
        {{ dangLay ? '⟳ Đang lấy…' : '⟳ Lấy tỷ giá tự động' }}
      </NutBam>
    </div>

    <p v-if="gon" class="tg__eq tg__eq--gon">{{ dangThuc }}</p>
    <p v-if="trangThai" class="tg__tt" :class="'tg__tt--' + trangThai.loai" role="status">
      {{ trangThai.chu }}
    </p>
  </section>
</template>

<style scoped>
.the { background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); }
.the__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); flex-wrap: wrap; }
.the__ten { margin: 0; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho); }
.tg--gon { display: flex; flex-direction: column; gap: var(--sp-1); }
.tg__hang { display: grid; grid-template-columns: minmax(0, 1fr) 118px; gap: var(--sp-2); align-items: end; }
.tg__o { display: flex; flex-direction: column; gap: var(--sp-1); min-width: 0; }
.tg__nut { grid-column: 1 / -1; }
.tg__chon { font-family: var(--font-noi-dung); font-size: 14px; color: var(--navy);
  background: var(--giay); border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 9px 8px; min-width: 0; width: 100%; }
.tg__chon:focus-visible { outline: var(--focus); outline-offset: 2px; }
.tg__eq { font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); }
.tg__eq--gon { margin: 0; }
.tg__tt { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--muc-phu); }
.tg__tt--ok { color: var(--duyet); }
.tg__tt--err { color: var(--loi); font-weight: 600; }
</style>
