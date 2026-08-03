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
    <div className="h-full flex bg-slate-950 font-sans text-slate-200 overflow-hidden">
      <div className="flex-1 h-full relative p-3">
        <div className="h-full relative rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
          <ViewerMap
            yearTiles={years}
            selectedYear={selectedYear}
            activeLayer={activeLayer}
            opacity={opacity}
            bounds={record.bounds}
          />

          <div className="absolute top-16 lg:top-3 left-3 z-40 flex items-center gap-2 flex-wrap max-w-[90%]">
            <span className="bg-slate-900/90 backdrop-blur-sm text-[13px] font-bold text-slate-400 px-2 py-1 rounded-lg border border-slate-800 shadow-md uppercase tracking-wider font-mono">
              Interactive Context Map
            </span>
            {yearList.length > 0 && (
              <div className="flex bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 shadow-md overflow-hidden">
                {yearList.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                      selectedYear === year ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    موسم {year}
                  </button>
                ))}
              </div>
            )}
            <div className="flex bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 shadow-md overflow-hidden">
              <button
                onClick={() => setActiveLayer('crop_type')}
                className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                  activeLayer === 'crop_type' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                تصنيف
              </button>
              <button
                onClick={() => setActiveLayer('crop_health')}
                className={`px-2.5 py-1 text-[13px] font-bold transition-colors ${
                  activeLayer === 'crop_health' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                صحة
              </button>
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="absolute top-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-100 truncate">{record.Layer_Name}</p>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">GAIP Comparison Viewer</p>
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-[11px] font-black shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              البيانات والمؤشرات
            </button>
          </div>
        )}

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="lg:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-slate-100 px-5 py-3 rounded-2xl shadow-2xl text-xs font-black"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            البيانات والمؤشرات
          </button>
        )}
      </div>

      <div
        style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        className={`border-r border-slate-900 bg-slate-950/90 backdrop-blur-lg h-full flex flex-col shrink-0 text-right overflow-y-auto ${
          isMobile
            ? `fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative'
        }`}
        dir="rtl"
      >
        <div
          onMouseDown={startResize}
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-red-500/50 bg-slate-800 transition-colors z-50 hidden lg:block"
        />

        {isMobile && (
          <button
            onClick={() => setPanelOpen(false)}
            className="absolute top-4 left-4 z-50 bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 border-b border-slate-900 bg-slate-950/60">
          <h2 className="text-lg font-black text-slate-100 mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            مقارنة المواسم المشتركة
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            Multi-Year Agricultural Telemetry Report
          </p>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold">{record.creator_name || 'مستخدم مجهول'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono">
                {record.Classification_Start_Date} ← {record.Classification_End_Date}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-slate-900 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            اختيار الطبقة (Layer)
          </h3>

          {yearList.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">اختيار الموسم (Season)</p>
              <div className="flex flex-wrap gap-1.5">
                {yearList.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      selectedYear === year
                        ? 'bg-emerald-700 text-white border-emerald-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    موسم {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">نوع الطبقة (Type)</p>
            <div className="flex rounded-lg border border-slate-800 overflow-hidden">
              <button
                onClick={() => setActiveLayer('crop_type')}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  activeLayer === 'crop_type' ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                تصنيف
              </button>
              <button
                onClick={() => setActiveLayer('crop_health')}
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  activeLayer === 'crop_health' ? 'bg-cyan-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                صحة
              </button>
            </div>
          </div>

          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            activeLayer === 'crop_type'
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}>
            <input
              type="radio"
              name="raster-layer"
              value="crop_type"
              checked={activeLayer === 'crop_type'}
              onChange={(e) => e.target.checked && setActiveLayer('crop_type')}
              className="accent-emerald-500 w-4 h-4 shrink-0"
            />
            <div className="flex-1">
              <p className="text-xs font-black text-slate-100">تصنيف المحاصيل</p>
              <p className="text-[10px] text-slate-500 font-sans">Crop Type Classification</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            activeLayer === 'crop_health'
              ? 'bg-cyan-950/40 border-cyan-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}>
            <input
              type="radio"
              name="raster-layer"
              value="crop_health"
              checked={activeLayer === 'crop_health'}
              onChange={(e) => e.target.checked && setActiveLayer('crop_health')}
              className="accent-cyan-500 w-4 h-4 shrink-0"
            />
            <div className="flex-1">
              <p className="text-xs font-black text-slate-100">صحة المحاصيل</p>
              <p className="text-[10px] text-slate-500 font-sans">Crop Health (NDVI)</p>
            </div>
          </label>

          <div className="border-t border-slate-800/60 pt-3 mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">الشفافية (Opacity)</span>
              <span className="text-xs font-black font-mono text-emerald-400">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacitySlider}
              onChange={(e) => setOpacitySlider(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="text-[9px] text-slate-600 mt-1 text-left font-mono">
              left = visible · right = faded
            </p>
          </div>

          <div className="border-t border-slate-800/60 pt-3 mt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">مفتاح الألوان (Legend)</p>
            {activeLayer === 'crop_type' ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-300">قمح (Wheat)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <span className="text-slate-300">ذرة (Corn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
                  <span className="text-slate-300">غير زراعي (Buildings)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                  <span className="text-slate-300">جودة ممتازة (High)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />
                  <span className="text-slate-300">جودة متوسطة (Medium)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                  <span className="text-slate-300">جودة ضعيفة (Low)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              📊 مؤشرات الإنتاج لموسم {selectedYear || '—'}
            </h3>

            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL AREA</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-slate-100 tracking-tight font-mono">
                  {Math.round(total)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">feddan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl relative overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CROP TYPE</span>
                <div className="mt-2 flex items-center gap-2">
                  {dominantCrop === 'Wheat' ? (
                    <Wheat className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-lg font-black text-slate-100">{dominantCrop}</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl relative overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HEALTH INDEX</span>
                <div className="mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className={`text-lg font-black font-mono ${
                    healthIndex > 75 ? 'text-emerald-400' : healthIndex > 45 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {healthIndex}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex">
                <div style={{ width: `${wheatPct}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${cornPct}%` }} className="bg-amber-500 h-full" />
                <div style={{ width: `${nonAgriPct}%` }} className="bg-slate-700 h-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="space-y-1 text-center">
                  <span className="text-emerald-400 font-black block">{wheatPct}%</span>
                  <span className="text-slate-500 font-sans flex items-center justify-center gap-1"><Wheat className="w-3 h-3" /> قمح</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-amber-400 font-black block">{cornPct}%</span>
                  <span className="text-slate-500 font-sans flex items-center justify-center gap-1"><Sprout className="w-3 h-3" /> ذرة</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-slate-400 font-black block">{nonAgriPct}%</span>
                  <span className="text-slate-500 font-sans flex items-center justify-center gap-1"><Building2 className="w-3 h-3" /> مباني</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-indigo-400" />
              مؤشر جودة صحة النبات (NDVI) — {selectedYear || '—'}
            </h3>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    healthIndex > 75 ? 'bg-gradient-to-l from-emerald-500 to-teal-400' :
                    healthIndex > 45 ? 'bg-gradient-to-l from-yellow-500 to-amber-400' :
                    'bg-gradient-to-l from-red-500 to-orange-400'
                  }`}
                  style={{ width: `${healthIndex}%` }}
                />
              </div>
              <div className="space-y-2 text-xs font-mono border-t border-slate-800/60 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">🟢 جودة ممتازة:</span>
                  <span className="text-slate-200 font-bold">{highH.toFixed(1)} ف ({((highH / totalH) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🟡 جودة متوسطة:</span>
                  <span className="text-slate-200 font-bold">{medH.toFixed(1)} ف ({((medH / totalH) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🔴 جودة ضعيفة:</span>
                  <span className="text-slate-200 font-bold">{lowH.toFixed(1)} ف ({((lowH / totalH) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {tableRows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Table2 className="w-4 h-4 text-emerald-400" />
                جداول المقارنة بين المواسم (فدان)
              </h3>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <p className="text-[11px] font-black text-slate-300">تغير هيكل المحاصيل والمساحة</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-2">الموسم</th>
                        <th className="py-2 px-2 text-emerald-400">🌾 قمح</th>
                        <th className="py-2 px-2 text-amber-400">🌽 ذرة</th>
                        <th className="py-2 px-2 text-slate-400">🏢 غير زراعي</th>
                        <th className="py-2 px-2 text-cyan-400">الكل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.year}
                          onClick={() => setSelectedYear(row.year)}
                          className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                            selectedYear === row.year ? 'bg-emerald-950/40' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2 px-2 font-black text-slate-200">موسم {row.year}</td>
                          <td className="py-2 px-2 text-slate-300 font-mono">{row.wheat.toFixed(1)}</td>
                          <td className="py-2 px-2 text-slate-300 font-mono">{row.corn.toFixed(1)}</td>
                          <td className="py-2 px-2 text-slate-300 font-mono">{row.nonAgri.toFixed(1)}</td>
                          <td className="py-2 px-2 text-cyan-400 font-black font-mono">{row.totalArea.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <p className="text-[11px] font-black text-slate-300">مقارنة صحة النبات (NDVI)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-wider">
                        <th className="py-2 px-2">الموسم</th>
                        <th className="py-2 px-2 text-emerald-400">🟢 ممتاز</th>
                        <th className="py-2 px-2 text-yellow-400">🟡 متوسط</th>
                        <th className="py-2 px-2 text-red-400">🔴 ضعيف</th>
                        <th className="py-2 px-2 text-cyan-400">المؤشر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr
                          key={row.year}
                          onClick={() => setSelectedYear(row.year)}
                          className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                            selectedYear === row.year ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2 px-2 font-black text-slate-200">موسم {row.year}</td>
                          <td className="py-2 px-2 text-emerald-400 font-bold font-mono">{row.high.toFixed(1)}</td>
                          <td className="py-2 px-2 text-yellow-400 font-bold font-mono">{row.med.toFixed(1)}</td>
                          <td className="py-2 px-2 text-red-400 font-bold font-mono">{row.low.toFixed(1)}</td>
                          <td className="py-2 px-2 text-cyan-400 font-black font-mono">{row.healthIndex}%</td>
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
