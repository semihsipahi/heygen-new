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
