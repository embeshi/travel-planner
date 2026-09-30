<script setup>
import { ref, computed } from 'vue'
import { kho } from '../lib/kho.js'
import { nhanVe, xemLaiVe, xoaVe } from '../lib/ke-ve.js'
import { taiXuong } from '../lib/backup.js'
import ConDau from './ConDau.vue'
import NutBam from './NutBam.vue'
import ChuyenMoi from './ChuyenMoi.vue'

/* ============================================================
   🎫 KỆ VÉ — bảng thiết kế M9 · L9. Một pane cuối tab Tổng kết,
   không phải trang riêng. Luật thị giác của M9:
   · header pane KHÔNG mang dấu đồng bộ — con dấu chỉ đóng TRÊN VÉ,
     mỗi vé một con
   · tên dài cắt «…» đúng một dòng
   · đông vé: kệ cuộn trong khung riêng, không kéo dài cả trang
   · nút rút gọn «＋ CHUYẾN MỚI» để giữ luật mono in hoa ≤3 chữ
   ============================================================ */
const emit = defineEmits(['doi', 'den-ty-gia'])
const moChuyenMoi = ref(false)
const dangHoiXoa = ref('')          /* id vé đang chờ xác nhận xoá */
const cacVe = computed(() => kho.chuyenDaCat)

function xemLai (id) {
  const ten = xemLaiVe(kho, id)
  if (ten) emit('doi')
}
function xuatVe (ve) {
  /* Xuất riêng một vé thành file backup — đọc lại được ở mọi bản app */
  try { taiXuong(ve.data) } catch (e) { alert('Không xuất được: ' + e.message) }
}
function xoa (id) {
  if (dangHoiXoa.value !== id) { dangHoiXoa.value = id; return }
  xoaVe(kho, id)
  dangHoiXoa.value = ''
  emit('doi')
}
</script>

<template>
  <section class="ke">
    <div class="ke__dau">
      <h3 class="ke__ten">🎫 Kệ vé <span class="ke__dem">{{ cacVe.length }}</span></h3>
      <NutBam kieu="chinh" @click="moChuyenMoi = true">＋ Chuyến mới</NutBam>
    </div>

    <p v-if="!cacVe.length" class="ke__trong">
      Kệ còn trống. Tấm vé đầu tiên sẽ xuất hiện khi bạn cất chuyến đang đi.
    </p>

    <div v-else class="ke__khung">
      <article v-for="ve in cacVe" :key="ve.id" class="veo">
        <div class="veo__dau">
          <div class="veo__ten-khu">
            <strong class="veo__tuyen">{{ nhanVe(ve).tuyen }}</strong>
            <span v-if="nhanVe(ve).ngay" class="veo__ngay">{{ nhanVe(ve).ngay }}</span>
          </div>
          <!-- Con dấu chỉ đóng trên vé — mỗi vé một con (luật M9) -->
          <ConDau loai="hoan-tat" />
        </div>

        <dl class="veo__so">
          <div><dt>Dòng lịch trình</dt><dd>{{ nhanVe(ve).soDong }}</dd></div>
          <div><dt>Tổng chi</dt><dd>{{ nhanVe(ve).tong }}</dd></div>
          <div><dt>Ví lúc chốt</dt><dd>{{ nhanVe(ve).vi }}</dd></div>
        </dl>

        <div class="veo__nut">
          <NutBam kieu="vien" @click="xemLai(ve.id)">Xem lại</NutBam>
          <details class="veo__menu">
            <summary aria-label="Thêm lựa chọn">⋯</summary>
            <div class="veo__menu-o">
              <button type="button" @click="xuatVe(ve)">Xuất file backup</button>
              <button type="button" class="veo__xoa" @click="xoa(ve.id)">
                {{ dangHoiXoa === ve.id ? 'Bấm lần nữa để xoá hẳn' : 'Xoá vé khỏi kệ' }}
              </button>
            </div>
          </details>
        </div>
      </article>
    </div>

    <ChuyenMoi :mo="moChuyenMoi" @dong="moChuyenMoi = false" @xong="emit('doi')"
               @den-ty-gia="emit('den-ty-gia')" />
  </section>
</template>

<style scoped>
.ke { display: flex; flex-direction: column; gap: var(--sp-3);
  border-top: 1px dashed var(--vach); padding-top: var(--sp-4); margin-top: var(--sp-2); }
.ke__dau { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); flex-wrap: wrap; }
.ke__ten { margin: 0; font-family: var(--font-nhan); font-size: 12px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--navy); }
.ke__dem { display: inline-block; min-width: 20px; text-align: center;
  background: var(--san-ho); color: var(--giay); border-radius: 999px;
  font-size: 10px; padding: 2px 6px; margin-left: 4px; }
.ke__trong { margin: 0; font-size: 13.5px; color: var(--muc-phu);
  border: 1.5px dashed var(--vach); border-radius: var(--bo-the); padding: var(--sp-4); }

/* Đông vé: cuộn trong khung riêng có mép trên/dưới (luật M9) */
.ke__khung { display: flex; flex-direction: column; gap: var(--sp-3);
  max-height: 420px; overflow-y: auto; padding: 2px;
  border-block: 1px solid var(--vach); }

.veo { background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3); display: flex;
  flex-direction: column; gap: var(--sp-2); }
.veo__dau { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--sp-2); }
.veo__ten-khu { min-width: 0; }
/* Tên dài cắt «…» đúng một dòng (luật M9) */
.veo__tuyen { display: block; font-family: var(--font-nhan); font-size: 15px; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.veo__ngay { font-family: var(--font-nhan); font-size: 11px; color: var(--nhan); }

.veo__so { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-2); margin: 0; }
.veo__so dt { font-family: var(--font-nhan); font-size: 9px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--nhan); }
.veo__so dd { margin: 2px 0 0; font-family: var(--font-nhan); font-size: 13px;
  font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.veo__nut { display: flex; align-items: center; gap: var(--sp-2); }
.veo__menu { position: relative; }
.veo__menu summary { list-style: none; cursor: pointer; font-size: 18px;
  color: var(--muc-phu); padding: 2px 10px; border: 1.5px solid var(--vach);
  border-radius: var(--bo-nho); user-select: none; }
.veo__menu summary::-webkit-details-marker { display: none; }
.veo__menu-o { position: absolute; right: 0; top: calc(100% + 4px); z-index: 5;
  display: flex; flex-direction: column; min-width: 190px;
  background: var(--giay); border: var(--vien); border-radius: var(--bo-nho);
  box-shadow: var(--bong-chip); overflow: hidden; }
.veo__menu-o button { text-align: left; font-family: var(--font-noi-dung); font-size: 13px;
  background: transparent; border: 0; padding: 9px var(--sp-3); cursor: pointer; color: var(--navy); }
.veo__menu-o button:hover { background: var(--kem); }
.veo__xoa { color: var(--loi) !important; }

@media (max-width: 700px) {
  .veo__so { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
