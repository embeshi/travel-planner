<script setup>
import { computed, nextTick, onMounted } from 'vue'
import { kho, dongTienMatMoi } from '../lib/kho.js'
import { sortByDate } from '../lib/xep-dong.js'
import { tongDoiTien, loiNhacTienMat } from '../lib/tien-te.js'
import { taoEnterHop } from '../lib/enter-hop.js'
import { fmtFx, fmtVND, tyGiaThucTe } from '../lib/dinh-dang.js'
import ONhap from './ONhap.vue'

/* ============================================================
   💵 ĐỔI TIỀN — bê từ sec-cash của v9.6: Ngày đổi · VNĐ đã đổi · Nhận
   được · Tỷ giá thực tế (tự tính) · Nơi đổi; tự xếp theo ngày; dòng
   tổng có tỷ giá trung bình; lời nhắc đủ/vượt/mẹo chỉ so với các dòng
   chọn «Tiền mặt».
   ============================================================ */
const emit = defineEmits(['doi'])
const baoDoi = () => emit('doi')

function xepLai () { return sortByDate(kho.cash) }
onMounted(xepLai)

const tong = computed(() => tongDoiTien(kho))
const nhac = computed(() => loiNhacTienMat(kho))

const COT = ['date', 'vnd', 'fx', 'place']
const oRef = new Map()
const datRef = (id, cot) => (el) => { if (el) oRef.set(id + '|' + cot, el); else oRef.delete(id + '|' + cot) }
const roiVao = (id, cot) => { const el = oRef.get(id + '|' + cot); if (el && el.focus) el.focus() }

async function themDong (sau) {
  const moi = dongTienMatMoi()
  moi.date = (sau && sau.date) || ''
  kho.cash.push(moi)
  xepLai(); baoDoi()
  await nextTick()
  return moi
}
const enterHop = taoEnterHop({ danhSach: () => kho.cash, cot: COT, roiVao, themDong })

async function doiNgay (row, v) {
  row.date = v; baoDoi()
  if (!xepLai()) return
  await nextTick(); roiVao(row.id, 'vnd')
}
function xoa (row) { const i = kho.cash.indexOf(row); if (i >= 0) kho.cash.splice(i, 1); baoDoi() }
const tyGia = (row) => { const t = tyGiaThucTe(row.vnd, row.fx); return t === null ? '—' : fmtVND(t) + '/1 ' + kho.currency }
</script>

<template>
  <section class="the dt">
    <div class="the__dau">
      <h3 class="the__ten">💵 Đổi tiền · VNĐ → {{ kho.currency }}</h3>
    </div>

    <div class="dt__bang">
      <div v-for="row in kho.cash" :key="row.id" :data-dong="row.id" class="dong">
        <ONhap :ref="datRef(row.id, 'date')" :model-value="row.date" class="o-ngay" type="date"
               @update:model-value="doiNgay(row, $event)" @enter="enterHop(row.id, 'date')" />
        <ONhap :ref="datRef(row.id, 'place')" v-model="row.place" class="o-noi"
               placeholder="Nơi đổi / ghi chú" @update:model-value="baoDoi" @enter="enterHop(row.id, 'place')" />
        <ONhap :ref="datRef(row.id, 'vnd')" v-model="row.vnd" class="o-vnd" type="number"
               placeholder="VNĐ đã đổi" can-phai @update:model-value="baoDoi" @enter="enterHop(row.id, 'vnd')" />
        <ONhap :ref="datRef(row.id, 'fx')" v-model="row.fx" class="o-fx" type="number"
               :placeholder="'Nhận ' + kho.currency" can-phai @update:model-value="baoDoi" @enter="enterHop(row.id, 'fx')" />
        <span class="dong__tg">Tỷ giá thực tế: {{ tyGia(row) }}</span>
        <button type="button" class="dong__xoa" title="Xóa lần đổi này" @click="xoa(row)">×</button>
      </div>
      <p v-if="!kho.cash.length" class="trong">Chưa ghi lần đổi tiền nào.</p>
      <button type="button" class="them" @click="themDong()">＋ Thêm lần đổi tiền</button>
    </div>

    <div class="the__tong">
      <div class="the__cot"><span class="nhan-mono">Đã đổi</span><span class="the__so">{{ fmtVND(tong.vnd) }}</span></div>
      <div class="the__cot"><span class="nhan-mono">Nhận về</span><span class="the__so">{{ fmtFx(tong.fx) }} {{ kho.currency }}</span></div>
      <div class="the__cot"><span class="nhan-mono">TB thực tế</span>
        <span class="the__so">{{ tong.tyGiaTB === null ? '—' : fmtVND(tong.tyGiaTB) + '/1 ' + kho.currency }}</span></div>
    </div>

    <p v-if="nhac.chu" class="dt__nhac" :class="'dt__nhac--' + nhac.kieu">{{ nhac.chu }}</p>
  </section>
</template>

<style scoped>
.the { background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3); }
.the__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); flex-wrap: wrap; }
.the__ten { margin: 0; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho); }

.dt__bang { border: 1.5px solid var(--navy); border-radius: var(--bo-nho); overflow: hidden; }
.dong { display: grid; gap: var(--sp-1) var(--sp-2); padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--vach); background: var(--giay);
  grid-template-columns: 150px minmax(0, 1fr);
  grid-template-areas: 'ngay noi' 'vnd fx' 'tg xoa'; }
.o-ngay { grid-area: ngay; } .o-noi { grid-area: noi; } .o-vnd { grid-area: vnd; } .o-fx { grid-area: fx; }
.dong__tg { grid-area: tg; font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); align-self: center; white-space: nowrap; }
.dong__xoa { grid-area: xoa; justify-self: end; border: 0; background: transparent; color: var(--khoa-muc);
  font-size: 17px; line-height: 1; cursor: pointer; padding: 0 4px; }
.dong__xoa:hover { color: var(--loi); }
.trong { margin: 0; padding: var(--sp-3); color: var(--muc-phu); font-size: 13px; }
.them { display: block; width: 100%; text-align: left; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho); background: transparent;
  border: 0; border-top: 1px dashed var(--vach); padding: var(--sp-2) var(--sp-3); cursor: pointer; }
.them:hover { background: var(--kem); }

.the__tong { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-2);
  border-top: 1.5px solid var(--navy); padding-top: var(--sp-2); }
.the__cot { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.the__so { font-family: var(--font-nhan); font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dt__nhac { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--muc-phu);
  border-left: 3px solid var(--vach); padding-left: var(--sp-2); }
.dt__nhac--du { color: var(--duyet); border-color: var(--duyet); }
.dt__nhac--vuot { color: var(--loi); border-color: var(--loi); font-weight: 600; }
@media (max-width: 380px) { .dong { grid-template-columns: 132px minmax(0, 1fr); } }
</style>
