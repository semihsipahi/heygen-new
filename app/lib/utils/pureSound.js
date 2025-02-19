export const runSoundFilter = () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // Web Audio API ile ses işleme başlatılır
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      // Gürültü filtresi (bandpass filter) oluşturuluyor
      const filter = audioContext.createBiquadFilter();

      filter.type = 'bandpass'; // Bandpass filtre türü, sadece belirli bir frekans aralığını geçirecek
      filter.frequency.setValueAtTime(1000, audioContext.currentTime); // 1000 Hz civarındaki frekansı hedef alıyoruz
      filter.Q.setValueAtTime(1, audioContext.currentTime); // Frekans genişliği, gürültüyü azaltmak için uygun bir değer seçilebilir

      // Mikrofon verisi, filtreye bağlanır ve ardından analizöre
      microphone.connect(filter);
      filter.connect(analyser);

      // Ses verisini analiz etmek için bir fonksiyon
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function updateAudio() {
        analyser.getByteFrequencyData(dataArray); // Ses verisi alınır
        requestAnimationFrame(updateAudio); // Ses verilerini sürekli günceller
      }

      updateAudio(); // Ses işleme başlatılır
    })
    .catch((err) => {
      console.error('Mikrofon erişimi hatası:', err);
    });
};
