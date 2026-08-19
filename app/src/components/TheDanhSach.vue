<script setup>
import { ref, computed } from 'vue'
import { kho } from '../lib/kho.js'
import { moTa, tienDo, goiYConLai, themMon, xoaMon } from '../lib/so-tay.js'
import ONhap from './ONhap.vue'

const props = defineProps({ khoa: { type: String, required: true } })
const emit = defineEmits(['doi'])
const baoDoi = () => emit('doi')

const tin = computed(() => moTa(props.khoa))
const ds = computed(() => kho[props.khoa])
const td = computed(() => tienDo(ds.value))
const goiY = computed(() => goiYConLai(props.khoa, ds.value).slice(0, 8))

const moi = ref('')
function them (ten) {
  if (!themMon(props.khoa, ten ?? moi.value)) return
  if (ten === undefined) moi.value = ''
  baoDoi()
}
function tick (m) { m.packed = !m.packed; baoDoi() }
function xoa (m) { xoaMon(props.khoa, m.id); baoDoi() }
</script>

<template>
  <section class="the">
    <header class="the__dau">
      <span class="the__ten"><span aria-hidden="true">{{ tin.bt }}</span> {{ tin.nhan }}</span>
      <span class="the__dem">{{ td.xong }}/{{ td.tong }}</span>
    </header>
    <div class="the__vach" :aria-label="`Đã ${tin.xong} ${td.xong} trên ${td.tong}`" role="img">
      <div class="the__vach-day" :style="{ width: td.phanTram + '%' }" />
    </div>

    <ul v-if="ds.length" class="mon">
      <!-- Mỗi món ĐÚNG MỘT DÒNG, kể cả trên điện thoại (CLAUDE.md) -->
      <li v-for="m in ds" :key="m.id" class="mon__o" :class="{ 'mon__o--xong': m.packed }">
        <button type="button" class="mon__tick" :aria-pressed="m.packed"
                :title="m.packed ? 'Bỏ đánh dấu' : tin.xong" @click="tick(m)">
          <span aria-hidden="true">{{ m.packed ? '✓' : '' }}</span>
        </button>
        <span class="mon__ten">{{ m.name }}</span>
        <button type="button" class="mon__xoa" title="Xoá món này" @click="xoa(m)">×</button>
      </li>
    </ul>
    <p v-else class="the__trong">Chưa có món nào. Thêm ở dưới, hoặc bấm một gợi ý.</p>

    <form class="them" @submit.prevent="them()">
      <ONhap v-model="moi" :placeholder="'Thêm vào ' + tin.nhan.toLowerCase()" @enter="them()" />
      <button type="submit" class="them__nut" :disabled="!moi.trim()">Thêm</button>
    </form>

    <div v-if="goiY.length" class="goi-y">
      <span class="nhan-mono">Gợi ý nhanh</span>
      <div class="goi-y__hang">
        <button v-for="g in goiY" :key="g" type="button" class="goi-y__chip" @click="them(g)">
          ＋ {{ g }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.the {
  display: flex; flex-direction: column; gap: var(--sp-2);
  background: var(--giay); border: var(--vien); border-radius: var(--bo-the);
  box-shadow: var(--bong-the-con); padding: var(--sp-3); min-width: 0;
}
.the__dau { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-2); }
.the__ten {
  font-family: var(--font-nhan); font-size: 12px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
}
.the__dem { font-family: var(--font-nhan); font-size: 12px; color: var(--san-ho); }

.the__vach { height: 6px; background: var(--khoa); border-radius: 3px; overflow: hidden; }
.the__vach-day { height: 100%; background: var(--duyet); transition: width var(--vua) var(--diu); }

.mon { list-style: none; margin: 0; padding: 0; }
.mon__o {
  display: grid; grid-template-columns: 20px minmax(0, 1fr) 22px;
  align-items: center; gap: var(--sp-2);
  padding: 5px 0; border-bottom: 1px solid var(--vach);
}
.mon__o:last-child { border-bottom: 0; }
.mon__ten { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.mon__o--xong .mon__ten { text-decoration: line-through; color: var(--muc-phu); }

.mon__tick {
  width: 18px; height: 18px; padding: 0; cursor: pointer; line-height: 1; font-size: 11px;
  background: var(--giay); border: 2px solid var(--navy); border-radius: 3px; color: var(--giay);
}
.mon__tick[aria-pressed='true'] { background: var(--duyet); border-color: var(--duyet); }
.mon__tick:focus-visible, .mon__xoa:focus-visible { outline: var(--focus); outline-offset: 2px; }

.mon__xoa {
  border: 0; background: transparent; color: var(--khoa-muc);
  font-size: 15px; cursor: pointer; padding: 0; opacity: 0;
}
.mon__o:hover .mon__xoa, .mon__xoa:focus-visible { opacity: 1; }
@media (hover: none) { .mon__xoa { opacity: .5; } }

.the__trong { margin: 0; font-size: 13px; color: var(--muc-phu); }

.them { display: flex; gap: var(--sp-2); align-items: flex-start; }
.them > :first-child { flex: 1; min-width: 0; }
.them__nut {
  font-family: var(--font-nhan); font-size: 11px; font-weight: 600;
  letter-spacing: var(--nhan-gian); text-transform: uppercase;
  color: var(--giay); background: var(--san-ho);
  border: 1.5px solid var(--navy); border-radius: var(--bo-nho);
  padding: 9px var(--sp-3); cursor: pointer; white-space: nowrap;
}
.them__nut:disabled { background: var(--khoa); color: var(--khoa-muc); border-color: var(--vach); cursor: not-allowed; }

.goi-y__hang { display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--sp-1); }
.goi-y__chip {
  font-size: 12px; color: var(--muc-phu); background: transparent;
  border: 1px dashed var(--vach); border-radius: var(--bo-nho);
  padding: 4px 8px; cursor: pointer;
}
.goi-y__chip:hover { border-color: var(--san-ho); color: var(--san-ho); }
.goi-y__chip:focus-visible { outline: var(--focus); outline-offset: 2px; }
</style>
