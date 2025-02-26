// ** React Imports
import { useState } from 'react';

// ** MUI Imports
import { Avatar, Card, CardContent, Grid, Typography } from '@mui/material';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react';
import KeenSliderWrapper from 'src/@core/styles/libs/keen-slider';

const ChatbotSwiper = ({ onSlideChange }) => {
  // ** States
  const [loaded, setLoaded] = useState < boolean > false;
  const [currentSlide, setCurrentSlide] = useState < number > 0;
  const direction = undefined;
  // ** Hook
  const [sliderRef, instanceRef] =
    useKeenSlider <
    HTMLDivElement >
    ({
      rtl: direction === 'rtl',
      loop: true,
      slides: {
        perView: 1,
      },
      slideChanged(slider) {
        const slideIndex = slider.track.details.rel;
        // console.log('slideChanged:', slideIndex);
        setCurrentSlide(slideIndex);
        onSlideChange(slideIndex);
      },
      created() {
        setLoaded(true);
      },
    },
    [
      (slider) => {
        let timeout;
        let mouseOver = false;
        function clearNextTimeout() {
          globalThis.window.clearTimeout(timeout);
        }
        function nextTimeout() {
          clearTimeout(timeout);
          if (mouseOver) return;
          timeout = globalThis.window.setTimeout(() => {
            slider.next();
          }, 6000);
        }
        slider.on('created', () => {
          slider.container.addEventListener('mouseover', () => {
            mouseOver = true;
            clearNextTimeout();
          });
          slider.container.addEventListener('mouseout', () => {
            mouseOver = false;
            nextTimeout();
          });
          nextTimeout();
        });
        slider.on('dragStarted', clearNextTimeout);
        slider.on('animationEnded', nextTimeout);
        slider.on('updated', () => {
          console.log('sliderUpdated'), nextTimeout();
        });
        slider.on('destroyed', () => {
          slider.on('dragStarted', clearNextTimeout, true);
          slider.on('animationEnded', nextTimeout, true);
          slider.on('updated', nextTimeout, true);
          clearNextTimeout();
        });
      },
    ]);

  return (
    <KeenSliderWrapper
      style={{ position: 'absolute', width: '100%', marginTop: '45%' }}
    >
      <Box ref={sliderRef} className="keen-slider">
        <Box
          className="keen-slider__slide"
          sx={{ padding: { md: '0 5%', lg: '0 20%' } }}
        >
          <Card
            sx={{
              overflow: 'visible !important',
              marginTop: '35px',
              position: 'relative',
            }}
          >
            <CardContent>
              <Avatar
                src="/images/avatars/swiper/swiper_1.jpeg"
                alt=""
                variant="circular"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  width: 70,
                  height: 70,
                }}
              />
              <Grid container mt={2} spacing={4} sx={{ marginTop: '1rem' }}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    “İlk defa bir platform üzerinden sanal bir mülakat deneyimi
                    yaşadım ve Meetgate beni çok etkiledi. Sistem gerçekten
                    kullanıcı dostu ve mülakat sonrası aldığım puanlar sayesinde
                    eşit değerlendiriyorum hissiyatı inanılmaz.”
                  </Typography>
                </Grid>
                <Grid item xs={10}>
                  <Typography variant="h6">Can S.</Typography>
                  <Typography variant="body2">
                    İnsan Kaynakları Uzmanı
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Icon icon="oui:quote" fontSize="3rem" color="lightgrey" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
        <Box
          className="keen-slider__slide"
          sx={{ padding: { md: '0 5%', lg: '0 20%' } }}
        >
          <Card
            sx={{
              overflow: 'visible !important',
              marginTop: '35px',
              position: 'relative',
            }}
          >
            <CardContent>
              <Avatar
                src="/images/avatars/swiper/swiper_2.jpeg"
                alt=""
                variant="circular"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  width: 70,
                  height: 70,
                }}
              />
              <Grid container mt={2} spacing={4} sx={{ marginTop: '1rem' }}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    “Meetgate üzerinden gerçekleştirdiğim görüşme, önceki
                    deneyimlerimden çok farklıydı. Akıcı ve stressiz bir ortamda
                    mülakat yaptım, sanki yüz yüze değil de bir arkadaşla
                    konuşuyormuş gibi hissettim. Bu rahatlatıcı atmosfer, gerçek
                    potansiyelimi gösterebilmemi sağladı.”
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Ayşe B.</Typography>
                  <Typography variant="body2">
                    Dijital Pazarlama Uzmanı
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
        <Box
          className="keen-slider__slide"
          sx={{ padding: { md: '0 5%', lg: '0 20%' } }}
        >
          <Card
            sx={{
              overflow: 'visible !important',
              marginTop: '35px',
              position: 'relative',
            }}
          >
            <CardContent>
              <Avatar
                src="/images/avatars/swiper/swiper_3.jpeg"
                alt=""
                variant="circular"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  width: 70,
                  height: 70,
                }}
              />
              <Grid container mt={2} spacing={4} sx={{ marginTop: '1rem' }}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    “Bir iş başvuru sürecinde bu kadar hızlı geri dönüş almak
                    beni gerçekten şaşırttı. Meetgate sayesinde sadece birkaç
                    gün içinde görüşmemi gerçekleştirdim. Zaman yönetimi
                    harika!”
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Merve K.</Typography>
                  <Typography variant="body2">Grafik Tasarımcı</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
        <Box
          className="keen-slider__slide"
          sx={{ padding: { md: '0 5%', lg: '0 20%' } }}
        >
          <Card
            sx={{
              overflow: 'visible !important',
              marginTop: '35px',
              position: 'relative',
            }}
          >
            <CardContent>
              <Avatar
                src="/images/avatars/swiper/swiper_4.jpeg"
                alt=""
                variant="circular"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  width: 70,
                  height: 70,
                }}
              />
              <Grid container mt={2} spacing={4} sx={{ marginTop: '1rem' }}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    “Meetgate’in sağladığı esneklik sayesinde işe alım süreci
                    çok daha rahat geçti. Evimde, kendi rahat ortamımda mülakat
                    yapma imkanı bulmak mükemmeldi.”
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Derya A.</Typography>
                  <Typography variant="body2">Satış Uzmanı</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
        <Box
          className="keen-slider__slide"
          sx={{ padding: { md: '0 5%', lg: '0 20%' } }}
        >
          <Card
            sx={{
              overflow: 'visible !important',
              marginTop: '35px',
              position: 'relative',
            }}
          >
            <CardContent>
              <Avatar
                src="/images/avatars/swiper/swiper_5.jpeg"
                alt=""
                variant="circular"
                sx={{
                  position: 'absolute',
                  top: '-35px',
                  width: 70,
                  height: 70,
                }}
              />
              <Grid container mt={2} spacing={4} sx={{ marginTop: '1rem' }}>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    “Daha önce mülakatlar sırasında hep çok stres yapardım, ama
                    Meetgate’in sade ve rahatlatıcı mülakat süreci sayesinde hiç
                    gerilmedim. Kendimi doğal bir şekilde ifade edebildim ve bu,
                    görüşmenin verimliliğini artırdı diye düşünüyorum.”
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6">Fatih K.</Typography>
                  <Typography variant="body2">Stajyer</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {loaded && instanceRef.current && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem',
            columnGap: '1rem',
          }}
        >
          {[
            ...Array(instanceRef.current.track.details.slides.length).keys(),
          ].map((idx) => {
            return (
              <Badge
                key={idx}
                variant="dot"
                color={currentSlide === idx ? 'success' : 'secondary'}
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  instanceRef.current?.moveToIdx(idx);
                }}
              ></Badge>
            );
          })}
        </Box>
      )}
    </KeenSliderWrapper>
  );
};
export default ChatbotSwiper;
