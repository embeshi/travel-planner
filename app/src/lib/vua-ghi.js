import { ref } from 'vue'

/* Dòng vừa ghi: nền san hô nhạt rồi phai dần về giấy trong 1,2 giây
   (bảng thiết kế mục 05). Dùng chung cho mọi màn đang hiện dòng đó,
   nên để ở một chỗ thay vì truyền prop lòng vòng. */
export const vuaGhiId = ref(null)
let dongHo = null

export function danhDauVuaGhi (id, ms = 1200) {
  vuaGhiId.value = id
  if (dongHo) clearTimeout(dongHo)
  dongHo = setTimeout(() => { vuaGhiId.value = null; dongHo = null }, ms)
}
