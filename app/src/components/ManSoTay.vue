<script setup>
import { computed } from 'vue'
import { kho } from '../lib/kho.js'
import { DANH_SACH, tienDo } from '../lib/so-tay.js'
import TheDanhSach from './TheDanhSach.vue'

const emit = defineEmits(['doi'])
const hanhLy = DANH_SACH.filter((d) => d.nhom === 'hanh-ly')
const soTay = DANH_SACH.filter((d) => d.nhom === 'so-tay')

/* activePack và activeNote là cột CÓ SẴN trong sổ v9.6 — dùng lại đúng
   chúng thay vì đẻ trạng thái mới, để tab đang mở cũng được nhớ như cũ. */
const NHOM = [
  { ten: 'Hành lý', ds: hanhLy, cot: 'activePack' },
  { ten: 'Sổ tay', ds: soTay, cot: 'activeNote' }
]
const tongTienDo = computed(() => {
  const moi = DANH_SACH.flatMap((d) => kho[d.khoa])
  return tienDo(moi)
})
</script>

<template>
  <section class="st">
    <div class="st__dau">
      <h2 class="st__ten">Sổ tay &amp; hành lý</h2>
      <span class="st__tong">Đã xong {{ tongTienDo.xong }}/{{ tongTienDo.tong }} món</span>
    </div>

    <div v-for="n in NHOM" :key="n.ten" class="nhom">
      <h3 class="nhom__ten">{{ n.ten }}</h3>

      <!-- Điện thoại: tab con, mỗi lúc một danh sách -->
      <div class="tab-con">
        <button v-for="d in n.ds" :key="d.khoa" type="button" class="tab-con__nut"
                :class="{ 'tab-con__nut--chon': kho[n.cot] === d.khoa }"
                :aria-current="kho[n.cot] === d.khoa ? 'true' : undefined"
                @click="kho[n.cot] = d.khoa; emit('doi')">
          <span aria-hidden="true">{{ d.bt }}</span> {{ d.nhan }}
          <span class="tab-con__dem">{{ tienDo(kho[d.khoa]).xong }}/{{ kho[d.khoa].length }}</span>
        </button>
      </div>

      <!-- Laptop bày cả ba cột cùng lúc; điện thoại chỉ hiện cái đang chọn -->
      <div class="cot">
        <TheDanhSach v-for="d in n.ds" :key="d.khoa" :khoa="d.khoa"
                     class="cot__o" :class="{ 'cot__o--an': kho[n.cot] !== d.khoa }"
                     @doi="emit('doi')" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.st { display: flex; flex-direction: column; gap: var(--sp-4); }
.st__dau { display: flex; align-items: baseline; gap: var(--sp-3); flex-wrap: wrap; }
.st__ten {
  margin: 0; font-family: var(--font-nhan); font-size: 13px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
}
.st__tong { font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); }

.nhom { display: flex; flex-direction: column; gap: var(--sp-2); }
.nhom__ten {
  margin: 0; font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--nhan);
}

.tab-con { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.tab-con__nut {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--navy); background: var(--giay);
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 7px var(--sp-3); cursor: pointer;
}
.tab-con__nut--chon { background: var(--san-ho); color: var(--giay); box-shadow: var(--bong-chip); }
.tab-con__dem { opacity: .75; }
.tab-con__nut:focus-visible { outline: var(--focus); outline-offset: 2px; }

.cot { display: grid; gap: var(--sp-3); }

@media (min-width: 701px) {
  /* Laptop bày ba cột cùng lúc — bỏ tab con đi cho khỏi thừa */
  .tab-con { display: none; }
  .cot { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cot__o--an { display: flex; }
}
@media (max-width: 700px) {
  .cot__o--an { display: none; }
}
</style>
