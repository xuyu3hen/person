"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import {
  addBodyShapeRecord,
  getBodyShapeRecords,
  deleteBodyShapeRecord,
  BodyShapeRecord,
} from "@/lib/bodyShapeDb";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1;

export function BodyShapeTab() {
  const [records, setRecords] = useState<BodyShapeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"timeline" | "upload" | "compare">("timeline");

  // Form states
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Compare states
  const [compareId1, setCompareId1] = useState<string>("");
  const [compareId2, setCompareId2] = useState<string>("");
  const compareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getBodyShapeRecords();
      setRecords(data);
      if (data.length >= 2) {
        setCompareId1(data[0].id);
        setCompareId2(data[1].id);
      } else if (data.length === 1) {
        setCompareId1(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load body shape records", e);
    } finally {
      setLoading(false);
    }
  }

  const applyWatermark = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Failed to get canvas context");

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Configure watermark text
          const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
          const fontSize = Math.max(16, Math.floor(img.width * 0.04));
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          
          // Add text shadow for better visibility on light backgrounds
          ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          const padding = Math.max(10, Math.floor(img.width * 0.02));
          ctx.fillText(timestamp, img.width - padding, img.height - padding);

          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject("Image load failed");
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject("File read failed");
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > MAX_PHOTOS) {
      setUploadError(`最多只能上传 ${MAX_PHOTOS} 张照片`);
      return;
    }

    const newPhotos: string[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`图片 ${file.name} 超过 5MB 限制`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setUploadError(`文件 ${file.name} 不是有效图片格式`);
        continue;
      }
      try {
        const watermarked = await applyWatermark(file);
        newPhotos.push(watermarked);
      } catch (err) {
        console.error(err);
        setUploadError(`图片 ${file.name} 处理失败`);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    // clear input
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (photos.length < MIN_PHOTOS || photos.length > MAX_PHOTOS) {
      setUploadError(`请上传 ${MIN_PHOTOS}-${MAX_PHOTOS} 张照片`);
      return;
    }
    if (description.length > 500) {
      setUploadError("描述不能超过500字");
      return;
    }

    setIsSaving(true);
    try {
      const record: BodyShapeRecord = {
        id: crypto.randomUUID(),
        date,
        description,
        photos,
        createdAt: Date.now(),
      };
      await addBodyShapeRecord(record);
      await loadRecords();
      // Reset form
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setPhotos([]);
      setView("timeline");
    } catch (e) {
      setUploadError("保存失败，请检查浏览器存储空间");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;
    await deleteBodyShapeRecord(id);
    await loadRecords();
  };

  const exportPDF = async () => {
    if (!compareRef.current) return;
    try {
      const canvas = await html2canvas(compareRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`body-shape-comparison-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
      alert("导出 PDF 失败");
    }
  };

  if (loading) {
    return <div className="p-6 text-[color:var(--muted)]">加载本地数据中...</div>;
  }

  const rec1 = records.find(r => r.id === compareId1);
  const rec2 = records.find(r => r.id === compareId2);

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
        <div className="text-lg font-semibold tracking-tight">体型记录 (本地隐私存储)</div>
        <div className="flex bg-[color:var(--panel)] p-1 rounded-lg border border-[color:var(--border)]">
          <button
            onClick={() => setView("timeline")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === "timeline" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] text-[color:var(--muted)]"}`}
          >
            时间轴
          </button>
          <button
            onClick={() => setView("upload")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === "upload" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] text-[color:var(--muted)]"}`}
          >
            新增记录
          </button>
          <button
            onClick={() => setView("compare")}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${view === "compare" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] text-[color:var(--muted)]"}`}
          >
            对比分析
          </button>
        </div>
      </div>

      {/* Upload View */}
      {view === "upload" && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">记录日期</label>
              <input
                type="date"
                max={format(new Date(), "yyyy-MM-dd")}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">上传照片 ({photos.length}/{MAX_PHOTOS})</label>
              <input
                type="file"
                multiple
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[color:var(--accent)] file:text-white hover:file:bg-opacity-80"
              />
              <span className="text-xs text-[color:var(--muted)]">单张最大5MB，上传后自动添加日期水印</span>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((src, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[color:var(--border)] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除照片"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">变化描述 ({description.length}/500)</label>
            <textarea
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 min-h-[120px]"
              placeholder="记录一下近期的饮食、训练情况或体型变化..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}

          <button
            className="button buttonPrimary self-start px-8"
            onClick={handleSave}
            disabled={isSaving || photos.length === 0}
          >
            {isSaving ? "处理并保存中..." : "保存体型记录"}
          </button>
        </div>
      )}

      {/* Timeline View */}
      {view === "timeline" && (
        <div className="flex flex-col gap-8">
          {records.length === 0 ? (
            <div className="text-center text-[color:var(--muted)] py-10">暂无体型记录，快去上传第一天的变化吧！</div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex flex-col gap-3 border border-[color:var(--border)] rounded-2xl p-5 bg-[color:color-mix(in_srgb,var(--panel)_30%,transparent)]">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg tracking-tight">{record.date}</div>
                  <button className="text-xs text-red-500 hover:underline" onClick={() => handleDelete(record.id)}>删除</button>
                </div>
                {record.description && (
                  <p className="text-sm text-[color:var(--text)] whitespace-pre-wrap">{record.description}</p>
                )}
                {/* Horizontal scrollable photos */}
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
                  {record.photos.map((src, i) => (
                    <div key={i} className="flex-none w-[200px] sm:w-[240px] aspect-[3/4] rounded-xl overflow-hidden snap-center border border-[color:var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${record.date}-${i}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Compare View */}
      {view === "compare" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">对比基准 (Before)</label>
              <select
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                value={compareId1}
                onChange={(e) => setCompareId1(e.target.value)}
              >
                <option value="">请选择记录</option>
                {records.map(r => <option key={r.id} value={r.id}>{r.date}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium">对比对象 (After)</label>
              <select
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                value={compareId2}
                onChange={(e) => setCompareId2(e.target.value)}
              >
                <option value="">请选择记录</option>
                {records.map(r => <option key={r.id} value={r.id}>{r.date}</option>)}
              </select>
            </div>
            <button className="button buttonPrimary" onClick={exportPDF} disabled={!rec1 || !rec2}>
              导出对比报告 PDF
            </button>
          </div>

          {rec1 && rec2 ? (
            <div ref={compareRef} className="bg-[color:var(--bg)] p-4 rounded-2xl border border-[color:var(--border)] flex flex-col gap-6">
              <div className="text-center font-bold text-xl tracking-tight pb-2 border-b border-[color:var(--border)]">
                体型变化对比 ({rec1.date} VS {rec2.date})
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div className="flex flex-col gap-3">
                  <div className="font-semibold text-center">{rec1.date} (Before)</div>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--panel)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rec1.photos[0]} className="w-full h-full object-cover" alt="Before" />
                  </div>
                  {rec1.description && (
                    <div className="text-xs text-[color:var(--muted)] p-3 bg-[color:var(--panel)] rounded-lg">
                      {rec1.description}
                    </div>
                  )}
                </div>

                {/* After */}
                <div className="flex flex-col gap-3">
                  <div className="font-semibold text-center">{rec2.date} (After)</div>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--panel)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rec2.photos[0]} className="w-full h-full object-cover" alt="After" />
                  </div>
                  {rec2.description && (
                    <div className="text-xs text-[color:var(--muted)] p-3 bg-[color:var(--panel)] rounded-lg">
                      {rec2.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-[color:var(--muted)] py-10">请选择两组记录进行对比</div>
          )}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
