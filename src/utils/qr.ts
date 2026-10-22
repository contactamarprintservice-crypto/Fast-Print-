import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, options?: { width?: number; margin?: number }): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
}

export async function generateQrSvg(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('QR SVG generation failed:', err);
    return '';
  }
}
