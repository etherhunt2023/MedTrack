import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { parseOCRText } from '../utils/ocrParser';
import type { ParsedInvoice } from '../utils/ocrParser';

interface OCRScanViewProps {
  onImport: (data: ParsedInvoice) => void;
}

const MOCK_INVOICES = {
  apollo: `APOLLO PHARMACY
Invoice No: APO-998231
Date: 2026-07-05
Patient: Jane Doe

Items:
----------------------------------------
1. Crocin 650 Tablet
   Qty: 2       Batch: CROC-872A   Expiry: 2028-05-31
   Unit Price: Rs 40.00      Total: Rs 80.00
2. Amoxil Capsule
   Qty: 1       Batch: AMX-112B    Expiry: 2026-05-15
   Unit Price: Rs 120.00     Total: Rs 120.00
----------------------------------------
Subtotal: Rs 200.00
Tax: Rs 36.00
Delivery: Rs 40.00
Discount: Rs 20.00
Total Amount: Rs 256.00
Thank you for shopping with Apollo Pharmacy!`,

  tata1mg: `TATA 1MG TECHNOLOGIES PRIVATE LIMITED
Order Reference: TXN-87612398
Invoice Date: 01/06/2026

Bill To: Jane Doe
Platform: Tata 1mg

Description of Goods:
- Glycomet 500 SR (Metformin Hydrochloride)
  Batch No: GLY-998C
  Expiry Date: 30/09/2027
  Qty: 3 | Unit Price: 50.00 | Amount: 150.00
- Crocin 650 (Paracetamol)
  Batch No: CROC-872A
  Expiry Date: 31/05/2028
  Qty: 2 | Unit Price: 40.00 | Amount: 80.00

Summary:
Subtotal: 230.00
Discount: 50.00
Tax: 18.00
Delivery: 40.00
Total Amount: 238.00`
};

export const OCRScanView: React.FC<OCRScanViewProps> = ({ onImport }) => {
  const [ocrText, setOcrText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedInvoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Auto-parse whenever raw text changes
  useEffect(() => {
    if (ocrText.trim()) {
      const parsed = parseOCRText(ocrText);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  }, [ocrText]);

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (val === 'apollo') {
      setOcrText(MOCK_INVOICES.apollo);
    } else if (val === 'tata1mg') {
      setOcrText(MOCK_INVOICES.tata1mg);
    } else {
      setOcrText('');
    }
  };

  // Process selected file with Tesseract.js
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setProgress(0);
    setStatusText('Initializing OCR Engine...');
    setSelectedTemplate('');

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Extracting text... ${Math.round(m.progress * 100)}%`);
          } else {
            setStatusText(m.status);
          }
        }
      });

      setOcrText(result.data.text);
      setStatusText('Text extraction complete.');
    } catch (err: any) {
      console.error(err);
      setStatusText(`Error during OCR scan: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
    }
  };

  return (
    <div className="ocr-scan-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header md-card md-card--filled" style={{ padding: '20px' }}>
        <h2 style={{ margin: 0 }}>Invoice OCR Scanner</h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Scan paper receipts or online invoices to log new orders instantly. Extract medicines, quantities, batch numbers, and price history client-side.
        </p>
      </div>

      {/* Upload and Template Card */}
      <div className="md-card md-card--elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
          {/* File input */}
          <div className="md-field-group">
            <label className="md-field-label" style={{ fontWeight: 600 }}>Upload Receipt Image</label>
            <input
              type="file"
              accept="image/*"
              className="md-field"
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ paddingTop: '8px' }}
            />
          </div>

          {/* Mock Template Selector */}
          <div className="md-field-group">
            <label className="md-field-label" style={{ fontWeight: 600 }}>Test with Mock Invoice Template</label>
            <select
              className="md-field"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              disabled={isLoading}
            >
              <option value="">-- Select Template (No Upload Required) --</option>
              <option value="apollo">Apollo Pharmacy Invoice Receipt</option>
              <option value="tata1mg">Tata 1mg Invoice Receipt</option>
            </select>
          </div>
        </div>

        {/* OCR Status/Progress */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.85rem', fontWeight: 500 }}>
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: 'var(--md-sys-color-primary)',
                transition: 'width 0.2s ease-in-out'
              }} />
            </div>
          </div>
        )}

        {!isLoading && statusText && (
          <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-primary)', fontWeight: 500 }}>
            ℹ️ {statusText}
          </div>
        )}
      </div>

      {/* Editor & Preview Split Screen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        {/* Left Side: Raw Text Editor */}
        <div className="md-card md-card--outlined" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0 }}>Raw Extracted Text</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Edit spelling errors or paste text directly. The parsed structured view on the right will update in real-time.
          </p>
          <textarea
            className="md-field"
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            disabled={isLoading}
            placeholder="No text extracted yet. Upload an invoice or choose a mock template above to begin."
            style={{
              height: '350px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              whiteSpace: 'pre',
              resize: 'none',
              padding: '12px'
            }}
          />
        </div>

        {/* Right Side: Parsed structured preview */}
        <div className="md-card md-card--outlined" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Structured Parsing Preview</h4>
            {parsedData && (
              <button
                className="md-btn md-btn--filled"
                onClick={handleImport}
                disabled={isLoading || parsedData.items.length === 0}
              >
                📥 Import to Order Form
              </button>
            )}
          </div>

          {!parsedData ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'var(--md-sys-color-on-surface-variant)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '2.5rem' }}>📄</span>
              <p style={{ marginTop: '12px' }}>Extract invoice text to see the structured preview.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent)',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <strong>Platform:</strong>
                  <div style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>{parsedData.platformName || 'Not detected'}</div>
                </div>
                <div>
                  <strong>Invoice / Reference:</strong>
                  <div style={{ fontWeight: 600 }}>{parsedData.orderNumber || 'Not detected'}</div>
                </div>
                <div>
                  <strong>Invoice Date:</strong>
                  <div style={{ fontWeight: 600 }}>{parsedData.orderDate || 'Not detected'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h5 style={{ margin: '0 0 8px 0' }}>Medicines Found ({parsedData.items.length})</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 4px' }}>Name / Brand</th>
                        <th style={{ padding: '6px 4px' }}>Batch</th>
                        <th style={{ padding: '6px 4px' }}>Expiry</th>
                        <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent)' }}>
                          <td style={{ padding: '8px 4px' }}>
                            <strong>{item.brandName || item.medicineName}</strong>
                            {item.brandName !== item.medicineName && item.medicineName && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>({item.medicineName})</div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-primary)' }}>{item.strength || '500mg'} • {item.dosageForm || 'Tablet'}</div>
                          </td>
                          <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{item.batchNumber || '-'}</td>
                          <td style={{ padding: '8px 4px' }}>{item.expiryDate || '-'}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{(item.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div style={{
                borderTop: '1px dashed var(--md-sys-color-outline)',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <strong>₹{(parsedData.subtotal || parsedData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)).toFixed(2)}</strong>
                </div>
                {parsedData.discount !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--md-sys-color-primary)' }}>
                    <span>Discounts:</span>
                    <strong>- ₹{parsedData.discount.toFixed(2)}</strong>
                  </div>
                )}
                {parsedData.tax !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST / Taxes:</span>
                    <strong>₹{parsedData.tax.toFixed(2)}</strong>
                  </div>
                )}
                {parsedData.deliveryCharges !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Charges:</span>
                    <strong>₹{parsedData.deliveryCharges.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1rem',
                  borderTop: '1px solid var(--md-sys-color-outline-variant)',
                  paddingTop: '8px',
                  marginTop: '4px'
                }}>
                  <strong>Total Amount:</strong>
                  <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                    ₹{(parsedData.totalAmount || 
                      (parsedData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) - (parsedData.discount || 0) + (parsedData.tax || 0) + (parsedData.deliveryCharges || 0))
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
