"use client";

import React, { useRef, useState, useEffect } from "react";

interface AsuntoPedidoSectionProps {
  audioFile?: File | null;
  onAudioChange: (file: File | null) => void;
  archivos: File[];
  onArchivosChange: (files: File[]) => void;
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ANEXO_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_ARCHIVOS = 5;

const EXTENSIONES_PERMITIDAS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
];

const EXTENSIONES_PROHIBIDAS = [
  ".exe",
  ".bat",
  ".cmd",
  ".msi",
  ".sh",
  ".bin",
  ".js",
  ".mjs",
  ".ts",
  ".php",
  ".html",
  ".htm",
  ".vbs",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
}

function getBadgeColor(ext: string): { bg: string; text: string; label: string } {
  switch (ext) {
    case ".pdf":
      return { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "PDF" };
    case ".doc":
    case ".docx":
      return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "WORD" };
    case ".xls":
    case ".xlsx":
      return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "EXCEL" };
    case ".ppt":
    case ".pptx":
      return { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "PPT" };
    default:
      return { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", label: "DOC" };
  }
}

export function AsuntoPedidoSection({
  audioFile,
  onAudioChange,
  archivos,
  onArchivosChange,
}: AsuntoPedidoSectionProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [anexosError, setAnexosError] = useState<string | null>(null);
  const [showGrabacionAviso, setShowGrabacionAviso] = useState(false);

  // Manejar URL temporal del audio para reproducción previa
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [audioFile]);

  // Selección de archivo de audio
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = getFileExtension(file.name);
    const isMp3 = ext === ".mp3" || file.type === "audio/mpeg" || file.type === "audio/mp3";

    if (!isMp3) {
      setAudioError("Formato no válido. Solo se admiten archivos de audio en formato MP3 (.mp3).");
      if (audioInputRef.current) audioInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_AUDIO_BYTES) {
      setAudioError(`El audio excede el límite de 10 MB (${formatBytes(file.size)}).`);
      if (audioInputRef.current) audioInputRef.current.value = "";
      return;
    }

    onAudioChange(file);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleEliminarAudio = () => {
    onAudioChange(null);
    setAudioError(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // Selección de archivos adjuntos
  const handleArchivosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnexosError(null);
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const totalCount = archivos.length + newFiles.length;
    if (totalCount > MAX_ARCHIVOS) {
      setAnexosError(
        `Límite excedido. Solo se permite un máximo de ${MAX_ARCHIVOS} archivos en total (actualmente tiene ${archivos.length}).`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    for (const f of newFiles) {
      const ext = getFileExtension(f.name);

      if (EXTENSIONES_PROHIBIDAS.includes(ext)) {
        setAnexosError(
          `Archivo bloqueado por seguridad: "${f.name}". No se permiten scripts, ejecutables ni archivos comprimidos.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
        setAnexosError(
          `Formato no permitido en "${f.name}". Solo se admiten documentos PDF, Word (.doc, .docx), Excel (.xls, .xlsx) y PowerPoint (.ppt, .pptx).`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (f.size > MAX_ANEXO_BYTES) {
        setAnexosError(
          `El archivo "${f.name}" (${formatBytes(f.size)}) supera el límite individual de 25 MB.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    const currentBytes = archivos.reduce((acc, f) => acc + f.size, 0);
    const incomingBytes = newFiles.reduce((acc, f) => acc + f.size, 0);
    if (currentBytes + incomingBytes > MAX_TOTAL_BYTES) {
      setAnexosError(
        `El peso total de los archivos adjuntos (${formatBytes(
          currentBytes + incomingBytes
        )}) excedería el límite de 50 MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onArchivosChange([...archivos, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEliminarArchivo = (index: number) => {
    setAnexosError(null);
    const updated = archivos.filter((_, idx) => idx !== index);
    onArchivosChange(updated);
  };

  const totalBytesAdjuntos = archivos.reduce((acc, f) => acc + f.size, 0);
  const totalMB = totalBytesAdjuntos / (1024 * 1024);

  return (
    <div className="w-full mt-6 pt-6 border-t-2 border-gray-200 flex flex-col gap-5">
      {/* Encabezado de la sección */}
      <div className="flex flex-col gap-1">
        <h3
          className="text-xl md:text-2xl font-bold text-black"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          ASUNTO DEL PEDIDO
        </h3>
        <p className="text-xs md:text-sm text-gray-600">
          Adjunte opcionalmente un registro de audio y los documentos complementarios que respalden su trámite.
        </p>
      </div>

      {/* 1. Registro de Audio */}
      <div className="bg-gray-50/80 rounded-2xl p-4 md:p-5 border border-gray-200 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-semibold text-black flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Registro de audio
              <span className="text-xs font-normal text-gray-500">(Opcional)</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Formato admitido: <strong>MP3</strong> (Máx. 10 MB)
            </p>
          </div>

          {/* Botones de acción para audio */}
          <div className="flex items-center gap-2">
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,audio/mpeg,audio/mp3"
              onChange={handleAudioSelect}
              className="hidden"
              id="input-audio-asunto"
            />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {audioFile ? "Reemplazar audio" : "Subir archivo MP3"}
            </button>

            {/* Botón visual de grabar */}
            <button
              type="button"
              onClick={() => setShowGrabacionAviso(true)}
              className="px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all flex items-center gap-1.5 cursor-pointer group"
              title="Grabar directamente con el micrófono"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 group-hover:animate-ping" />
              Grabar audio
            </button>
          </div>
        </div>

        {/* Aviso de función de grabación directa */}
        {showGrabacionAviso && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Función de grabación en desarrollo:</strong> La grabación directa desde el navegador estará disponible próximamente. Por favor, suba su archivo de audio directamente en formato MP3 con el botón <em>&quot;Subir archivo MP3&quot;</em>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGrabacionAviso(false)}
              className="text-amber-800 hover:text-black font-bold text-sm px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error en selección de audio */}
        {audioError && (
          <p className="text-xs text-red-600 font-medium">{audioError}</p>
        )}

        {/* Reproductor y visualización de archivo cargado */}
        {audioFile && audioUrl && (
          <div className="mt-2 p-3 bg-white rounded-xl border border-gray-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                MP3
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                  {audioFile.name}
                </p>
                <p className="text-[11px] text-gray-500">{formatBytes(audioFile.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <audio controls src={audioUrl} className="h-9 w-full md:w-64 max-w-full" />
              <button
                type="button"
                onClick={handleEliminarAudio}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Archivos Adjuntos */}
      <div className="bg-gray-50/80 rounded-2xl p-4 md:p-5 border border-gray-200 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-semibold text-black flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Archivos adjuntos
              <span className="text-xs font-normal text-gray-500">(Opcional)</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Formatos: <strong>PDF, Word, Excel, PowerPoint</strong> • Máx. 5 archivos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={handleArchivosSelect}
              className="hidden"
              id="input-archivos-asunto"
            />
            <button
              type="button"
              disabled={archivos.length >= MAX_ARCHIVOS}
              onClick={() => fileInputRef.current?.click()}
              className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl bg-white border text-gray-800 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                archivos.length >= MAX_ARCHIVOS
                  ? "opacity-50 cursor-not-allowed border-gray-200"
                  : "border-gray-300 hover:bg-gray-100 hover:border-black"
              }`}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar archivos ({archivos.length}/{MAX_ARCHIVOS})
            </button>
          </div>
        </div>

        {/* Mensaje de error de anexos */}
        {anexosError && (
          <p className="text-xs text-red-600 font-medium">{anexosError}</p>
        )}

        {/* Barra de progreso por número de documentos */}
        {archivos.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Número de documentos:</span>
              <span className="font-semibold text-gray-800">
                {archivos.length} de {MAX_ARCHIVOS} documentos
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  archivos.length >= MAX_ARCHIVOS ? "bg-amber-500" : "bg-black"
                }`}
                style={{ width: `${Math.min(100, (archivos.length / MAX_ARCHIVOS) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Listado de archivos seleccionados */}
        {archivos.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {archivos.map((file, idx) => {
              const ext = getFileExtension(file.name);
              const badge = getBadgeColor(ext);
              return (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-xl border border-gray-300 flex items-center justify-between gap-3 shadow-xs hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border ${badge.bg} ${badge.text} shrink-0`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs md:text-sm text-gray-900 font-medium truncate">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-gray-500 shrink-0">
                      ({formatBytes(file.size)})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEliminarArchivo(idx)}
                    className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center font-bold text-sm cursor-pointer shrink-0"
                    title="Eliminar archivo"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
