<script setup>
import { computed, nextTick, onMounted } from 'vue'
import { kho, dongGoiBayMoi } from '../lib/kho.js'
import { sortByDate } from '../lib/xep-dong.js'
import { tongGoiBay } from '../lib/tien-te.js'
import { taoEnterHop } from '../lib/enter-hop.js'
import { soNgayLuuTru } from '../lib/ngay.js'
import { fmtFx, fmtVND, num } from '../lib/dinh-dang.js'
import ONhap from './ONhap.vue'
import TheTyGia from './TheTyGia.vue'

/* ============================================================
   ✈️🏨 GÓI BAY & KHÁCH SẠN — bê từ sec-book của v9.6:
   thanh toán bằng (bkCurrency/bkRate) · thông tin khách sạn + số đêm
   tự tính · bảng khoản trả trước (Ngày · Hạng mục · Nơi mua · Chi phí ·
   Ghi chú) tự xếp theo ngày, Enter hai chế độ.

   Bố cục thẻ dọc nén (M3/L3): pane phải ~400px ở laptop và 343px ở
   điện thoại cùng dùng một dạng — không bảng ngang, không cuộn ngang.
   ============================================================ */
const emit = defineEmits(['doi'])
const baoDoi = () => emit('doi')

function xepLai () { return sortByDate(kho.bookings) }
onMounted(xepLai)

const tong = computed(() => tongGoiBay(kho))
const luuTru = computed(() => soNgayLuuTru(kho.hotel.checkin, kho.hotel.checkout))

const COT = ['name', 'cost', 'vendor', 'date', 'note']
const oRef = new Map()
const datRef = (id, cot) => (el) => { if (el) oRef.set(id + '|' + cot, el); else oRef.delete(id + '|' + cot) }
const roiVao = (id, cot) => { const el = oRef.get(id + '|' + cot); if (el && el.focus) el.focus() }

async function themDong (sau) {
  const moi = dongGoiBayMoi()
  moi.date = (sau && sau.date) || ''
  kho.bookings.push(moi)
  xepLai(); baoDoi()
  await nextTick()
  return moi
}
const enterHop = taoEnterHop({ danhSach: () => kho.bookings, cot: COT, roiVao, themDong })

async function doiNgay (row, v) {
  row.date = v; baoDoi()
  if (!xepLai()) return
  await nextTick(); roiVao(row.id, 'name')
}
function xoa (row) { const i = kho.bookings.indexOf(row); if (i >= 0) kho.bookings.splice(i, 1); baoDoi() }
const quyDoi = (row) => (kho.bkRate && num(row.cost) > 0) ? fmtVND(num(row.cost) * kho.bkRate)
  : (num(row.cost) > 0 ? 'nhập tỷ giá' : '—')
</script>

<template>
  <section class="the gb">
    <div class="the__dau">
      <h3 class="the__ten">✈️🏨 Gói bay &amp; khách sạn</h3>
      <span class="gb__da-tra">✓ Đã thanh toán</span>
    </div>

    <TheTyGia gon khoa-tien="bkCurrency" khoa-ty-gia="bkRate" nhan-tien="Thanh toán bằng"
              id="the-ty-gia-goi-bay" @doi="baoDoi" />

    <div class="gb__ks">
      <span class="nhan-mono">🏨 Thông tin khách sạn</span>
      <ONhap v-model="kho.hotel.name" placeholder="Tên khách sạn — ví dụ: ibis Bangkok Riverside"
             @update:model-value="baoDoi" />
      <ONhap v-model="kho.hotel.address" placeholder="Địa chỉ: số nhà, đường, quận, thành phố"
             @update:model-value="baoDoi" />
      <div class="gb__ngay">
        <label class="gb__o"><span class="nhan-mono">Check-in</span>
          <ONhap v-model="kho.hotel.checkin" type="date" @update:model-value="baoDoi" /></label>
        <label class="gb__o"><span class="nhan-mono">Check-out</span>
          <ONhap v-model="kho.hotel.checkout" type="date" @update:model-value="baoDoi" /></label>
        <div class="gb__o"><span class="nhan-mono">Lưu trú</span>
          <span class="gb__dem" :class="{ 'gb__dem--loi': luuTru.loi }" role="status">{{ luuTru.nhan }}</span></div>
      </div>
    </div>

    <div class="gb__bang">
      <div v-for="row in kho.bookings" :key="row.id" :data-dong="row.id" class="dong">
        <ONhap :ref="datRef(row.id, 'name')" v-model="row.name" class="o-ten"
               placeholder="Hạng mục — ví dụ: Gói bay + khách sạn 4N3Đ"
               @update:model-value="baoDoi" @enter="enterHop(row.id, 'name')" />
        <ONhap :ref="datRef(row.id, 'cost')" v-model="row.cost" class="o-tien" type="number"
               :placeholder="'0 ' + kho.bkCurrency" can-phai
               @update:model-value="baoDoi" @enter="enterHop(row.id, 'cost')" />
        <ONhap :ref="datRef(row.id, 'vendor')" v-model="row.vendor" class="o-noi"
               placeholder="Nơi mua — Expedia, Traveloka…"
               @update:model-value="baoDoi" @enter="enterHop(row.id, 'vendor')" />
        <ONhap :ref="datRef(row.id, 'date')" :model-value="row.date" class="o-ngay" type="date"
               @update:model-value="doiNgay(row, $event)" @enter="enterHop(row.id, 'date')" />
        <ONhap :ref="datRef(row.id, 'note')" v-model="row.note" class="o-ghi"
               placeholder="Ghi chú: mã đặt chỗ, gói gồm những gì…"
               @update:model-value="baoDoi" @enter="enterHop(row.id, 'note')" />
        <span class="dong__vnd">≈ {{ quyDoi(row) }}</span>
        <button type="button" class="dong__xoa" title="Xóa khoản này" @click="xoa(row)">×</button>
      </div>
      <p v-if="!kho.bookings.length" class="trong">Chưa có khoản trả trước nào.</p>
      <button type="button" class="them" @click="themDong()">＋ Thêm khoản trả trước</button>
    </div>

    <div class="the__tong">
      <span class="nhan-mono">Đã thanh toán</span>
      <span class="the__so">{{ fmtFx(tong.fx) }} {{ kho.bkCurrency }}</span>
      <span class="the__vnd" :class="{ 'the__vnd--thieu': tong.vnd === null && tong.fx > 0 }">
        {{ tong.vnd !== null ? fmtVND(tong.vnd) : (tong.fx > 0 ? 'thiếu tỷ giá ' + kho.bkCurrency : '—') }}
      </span>
    </div>
  </section>
</template>

<style scoped>
.the { background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3); }
.the__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); flex-wrap: wrap; }
.the__ten { margin: 0; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho); }
.gb__da-tra { font-family: var(--font-nhan); font-size: 9.5px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; color: var(--duyet); border: 1.5px solid var(--duyet); border-radius: var(--bo-nho); padding: 2px 6px; }

.gb__ks { display: flex; flex-direction: column; gap: var(--sp-2); border-top: 1px dashed var(--vach); padding-top: var(--sp-3); }
.gb__ngay { display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--sp-2); align-items: end; }
.gb__o { display: flex; flex-direction: column; gap: var(--sp-1); min-width: 0; }
.gb__dem { font-family: var(--font-nhan); font-size: 11px; font-weight: 600; white-space: nowrap;
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho); padding: 9px 8px; background: var(--kem); }
.gb__dem--loi { color: var(--loi); border-color: var(--loi); background: var(--san-ho-nhat); }

.gb__bang { border: 1.5px solid var(--navy); border-radius: var(--bo-nho); overflow: hidden; }
.dong { display: grid; gap: var(--sp-1) var(--sp-2); padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--vach); background: var(--giay);
  grid-template-columns: minmax(0, 1fr) 118px;
  grid-template-areas: 'ten tien' 'noi ngay' 'ghi ghi' 'vnd xoa'; }
.o-ten { grid-area: ten; } .o-tien { grid-area: tien; } .o-noi { grid-area: noi; }
.o-ngay { grid-area: ngay; } .o-ghi { grid-area: ghi; }
.dong__vnd { grid-area: vnd; font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); align-self: center; }
.dong__xoa { grid-area: xoa; justify-self: end; border: 0; background: transparent; color: var(--khoa-muc);
  font-size: 17px; line-height: 1; cursor: pointer; padding: 0 4px; }
.dong__xoa:hover { color: var(--loi); }
.trong { margin: 0; padding: var(--sp-3); color: var(--muc-phu); font-size: 13px; }
.them { display: block; width: 100%; text-align: left; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho); background: transparent;
  border: 0; border-top: 1px dashed var(--vach); padding: var(--sp-2) var(--sp-3); cursor: pointer; }
.them:hover { background: var(--kem); }

.the__tong { display: flex; align-items: baseline; gap: var(--sp-3); flex-wrap: wrap; border-top: 1.5px solid var(--navy); padding-top: var(--sp-2); }
.the__so { font-family: var(--font-nhan); font-size: 14px; font-weight: 600; margin-left: auto; }
.the__vnd { font-family: var(--font-nhan); font-size: 12px; color: var(--muc-phu); }
.the__vnd--thieu { color: var(--loi); font-weight: 600; }
</style>
