import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const EXPORT_COLOR_PROPS = [
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'box-shadow',
  'caret-color',
  'color',
  'fill',
  'outline-color',
  'stroke',
  'text-decoration-color',
] as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const parseCssNumber = (value: string | undefined, percentScale = 1) => {
  if (!value || value === 'none') return 0;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;

  return value.endsWith('%') ? (parsed / 100) * percentScale : parsed;
};

const serializeRgbColor = (rgb: string, alphaRaw?: string) => {
  if (!alphaRaw) return `rgb(${rgb})`;

  const alpha = parseCssNumber(alphaRaw);
  return `rgb(${rgb} / ${clamp(alpha)})`;
};

const oklabToRgb = (lightness: number, a: number, b: number) => {
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  const linearR = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const linearG = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const linearB = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const encode = (channel: number) => {
    const safeChannel = clamp(channel);
    const srgb = safeChannel <= 0.0031308
      ? 12.92 * safeChannel
      : 1.055 * safeChannel ** (1 / 2.4) - 0.055;

    return Math.round(clamp(srgb) * 255);
  };

  return `${encode(linearR)} ${encode(linearG)} ${encode(linearB)}`;
};

const splitColorFunctionParts = (match: string) => {
  const value = match.slice(match.indexOf('(') + 1, -1).trim();
  const parts = value.replace(/\s*\/\s*/g, ' / ').split(/\s+/);
  const alphaIndex = parts.indexOf('/');

  return {
    parts,
    alphaRaw: alphaIndex >= 0 ? parts[alphaIndex + 1] : undefined,
  };
};

const normalizeOklchColor = (match: string) => {
  const { parts, alphaRaw } = splitColorFunctionParts(match);
  const lightness = parseCssNumber(parts[0], 1);
  const chroma = parseCssNumber(parts[1], 0.4);
  const hue = parseCssNumber(parts[2]);
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const rgb = oklabToRgb(lightness, a, b);

  return serializeRgbColor(rgb, alphaRaw);
};

const normalizeOklabColor = (match: string) => {
  const { parts, alphaRaw } = splitColorFunctionParts(match);
  const lightness = parseCssNumber(parts[0], 1);
  const a = parseCssNumber(parts[1], 0.4);
  const b = parseCssNumber(parts[2], 0.4);
  const rgb = oklabToRgb(lightness, a, b);

  return serializeRgbColor(rgb, alphaRaw);
};

const normalizeCssColors = (value: string) =>
  value
    .replace(/oklch\([^)]*\)/gi, normalizeOklchColor)
    .replace(/oklab\([^)]*\)/gi, normalizeOklabColor);

const removeExportClasses = (element: Element) => {
  [element, ...Array.from(element.querySelectorAll('*'))].forEach((node) => {
    node.removeAttribute('class');
  });
};

const inlineExportStyles = (source: Element, target: Element, includeAllStyles = false) => {
  const sourceElements = [source, ...Array.from(source.querySelectorAll('*'))];
  const targetElements = [target, ...Array.from(target.querySelectorAll('*'))];

  sourceElements.forEach((sourceElement, index) => {
    const targetElement = targetElements[index] as HTMLElement | SVGElement | undefined;
    if (!targetElement) return;

    const computedStyle = window.getComputedStyle(sourceElement);
    const properties = includeAllStyles
      ? Array.from({ length: computedStyle.length }, (_value, propertyIndex) => computedStyle.item(propertyIndex))
      : [...EXPORT_COLOR_PROPS];

    properties.forEach((property) => {
      try {
        const value = computedStyle.getPropertyValue(property);
        if (!value) return;

        const normalizedValue = normalizeCssColors(value);
        if (/(?:oklab|oklch|color-mix)\(/i.test(normalizedValue)) return;

        targetElement.style.setProperty(property, normalizedValue, 'important');
      } catch {
        // Skip non-serializable browser-only computed styles.
      }
    });
  });
};

const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      image.crossOrigin = 'anonymous';

      if (image.complete) return;

      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 3000);
        const finish = () => {
          window.clearTimeout(timeout);
          resolve();
        };

        image.onload = finish;
        image.onerror = finish;
      });
    })
  );
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const inlineImagesAsDataUrls = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img'));
  const restoreImageSources: Array<() => void> = [];

  await Promise.all(
    images.map(async (image) => {
      const originalSource = image.getAttribute('src');
      if (!originalSource || originalSource.startsWith('data:')) return;

      try {
        const absoluteSource = new URL(originalSource, window.location.href).href;
        const response = await fetch(absoluteSource, { cache: 'force-cache' });
        if (!response.ok) return;

        const dataUrl = await blobToDataUrl(await response.blob());
        restoreImageSources.push(() => image.setAttribute('src', originalSource));
        image.setAttribute('src', dataUrl);
      } catch {
        image.style.visibility = 'hidden';
        restoreImageSources.push(() => {
          image.style.visibility = '';
          image.setAttribute('src', originalSource);
        });
      }
    })
  );

  await waitForImages(element);

  return () => {
    restoreImageSources.forEach((restore) => restore());
  };
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const captureDocumentCanvas = async (element: HTMLElement) => {
  await waitForImages(element);
  const restoreImages = await inlineImagesAsDataUrls(element);

  try {
    return await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (_document, clonedElement) => {
        inlineExportStyles(element, clonedElement, true);
        removeExportClasses(clonedElement);
      },
    });
  } finally {
    restoreImages();
  }
};

export const sanitizeFileName = (value?: string) =>
  (value || 'document').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'document';

export const exportElementToPdf = async (element: HTMLElement, baseName: string) => {
  const canvas = await captureDocumentCanvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;
  let remainingHeight = imgHeight;
  let yPosition = margin;

  pdf.addImage(imgData, 'PNG', margin, yPosition, usableWidth, imgHeight);
  remainingHeight -= pageHeight - margin * 2;

  while (remainingHeight > 0) {
    yPosition = remainingHeight - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, yPosition, usableWidth, imgHeight);
    remainingHeight -= pageHeight - margin * 2;
  }

  downloadBlob(pdf.output('blob'), `${baseName}.pdf`);
};

export const exportElementToImage = async (element: HTMLElement, baseName: string) => {
  const canvas = await captureDocumentCanvas(element);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((canvasBlob) => {
      if (canvasBlob) resolve(canvasBlob);
      else reject(new Error('Could not create image export'));
    }, 'image/jpeg', 0.92);
  });

  downloadBlob(blob, `${baseName}.jpg`);
};

export const exportElementToWord = async (element: HTMLElement, baseName: string) => {
  await waitForImages(element);
  const restoreImages = await inlineImagesAsDataUrls(element);

  try {
    const clone = element.cloneNode(true) as HTMLElement;
    inlineExportStyles(element, clone, true);
    removeExportClasses(clone);

    clone.querySelectorAll('img').forEach((image) => {
      const img = image as HTMLImageElement;
      if (!img.src.startsWith('data:')) {
        img.src = new URL(img.getAttribute('src') || img.src, window.location.href).href;
      }
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>";
    const footer = '</body></html>';
    const sourceHTML = header + clone.outerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword;charset=utf-8' });

    downloadBlob(blob, `${baseName}.doc`);
  } finally {
    restoreImages();
  }
};
