<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import NutBam from './components/NutBam.vue'
import ONhap from './components/ONhap.vue'
import Chip from './components/Chip.vue'
import TheKPI from './components/TheKPI.vue'
import ThanhTong from './components/ThanhTong.vue'
import ConDau from './components/ConDau.vue'
import ThanhTab from './components/ThanhTab.vue'
import ToastHoanTac from './components/ToastHoanTac.vue'

/* Bề ngang cửa sổ — hiện lên để soi vết sẹo «Tổng cộng»:
   dưới 701px thì thanh Tổng cộng không được có một nét đứt nào. */
const beNgang = ref(0)
const doBeNgang = () => (beNgang.value = window.innerWidth)
onMounted(() => { doBeNgang(); window.addEventListener('resize', doBeNgang) })
onUnmounted(() => window.removeEventListener('resize', doBeNgang))

const oThuong = ref('Khon Boat Noodles')
const oGo = ref('')
const oSo = ref('120')
const oLoi = ref('1240000000')
const oXong = ref('Khon Boat Noodles')
const lanEnter = ref(0)

const DANH_MUC = [
  { bt: '🍜', ten: 'Ăn uống' }, { bt: '🚕', ten: 'Di chuyển' },
  { bt: '🎟', ten: 'Vé' }, { bt: '🛍', ten: 'Mua sắm' },
  { bt: '🏨', ten: 'Lưu trú' }, { bt: '📦', ten: 'Khác' }
]
const KENH = ['Tiền mặt', 'Momo', 'Zalo', 'Thẻ']
const danhMucChon = ref('Ăn uống')
const kenhChon = ref('Tiền mặt')

const TABS = [
  { ma: 'hom-nay', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { ma: 'ke-hoach', nhan: 'Kế hoạch', bieuTuong: '🗓' },
  { ma: 'so-tay', nhan: 'Sổ tay', bieuTuong: '🧳' },
  { ma: 'tong-ket', nhan: 'Tổng kết', bieuTuong: '📊' }
]
const tab = ref('ke-hoach')

const hienToast = ref(false)
</script>

<template>
  <div class="bang">
    <header class="bang__dau">
      <div class="soc-ve" />
      <div class="bang__dau-than">
        <span class="nhan-mono">Bảng linh kiện · lô 1</span>
        <h1 class="bang__tieu-de">Kế hoạch du lịch <span class="do">v10</span></h1>
        <p class="bang__mo-ta">
          Tám linh kiện dựng theo mục 02 bảng thiết kế. Mở file này cạnh
          <code>docs/bang-thiet-ke-v10.html</code> để soi từng ô.
        </p>
        <p class="bang__do">
          Bề ngang cửa sổ: <strong>{{ beNgang }}px</strong> —
          {{ beNgang >= 701 ? 'tư thế laptop' : 'tư thế điện thoại' }}
        </p>
      </div>
    </header>

    <!-- 1 · Nút -->
    <section class="khu">
      <h2 class="khu__ten">01 · Nút</h2>
      <div class="hang">
        <NutBam kieu="chinh">Lưu</NutBam>
        <NutBam kieu="phu">Xuất PDF</NutBam>
        <NutBam kieu="vien">Hủy</NutBam>
        <NutBam kieu="pha-huy">Đè dữ liệu</NutBam>
        <NutBam kieu="chinh" khoa>Lưu</NutBam>
      </div>
      <p class="ghi-chu">
        Hover, focus và nhấn giữ là trạng thái thật — rê chuột và bấm thử.
        Nhấn giữ thì nút lùi 2px và bóng khối co còn 1px trong 90ms.
      </p>
    </section>

    <!-- 2 · Ô nhập -->
    <section class="khu">
      <h2 class="khu__ten">02 · Ô nhập</h2>
      <div class="luoi">
        <div><span class="nhan-mono">Thường</span><ONhap v-model="oThuong" /></div>
        <div><span class="nhan-mono">Rỗng · gợi ý</span><ONhap v-model="oGo" placeholder="Tên hoạt động…" /></div>
        <div><span class="nhan-mono">Số tiền</span><ONhap v-model="oSo" can-phai /></div>
        <div>
          <span class="nhan-mono">Lỗi</span>
          <ONhap v-model="oLoi" can-phai trang-thai="loi"
                 thong-bao="Số tiền vượt giới hạn hợp lý — kiểm tra lại đơn vị." />
        </div>
        <div>
          <span class="nhan-mono">Vừa lưu</span>
          <ONhap v-model="oXong" trang-thai="thanh-cong" thong-bao="Đã ghi ✓" />
        </div>
        <div><span class="nhan-mono">Khóa</span><ONhap model-value="Chưa có chuyến" khoa /></div>
      </div>

      <div class="thu-ime">
        <p class="ghi-chu ghi-chu--dam">Thử giáp bộ gõ tiếng Việt</p>
        <p class="ghi-chu">
          Bật bộ gõ tiếng Việt, gõ vào ô trên cùng một chữ có dấu rồi bấm Enter để chốt dấu.
          Con số bên dưới <strong>không được nhảy</strong> khi anh chỉ đang chốt chữ —
          nó chỉ nhảy khi Enter thật sự là lệnh của app.
        </p>
        <ONhap v-model="oThuong" placeholder="Gõ thử: chùa, phở, xôi…" @enter="lanEnter++" />
        <p class="ghi-chu">Enter thật sự tới app: <strong>{{ lanEnter }}</strong> lần</p>
      </div>
    </section>

    <!-- 3 · Chip -->
    <section class="khu">
      <h2 class="khu__ten">03 · Chip danh mục &amp; kênh</h2>
      <div class="hang">
        <Chip v-for="d in DANH_MUC" :key="d.ten" :bieu-tuong="d.bt"
              :chon="danhMucChon === d.ten" @click="danhMucChon = d.ten">
          {{ d.ten }}
        </Chip>
      </div>
      <div class="hang">
        <Chip v-for="k in KENH" :key="k" :chon="kenhChon === k" @click="kenhChon = k">
          {{ k }}
        </Chip>
        <Chip khoa>Chưa phân loại</Chip>
      </div>
    </section>

    <!-- 4 · Thẻ KPI -->
    <section class="khu">
      <h2 class="khu__ten">04 · Thẻ KPI</h2>
      <div class="luoi">
        <TheKPI nhan="Đã chi hôm nay" so="1.240 ฿" phu="≈ 890.000 ₫" />
        <TheKPI nhan="Ví tiền mặt còn" so="1.150 ฿" phu="Chỉ tính dòng chọn Tiền mặt" />
        <TheKPI nhan="Ví tiền mặt · vượt" so="−310 ฿" canh-bao />
        <TheKPI nhan="Tổng cả chuyến" so="30,6 tr ₫" nen="navy" />
      </div>
    </section>

    <!-- 5 · Thanh Tổng cộng -->
    <section class="khu">
      <h2 class="khu__ten">05 · Thanh Tổng cộng</h2>
      <ThanhTong so="16.397 ฿" phu="11,8 tr ₫" />
      <p class="ghi-chu">
        <strong>Vết sẹo.</strong> Dưới 701px: nền navy đặc, vân mã vạch,
        <strong>không một nét đứt nào</strong>. Từ 701px mới có hai lỗ bấm hai đầu.
        Thu hẹp cửa sổ qua lại mốc 701px để nghiệm thu.
      </p>
    </section>

    <!-- 6 · Con dấu -->
    <section class="khu">
      <h2 class="khu__ten">06 · Con dấu</h2>
      <div class="hang hang--thua">
        <ConDau loai="duyet" />
        <ConDau loai="canh-bao" />
        <ConDau loai="hoan-tat" />
      </div>
      <p class="ghi-chu">Tối đa MỘT con dấu mỗi màn, luôn đặt ở header.</p>
    </section>

    <!-- 7 · Thanh tab -->
    <section class="khu">
      <h2 class="khu__ten">07 · Điều hướng</h2>
      <div class="khung-tab"><ThanhTab v-model="tab" :tabs="TABS" /></div>
      <p class="ghi-chu">
        Đang chọn: <strong>{{ tab }}</strong>. Từ 701px nó tự đổi thành sidebar trái 186px.
      </p>
    </section>

    <!-- 8 · Toast -->
    <section class="khu">
      <h2 class="khu__ten">08 · Toast + Hoàn tác</h2>
      <NutBam kieu="chinh" @click="hienToast = true">Ghi thử một khoản</NutBam>
      <div class="cho-toast">
        <ToastHoanTac
          :hien="hienToast"
          noi-dung="Đã ghi ✓"
          chi-tiet="120 ฿ · 🍜 Ăn uống · Tiền mặt"
          :giay="5"
          @hoan-tac="hienToast = false"
          @het-gio="hienToast = false"
        />
      </div>
      <p class="ghi-chu">Vạch nghệ đếm cạn trong 5 giây rồi toast tự đóng.</p>
    </section>

    <footer class="bang__chan">
      <p class="ghi-chu">
        Chưa dựng ở lô này (cố tình): hàng lịch trình, bottom sheet, biểu đồ cột,
        khối ✦ AI — bốn cái đó chỉ dùng ở một màn, hình dạng thật chỉ lộ ra khi dựng màn đó.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.bang { max-width: 1040px; margin: 0 auto; padding-bottom: var(--sp-8); }

.bang__dau {
  background: var(--giay);
  border: var(--vien);
  border-radius: var(--bo-the);
  box-shadow: var(--bong-the);
  overflow: hidden;
  margin: var(--sp-4) var(--sp-4) var(--sp-8);
}
.bang__dau-than { padding: var(--sp-4); }
.bang__tieu-de {
  margin: var(--sp-1) 0 var(--sp-2);
  font-family: var(--font-nhan);
  font-size: 26px;
  font-weight: 600;
}
.do { color: var(--san-ho); }
.bang__mo-ta { margin: 0 0 var(--sp-2); color: var(--muc-phu); font-size: 14px; }
.bang__do { margin: 0; font-family: var(--font-nhan); font-size: 12px; color: var(--nhan); }
code { font-family: var(--font-nhan); font-size: .9em; }

.khu { padding: 0 var(--sp-4) var(--sp-8); }
.khu__ten {
  font-family: var(--font-nhan);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: var(--nhan-gian);
  text-transform: uppercase;
  color: var(--san-ho);
  margin: 0 0 var(--sp-3);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--vach);
}

.hang { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; }
.hang + .hang { margin-top: var(--sp-3); }
.hang--thua { gap: var(--sp-6); padding: var(--sp-2) 0; }

.luoi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--sp-4);
}
.luoi .nhan-mono { display: block; margin-bottom: var(--sp-1); }

.thu-ime {
  margin-top: var(--sp-4);
  padding: var(--sp-3);
  background: var(--nghe-nhat);
  border-radius: var(--bo-the);
}
.thu-ime :deep(.o) { margin: var(--sp-2) 0; }

.ghi-chu { margin: var(--sp-2) 0 0; font-size: 13.5px; line-height: 1.55; color: var(--muc-phu); }
.ghi-chu--dam { color: var(--navy); font-weight: 600; }

.khung-tab {
  border: var(--vien);
  border-radius: var(--bo-the);
  overflow: hidden;
  max-width: 420px;
}
.cho-toast { margin-top: var(--sp-3); max-width: 420px; min-height: 74px; }
.bang__chan { padding: 0 var(--sp-4); }
</style>
