/* ============================================================
   CẤU HÌNH SUPABASE — điều kiện SỐ 1 trong «bốn thứ giữ cho dữ liệu cũ
   tự hiện ra trong v10» (CLAUDE.md).

   ⚠️ HAI CHUỖI DƯỚI ĐÂY KHÔNG ĐƯỢC ĐỔI MỘT KÝ TỰ ⚠️
   Đổi là v10 đi mở nhầm căn phòng khác và thấy trống trơn — dữ liệu vẫn
   nằm nguyên đó, chỉ là không ai nhìn thấy.

   Chúng được CHÉP BẰNG MÁY từ index.html v9.6, không gõ tay, để không có
   cơ hội sai một ký tự. Khoá publishable vốn công khai, an toàn khi có RLS.
   ============================================================ */
export const SUPABASE_URL = 'https://rcwbyzuvzwizsedzmnmq.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_l7aC3PVvB8la4bZPc_CGpA_JnxC27SA'

/* Thư viện supabase-js — một trong hai ngoại lệ CDN có sẵn từ v9.6
   (luật 5 CLAUDE.md). Service worker trữ lại nên offline vẫn chạy. */
export const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

export const BANG = 'trips'

/* Tem phiên bản — luôn hiển thị, đây là thứ CLAUDE.md liệt vào «phải giữ».
   Chỉ nhảy số khi thay đổi được đẩy lên nhánh chính. */
export const PHIEN_BAN = 'v10.2'
