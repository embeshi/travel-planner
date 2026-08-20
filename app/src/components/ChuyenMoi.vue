<script setup>
import { ref, watch, computed } from 'vue'
import { kho } from '../lib/kho.js'
import { donSoChoChuyenMoi } from '../lib/chuyen-moi.js'
import { taiXuong } from '../lib/backup.js'
import NutBam from './NutBam.vue'

/* ============================================================
   HỘP THOẠI BẮT ĐẦU CHUYẾN MỚI — phanh hai nấc cho một thao tác xoá.

   Nấc 1: ÉP xuất backup — nút dọn sổ bị KHOÁ cho tới khi file backup
          của chuyến cũ đã rơi xuống máy. Không có đường tắt.
   Nấc 2: xác nhận kiểu đè-dữ-liệu (mẫu «Tôi hiểu, đè đi» của bảng
          thiết kế), ghi rõ tên chuyến và số dòng sắp được cất.

   Sau khi dọn, chuyến cũ CHỈ còn trong file backup vừa xuất — hộp thoại
   phải nói thẳng điều đó, không để người dùng tưởng còn nút undo.
   ============================================================ */
const props = defineProps({ mo: { type: Boolean, default: false } })
const emit = defineEmits(['dong', 'xong'])

const hop = ref(null)
const tenFileDaXuat = ref('')
const loi = ref('')

watch(() => props.mo, (v) => {
  if (!hop.value) return
  if (v) { tenFileDaXuat.value = ''; loi.value = ''; hop.value.showModal() }
  else if (hop.value.open) hop.value.close()
})

const soDong = computed(() => kho.rows.length)

function xuat () {
  loi.value = ''
  try {
    tenFileDaXuat.value = taiXuong(kho)
  } catch (e) {
    loi.value = 'Không xuất được backup: ' + (e && e.message ? e.message : 'lỗi lạ')
  }
}

function batDau () {
  if (!tenFileDaXuat.value) return   /* nấc 1 chưa qua thì nấc 2 không chạy */
  donSoChoChuyenMoi(kho)
  emit('xong')
  emit('dong')
}
</script>

<template>
  <dialog ref="hop" class="cm" @close="emit('dong')">
    <div class="cm__than">
      <div class="cm__dau">
        <span class="nhan-mono">Bắt đầu chuyến mới</span>
        <button type="button" class="cm__dong" aria-label="Đóng" @click="emit('dong')">×</button>
      </div>

      <p class="cm__loi-noi">
        Chuyến <strong>«{{ kho.title }}»</strong> ({{ soDong }} dòng lịch trình) sẽ được
        <strong>cất vào file backup</strong>, rồi sổ được dọn trống cho chuyến mới.
      </p>
      <ul class="cm__ghi">
        <li>Sau bước này, chuyến cũ <strong>chỉ còn trong file backup</strong> —
            muốn đọc lại thì bấm «Nhập backup» với file đó.</li>
        <li>Danh sách hành lý (skincare, makeup, đồ dùng) <strong>giữ nguyên món</strong>,
            chỉ bỏ dấu tick.</li>
        <li>Nên gửi file backup ra khỏi máy (tự email cho mình / thả Drive).</li>
      </ul>

      <!-- Nấc 1 · ép xuất backup -->
      <div class="cm__buoc" :class="{ 'cm__buoc--xong': tenFileDaXuat }">
        <span class="nhan-mono">Bước 1</span>
        <NutBam v-if="!tenFileDaXuat" kieu="phu" @click="xuat">Xuất backup chuyến này</NutBam>
        <p v-else class="cm__da-xuat">✓ Đã cất: <code>{{ tenFileDaXuat }}</code></p>
        <p v-if="loi" class="cm__loi">{{ loi }}</p>
      </div>

      <!-- Nấc 2 · xác nhận đè — khoá cho tới khi nấc 1 xong -->
      <div class="cm__buoc">
        <span class="nhan-mono">Bước 2</span>
        <div class="cm__hang-nut">
          <NutBam kieu="pha-huy" :khoa="!tenFileDaXuat" @click="batDau">
            Tôi hiểu, dọn sổ cho chuyến mới
          </NutBam>
          <NutBam kieu="vien" @click="emit('dong')">Hủy</NutBam>
        </div>
        <p v-if="!tenFileDaXuat" class="cm__khoa-vi">Bị khoá cho tới khi xuất backup xong.</p>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.cm {
  border: var(--vien); border-radius: var(--bo-the); box-shadow: var(--bong-the);
  background: var(--giay); color: var(--navy); padding: 0;
  width: min(480px, calc(100vw - 32px));
}
.cm::backdrop { background: rgba(31, 58, 95, .55); }
.cm__than { display: flex; flex-direction: column; gap: var(--sp-3); padding: var(--sp-4); }
.cm__dau { display: flex; align-items: center; justify-content: space-between; }
.cm__dong { border: 0; background: transparent; font-size: 24px; line-height: 1;
  color: var(--muc-phu); cursor: pointer; padding: 0 4px; }
.cm__loi-noi { margin: 0; font-size: 14.5px; line-height: 1.6; }
.cm__ghi { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: var(--muc-phu);
  display: flex; flex-direction: column; gap: 4px; }
.cm__buoc { display: flex; flex-direction: column; gap: var(--sp-2);
  border-top: 1px dashed var(--vach); padding-top: var(--sp-3); }
.cm__buoc--xong .nhan-mono { color: var(--duyet); }
.cm__da-xuat { margin: 0; font-size: 13px; color: var(--duyet); font-weight: 600; }
.cm__da-xuat code { font-family: var(--font-nhan); font-size: 11px; }
.cm__loi { margin: 0; color: var(--loi); font-size: 13px; font-weight: 600; }
.cm__hang-nut { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.cm__khoa-vi { margin: 0; font-size: 12px; color: var(--khoa-muc); }
</style>
