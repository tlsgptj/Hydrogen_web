"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import background from "@/public/background.png";
import car from "@/public/car.png";
import bus from "@/public/bus.png";
import H2 from "@/public/H2.png";
import Hls from "hls.js";

interface StationData {
  id: string;
  name: string;
  waitMinutes: number;
  carCount: number;
  busCount: number;
  operatingHours: string;
  isOpen: boolean;
  cctv: {
    streamUrl: string;
    isLive: boolean;
  };
}

const STATION_DATA: StationData = {
  id: "wanju-01",
  name: "완주 H수소충전소",
  waitMinutes: 0,
  carCount: 1,
  busCount: 1,
  operatingHours: "09:00 ~ 20:00",
  isOpen: true,
  cctv: {
    streamUrl: "http://localhost:8889/hydrogen_cam",
    isLive: false,
  },
};

function CCTVPlayer({
  streamUrl,
  isLive,
}: {
  streamUrl: string;
  isLive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => setError(true));
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    video.src = streamUrl;
    video.onerror = () => setError(true);
  }, [streamUrl]);

  if (!streamUrl || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0D1526]">
        <span className="text-[24px] text-white md:text-[35px]">CCTV</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {isLive && (
        <span className="absolute left-2 top-2 z-10 rounded bg-red-500 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
          ● LIVE
        </span>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function WaitGauge({ minutes }: { minutes: number }) {
  return (
    <div className="relative h-[96px] w-[96px] shrink-0 md:h-[176px] md:w-[176px]">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#1D6FE3"
          strokeWidth="3"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[18px] font-semibold text-[#1D6FE3] md:text-[36px]">
          {minutes}분
        </span>
      </div>
    </div>
  );
}

function VehicleCard({ type, count }: { type: "car" | "bus"; count: number }) {
  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      <Image
        src={type === "car" ? car : bus}
        alt={type === "car" ? "수소차" : "수소버스"}
        width={176}
        height={62}
        className="h-auto w-[88px] object-contain md:w-[176px]"
      />

      <span className="mt-1 text-[18px] font-semibold text-[#1D6FE3] md:mt-3 md:text-[36px]">
        {count}대
      </span>
    </div>
  );
}

export default function HydrogenStationPage() {
  const [station] = useState<StationData>(STATION_DATA);

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex h-[56px] items-center border-b border-slate-200 bg-white px-4 shadow-sm md:h-[64px] md:px-8">
        <div className="mx-auto flex w-full max-w-[1518px] items-center">
          <Image
            src={logo}
            alt="Hying Guard"
            height={40}
            className="h-7 w-auto md:h-10"
          />
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative flex h-[96px] w-full items-center overflow-hidden px-4 md:h-[300px] md:items-end md:px-10 md:pb-20">
        <Image
          src={background}
          alt="배경 이미지"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 mx-auto w-full max-w-[1518px] md:mb-10">
          <h1 className="text-[18px] font-bold leading-tight tracking-tight text-white md:text-[40px]">
            실시간 수소충전소 대기현황
          </h1>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto w-full max-w-[1518px] px-4 py-5 pb-10 md:py-8 md:pb-16">
        <div>
          {/* 충전소 헤더 */}
          <div className="flex items-center gap-3 border-b border-slate-100 py-4 md:px-6 md:py-5">
            <div className="relative shrink-0">
              <Image
                src={H2}
                alt="충전소 아이콘"
                width={80}
                height={87}
                className="h-[60px] w-[52px] object-contain md:h-[87px] md:w-[80px]"
              />
            </div>

            <span className="text-[18px] font-bold tracking-tight text-slate-900 md:text-[30px]">
              {station.name}
            </span>
          </div>

          {/* 대기현황 + CCTV */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[921px_498px] md:gap-[20px]">
            {/* 대기 현황 패널 */}
            <div className="flex min-h-[143px] w-full items-center justify-between bg-[#BAE3FF] px-4 py-5 md:h-[280px] md:w-[921px] md:justify-start md:pl-[120px] md:pr-8 md:py-8 md:gap-[109px]">
              <WaitGauge minutes={station.waitMinutes} />

              <div className="flex gap-[20px] md:gap-[20px]">
                <VehicleCard type="car" count={station.carCount} />
                <VehicleCard type="bus" count={station.busCount} />
              </div>
            </div>

            {/* CCTV 패널 */}
            <div className="h-[200px] w-full bg-[#0A0F1E] md:h-[280px] md:w-[498px]">
              <CCTVPlayer
                streamUrl={station.cctv.streamUrl}
                isLive={station.cctv.isLive}
              />
            </div>
          </div>

          {/* 운영시간 안내 */}
          <div className="px-0 py-4 text-[14px] text-slate-500 md:px-6 md:py-3.5 md:text-[24px]">
            <span className="text-slate-700">{station.name}</span>
            <span> 운영시간은 </span>
            <strong className="text-blue-700">{station.operatingHours}</strong>
            <span>입니다.</span>
          </div>
        </div>
      </main>
    </div>
  );
}