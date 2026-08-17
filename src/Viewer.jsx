import React, { useState, useEffect, useMemo } from 'react';
import ViewerMap from './ViewerMap.jsx';
import { Wheat, Sprout, Building2, Activity, Percent, User, CalendarDays, Layers, X, Table2 } from 'lucide-react';

const YEAR_RE = /^Year_?(\d{4})$/;

export default function Viewer({ record }) {
  const [activeLayer, setActiveLayer] = useState('crop_type');
  const [opacitySlider, setOpacitySlider] = useState(0.25);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const opacity = 1 - opacitySlider;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rawYears = (record.years && typeof record.years === 'object') ? record.years : {};

  const years = useMemo(() => {
    const map = {};
    Object.entries(rawYears).forEach(([key, value]) => {
      const m = key.match(YEAR_RE);
      const year = m ? m[1] : key;
      if (year && value && typeof value === 'object') map[year] = value;
    });
    return map;
  }, [rawYears]);

  const yearList = Object.keys(years).sort((a, b) => parseInt(b) - parseInt(a));
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    if (!selectedYear && yearList.length > 0) setSelectedYear(yearList[0]);
  }, [yearList, selectedYear]);

  const current = selectedYear ? years[selectedYear] : null;
  const cropAreas = current?.crop_areas_feddans || {};
  const healthAreas = current?.crop_health_feddans || {};

  const wheat = cropAreas.Wheat_1 || cropAreas.wheat || 0;
  const corn = cropAreas.Corn_0 || cropAreas.corn || 0;
  const nonAgri = cropAreas.Non_agricultural_2 || cropAreas.non_agricultural || 0;
  const total = wheat + corn + nonAgri || 1;
  const wheatPct = ((wheat / total) * 100).toFixed(1);
  const cornPct = ((corn / total) * 100).toFixed(1);
  const nonAgriPct = ((nonAgri / total) * 100).toFixed(1);

  const highH = healthAreas.High_Quality_Green || 0;
  const medH = healthAreas.Medium_Quality_Yellow || 0;
  const lowH = healthAreas.Low_Quality_Red || 0;
  const totalH = highH + medH + lowH || 1;
  const healthIndex = Math.round(((highH * 100) + (medH * 60) + (lowH * 20)) / totalH);
  const dominantCrop = wheat >= corn ? 'Wheat' : 'Corn';

  const tableRows = yearList.map(year => {
    const y = years[year];
    const a = y.crop_areas_feddans || {};
    const h = y.crop_health_feddans || {};
    const w = a.Wheat_1 || a.wheat || 0;
    const c = a.Corn_0 || a.corn || 0;
    const n = a.Non_agricultural_2 || a.non_agricultural || 0;
    const high = h.High_Quality_Green || 0;
    const med = h.Medium_Quality_Yellow || 0;
    const low = h.Low_Quality_Red || 0;
    const totalHRow = high + med + low || 1;
    return {
      year,
      wheat: w,
      corn: c,
      nonAgri: n,
      totalArea: w + c + n,
      high,
      med,
      low,
      healthIndex: Math.round(((high * 100) + (med * 60) + (low * 20)) / totalHRow)
    };
  });

  const startResize = (e) => {
    e.preventDefault();
    const startWidth = sidebarWidth;
    const startX = e.clientX;
    const doDrag = (move) => {
      const deltaX = startX - move.clientX;
      const newWidth = startWidth + deltaX;
      if (newWidth > 320 && newWidth < 700) setSidebarWidth(newWidth);
    };
    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  return (
    <div className="h-full flex bg-[#FBF5DD] font-sans text-[#594545] overflow-hidden">
      <div className="flex-1 h-full relative p-3">
        <div className="h-full relative rounded-2xl border border-[#D4CD9B] bg-[#fff8ea]/60 shadow-md overflow-hidden">
          <ViewerMap
            yearTiles={years}
            selectedYear={selectedYear}
            activeLayer={activeLayer}
            opacity={opacity}
            bounds={record.bounds}
          />

          <div className="absolute top-16 lg:top-3 left-3 z-40 flex items-center gap-2 flex-wrap max-w-[90%]">
            <span className="bg-[#fff8ea]/90 backdrop-blur-sm text-[13px] font-bold text-[#815b5b] px-2 py-1 rounded-lg border border-[#D4CD9B] shadow-sm uppercase tracking-wider font-mono">
              Interactive Context Map
            </span>
            {yearList.length > 0 && (
              <div className="flex bg-[#fff8ea]/90 backdrop-blur-sm rounded-lg border border-[#D4CD9B] shadow-sm overflow-hidden">
                {yearList.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                      selectedYear === year ? 'bg-[#815b5b] text-white' : 'text-[#9e7676] hover:text-[#594545]'
                    }`}
                  >
                    موسم {year}
                  </button>
                ))}
              </div>
            )}
            <div className="flex bg-[#fff8ea]/90 backdrop-blur-sm rounded-lg border border-[#D4CD9B] shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveLayer('crop_type')}
                className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                  activeLayer === 'crop_type' ? 'bg-[#815b5b] text-white' : 'text-[#9e7676] hover:text-[#594545]'
                }`}
              >
                تصنيف
              </button>
              <button
                onClick={() => setActiveLayer('crop_health')}
                className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                  activeLayer === 'crop_health' ? 'bg-[#9e7676] text-white' : 'text-[#9e7676] hover:text-[#594545]'
                }`}
              >
                صحة
              </button>
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="absolute top-0 inset-x-0 z-40 bg-[#fff8ea]/95 backdrop-blur-md border-b border-[#D4CD9B] flex items-center justify-between px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#815b5b] animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-[#594545] truncate">{record.Layer_Name}</p>
                <p className="text-[9px] text-[#9e7676] font-mono uppercase tracking-widest">GAIP Comparison Viewer</p>
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 bg-[#815b5b] hover:bg-[#594545] text-white px-3.5 py-2 rounded-xl text-[11px] font-black shrink-0 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              البيانات والمؤشرات
            </button>
          </div>
        )}

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="lg:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-[#fff8ea]/95 backdrop-blur-md border border-[#815b5b]/40 text-[#594545] px-5 py-3 rounded-2xl shadow-xl text-xs font-black"
          >
            <Layers className="w-4 h-4 text-[#815b5b]" />
            البيانات والمؤشرات
          </button>
        )}
      </div>

      <div
        style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        className={`border-r border-[#D4CD9B] bg-[#FBF5DD]/95 backdrop-blur-lg h-full flex flex-col shrink-0 text-right overflow-y-auto ${
          isMobile
            ? `fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative'
        }`}
        dir="rtl"
      >
        <div
          onMouseDown={startResize}
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#D4CD9B] bg-[#D4CD9B]/50 transition-colors z-50 hidden lg:block"
        />

        {isMobile && (
          <button
            onClick={() => setPanelOpen(false)}
            className="absolute top-4 left-4 z-50 bg-[#fff8ea] hover:bg-[#D4CD9B] border border-[#D4CD9B] text-[#594545] p-2 rounded-xl transition-colors shadow-sm"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 border-b border-[#D4CD9B] bg-[#fff8ea]">
          <h2 className="text-lg font-black text-[#594545] mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#815b5b] animate-pulse" />
            مقارنة المواسم المشتركة
          </h2>
          <p className="text-[10px] text-[#9e7676] uppercase tracking-widest font-mono">
            Multi-Year Agricultural Telemetry Report
          </p>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#815b5b]">
              <User className="w-3.5 h-3.5 text-[#9e7676] shrink-0" />
              <span className="font-bold">{record.creator_name || 'مستخدم مجهول'}</span>
            </div>
            <div className="flex items-center gap-2 text-[#9e7676]">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono font-bold">
                {record.Classification_Start_Date} ← {record.Classification_End_Date}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-[#D4CD9B] space-y-4">
          <h3 className="text-xs font-black text-[#815b5b] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            اختيار الطبقة (Layer)
          </h3>

          {yearList.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#815b5b] uppercase mb-2">اختيار الموسم (Season)</p>
              <div className="flex flex-wrap gap-1.5">
                {yearList.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      selectedYear === year
                        ? 'bg-[#815b5b] text-white border-[#815b5b]'
                        : 'bg-[#fff8ea] text-[#9e7676] border-[#D4CD9B] hover:text-[#594545] hover:border-[#815b5b]'
                    }`}
                  >
                    موسم {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-[#815b5b] uppercase mb-2">نوع الطبقة (Type)</p>
            <div className="flex rounded-lg border border-[#D4CD9B] overflow-hidden">
              <button
                onClick={() => setActiveLayer('crop_type')}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  activeLayer === 'crop_type' ? 'bg-[#815b5b] text-white' : 'bg-[#fff8ea] text-[#9e7676] hover:text-[#594545]'
                }`}
              >
                تصنيف
              </button>
              <button
                onClick={() => setActiveLayer('crop_health')}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  activeLayer === 'crop_health' ? 'bg-[#9e7676] text-white' : 'bg-[#fff8ea] text-[#9e7676] hover:text-[#594545]'
                }`}
              >
                صحة
              </button>
            </div>
          </div>

          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            activeLayer === 'crop_type'
              ? 'bg-[#815b5b]/10 border-[#815b5b]'
              : 'bg-[#fff8ea] border-[#D4CD9B] hover:border-[#815b5b]'
          }`}>
            <input
              type="radio"
              name="raster-layer"
              value="crop_type"
              checked={activeLayer === 'crop_type'}
              onChange={(e) => e.target.checked && setActiveLayer('crop_type')}
              className="accent-[#815b5b] w-4 h-4 shrink-0"
            />
            <div className="flex-1">
              <p className="text-xs font-black text-[#594545]">تصنيف المحاصيل</p>
              <p className="text-[10px] text-[#9e7676] font-sans font-bold">Crop Type Classification</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            activeLayer === 'crop_health'
              ? 'bg-[#9e7676]/10 border-[#9e7676]'
              : 'bg-[#fff8ea] border-[#D4CD9B] hover:border-[#815b5b]'
          }`}>
            <input
              type="radio"
              name="raster-layer"
              value="crop_health"
              checked={activeLayer === 'crop_health'}
              onChange={(e) => e.target.checked && setActiveLayer('crop_health')}
              className="accent-[#9e7676] w-4 h-4 shrink-0"
            />
            <div className="flex-1">
              <p className="text-xs font-black text-[#594545]">صحة المحاصيل</p>
              <p className="text-[10px] text-[#9e7676] font-sans font-bold">Crop Health (NDVI)</p>
            </div>
          </label>

          <div className="border-t border-[#D4CD9B] pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#815b5b] uppercase">الشفافية (Opacity)</span>
              <span className="text-xs font-black font-mono text-[#594545]">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacitySlider}
              onChange={(e) => setOpacitySlider(parseFloat(e.target.value))}
              className="w-full accent-[#815b5b]"
            />
            <p className="text-[9px] text-[#9e7676] mt-1 text-left font-mono font-bold">
              left = visible · right = faded
            </p>
          </div>

          <div className="border-t border-[#D4CD9B] pt-3 mt-1">
            <p className="text-[10px] font-bold text-[#815b5b] uppercase mb-2">مفتاح الألوان (Legend)</p>
            {activeLayer === 'crop_type' ? (
              <div className="space-y-1.5 text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#815b5b] inline-block" />
                  <span className="text-[#594545]">قمح (Wheat)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#594545] inline-block" />
                  <span className="text-[#594545]">ذرة (Corn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#9e7676] inline-block" />
                  <span className="text-[#594545]">غير زراعي (Buildings)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
                  <span className="text-[#594545]">جودة ممتازة (High)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />
                  <span className="text-[#594545]">جودة متوسطة (Medium)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                  <span className="text-[#594545]">جودة ضعيفة (Low)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#815b5b] uppercase tracking-wider border-b border-[#D4CD9B] pb-2">
              📊 مؤشرات الإنتاج لموسم {selectedYear || '—'}
            </h3>

            <div className="bg-[#fff8ea] border border-[#D4CD9B] p-4 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#815b5b]" />
              <span className="text-[10px] font-bold text-[#9e7676] uppercase tracking-widest">TOTAL AREA</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-[#594545] tracking-tight font-mono">
                  {Math.round(total)}
                </span>
                <span className="text-xs font-bold text-[#815b5b] uppercase tracking-wider">feddan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#fff8ea] border border-[#D4CD9B] p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <span className="text-[10px] font-bold text-[#9e7676] uppercase tracking-widest">CROP TYPE</span>
                <div className="mt-2 flex items-center gap-2">
                  {dominantCrop === 'Wheat' ? (
                    <Wheat className="w-4 h-4 text-[#815b5b] shrink-0" />
                  ) : (
                    <Sprout className="w-4 h-4 text-[#594545] shrink-0" />
                  )}
                  <span className="text-lg font-black text-[#594545]">{dominantCrop}</span>
                </div>
              </div>

              <div className="bg-[#fff8ea] border border-[#D4CD9B] p-4 rounded-2xl relative overflow-hidden shadow-sm">
                <span className="text-[10px] font-bold text-[#9e7676] uppercase tracking-widest">HEALTH INDEX</span>
                <div className="mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#815b5b] shrink-0" />
                  <span className={`text-lg font-black font-mono ${
                    healthIndex > 75 ? 'text-[#306D29]' : healthIndex > 45 ? 'text-[#d97706]' : 'text-[#dc2626]'
                  }`}>
                    {healthIndex}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#fff8ea] border border-[#D4CD9B] p-4 rounded-2xl space-y-3 shadow-sm">
              <div className="w-full bg-[#FBF5DD] h-3 rounded-full overflow-hidden flex border border-[#D4CD9B]">
                <div style={{ width: `${wheatPct}%` }} className="bg-[#594545] h-full" />
                <div style={{ width: `${cornPct}%` }} className="bg-[#815b5b] h-full" />
                <div style={{ width: `${nonAgriPct}%` }} className="bg-[#9e7676] h-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="space-y-1 text-center">
                  <span className="text-[#594545] font-black block">{wheatPct}%</span>
                  <span className="text-[#815b5b] font-bold font-sans flex items-center justify-center gap-1"><Wheat className="w-3 h-3" /> قمح</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-[#815b5b] font-black block">{cornPct}%</span>
                  <span className="text-[#815b5b] font-bold font-sans flex items-center justify-center gap-1"><Sprout className="w-3 h-3" /> ذرة</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-[#9e7676] font-black block">{nonAgriPct}%</span>
                  <span className="text-[#815b5b] font-bold font-sans flex items-center justify-center gap-1"><Building2 className="w-3 h-3" /> مباني</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#815b5b] uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#9e7676]" />
              مؤشر جودة صحة النبات (NDVI) — {selectedYear || '—'}
            </h3>
            <div className="bg-[#fff8ea] border border-[#D4CD9B] p-4 rounded-2xl space-y-2.5 shadow-sm">
              <div className="w-full bg-[#FBF5DD] h-3 rounded-full overflow-hidden border border-[#D4CD9B]">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    healthIndex > 75 ? 'bg-gradient-to-l from-[#815b5b] to-[#594545]' :
                    healthIndex > 45 ? 'bg-gradient-to-l from-[#9e7676] to-[#815b5b]' :
                    'bg-gradient-to-l from-[#D4CD9B] to-[#9e7676]'
                  }`}
                  style={{ width: `${healthIndex}%` }}
                />
              </div>
              <div className="space-y-2 text-xs font-mono font-bold border-t border-[#D4CD9B] pt-3">
                <div className="flex justify-between">
                  <span className="text-[#594545]">🟢 جودة ممتازة:</span>
                  <span className="text-[#815b5b]">{highH.toFixed(1)} ف ({((highH / totalH) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#594545]">🟡 جودة متوسطة:</span>
                  <span className="text-[#815b5b]">{medH.toFixed(1)} ف ({((medH / totalH) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#594545]">🔴 جودة ضعيفة:</span>
                  <span className="text-[#815b5b]">{lowH.toFixed(1)} ف ({((lowH / totalH) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {tableRows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#815b5b] uppercase tracking-wider flex items-center gap-1.5">
                <Table2 className="w-4 h-4 text-[#815b5b]" />
                جداول المقارنة بين المواسم (فدان)
              </h3>

              <div className="bg-[#fff8ea] border border-[#D4CD9B] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#FBF5DD] px-4 py-2.5 border-b border-[#D4CD9B] flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#815b5b] rounded-full" />
                  <p className="text-[11px] font-black text-[#594545]">تغير هيكل المحاصيل والمساحة</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#D4CD9B] text-[#815b5b] font-black text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-2">الموسم</th>
                        <th className="py-2 px-2 text-[#306D29]">🌾 قمح</th>
                        <th className="py-2 px-2 text-[#d97706]">🌽 ذرة</th>
                        <th className="py-2 px-2 text-[#9e7676]">🏢 غير زراعي</th>
                        <th className="py-2 px-2 text-[#815b5b]">الكل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.year}
                          onClick={() => setSelectedYear(row.year)}
                          className={`border-b border-[#D4CD9B]/60 cursor-pointer transition-colors ${
                            selectedYear === row.year ? 'bg-[#815b5b]/10' : 'hover:bg-[#FBF5DD]'
                          }`}
                        >
                          <td className="py-2 px-2 font-black text-[#594545]">موسم {row.year}</td>
                          <td className="py-2 px-2 text-[#594545] font-bold font-mono">{row.wheat.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#594545] font-bold font-mono">{row.corn.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#594545] font-bold font-mono">{row.nonAgri.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#815b5b] font-black font-mono">{row.totalArea.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#fff8ea] border border-[#D4CD9B] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#FBF5DD] px-4 py-2.5 border-b border-[#D4CD9B] flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#9e7676] rounded-full" />
                  <p className="text-[11px] font-black text-[#594545]">مقارنة صحة النبات (NDVI)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#D4CD9B] text-[#815b5b] font-black text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-2">الموسم</th>
                        <th className="py-2 px-2 text-[#306D29]">🟢 ممتاز</th>
                        <th className="py-2 px-2 text-[#d97706]">🟡 متوسط</th>
                        <th className="py-2 px-2 text-[#dc2626]">🔴 ضعيف</th>
                        <th className="py-2 px-2 text-[#815b5b]">المؤشر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.year}
                          onClick={() => setSelectedYear(row.year)}
                          className={`border-b border-[#D4CD9B]/60 cursor-pointer transition-colors ${
                            selectedYear === row.year ? 'bg-[#9e7676]/10' : 'hover:bg-[#FBF5DD]'
                          }`}
                        >
                          <td className="py-2 px-2 font-black text-[#594545]">موسم {row.year}</td>
                          <td className="py-2 px-2 text-[#306D29] font-bold font-mono">{row.high.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#d97706] font-bold font-mono">{row.med.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#dc2626] font-bold font-mono">{row.low.toFixed(1)}</td>
                          <td className="py-2 px-2 text-[#815b5b] font-black font-mono">{row.healthIndex}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
