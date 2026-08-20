<script setup>
import { ref, computed } from 'vue'
import { kho } from '../lib/kho.js'
import { tongChiPhiCaChuyen, coCauTheoDanhMuc, coCauTheoKenh, trungBinhMoiNgay, soVoiDuTru, tongDaDoi } from '../lib/tong-hop.js'
import { viTienMatConLai } from '../lib/xep-dong.js'
import { nhomTheoNgay, nhomCaoNhat } from '../lib/nhom-ngay.js'
import { fmtVND, fmtFx, num } from '../lib/dinh-dang.js'
import TheKPI from './TheKPI.vue'
import ThanhTong from './ThanhTong.vue'
import NutBam from './NutBam.vue'
import ONhap from './ONhap.vue'
import KhoaAI from './KhoaAI.vue'
import { coKhoaAI, khoaAI, keChuyenBangAI, banNhapNoiBo } from '../lib/ai.js'

const emit = defineEmits(['doi'])

const tong = computed(() => tongChiPhiCaChuyen(kho))
const tb = computed(() => trungBinhMoiNgay(kho))
const duTru = computed(() => soVoiDuTru(kho))
const theoNgay = computed(() => nhomTheoNgay(kho.rows, { chiDongCoTien: true }))
const ngayDinh = computed(() => nhomCaoNhat(theoNgay.value))
const caoNhat = computed(() => Math.max(1, ...theoNgay.value.map((g) => g.tong)))
const danhMuc = computed(() => coCauTheoDanhMuc(kho))
const kenh = computed(() => coCauTheoKenh(kho))
const viCon = computed(() => viTienMatConLai(kho.rows, tongDaDoi(kho)))

/* Xuất PDF bằng chính hộp thoại in của hệ điều hành: 0KB thư viện, chạy
   offline, và trên iOS/Android/desktop đều có mục «Lưu thành PDF».
   Kéo cả một thư viện PDF vào chỉ để làm việc này là không đáng. */
function xuatPDF () { window.print() }

/* ============================================================
   ✦ AI KỂ CHUYỆN — lô 11b. Ba luật:
   1. Bản nháp là BẢN XEM TRƯỚC SỬA ĐƯỢC, không tự ghi đi đâu cả —
      «bản nháp chỉ hiện ở đây; bấm Xuất PDF mới ghi ra tệp» (PRD F6).
   2. Đường làm tay luôn hiện: nút «Viết nháp không cần AI» dựng đoạn văn
      từ đúng số liệu thật, offline, 0 đồng.
   3. Nút Xuất PDF chỉ bật sau khi có bản nháp (PRD F6).
   ============================================================ */
const banNhap = ref('')
const dangKe = ref(false)
const loiAI = ref('')

function vietTay () {
  loiAI.value = ''
  banNhap.value = banNhapNoiBo(kho)
}

async function keBangAI () {
  if (!coKhoaAI() || dangKe.value) return
  loiAI.value = ''; dangKe.value = true
  try {
    banNhap.value = await keChuyenBangAI(kho)
  } catch (e) {
    loiAI.value = e.message || 'Không gọi được AI.'
  } finally {
    dangKe.value = false
  }
}
</script>

<template>
  <section class="tk">
    <div class="tk__dau">
      <h2 class="tk__ten">Tổng kết chuyến đi</h2>
      <NutBam kieu="phu" class="tk__in" :khoa="!banNhap.trim()"
              :title="banNhap.trim() ? '' : 'Tạo bản nháp tổng kết trước đã (PRD F6)'"
              @click="xuatPDF">Xuất PDF</NutBam>
    </div>

    <div class="tk__kpi">
      <TheKPI nhan="Tổng cả chuyến" :so="fmtVND(tong.tong)" nen="navy" />
      <TheKPI v-if="tb" nhan="Trung bình mỗi ngày" :so="fmtVND(tb.moiNgay)"
              :phu="tb.songay + ' ngày'" />
      <TheKPI v-if="duTru" nhan="So dự trù"
              :so="(duTru.phanTram >= 0 ? '+' : '') + duTru.phanTram.toFixed(1) + '%'"
              :phu="'dự trù ' + fmtVND(duTru.duTru)"
              :canh-bao="duTru.chenh > 0" />
      <TheKPI nhan="Ví tiền mặt còn" :so="fmtFx(viCon) + ' ' + kho.currency"
              :canh-bao="viCon < 0" />
    </div>

    <p v-if="tong.thieuTyGia.length" class="tk__thieu">
      Thiếu tỷ giá {{ tong.thieuTyGia.join(', ') }} — tổng phía trên chưa đủ.
    </p>

    <!-- Ngân sách dự trù -->
    <div class="tk__du-tru">
      <label class="nhan-mono" for="o-du-tru">Ngân sách dự trù (VNĐ)</label>
      <ONhap id="o-du-tru" v-model="kho.budget" type="number" placeholder="Ví dụ: 31900000"
             can-phai @update:model-value="emit('doi')" />
    </div>

    <!-- Biểu đồ cột chi theo ngày -->
    <h3 class="tk__khu">Chi theo ngày</h3>
    <div v-if="theoNgay.length" class="cot-ngay">
      <div v-for="g in theoNgay" :key="g.key" class="cot-ngay__o"
           :class="{ 'cot-ngay__o--dinh': g.key === ngayDinh }">
        <span class="cot-ngay__so">{{ fmtFx(g.tong) }}</span>
        <div class="cot-ngay__thanh" :style="{ height: Math.max(4, (g.tong / caoNhat) * 100) + '%' }" />
        <span class="cot-ngay__nhan">
          {{ g.nhan }}<template v-if="g.key === ngayDinh"> 🔥</template>
        </span>
      </div>
    </div>
    <p v-else class="tk__trong">Chưa có dòng nào có chi phí.</p>

    <!-- Cơ cấu -->
    <div class="tk__co-cau">
      <div>
        <h3 class="tk__khu">Theo danh mục</h3>
        <ul class="ty-le">
          <li v-for="x in danhMuc.ds" :key="x.ten" class="ty-le__o">
            <span class="ty-le__ten">{{ x.ten }}</span>
            <span class="ty-le__vach"><i :style="{ width: x.phanTram + '%' }" /></span>
            <span class="ty-le__so">{{ Math.round(x.phanTram) }}%</span>
          </li>
        </ul>
        <p v-if="!danhMuc.ds.length" class="tk__trong">Chưa có dữ liệu.</p>
      </div>
      <div>
        <h3 class="tk__khu">Theo kênh thanh toán</h3>
        <ul class="ty-le">
          <li v-for="x in kenh.ds" :key="x.ten" class="ty-le__o">
            <span class="ty-le__ten">{{ x.ten }}</span>
            <span class="ty-le__vach"><i :style="{ width: x.phanTram + '%' }" /></span>
            <span class="ty-le__so">{{ fmtFx(x.tien) }}</span>
          </li>
        </ul>
        <p v-if="!kenh.ds.length" class="tk__trong">Chưa có dữ liệu.</p>
      </div>
    </div>

    <ThanhTong nhan="Tổng cả chuyến" :so="fmtVND(tong.tong)"
               :phu="fmtFx(tong.tripFx) + ' ' + kho.currency" />

    <div class="tk__ai">
      <span class="nhan-mono">✦ AI kể chuyện chuyến đi</span>

      <KhoaAI />

      <div class="tk__ai-nut">
        <NutBam kieu="chinh" :khoa="!khoaAI || dangKe" @click="keBangAI">
          {{ dangKe ? 'Đang đọc số liệu chuyến đi…' : '✦ Tạo bản tổng kết' }}
        </NutBam>
        <NutBam kieu="vien" @click="vietTay">Viết nháp không cần AI</NutBam>
      </div>
      <p v-if="loiAI" class="tk__ai-loi">{{ loiAI }}</p>

      <!-- Bản xem trước SỬA ĐƯỢC. Dùng textarea (không phải ONhap) có chủ ý:
           đây là đoạn văn nhiều dòng, Enter nghĩa là xuống dòng chứ không phải
           lệnh — nên không cần giáp Enter của ONhap. -->
      <template v-if="banNhap">
        <textarea v-model="banNhap" class="tk__nhap" rows="6"
                  aria-label="Bản nháp tổng kết — sửa được trước khi xuất" />
        <p class="tk__ai-ghi">Bản nháp chỉ hiện ở đây — bấm Xuất PDF mới ra tệp.</p>
      </template>
    </div>

    <!-- Bản in của đoạn tổng kết: chỉ hiện khi in -->
    <div v-if="banNhap" class="tk__ban-in" aria-hidden="true">{{ banNhap }}</div>
  </section>
</template>

<style scoped>
.tk { display: flex; flex-direction: column; gap: var(--sp-3); }
.tk__dau { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); flex-wrap: wrap; }
.tk__ten {
  margin: 0; font-family: var(--font-nhan); font-size: 13px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
}
.tk__kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--sp-3); }
.tk__thieu { margin: 0; color: var(--loi); font-size: 13px; font-weight: 600; }
.tk__du-tru { display: flex; flex-direction: column; gap: var(--sp-1); max-width: 260px; }

.tk__khu {
  margin: var(--sp-3) 0 var(--sp-2); font-family: var(--font-nhan);
  font-size: 11px; font-weight: 600; letter-spacing: var(--nhan-gian);
  text-transform: uppercase; color: var(--navy);
}
.tk__trong { margin: 0; font-size: 13px; color: var(--muc-phu); }

/* Biểu đồ cột kiểu bảng giờ bay: khối navy viền cứng, ngày đỉnh tô nghệ */
.cot-ngay {
  display: flex; align-items: flex-end; gap: var(--sp-2);
  height: 168px; padding: var(--sp-3);
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); overflow-x: auto;
}
.cot-ngay__o { flex: 1; min-width: 42px; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end; gap: 4px; height: 100%; }
.cot-ngay__so { font-family: var(--font-nhan); font-size: 10px; color: var(--nhan); }
.cot-ngay__thanh {
  width: 100%; background: var(--navy);
  border: 1.5px solid var(--navy); border-radius: 2px 2px 0 0;
  transition: height var(--vua) var(--diu);
}
.cot-ngay__o--dinh .cot-ngay__thanh { background: var(--nghe); }
.cot-ngay__nhan { font-family: var(--font-nhan); font-size: 10px; white-space: nowrap; }

.tk__co-cau { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--sp-4); }
.ty-le { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.ty-le__o { display: grid; grid-template-columns: minmax(0, 1fr) 92px 56px; align-items: center; gap: var(--sp-2); }
.ty-le__ten { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ty-le__vach { height: 8px; background: var(--khoa); border-radius: 4px; overflow: hidden; }
.ty-le__vach i { display: block; height: 100%; background: var(--san-ho); }
.ty-le__so { font-family: var(--font-nhan); font-size: 12px; text-align: right; }

.tk__ai {
  border: 1.5px dashed var(--vach); border-radius: var(--bo-the);
  padding: var(--sp-3); background: var(--dien-tin);
}
.tk__ai { display: flex; flex-direction: column; gap: var(--sp-2); }
.tk__ai-nut { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.tk__ai-loi { margin: 0; color: var(--loi); font-size: 13px; font-weight: 600; }
.tk__ai-ghi { margin: 0; font-size: 12px; color: var(--muc-phu); }
.tk__nhap {
  width: 100%; resize: vertical; font-family: var(--font-noi-dung);
  font-size: 14px; line-height: 1.6; color: var(--navy);
  background: var(--giay); border: 1.5px solid var(--navy);
  border-radius: var(--bo-nho); padding: var(--sp-3);
}
.tk__nhap:focus-visible { outline: var(--focus); outline-offset: 2px; }
.tk__ban-in { display: none; }

/* Xuất PDF: giấu mọi thứ không phải nội dung tổng kết */
@media print {
  .tk__in, .tk__du-tru, .tk__ai { display: none; }
  /* Đoạn tổng kết được in kèm — đây chính là «Xuất PDF» của bản nháp */
  .tk__ban-in {
    display: block; font-size: 14px; line-height: 1.7;
    padding: 12px 0; border-top: 1px solid #999; margin-top: 12px;
  }
  .tk { gap: 12px; }
  .cot-ngay, .tk__kpi > * { box-shadow: none; }
}
</style>
