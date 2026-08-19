<script setup>
import { ref, computed } from 'vue'
import { khoMacDinh, applyData, ruotCuaBackup } from './lib/kho.js'
import { baConSoVanTay, tongChiPhiCaChuyen, tongDaDoi } from './lib/tong-hop.js'
import { fmtVND, fmtFx } from './lib/dinh-dang.js'
import { danhMucCua, CHUA_PHAN_LOAI } from './lib/kho.js'
import NutBam from './components/NutBam.vue'
import TheKPI from './components/TheKPI.vue'
import ThanhTong from './components/ThanhTong.vue'
import ConDau from './components/ConDau.vue'

const so = ref(null)
const tenFile = ref('')
const loi = ref('')

function chonFile (e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  loi.value = ''
  tenFile.value = f.name
  const doc = new FileReader()
  doc.onload = () => {
    try {
      const obj = JSON.parse(doc.result)
      /* Dựng vào một kho RIÊNG, không đụng kho của app, không ghi xuống máy. */
      so.value = applyData(ruotCuaBackup(obj), khoMacDinh())
    } catch (err) {
      loi.value = 'Không đọc được file này: ' + err.message
      so.value = null
    }
  }
  doc.onerror = () => { loi.value = 'Không mở được file.'; so.value = null }
  doc.readAsText(f)
}

const vanTay = computed(() => so.value ? baConSoVanTay(so.value) : null)
const chiTiet = computed(() => so.value ? tongChiPhiCaChuyen(so.value) : null)

const khoi = computed(() => {
  if (!so.value) return []
  const s = so.value
  return [
    ['Lịch trình', s.rows.length], ['Đổi tiền', s.cash.length],
    ['Gói bay + KS', s.bookings.length], ['Skincare', s.skincare.length],
    ['Makeup', s.makeup.length], ['Đồ dùng', s.essentials.length],
    ['Mua mang về', s.shopping.length], ['Đi đâu', s.places.length], ['Ăn gì', s.food.length]
  ]
})

const chuaPhanLoai = computed(() =>
  so.value ? so.value.rows.filter((r) => danhMucCua(r) === CHUA_PHAN_LOAI).length : 0)

const soNgay = computed(() =>
  so.value ? new Set(so.value.rows.map((r) => r.date).filter(Boolean)).size : 0)
</script>

<template>
  <div class="dc">
    <div class="soc-ve" />

    <header class="dc__dau">
      <div>
        <span class="nhan-mono">Nghi thức giữ dữ liệu · bước 4</span>
        <h1 class="dc__tieu-de">Đối chiếu ba con số</h1>
      </div>
      <ConDau loai="canh-bao" />
    </header>

    <section class="dc__than">
      <div class="an-toan">
        <p class="an-toan__ten">Trang này không chạm vào dữ liệu thật</p>
        <ul>
          <li>Không đăng nhập, không gọi một dòng nào tới máy chủ</li>
          <li>Không ghi gì xuống bộ nhớ máy — file chỉ được đọc trong bộ nhớ tạm</li>
          <li>Chọn file rồi đóng tab là xong, không để lại dấu vết</li>
        </ul>
      </div>

      <label class="chon">
        <span class="nhan-mono">Chọn file backup JSON</span>
        <input type="file" accept="application/json,.json" @change="chonFile">
      </label>
      <p v-if="tenFile" class="ten-file">Đang đọc: <strong>{{ tenFile }}</strong></p>
      <p v-if="loi" class="loi">{{ loi }}</p>

      <template v-if="vanTay">
        <h2 class="khu">Ba con số vân tay</h2>
        <div class="luoi3">
          <TheKPI nhan="Số dòng lịch trình" :so="String(vanTay.soDongLichTrinh)"
                  :phu="soNgay + ' ngày'" />
          <TheKPI nhan="Tổng chi phí cả chuyến" :so="fmtVND(vanTay.tongChiPhiVnd)" nen="navy" />
          <TheKPI nhan="Ví tiền mặt còn lại"
                  :so="fmtFx(vanTay.viTienMatConLai) + ' ' + vanTay.donViVi"
                  :canh-bao="vanTay.viTienMatConLai < 0" />
        </div>

        <p v-if="vanTay.thieuTyGia.length" class="loi">
          Thiếu tỷ giá: {{ vanTay.thieuTyGia.join(', ') }} — tổng phía trên chưa đủ.
        </p>

        <h2 class="khu">Chi tiết để đối chiếu</h2>
        <table class="bang">
          <tbody>
            <tr>
              <td>Lịch trình</td>
              <td>{{ fmtFx(chiTiet.tripFx) }} {{ so.currency }} × {{ so.rate }}</td>
              <td>{{ fmtVND(chiTiet.tripVnd || 0) }}</td>
            </tr>
            <tr>
              <td>Gói bay + khách sạn</td>
              <td>{{ fmtFx(chiTiet.bkFx) }} {{ so.bkCurrency }} × {{ so.bkRate }}</td>
              <td>{{ fmtVND(chiTiet.bkVnd || 0) }}</td>
            </tr>
            <tr>
              <td>Đã đổi ra tiền mặt</td>
              <td>{{ fmtFx(tongDaDoi(so)) }} {{ so.currency }}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
        <ThanhTong :so="fmtVND(vanTay.tongChiPhiVnd)" />

        <h2 class="khu">Từng khối có lên đủ không</h2>
        <div class="khoi">
          <div v-for="[ten, n] in khoi" :key="ten" class="khoi__o">
            <span class="nhan-mono">{{ ten }}</span>
            <strong>{{ n }}</strong>
          </div>
        </div>

        <p class="ghi-chu">
          Dòng chưa có danh mục: <strong>{{ chuaPhanLoai }}/{{ so.rows.length }}</strong> —
          hiện «{{ CHUA_PHAN_LOAI }}». Sổ cũ chưa có trường này nên con số bằng tổng số
          dòng là đúng, không phải lỗi.
        </p>

        <div class="ket">
          <NutBam kieu="vien" @click="so = null; tenFile = ''">Xoá khỏi màn hình</NutBam>
          <span class="ghi-chu">Ba con số khớp với bản ghi ngoài repo thì lô này đạt.</span>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.dc { max-width: 900px; margin: 0 auto; padding-bottom: var(--sp-8); }
.dc__dau {
  display: flex; align-items: flex-start; justify-content: space-between; gap: var(--sp-4);
  padding: var(--sp-4); background: var(--giay); border-bottom: var(--vien);
}
.dc__tieu-de { margin: var(--sp-1) 0 0; font-family: var(--font-nhan); font-size: 24px; font-weight: 600; }
.dc__than { padding: var(--sp-4); }

.an-toan {
  background: var(--duyet-nhat); border-left: 4px solid var(--duyet);
  border-radius: 0 var(--bo-the) var(--bo-the) 0; padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-6);
}
.an-toan__ten { margin: 0 0 var(--sp-2); font-weight: 600; color: var(--duyet); }
.an-toan ul { margin: 0; padding-left: 20px; font-size: 14px; color: var(--muc-phu); }

.chon { display: block; }
.chon .nhan-mono { display: block; margin-bottom: var(--sp-2); }
.chon input { font-family: var(--font-noi-dung); font-size: 14px; }
.ten-file { font-size: 14px; color: var(--muc-phu); }
.loi { color: var(--loi); font-weight: 600; }

.khu {
  font-family: var(--font-nhan); font-size: 12px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase; color: var(--san-ho);
  margin: var(--sp-6) 0 var(--sp-3); padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--vach);
}
.luoi3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--sp-3); }

.bang { width: 100%; border-collapse: collapse; margin-bottom: var(--sp-3); }
.bang td { padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--vach); font-size: 14px; }
.bang td:nth-child(2), .bang td:last-child {
  font-family: var(--font-nhan); font-size: 13px; text-align: right;
}

.khoi { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--sp-2); }
.khoi__o {
  display: flex; flex-direction: column; gap: 2px; padding: var(--sp-2) var(--sp-3);
  background: var(--giay); border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
}
.khoi__o strong { font-family: var(--font-nhan); font-size: 18px; }

.ghi-chu { font-size: 13.5px; color: var(--muc-phu); line-height: 1.55; }
.ket { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; margin-top: var(--sp-6); }
</style>
