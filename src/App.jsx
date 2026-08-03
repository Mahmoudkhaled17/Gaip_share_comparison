import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, COMPARISONS_TABLE } from './config.js';
import Viewer from './Viewer.jsx';
import { Loader2, MapPin, AlertTriangle, Layers } from 'lucide-react';

export default function App() {
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState('loading');

  const layerId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    const fetchLayer = async () => {
      if (!layerId) {
        setStatus('no-id');
        return;
      }
      setStatus('loading');
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/${COMPARISONS_TABLE}?Id=eq.${encodeURIComponent(layerId)}&select=*`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Accept: 'application/json',
            },
          }
        );
        if (!res.ok) {
          setStatus('error');
          return;
        }
        const rows = await res.json();
        if (!rows || rows.length === 0) {
          setStatus('not-found');
          return;
        }
        setRecord(rows[0]);
        setStatus('ready');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };
    fetchLayer();
  }, [layerId]);

  if (status === 'no-id') {
    return (
      <Shell>
        <MessageBox
          icon={<Layers className="w-6 h-6" />}
          title="رابط غير صالح"
          desc="هذا الرابط لا يحتوي على معرّف تقرير. استخدم رابط المشاركة الصحيح مثل: ?id=123"
        />
      </Shell>
    );
  }

  if (status === 'loading') {
    return (
      <Shell>
        <div className="h-56 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-bold">جاري تحميل التقرير المشترك...</p>
        </div>
      </Shell>
    );
  }

  if (status === 'not-found') {
    return (
      <Shell>
        <MessageBox
          icon={<MapPin className="w-6 h-6" />}
          title="التقرير غير موجود"
          desc="لا يوجد سجل مطابق لهذا المعرّف. تأكد من الرابط أو اطلب من المشارك إعادة المشاركة."
        />
      </Shell>
    );
  }

  if (status === 'error') {
    return (
      <Shell>
        <MessageBox
          icon={<AlertTriangle className="w-6 h-6" />}
          title="خطأ في الاتصال"
          desc="تعذر الوصول إلى قاعدة البيانات. تحقق من اتصالك بالإنترنت أو من إعدادات المشروع."
        />
      </Shell>
    );
  }

  return <Viewer record={record} />;
}

function Shell({ children }) {
  return (
    <div className="h-full bg-slate-950 font-sans text-slate-200 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-wide">
              GAIP Shared Comparison Viewer
            </h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function MessageBox({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-4">
      <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-2xl text-slate-300">
        {icon}
      </div>
      <p className="text-sm font-black text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
