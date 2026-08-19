<script setup>
import { computed } from 'vue'
import { kho, daXong, danhMucCua, CHUA_PHAN_LOAI } from '../lib/kho.js'
import { daChiHomNay, dongCuaHomNay, tongDaDoi } from '../lib/tong-hop.js'
import { viTienMatConLai } from '../lib/xep-dong.js'
import { rowTotal } from '../lib/xep-dong.js'
import { fmtFx, fmtVND, num } from '../lib/dinh-dang.js'
import { homNayISO, ngayThuMay, mocChuyenDi } from '../lib/giai-doan.js'
import { dayKeyInfo, pad2, weekdayOf } from '../lib/ngay.js'
import TheKPI from './TheKPI.vue'

const props = defineProps({
  /* Cho phép truyền ngày vào để thử — mặc định là hôm nay thật. */
  homNay: { type: String, default: () => homNayISO() }
})
const emit = defineEmits(['doi', 'sang-tab'])
const baoDoi = () => emit('doi')

const dong = computed(() => dongCuaHomNay(kho, props.homNay))
const daChi = computed(() => daChiHomNay(kho, props.homNay))
const viCon = computed(() => viTienMatConLai(kho.rows, tongDaDoi(kho)))
const thuMay = computed(() => ngayThuMay(kho, props.homNay))
const coMoc = computed(() => mocChuyenDi(kho).tu !== 'chua-co')

const nhanNgay = computed(() => {
  const t = dayKeyInfo(props.homNay)
  if (t.cls !== 0) return props.homNay
  return weekdayOf(t.y, t.mo, t.d) + ' · ' + pad2(t.d) + '/' + pad2(t.mo)
})

function tick (row) { row.done = !daXong(row); baoDoi() }

/* Tick nhanh sổ tay: lấy vài món CHƯA xong từ ba danh sách «trong chuyến».
   Hành lý (skincare/makeup/essentials) là việc trước chuyến nên không lên đây. */
const DS_TRONG_CHUYEN = [
  { khoa: 'food', bt: '🍜' },
  { khoa: 'shopping', bt: '🛍' },
  { khoa: 'places', bt: '📍' }
]
const tickNhanh = computed(() =>
  DS_TRONG_CHUYEN.flatMap(({ khoa, bt }) =>
    kho[khoa].filter((m) => !m.packed).slice(0, 3).map((m) => ({ m, bt, khoa }))
  ).slice(0, 6)
)
function tickMon (o) { o.m.packed = true; baoDoi() }
</script>

<template>
  <section class="hn">
    <div class="hn__dau">
      <h2 class="hn__ten">Hôm nay</h2>
      <span class="hn__ngay">
        {{ nhanNgay }}<template v-if="thuMay"> · ngày {{ thuMay.thu }}/{{ thuMay.tong }} của chuyến</template>
      </span>
    </div>

    <div class="hn__kpi">
      <TheKPI nhan="Đã chi hôm nay" :so="fmtFx(daChi) + ' ' + kho.currency"
              :phu="kho.rate ? '≈ ' + fmtVND(daChi * kho.rate) : 'chưa có tỷ giá'" />
      <TheKPI nhan="Ví tiền mặt còn" :so="fmtFx(viCon) + ' ' + kho.currency"
              phu="Chỉ tính dòng chọn Tiền mặt" :canh-bao="viCon < 0" />
    </div>

    <h3 class="hn__khu">
      Lịch trình hôm nay
      <span class="hn__dem">{{ dong.length }} mục</span>
    </h3>

    <ul v-if="dong.length" class="viec">
      <li v-for="r in dong" :key="r.id" class="viec__o" :class="{ 'viec__o--xong': daXong(r) }">
        <button type="button" class="viec__tick" :aria-pressed="daXong(r)"
                :title="daXong(r) ? 'Bỏ đánh dấu' : 'Đánh dấu đã xong'" @click="tick(r)">
          <span aria-hidden="true">{{ daXong(r) ? '✓' : '' }}</span>
        </button>
        <span class="viec__ten">{{ r.activity || 'Chưa đặt tên' }}</span>
        <span class="viec__dm" :class="{ 'viec__dm--trong': !r.cat }">{{ r.cat || CHUA_PHAN_LOAI }}</span>
        <span class="viec__tien">
          {{ num(r.tripCost) > 0 ? fmtFx(rowTotal(r)) + ' ' + kho.currency : '—' }}
        </span>
      </li>
    </ul>

    <p v-else class="hn__trong">
      <template v-if="coMoc">Hôm nay chưa có việc nào trong lịch trình.</template>
      <template v-else>Chưa có chuyến nào. Sang tab Kế hoạch để bắt đầu.</template>
      <button type="button" class="hn__lien-ket" @click="emit('sang-tab', 'ke-hoach')">
        Mở Kế hoạch →
      </button>
    </p>

    <template v-if="tickNhanh.length">
      <h3 class="hn__khu">Tick nhanh sổ tay</h3>
      <div class="nhanh">
        <button v-for="o in tickNhanh" :key="o.khoa + o.m.id" type="button"
                class="nhanh__chip" @click="tickMon(o)">
          <span aria-hidden="true">{{ o.bt }}</span> {{ o.m.name }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.hn { display: flex; flex-direction: column; gap: var(--sp-3); }
.hn__dau { display: flex; align-items: baseline; gap: var(--sp-3); flex-wrap: wrap; }
.hn__ten {
  margin: 0; font-family: var(--font-nhan); font-size: 13px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
}
.hn__ngay { font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); }

.hn__kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--sp-3); }

.hn__khu {
  margin: var(--sp-3) 0 0; display: flex; align-items: baseline; gap: var(--sp-2);
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--navy);
}
.hn__dem { color: var(--nhan); font-weight: 400; }

/* Mỗi việc đúng MỘT dòng, kể cả trên điện thoại (điều tối kỵ trong CLAUDE.md) */
.viec {
  list-style: none; margin: 0; padding: 0;
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); overflow: hidden;
}
.viec__o {
  display: grid; grid-template-columns: 26px minmax(0, 1fr) auto auto;
  align-items: center; gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--vach);
}
.viec__o:last-child { border-bottom: 0; }

.viec__tick {
  width: 20px; height: 20px; padding: 0; cursor: pointer;
  background: var(--giay); border: 2px solid var(--navy); border-radius: var(--bo-nho);
  color: var(--giay); font-size: 12px; line-height: 1;
}
.viec__tick[aria-pressed='true'] { background: var(--duyet); border-color: var(--duyet); }
.viec__tick:focus-visible { outline: var(--focus); outline-offset: 2px; }

.viec__ten { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.viec__o--xong .viec__ten { text-decoration: line-through; color: var(--muc-phu); }

.viec__dm {
  font-family: var(--font-nhan); font-size: 10px; letter-spacing: .06em;
  color: var(--muc-phu); white-space: nowrap;
}
.viec__dm--trong { color: var(--khoa-muc); }
.viec__tien {
  font-family: var(--font-nhan); font-size: var(--so-hang); font-weight: 600;
  white-space: nowrap;
}

.hn__trong {
  margin: 0; padding: var(--sp-4); color: var(--muc-phu); font-size: 14px;
  background: var(--giay); border: 1.5px dashed var(--vach); border-radius: var(--bo-the);
  display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap;
}
.hn__lien-ket {
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--san-ho); background: transparent; border: 0; cursor: pointer; padding: 0;
}

.nhanh { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.nhanh__chip {
  font-size: 13px; color: var(--navy); background: var(--giay);
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 6px var(--sp-3); cursor: pointer;
}
.nhanh__chip:hover { background: var(--kem); }
.nhanh__chip:focus-visible { outline: var(--focus); outline-offset: 2px; }

@media (max-width: 700px) {
  .viec__o { grid-template-columns: 26px minmax(0, 1fr) auto; }
  .viec__dm { display: none; }
}
</style>
