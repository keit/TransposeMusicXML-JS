import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';

interface MusicDisplayProps {
  musicXML: string | null;
  title?: string;
  showPdfExport?: boolean;
}

export const MusicDisplay: React.FC<MusicDisplayProps> = ({ 
  musicXML, 
  title, 
  showPdfExport = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const exportToPDF = async () => {
    if (!containerRef.current || !osmdRef.current) {
      console.error('No music content to export');
      return;
    }

    setExportingPDF(true);
    
    try {
      // Temporarily expand the container to show all content
      const originalHeight = containerRef.current.style.height;
      const originalMaxHeight = containerRef.current.style.maxHeight;
      const originalOverflow = containerRef.current.style.overflow;
      
      containerRef.current.style.height = 'auto';
      containerRef.current.style.maxHeight = 'none';
      containerRef.current.style.overflow = 'visible';
      
      // Wait a bit for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-render OSMD to ensure all content is visible
      if (osmdRef.current) {
        osmdRef.current.render();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Get the SVG element from the container (this should now contain the complete rendered score)
      const svgElement = containerRef.current.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('No SVG content found to export');
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      
      // Restore original container styles
      containerRef.current.style.height = originalHeight;
      containerRef.current.style.maxHeight = originalMaxHeight;
      containerRef.current.style.overflow = originalOverflow;
      
      // Get the actual SVG dimensions from the SVG element itself
      let svgWidth = svgElement.clientWidth || 800;
      let svgHeight = svgElement.clientHeight || 600;
      
      // Try to get dimensions from viewBox if available
      const viewBox = svgElement.viewBox?.baseVal;
      if (viewBox) {
        svgWidth = viewBox.width;
        svgHeight = viewBox.height;
      } else if (svgElement.width?.baseVal?.value && svgElement.height?.baseVal?.value) {
        svgWidth = svgElement.width.baseVal.value;
        svgHeight = svgElement.height.baseVal.value;
      }
      
      // Set explicit dimensions on the clone to ensure proper rendering
      svgClone.setAttribute('width', svgWidth.toString());
      svgClone.setAttribute('height', svgHeight.toString());

      // Create a new PDF document with appropriate orientation
      const isLandscape = svgWidth > svgHeight;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Calculate scaling to fit the entire score on the page(s)
      const availableWidth = pageWidth - (2 * margin);
      const availableHeight = pageHeight - (2 * margin);
      
      const scaleX = availableWidth / svgWidth;
      const scaleY = availableHeight / svgHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
      
      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;

      // Center the content on the page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      // If the scaled height is too large for one page, we might need multiple pages
      if (scaledHeight > availableHeight) {
        // Split into multiple pages
        const pagesNeeded = Math.ceil(scaledHeight / availableHeight);
        const heightPerPage = svgHeight / pagesNeeded;
        
        for (let page = 0; page < pagesNeeded; page++) {
          if (page > 0) pdf.addPage();
          
          // Create a clipped version for this page
          const pageClone = svgClone.cloneNode(true) as SVGElement;
          const viewBoxY = page * heightPerPage;
          
          pageClone.setAttribute('viewBox', `0 ${viewBoxY} ${svgWidth} ${heightPerPage}`);
          pageClone.setAttribute('width', scaledWidth.toString());
          pageClone.setAttribute('height', (heightPerPage * scale).toString());
          
          await pdf.svg(pageClone, {
            x: margin,
            y: margin,
            width: scaledWidth,
            height: heightPerPage * scale
          });
        }
      } else {
        // Single page
        await pdf.svg(svgClone, {
          x: x,
          y: y,
          width: scaledWidth,
          height: scaledHeight
        });
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = title 
        ? `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`
        : `transposed_score_${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !musicXML) {
      return;
    }

    const initializeOSMD = async () => {
      setLoading(true);
      setError(null);

      try {
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Initialize OSMD
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current as HTMLElement, {
          autoResize: true,
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawPartNames: true,
          drawCredits: true,
          backend: 'svg',
        });

        // Load and render the music
        await osmdRef.current.load(musicXML);
        osmdRef.current.render();
        
        setLoading(false);
      } catch (err) {
        console.error('Error rendering music:', err);
        setError(err instanceof Error ? err.message : 'Failed to render music');
        setLoading(false);
      }
    };

    initializeOSMD();
  }, [musicXML]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (osmdRef.current && !loading) {
        setTimeout(() => {
          try {
            osmdRef.current?.render();
          } catch (err) {
            console.warn('Error during resize render:', err);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);

  if (!musicXML) {
    return (
      <div className="music-display-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">🎼</div>
          <p>Upload a MusicXML file to see the score here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-display">
      {title && (
        <div className="music-header">
          <h3 className="music-title">{title}</h3>
          {showPdfExport && !loading && !error && (
            <button
              onClick={exportToPDF}
              disabled={exportingPDF}
              className="pdf-export-button"
              title="Export to PDF"
            >
              {exportingPDF ? '📄 Exporting...' : '📄 Export PDF'}
            </button>
          )}
        </div>
      )}
      
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading and rendering score...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <h4>Error rendering music:</h4>
          <p>{error}</p>
          <details>
            <summary>Technical details</summary>
            <pre>{error}</pre>
          </details>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="osmd-container"
        style={{ 
          minHeight: loading ? '400px' : 'auto',
          position: 'relative'
        }}
      />
    </div>
  );
};