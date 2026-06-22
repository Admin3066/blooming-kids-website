import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Robust Client-Side PDF Generation Worker
 * Leverages the bundled jsPDF and html2canvas libraries.
 * Replaces modern OKLCH CSS colors dynamically before rendering to bypass html2canvas parser crashes.
 */

function replaceOklchInString(cssText: string): string {
  // First convert oklch
  let result = cssText.replace(/oklch\(([^)]+)\)/g, (match, content) => {
    try {
      if (content.includes('var(')) {
        return match; // Keep unchanged to let CSS variables handle fallback or resolve normally
      }

      // Split by space or slash or comma
      const parts = content.trim().split(/[\s,\/]+/);
      if (parts.length < 3) return 'rgba(128, 128, 128, 1)';
      
      let lStr = parts[0];
      let cStr = parts[1];
      let hStr = parts[2];
      let opacityStr = parts[3] || '1';
      
      // Parse L (can be % e.g., 60% or decimal e.g., 0.6)
      let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      let c = parseFloat(cStr);
      let h = parseFloat(hStr);
      let opacity = opacityStr.endsWith('%') ? parseFloat(opacityStr) / 100 : parseFloat(opacityStr);
      
      if (isNaN(l)) l = 0.5;
      if (isNaN(c)) c = 0.1;
      if (isNaN(h)) h = 0;
      if (isNaN(opacity)) opacity = 1;
      
      // Convert h to radians
      const hRad = (h * Math.PI) / 180;
      
      // okLab conversion
      const L = l;
      const a_val = c * Math.cos(hRad);
      const b_val = c * Math.sin(hRad);
      
      // LMS to linear RGB conversion
      const l_ = L + 0.3963377774 * a_val + 0.2158037573 * b_val;
      const m_ = L - 0.1055613458 * a_val - 0.0638541728 * b_val;
      const s_ = L - 0.0894841775 * a_val - 1.2914855480 * b_val;
      
      const l_cubed = l_ * l_ * l_;
      const m_cubed = m_ * m_ * m_;
      const s_cubed = s_ * s_ * s_;
      
      const r_lin = +4.0767416621 * l_cubed - 3.3077115913 * m_cubed + 0.2309699292 * s_cubed;
      const g_lin = -1.2684380046 * l_cubed + 2.6097574011 * m_cubed - 0.3413193965 * s_cubed;
      const b_lin = -0.0041960863 * l_cubed - 0.7034186147 * m_cubed + 1.7076147010 * s_cubed;
      
      const toSRGB = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };
      
      const r = Math.max(0, Math.min(255, Math.round(toSRGB(r_lin) * 255)));
      const g = Math.max(0, Math.min(255, Math.round(toSRGB(g_lin) * 255)));
      const b = Math.max(0, Math.min(255, Math.round(toSRGB(b_lin) * 255)));
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch (e) {
      return 'rgba(128, 128, 128, 1)';
    }
  });

  // Then convert oklab
  result = result.replace(/oklab\(([^)]+)\)/g, (match, content) => {
    try {
      if (content.includes('var(')) {
        return match;
      }
      const parts = content.trim().split(/[\s,\/]+/);
      if (parts.length < 3) return 'rgba(128, 128, 128, 1)';
      
      let lStr = parts[0];
      let aStr = parts[1];
      let bStr = parts[2];
      let opacityStr = parts[3] || '1';
      
      let L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      let a_val = parseFloat(aStr);
      let b_val = parseFloat(bStr);
      let opacity = opacityStr.endsWith('%') ? parseFloat(opacityStr) / 100 : parseFloat(opacityStr);
      
      if (isNaN(L)) L = 0.5;
      if (isNaN(a_val)) a_val = 0;
      if (isNaN(b_val)) b_val = 0;
      if (isNaN(opacity)) opacity = 1;
      
      const l_ = L + 0.3963377774 * a_val + 0.2158037573 * b_val;
      const m_ = L - 0.1055613458 * a_val - 0.0638541728 * b_val;
      const s_ = L - 0.0894841775 * a_val - 1.2914855480 * b_val;
      
      const l_cubed = l_ * l_ * l_;
      const m_cubed = m_ * m_ * m_;
      const s_cubed = s_ * s_ * s_;
      
      const r_lin = +4.0767416621 * l_cubed - 3.3077115913 * m_cubed + 0.2309699292 * s_cubed;
      const g_lin = -1.2684380046 * l_cubed + 2.6097574011 * m_cubed - 0.3413193965 * s_cubed;
      const b_lin = -0.0041960863 * l_cubed - 0.7034186147 * m_cubed + 1.7076147010 * s_cubed;
      
      const toSRGB = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };
      
      const r = Math.max(0, Math.min(255, Math.round(toSRGB(r_lin) * 255)));
      const g = Math.max(0, Math.min(255, Math.round(toSRGB(g_lin) * 255)));
      const b = Math.max(0, Math.min(255, Math.round(toSRGB(b_lin) * 255)));
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch (e) {
      return 'rgba(128, 128, 128, 1)';
    }
  });

  return result;
}

export async function downloadElementAsPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PDF Generator] Targeted DOM element not found: #${elementId}`);
    return;
  }

  // 1. Gather all style and link tags to temporarily clean up oklch colors before html2canvas processes them
  const styleTags = Array.from(document.querySelectorAll('style'));
  const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

  // 2. Maps/arrays to save original styles and restore them later
  const originalStylesMap = new Map<HTMLStyleElement, string>();
  const originalLinksConfig = [] as { element: HTMLLinkElement; disabled: boolean }[];
  const tempStyleElements = [] as HTMLStyleElement[];

  // Convert <style> blocks
  for (const style of styleTags) {
    originalStylesMap.set(style, style.textContent || '');
    style.textContent = replaceOklchInString(style.textContent || '');
  }

  // Fetch and convert <link rel="stylesheet"> blocks (if same-origin)
  for (const link of linkTags) {
    try {
      const url = link.href;
      if (url && (url.startsWith(window.location.origin) || !url.startsWith('http'))) {
        originalLinksConfig.push({ element: link, disabled: link.disabled });
        
        // Disable custom stylesheet link
        link.disabled = true;

        // Fetch original CSS raw text
        const response = await fetch(url);
        if (response.ok) {
          const rawCss = await response.text();
          const cleanedCss = replaceOklchInString(rawCss);
          
          // Inject cleaned style block
          const tempStyle = document.createElement('style');
          tempStyle.className = 'temp-pdf-clean-style';
          tempStyle.textContent = cleanedCss;
          document.head.appendChild(tempStyle);
          tempStyleElements.push(tempStyle);
        }
      }
    } catch (err) {
      console.warn('[PDF Worker] Skip parsing external link stylesheet:', link.href, err);
    }
  }

  const restoreOriginalStyles = () => {
    // Restore <style> contents
    for (const [style, originalText] of originalStylesMap.entries()) {
      style.textContent = originalText;
    }
    
    // Enable original <link> elements
    for (const config of originalLinksConfig) {
      config.element.disabled = config.disabled;
    }
    
    // Clean up injected temp styles
    for (const tempStyle of tempStyleElements) {
      tempStyle.remove();
    }
    console.log('[PDF Worker] Re-established original OKLCH stylesheets successfully.');
  };

  try {
    // Generate the high-density canvas using html2canvas directly
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Slicing loop to accommodate multi-page statements nicely if overflow occurs
    while (heightLeft > 0) {
      if (position < 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    pdf.save(filename);
    console.log('[PDF Worker] PDF Generated and saved successfully.');
  } catch (err) {
    console.error('[PDF Worker Error]:', err);
  } finally {
    restoreOriginalStyles();
  }
}
