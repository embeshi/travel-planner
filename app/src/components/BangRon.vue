<script setup>
import { computed } from 'vue'
import { kho } from '../lib/kho.js'
import { tongChiPhiCaChuyen } from '../lib/tong-hop.js'
import { nhomTheoNgay, nhomCaoNhat } from '../lib/nhom-ngay.js'
import { ngayThuMay } from '../lib/giai-doan.js'
import { fmtVND } from '../lib/dinh-dang.js'
import NutBam from './NutBam.vue'

const emit = defineEmits(['dong', 'xem'])
const tong = computed(() => tongChiPhiCaChuyen(kho).tong)
const soNgay = computed(() => {
  const t = ngayThuMay(kho, kho.hotel.checkout || '')
  return t ? t.tong : null
})
const ngayDinh = computed(() => {
  const ds = nhomTheoNgay(kho.rows, { chiDongCoTien: true })
  const key = nhomCaoNhat(ds)
  return ds.find((g) => g.key === key)?.nhan || null
})
</script>

<template>
  <!-- Trượt xuống MỘT LẦN, không lặp (bảng thiết kế mục 05) -->
  <div class="br" role="status">
    <div class="br__than">
      <div class="br__chibi" aria-hidden="true">[ ẢNH CHIBI 🎉 ]</div>
      <div class="br__chu">
        <strong class="br__ten">Chuyến đi hoàn tất 🎉</strong>
        <p class="br__mo">
          <template v-if="soNgay">{{ soNgay }} ngày </template>ở {{ kho.title }} đã khép lại,
          tổng cộng {{ fmtVND(tong) }}<template v-if="ngayDinh">, ngày đáng nhớ nhất là {{ ngayDinh }}</template>.
          Cuống vé được lưu lại nguyên vẹn để đọc lại bất cứ lúc nào.
        </p>
      </div>
      <div class="br__nut">
        <NutBam kieu="chinh" @click="emit('xem')">Xem tổng kết</NutBam>
        <NutBam kieu="vien" @click="emit('dong')">Đóng</NutBam>
      </div>
    </div>
  </div>
</template>

<style scoped>
.br {
  background: var(--san-ho-nhat); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the); overflow: hidden;
  animation: truot-xuong 240ms var(--diu);
}
@keyframes truot-xuong {
  from { transform: translateY(-14px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}
.br__than { display: flex; align-items: center; gap: var(--sp-4); padding: var(--sp-3) var(--sp-4); flex-wrap: wrap; }
.br__chibi {
  border: 1.5px dashed var(--khoa-muc); border-radius: var(--bo-nho);
  padding: var(--sp-3); color: var(--khoa-muc);
  font-family: var(--font-nhan); font-size: 10px; letter-spacing: var(--nhan-gian);
}
.br__chu { flex: 1; min-width: 200px; }
.br__ten { font-family: var(--font-nhan); font-size: 15px; font-weight: 600; }
.br__mo { margin: 4px 0 0; font-size: 13.5px; color: var(--muc-phu); }
.br__nut { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
</style>
