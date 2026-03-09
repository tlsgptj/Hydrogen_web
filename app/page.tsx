"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import background from "@/public/background.png";
import car from "@/public/car.png";
import bus from "@/public/bus.png";
import H2 from "@/public/H2.png";
import Hls from 'hls.js';

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────
interface StationData {
  id: string;
  name: string;
  waitMinutes: number;
  carCount: number;
  busCount: number;
  operatingHours: string;
  isOpen: boolean;
  cctv: {
    streamUrl: string; // 실제 CCTV 스트림 URL (HLS / WebRTC 등)
    isLive: boolean;
  };
}

// ──────────────────────────────────────────────
// 더미 데이터 (실제 API 연동 시 교체)
// ──────────────────────────────────────────────
const STATION_DATA: StationData = {
  id: "wanju-01",
  name: "완주 H수소충전소",
  waitMinutes: 0,
  carCount: 1,
  busCount: 1,
  operatingHours: "09:00 ~ 20:00",
  isOpen: true,
  cctv: {
    streamUrl: "rtsp://admin:%40%40admin7434@192.168.1.11:554/0/onvif/profile1/media.smp", // TODO: 실제 CCTV HLS 스트림 URL 입력 (예: "https://example.com/live/stream.m3u8")
    isLive: false,
  },
};

// ──────────────────────────────────────────────
// CCTV 컴포넌트 (HLS 스트림 지원 - hls.js 사용 권장)
// ──────────────────────────────────────────────
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
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    }

    // 기본 video src 처리 (MP4 / WebRTC SDP URL 등)
    video.src = streamUrl;
    video.onerror = () => setError(true);
  }, [streamUrl]);

  if (!streamUrl || error) {
    return (
      // CCTV 미연결 플레이스홀더
      <div className="flex flex-1 items-center justify-center bg-[#0D1526]">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[35px] text-white">CCTV</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-black">
      {isLive && (
        <span className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wide">
          ● LIVE
        </span>
      )}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// 대기시간 원형 게이지
// ──────────────────────────────────────────────
function WaitGauge({ minutes }: { minutes: number }) {
  return (
    <div className="relative w-[176px] h-[176px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
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
        <span className="text-[36px] text-[#1D6FE3] font-semibold">
          {minutes}분
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 차량 카운트 카드
// ──────────────────────────────────────────────
function VehicleCard({ type, count }: { type: "car" | "bus"; count: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {type === "car" ? (
        <Image
          src={car}
          alt="수소차"
          width={176}
          height={62}
          className="object-contain"
        />
      ) : (
        <Image
          src={bus}
          alt="수소버스"
          width={176}
          height={62}
          className="object-contain"
        />
      )}

      {/* 차량 대수 텍스트 */}
      <span className="text-[36px] text-[#1D6FE3] font-semibold mt-3">
        {count}대
      </span>
    </div>
  );
}
// ──────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ──────────────────────────────────────────────
export default function HydrogenStationPage() {
  const [station] = useState<StationData>(STATION_DATA);

  // TODO: 실시간 데이터 폴링 (예: 10초마다 API 호출)
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const res = await fetch('/api/station/' + station.id);
  //     const data = await res.json();
  //     setStation(data);
  //   }, 10_000);
  //   return () => clearInterval(interval);
  // }, [station.id]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-gray-900">

      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-slate-200 px-8 h-[64px] flex items-center sticky top-0 z-50 shadow-sm">
        <Image
          src={logo}
          alt="Hying Guard"
          height={40}
          className="h-10 w-auto ml-[240px]"
        />
      </header>

      {/* ── 히어로 배너 ── */}
      <section className="relative w-screen h-[300px] overflow-hidden flex items-end px-10 pb-20">
        <Image
          src={background}
          alt="배경 이미지"
          fill
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 mb-10 ml-[240px]">
          <h1 className="text-2xl md:text-[40px] font-bold text-white tracking-tight leading-tight">
            실시간 수소충전소 대기현황
          </h1>
        </div>
      </section>

      {/* ── 메인 콘텐츠 ── */}
      <main className="max-w-[1518px] ml-[240px] py-8 pb-16">


          {/* 충전소 헤더 */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            {/* 아이콘 */}
            <div className="relative shrink-0">
            
                <Image
                  src={H2}
                  alt="충전소 아이콘"
                  width={80}
                  height={87}
                  className="w-[80px] h-[87px] object-contain"
                />
            </div>

            {/* 충전소명 */}
            <span className="text-[30px] font-bold text-slate-900 tracking-tight">
              {station.name}
            </span>
          </div>



          {/* 대기현황 + CCTV 그리드 */}
          <div className="grid grid-cols-[1000px_498px] gap-[20px]">

            {/* ── 대기 현황 패널 ── */}
            <div className="w-[921px] h-[280px] bg-[#BAE3FF] p-8 flex items-center gap-[120px]">
              <WaitGauge minutes={station.waitMinutes} />
              <div className="flex gap-[28px] flex-wrap">
                <VehicleCard type="car" count={station.carCount} />
                <VehicleCard type="bus" count={station.busCount} />
              </div>
            </div>

            {/* ── CCTV 패널 ── */}
            <div className="w-[498px] h-[280px] bg-[#0A0F1E] flex flex-col">
              <CCTVPlayer
                streamUrl={station.cctv.streamUrl}
                isLive={station.cctv.isLive}
              />
            </div>

          </div>
          {/* 운영시간 안내 */}
          <div className="flex items-center gap-1.5 px-6 py-3.5 border-t border-slate-100 text-[24px] text-slate-500">
            <span className="text-slate-700">{station.name}</span>
            <span>운영시간은</span>
            <strong className="text-blue-700">{station.operatingHours}</strong>
            <span>입니다.</span>
          </div>
      </main>
    </div>
  );
}