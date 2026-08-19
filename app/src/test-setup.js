/* jsdom không cài sẵn matchMedia, mà app dùng nó để phân biệt điện thoại
   với laptop. Cho phép từng bài kiểm tự chọn bề ngang qua datBeNgang(). */
let beNgang = 1280

export function datBeNgang (px) { beNgang = px }

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (truyVan) => {
    const max = /max-width:\s*(\d+)px/.exec(truyVan)
    const khop = max ? beNgang <= Number(max[1]) : false
    return {
      matches: khop,
      media: truyVan,
      addEventListener () {},
      removeEventListener () {},
      addListener () {},
      removeListener () {},
      dispatchEvent () { return false }
    }
  }
}
