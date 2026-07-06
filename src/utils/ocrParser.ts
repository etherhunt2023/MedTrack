export interface ParsedItem {
  medicineName: string;
  brandName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  expiryDate?: string; // YYYY-MM-DD
  batchNumber?: string;
  dosageForm?: string;
  strength?: string;
}

export interface ParsedInvoice {
  platformName?: string;
  orderNumber?: string;
  orderDate?: string; // YYYY-MM-DD
  subtotal?: number;
  discount?: number;
  tax?: number;
  deliveryCharges?: number;
  totalAmount?: number;
  items: ParsedItem[];
}

/**
 * Normalizes date strings (e.g. DD/MM/YYYY or DD-MM-YYYY) into YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  const clean = dateStr.trim();
  // Try YYYY-MM-DD first
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return clean;
}

/**
 * Parses raw text from invoice to extract structured information.
 */
export function parseOCRText(text: string): ParsedInvoice {
  const result: ParsedInvoice = {
    items: []
  };

  // 1. Detect Platform
  if (/apollo/i.test(text)) {
    result.platformName = 'Apollo Pharmacy';
  } else if (/tata\s*1mg|1mg/i.test(text)) {
    result.platformName = 'Tata 1mg';
  } else if (/pharmeasy/i.test(text)) {
    result.platformName = 'PharmEasy';
  } else {
    result.platformName = 'Local Pharmacy';
  }

  // 2. Detect Invoice/Order Number
  // Look for: Invoice No: ..., Order Reference: ..., Invoice No ..., etc.
  const orderNoMatch = text.match(/(?:invoice|order|txn)(?:\s+no|\s+reference|\s+id)?\s*[:#-]?\s*([a-z0-9-]+)/i);
  if (orderNoMatch) {
    result.orderNumber = orderNoMatch[1].trim();
  }

  // 3. Detect Order Date
  const dateMatch = text.match(/(?:invoice\s+|order\s+)?date\s*[:-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) {
    result.orderDate = normalizeDate(dateMatch[1]);
  }

  // 4. Detect Financial Summary Values
  const subtotalMatch = text.match(/subtotal\s*[:-]?\s*(?:rs|₹|[$ \s])\s*([0-9.,]+)/i);
  if (subtotalMatch) {
    result.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
  }

  const taxMatch = text.match(/(?:tax|gst)\s*(?:\(\d+%\))?\s*[:-]?\s*(?:rs|₹|[$ \s])\s*([0-9.,]+)/i);
  if (taxMatch) {
    result.tax = parseFloat(taxMatch[1].replace(/,/g, ''));
  }

  const deliveryMatch = text.match(/(?:delivery|shipping|fee|charges)\s*[:-]?\s*(?:rs|₹|[$ \s])\s*([0-9.,]+)/i);
  if (deliveryMatch) {
    result.deliveryCharges = parseFloat(deliveryMatch[1].replace(/,/g, ''));
  }

  const discountMatch = text.match(/(?:discount|discounts)\s*[:-]?\s*-?(?:rs|₹|[$ \s])\s*([0-9.,]+)/i);
  if (discountMatch) {
    result.discount = parseFloat(discountMatch[1].replace(/,/g, ''));
  }

  const totalMatch = text.match(/(?:total|net\s+payable|total\s+paid|amount)\s*[:-]?\s*(?:rs|₹|[$ \s])\s*([0-9.,]+)/i);
  if (totalMatch) {
    result.totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // 5. Detect Items
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for Apollo Invoice specific lines
    // "1. Crocin 650 Tablet" followed by "Qty: 2 Batch: CROC-872A Expiry: 2028-05-31" and prices
    const itemStartMatch = line.match(/^\d+\.\s+([A-Za-z0-9\s]+?)(?:\s+(Tablet|Capsule|Syrup|Inhaler|Cream|Drops))?$/i);
    if (itemStartMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextLine2 = i + 2 < lines.length ? lines[i + 2] : '';
      const combinedProps = nextLine + ' ' + nextLine2;

      const qtyMatch = combinedProps.match(/qty\s*:\s*(\d+)/i);
      const batchMatch = combinedProps.match(/batch\s*:\s*([A-Za-z0-9-]+)/i);
      const expiryMatch = combinedProps.match(/expiry\s*:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      const priceMatch = combinedProps.match(/unit\s+price\s*:\s*(?:rs|₹|[$ \s])\s*([0-9.]+)/i);

      if (qtyMatch && priceMatch) {
        let medicineName = itemStartMatch[1].trim();
        let dosageForm = itemStartMatch[2] ? itemStartMatch[2].trim() : 'Tablet';
        
        let strength = '500mg';
        const strengthMatch = medicineName.match(/(\d+mg|\d+mcg|\d+ml|\d+\s*mg)/i);
        if (strengthMatch) {
          strength = strengthMatch[1].trim();
          medicineName = medicineName.replace(strengthMatch[0], '').trim();
        }

        result.items.push({
          medicineName: medicineName,
          brandName: medicineName,
          quantity: parseInt(qtyMatch[1]),
          unitPrice: parseFloat(priceMatch[1]),
          discount: 0,
          expiryDate: expiryMatch ? normalizeDate(expiryMatch[1]) : undefined,
          batchNumber: batchMatch ? batchMatch[1] : undefined,
          dosageForm,
          strength
        });
        i += 2; // skip parsed lines
        continue;
      }
    }

    // Look for Tata 1mg specific lines
    // "- Glycomet 500 SR (Metformin Hydrochloride)"
    // "  Batch No: GLY-998C"
    // "  Expiry Date: 30/09/2027"
    // "  Qty: 3 | Unit Price: 50.00 | Amount: 150.00"
    const tataItemStartMatch = line.match(/^-\s*([A-Za-z0-9\s]+?)(?:\s*\((.+?)\))?$/);
    if (tataItemStartMatch) {
      let brand = tataItemStartMatch[1].trim();
      let generic = tataItemStartMatch[2] ? tataItemStartMatch[2].trim() : brand;

      let batch: string | undefined = undefined;
      let expiry: string | undefined = undefined;
      let qty = 1;
      let unitPrice = 0;

      // Scan subsequent lines for details
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('Batch') || lines[j].trim().startsWith('Expiry') || lines[j].trim().startsWith('Qty') || lines[j].trim().includes('|'))) {
        const itemDetailLine = lines[j].trim();
        const batchMatch = itemDetailLine.match(/batch\s*(?:no)?\s*[:-]?\s*([a-z0-9-]+)/i);
        if (batchMatch) batch = batchMatch[1].trim();

        const expiryMatch = itemDetailLine.match(/expiry\s*(?:date)?\s*[:-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})/i);
        if (expiryMatch) expiry = normalizeDate(expiryMatch[1]);

        const qtyPriceMatch = itemDetailLine.match(/qty\s*[:-]?\s*(\d+)\s*\|\s*unit\s*price\s*[:-]?\s*([0-9.]+)/i);
        if (qtyPriceMatch) {
          qty = parseInt(qtyPriceMatch[1]);
          unitPrice = parseFloat(qtyPriceMatch[2]);
        }
        j++;
      }

      let strength = '500mg';
      const strengthMatch = brand.match(/(\d+mg|\d+mcg|\d+ml|\d+\s*mg)/i) || generic.match(/(\d+mg|\d+mcg|\d+ml|\d+\s*mg)/i);
      if (strengthMatch) {
        strength = strengthMatch[1].trim();
        brand = brand.replace(strengthMatch[0], '').trim();
        generic = generic.replace(strengthMatch[0], '').trim();
      }

      result.items.push({
        medicineName: generic,
        brandName: brand,
        quantity: qty,
        unitPrice: unitPrice,
        discount: 0,
        expiryDate: expiry,
        batchNumber: batch,
        dosageForm: 'Tablet',
        strength
      });
      
      i = j - 1;
      continue;
    }
  }

  // Fallback parser if no items parsed
  if (result.items.length === 0) {
    const lines = text.split('\n');
    lines.forEach(l => {
      const match = l.match(/([a-z0-9\s]+?)\s+(?:qty|quantity|x)?\s*[:\s-]?\s*(\d+)\s*(?:x)?\s*(?:price|rate|at|@)?\s*[:\s-]?\s*(?:rs|₹|[$ \s])?\s*([0-9.]+)/i);
      if (match) {
        const name = match[1].trim();
        if (/subtotal|total|discount|tax|invoice|gst|delivery|shipping|date/i.test(name)) {
          return;
        }
        result.items.push({
          medicineName: name,
          brandName: name,
          quantity: parseInt(match[2]),
          unitPrice: parseFloat(match[3]),
          discount: 0,
          dosageForm: 'Tablet',
          strength: '500mg'
        });
      }
    });
  }

  return result;
}
