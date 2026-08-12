<script setup>
defineProps({
  nhan: { type: String, default: 'Tổng cộng' },
  so: { type: String, required: true },
  phu: { type: String, default: '' }
})
</script>

<!--
  ============================================================
  THANH TỔNG CỘNG — vết sẹo, đọc trước khi sửa.

  `CLAUDE.md`: «Khối "Tổng cộng" trên mobile: KHÔNG nét đứt, không
  viền trang trí.» Chủ dự án đã bác ba lần qua các bản v9.x.

  Luật:
  - Mobile (≤700px): nền navy đặc + vân mã vạch. Không một nét đứt nào.
  - Laptop (≥701px): mới được thêm hai lỗ bấm tròn và đường xé nét đứt.

  Vân mã vạch CHỈ sống ở đây, không dán lên hàng dữ liệu (luật 01B).
  Vì cả app dùng chung một linh kiện này nên nó chỉ có một chỗ để sai.
  ============================================================
-->
<template>
  <div class="tong">
    <span class="tong__nhan">{{ nhan }}</span>
    <span class="tong__so">{{ so }}</span>
    <span v-if="phu" class="tong__phu">{{ phu }}</span>
  </div>
</template>

<style scoped>
.tong {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--bo-the);
  color: var(--kem);
  background-color: var(--navy);
  background-image: var(--ma-vach);
  position: relative;
}

.tong__nhan {
  font-family: var(--font-nhan);
  font-size: var(--nhan-co);
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  color: var(--kem);
  opacity: .85;
}

.tong__so {
  margin-left: auto;
  font-family: var(--font-nhan);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: .04em;
}

.tong__phu {
  font-family: var(--font-nhan);
  font-size: 12px;
  opacity: .8;
}

/* Lỗ bấm + đường xé: CHỈ từ 701px trở lên. Dưới mốc đó tuyệt đối không. */
@media (min-width: 701px) {
  .tong { padding-inline: var(--sp-8); }

  .tong::before,
  .tong::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--kem);
    transform: translateY(-50%);
  }
  .tong::before { left: -7px; }
  .tong::after { right: -7px; }
}
</style>
