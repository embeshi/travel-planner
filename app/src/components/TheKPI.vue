<script setup>
defineProps({
  nhan: { type: String, required: true },
  so: { type: String, required: true },
  phu: { type: String, default: '' },
  /* Vượt ví tiền mặt → viền + chữ màu lỗi, nền san hô nhạt.
     Chỉ tính trên các dòng chọn «Tiền mặt» — không so sai phạm trù (mục 05 PRD). */
  canhBao: { type: Boolean, default: false },
  /* giay | navy — thẻ navy dùng cho chỉ số dẫn đầu */
  nen: { type: String, default: 'giay' }
})
</script>

<template>
  <div class="kpi" :class="[`kpi--${nen}`, { 'kpi--canh-bao': canhBao }]">
    <span class="kpi__nhan">{{ nhan }}</span>
    <strong class="kpi__so">{{ so }}</strong>
    <span v-if="phu" class="kpi__phu">{{ phu }}</span>
  </div>
</template>

<style scoped>
.kpi {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-3) var(--sp-4);
  border: var(--vien);
  border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con);
  /* Vùng số liệu nền trơn, không vân mã vạch */
  background: var(--giay);
}

.kpi__nhan {
  font-family: var(--font-nhan);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  color: var(--nhan);
}

.kpi__so {
  font-family: var(--font-nhan);
  font-size: var(--so-lon);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -.01em;
}

.kpi__phu { font-size: 13px; color: var(--muc-phu); }

.kpi--navy { background: var(--navy); color: var(--kem); }
.kpi--navy .kpi__nhan { color: var(--kem); opacity: .8; }
.kpi--navy .kpi__phu { color: var(--kem); opacity: .8; }

.kpi--canh-bao {
  background: var(--san-ho-nhat);
  border-color: var(--loi);
  color: var(--loi);
}
.kpi--canh-bao .kpi__nhan { color: var(--loi); }
.kpi--canh-bao .kpi__phu { color: var(--loi); }
</style>
