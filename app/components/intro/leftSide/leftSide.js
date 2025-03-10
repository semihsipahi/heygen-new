"use client";

import { Box } from "@mui/material";
import Image from "next/image";
import ChatbotSwiper from "../swiper/ChatBotSwiper";


export default function LeftSide({ slideIndex }) {
  return (
    <div className="left-column">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundImage: `url(/images/avatars/swiper/swiper_background_${slideIndex}.jpg)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >

        <Box sx={{ display: "flex", width: 72, height: 36 }}>
          <Image src="/small/topRight.png" width={36} height={36} alt="" />
          <Box sx={{ width: 36, height: 36, backgroundColor: "white" }} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            width: "100%",
            position: "relative",
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChatbotSwiper onSlideChange={() => {}} />
           
          </Box>
          <Box sx={{ width: 36, backgroundColor: "white" }} />
        </Box>

        <Box
          sx={{
            display: "flex",
            width: 36,
            height: 36,
            backgroundImage: "url(/small/rightBottom.png)",
          }}
        />
      </Box>
    </div>
  );
}
