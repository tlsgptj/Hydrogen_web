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

interface VehicleCountApiResponse {
  cameraId: string;
  timestamp: string;
  totalVehicles: number;
  cars: number;
  trucks: number;
}

const DEFAULT_STATION_DATA: StationData = {
  id: "wanju-01",
  name: "완주 H수소충전소",
  waitMinutes: 0,
  carCount: 0,
  busCount: 0,
  operatingHours: "06:00 ~ 20:30",
  isOpen: true,
  cctv: {
    streamUrl: "https://cctv.hydrogen-cctv.com/hydrogen_cam/index.m3u8",
    isLive: false,
  },
};

function calculateWaitMinutes(cars: number, trucks: number) {
  // 예시 로직:
  // 승용차 1대 = 5분
  // 대형차(버스/트럭) 1대 = 10분
  return cars * 5 + trucks * 10;
}

// --- CCTV 플레이어 컴포넌트 ---
function CCTVPlayer({
  streamUrl,
  isLive,
}: {
  streamUrl: string;
  isLive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.warn("Auto-play blocked:", e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError(true);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch((e) => console.warn("Auto-play blocked:", e));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  if (!streamUrl || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0D1526]">
        <span className="text-[18px] text-white md:text-[24px]">
          CCTV 연결 재시도 중...
        </span>
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
  const [station, setStation] = useState<StationData>(DEFAULT_STATION_DATA);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
  const fetchVehicleCount = async () => {
    try {
      const response = await fetch("/api/vehicle-count", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      setStation((prev) => ({
        ...prev,
        waitMinutes: data.cars * 5 + data.trucks * 10,
        carCount: data.cars,
        busCount: data.trucks,
        cctv: {
          ...prev.cctv,
          isLive: true,
        },
      }));

      setLastUpdated(data.timestamp);
      setApiError(false);
    } catch (error) {
      console.error("vehicle-count fetch error:", error);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  fetchVehicleCount();

  const intervalId = setInterval(fetchVehicleCount, 5000);

  return () => clearInterval(intervalId);
}, []);

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-gray-900">
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

      <main className="mx-auto w-full max-w-[1518px] px-4 py-5 pb-10 md:py-8 md:pb-16">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-100 py-4 md:px-6 md:py-5">
            <Image
              src={H2}
              alt="충전소 아이콘"
              width={80}
              height={87}
              className="h-[60px] w-[52px] md:h-[87px] md:w-[80px]"
            />
            <span className="text-[18px] font-bold text-slate-900 md:text-[30px]">
              {station.name}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[921px_498px] md:gap-[20px]">
            <div className="flex min-h-[143px] w-full items-center justify-between bg-[#BAE3FF] px-4 py-5 md:h-[280px] md:justify-start md:pl-[120px] md:pr-8 md:gap-[109px]">
              <WaitGauge minutes={station.waitMinutes} />
              <div className="flex gap-[20px]">
                <VehicleCard type="car" count={station.carCount} />
                <VehicleCard type="bus" count={station.busCount} />
              </div>
            </div>

            <div className="h-[200px] w-full bg-[#0A0F1E] md:h-[280px]">
              <CCTVPlayer
                streamUrl={station.cctv.streamUrl}
                isLive={station.cctv.isLive}
              />
            </div>
          </div>

          <div className="px-0 py-4 text-[14px] text-slate-500 md:px-6 md:py-3.5 md:text-[24px]">
            <span className="text-slate-700">{station.name}</span> 운영시간은{" "}
            <strong className="text-blue-700">{station.operatingHours}</strong> 입니다.
          </div>

          <div className="px-0 text-[13px] text-slate-500 md:px-6 md:text-[16px]">
            {loading && <p>대기정보 불러오는 중...</p>}
            {apiError && <p className="text-red-500">대기정보를 불러오지 못했습니다.</p>}
            {lastUpdated && !apiError && (
              <p>마지막 갱신: {new Date(lastUpdated).toLocaleString("ko-KR")}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}