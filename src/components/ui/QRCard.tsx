"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const QR_SIZE = 240;
const EXPORT_SIZE = 1024;
const COPIED_RESET_MS = 2500;

type QRCardProps = {
  url: string;
  slug: string;
  reference: string;
  detail?: string;
  title?: string;
  description?: string;
};

function toAbsoluteUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export function QRCard({
  url,
  slug,
  reference,
  detail,
  title,
  description,
}: QRCardProps) {
  const headingId = useId();
  const qrRef = useRef<HTMLDivElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const qrValue = toAbsoluteUrl(url);
  const caption = [reference, detail].filter(Boolean).join(" · ");

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy() {
    setError(undefined);

    try {
      await navigator.clipboard.writeText(qrValue);
    } catch {
      setCopied(false);
      setError("No pudimos copiar el enlace. Cópialo manualmente.");
      return;
    }

    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

  function handleDownload() {
    setError(undefined);

    const wrapper = qrRef.current;
    const svg = wrapper?.querySelector("svg");

    if (!wrapper || !svg) {
      setError("No pudimos generar la imagen. Inténtalo de nuevo.");
      return;
    }

    const foreground = getComputedStyle(svg).color;
    const background = getComputedStyle(wrapper).backgroundColor;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(EXPORT_SIZE));
    clone.setAttribute("height", String(EXPORT_SIZE));

    const markup = new XMLSerializer()
      .serializeToString(clone)
      .replace(/currentColor/g, foreground);

    const objectUrl = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    );

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        setError("No pudimos generar la imagen. Inténtalo de nuevo.");
        return;
      }

      context.fillStyle = background;
      context.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      context.drawImage(image, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError("No pudimos generar la imagen. Inténtalo de nuevo.");
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `qr-${slug}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("No pudimos generar la imagen. Inténtalo de nuevo.");
    };

    image.src = objectUrl;
  }

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className="flex w-full max-w-[480px] flex-col items-center gap-ds-6 rounded-lg border border-border bg-surface p-ds-7"
    >
      {title || description ? (
        <header className="flex w-full flex-col gap-ds-2 text-center">
          {title ? (
            <h2 id={headingId} className="text-24 font-bold text-text">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-16 text-text-muted">{description}</p>
          ) : null}
        </header>
      ) : null}

      <div ref={qrRef} className="rounded-md bg-surface text-primary">
        <QRCodeSVG
          value={qrValue}
          size={QR_SIZE}
          level="M"
          marginSize={4}
          bgColor="transparent"
          fgColor="currentColor"
          role="img"
          aria-label={`Código QR de ${reference}`}
        />
      </div>

      <div className="flex w-full flex-col gap-ds-2 text-center">
        <p className="break-all font-mono text-16 text-text">{url}</p>
        {caption ? <p className="text-14 text-text-muted">{caption}</p> : null}
      </div>

      <div className="flex w-full flex-col gap-ds-3">
        <Button
          variant="primary"
          icon={<Download size={20} aria-hidden="true" />}
          onClick={handleDownload}
          className="w-full"
        >
          Descargar PNG
          <span className="sr-only"> del código QR</span>
        </Button>
        <Button
          variant="secondary"
          icon={
            copied ? (
              <Check size={20} aria-hidden="true" />
            ) : (
              <Copy size={20} aria-hidden="true" />
            )
          }
          onClick={handleCopy}
          className="w-full"
        >
          {copied ? "Enlace copiado" : "Copiar enlace"}
          <span className="sr-only"> de tu consultorio</span>
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={copied ? "text-center text-14 text-success" : "sr-only"}
      >
        {copied ? "El enlace se copió al portapapeles." : ""}
      </p>

      {error ? (
        <p role="alert" className="text-center text-14 text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}