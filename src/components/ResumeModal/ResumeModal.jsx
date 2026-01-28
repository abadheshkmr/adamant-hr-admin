import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import './ResumeModal.css';

const ResumeModal = ({ resumeUrl, candidateName, jobTitle, onClose, url }) => {
  const [isPDF, setIsPDF] = useState(true); // Default to PDF, will check
  const [loadError, setLoadError] = useState(false);
  const [docxContent, setDocxContent] = useState(null);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [docxError, setDocxError] = useState(null);

  // Handle both formats: "uploads/..." or just the path
  const normalizedUrl = resumeUrl?.startsWith('uploads/') ? resumeUrl : resumeUrl ? `uploads/${resumeUrl}` : '';
  const fullResumeUrl = resumeUrl ? `${url}/${normalizedUrl}` : '';
  
  // More robust PDF detection - check filename extension
  const fileName = resumeUrl?.split('/').pop() || 'resume';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const detectedIsPDF = fileExtension === 'pdf';
  const isDocx = fileExtension === 'docx' || fileExtension === 'doc';
  
  // Check if file is PDF based on extension
  useEffect(() => {
    if (resumeUrl) {
      setIsPDF(detectedIsPDF);
      setLoadError(false);
      setDocxContent(null);
      setDocxError(null);
    }
  }, [detectedIsPDF, resumeUrl]);

  // Load and convert DOCX to HTML
  useEffect(() => {
    if (isDocx && fullResumeUrl && !docxContent && !docxError) {
      setLoadingDocx(true);
      setDocxError(null);
      
      fetch(fullResumeUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch DOCX file');
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => {
          return mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        })
        .then(result => {
          setDocxContent(result.value);
          setLoadingDocx(false);
        })
        .catch(error => {
          console.error('Error loading DOCX:', error);
          setDocxError(error.message);
          setLoadingDocx(false);
        });
    }
  }, [isDocx, fullResumeUrl, docxContent, docxError]);

  // Handle iframe load error - if PDF fails to load, might not be PDF
  const handleIframeError = () => {
    console.warn('PDF failed to load, treating as non-PDF');
    setIsPDF(false);
    setLoadError(true);
  };

  console.log('ResumeModal Debug:', {
    resumeUrl,
    normalizedUrl,
    fullResumeUrl,
    fileName,
    fileExtension,
    detectedIsPDF,
    isPDF
  });

  // Early return after hooks
  if (!resumeUrl) return null;

  return (
    <div className="resume-modal-overlay" onClick={onClose}>
      <div className="resume-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="resume-modal-header">
          <div className="resume-modal-title">
            <h3>{candidateName}</h3>
            {jobTitle && <p className="resume-modal-subtitle">{jobTitle}</p>}
          </div>
          <div className="resume-modal-actions">
            <a
              href={fullResumeUrl}
              download={fileName}
              className="resume-download-btn"
              onClick={(e) => e.stopPropagation()}
            >
              📥 Download
            </a>
            <button className="resume-close-btn" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="resume-modal-body">
          {isPDF && !loadError ? (
            <iframe
              src={fullResumeUrl}
              className="resume-iframe"
              title={`Resume - ${candidateName}`}
              onError={handleIframeError}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  const iframe = e.target;
                  // If iframe content is accessible and not an error page
                  if (iframe.contentDocument && iframe.contentDocument.body) {
                    const bodyText = iframe.contentDocument.body.innerText || '';
                    // If it's an error page or HTML error, treat as non-PDF
                    if (bodyText.includes('404') || bodyText.includes('Not Found') || bodyText.includes('Error')) {
                      handleIframeError();
                    }
                  }
                } catch (err) {
                  // Cross-origin or other error - assume PDF loaded fine
                  console.log('Iframe load check:', err.message);
                }
              }}
            />
          ) : isDocx ? (
            // DOCX Preview
            <div className="resume-docx-preview">
              {loadingDocx ? (
                <div className="resume-loading">
                  <div className="loading-spinner">⏳</div>
                  <p>Loading document...</p>
                </div>
              ) : docxError ? (
                <div className="resume-non-pdf">
                  <div className="resume-non-pdf-icon">⚠️</div>
                  <p>Error loading DOCX file: {docxError}</p>
                  <a
                    href={fullResumeUrl}
                    download={fileName}
                    className="resume-download-btn-large"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📥 Download Resume ({fileExtension.toUpperCase()})
                  </a>
                </div>
              ) : docxContent ? (
                <div 
                  className="docx-content"
                  dangerouslySetInnerHTML={{ __html: docxContent }}
                />
              ) : null}
            </div>
          ) : (
            <div className="resume-non-pdf">
              <div className="resume-non-pdf-icon">📄</div>
              <p>
                {loadError 
                  ? 'Unable to preview this file. It may not be a PDF or the file may be corrupted.'
                  : 'This file format cannot be previewed in the browser.'}
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                File: {fileName} ({fileExtension ? fileExtension.toUpperCase() : 'Unknown format'})
              </p>
              <a
                href={fullResumeUrl}
                download={fileName}
                className="resume-download-btn-large"
                onClick={(e) => {
                  // Force download
                  e.stopPropagation();
                }}
              >
                📥 Download Resume ({fileExtension ? fileExtension.toUpperCase() : 'FILE'})
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
