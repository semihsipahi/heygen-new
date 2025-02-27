export const extractTagContent = (inputString, tag) => {
  const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, 's');
  const match = inputString.match(regex);
  return match ? match[1].trim() : null;
};

// Örnek Kullanım:
// const input = `<when_question>
// Sorunuz: "Şu anda müsait olmadığınızı anlıyorum, peki ne zaman görüşme için müsait olabileceğinizi bize bildirebilir misiniz?"
// </when_question>

// <user_input>
// {{ $json.body.user_input }}
// </user_input>

// <ready_state>
// NOT
// </ready_state>`;

// console.log(extractTagContent(input, 'when_question'));

export function extractBetween(str, startTag, endTag) {
  const startIndex = str.indexOf(startTag);
  if (startIndex === -1) return ''; // startTag bulunamadıysa boş döndür

  // startTag'in bitiş konumunu belirleyelim:
  const contentStartIndex = startIndex + startTag.length;

  // contentStartIndex'ten itibaren endTag'i arayalım
  const endIndex = str.indexOf(endTag, contentStartIndex);
  if (endIndex === -1) return ''; // endTag bulunamazsa boş döndür

  // startTag ile endTag arasındaki içeriği döndürüyoruz
  return str.substring(contentStartIndex, endIndex).trim();
}

// Örnek kullanım
// const inputString = "<summary> Geri bildirimleriniz, empati kurma ve kişiye özel çözümler sunma konusundaki çabanızın müşteri memnuniyetini artırma açısından çok değerli olduğunu gösteriyor, bu da müşteri ilişkileri yönetiminde güçlü bir yetenek sağlıyor. </summary>";

// // Nereye kadar keseceğini "startTag" ve "endTag" olarak belirtiyoruz
// const summaryContent = extractBetween(inputString, "<summary>", "</summary>");

// console.log(summaryContent);
