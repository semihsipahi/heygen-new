export function generateGUID() {
  // 'x' ve 'y' karakterlerini rastgele değerlerle değiştiriyoruz.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    // 0-15 arası rastgele sayı oluştur
    const r = (Math.random() * 16) | 0;
    // 'x' için rastgele değeri, 'y' için 8, 9, A veya B değerini hesapla
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
