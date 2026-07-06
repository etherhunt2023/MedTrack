import React, { useState, useEffect } from 'react';
import { useDB } from '../context/DBContext';
import { type ParsedInvoice } from '../utils/ocrParser';

interface OrderItemFormState {
  isNewMedicine: boolean;
  medicine_id: string;
  newMedName: string;
  newMedBrand: string;
  newMedDosageForm: string;
  newMedStrength: string;
  newMedDescription: string;
  quantity: number;
  unit_price: number;
  discount: number;
  expiry_date: string;
  batch_number: string;
}

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Inhaler', 'Cream', 'Drops', 'Injection', 'Other'];

interface OrdersViewProps {
  prefilledData?: ParsedInvoice | null;
  clearPrefilledData?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ prefilledData, clearPrefilledData }) => {
  const { orders, platforms, medicines, addMedicine, createOrder, refreshData } = useDB();

  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [platformId, setPlatformId] = useState(platforms[0]?.id || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNumber, setOrderNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);

  // Multi-item dynamic state
  const [items, setItems] = useState<OrderItemFormState[]>([
    {
      isNewMedicine: false,
      medicine_id: medicines[0]?.id || '',
      newMedName: '',
      newMedBrand: '',
      newMedDosageForm: 'Tablet',
      newMedStrength: '',
      newMedDescription: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      expiry_date: '',
      batch_number: ''
    }
  ]);

  // Expandable active order details id state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Apply prefilled data from OCR import
  useEffect(() => {
    if (prefilledData && clearPrefilledData) {
      setIsCreating(true);
      
      // Match platform name
      const matchedPlatform = platforms.find(
        p => p.name.toLowerCase() === prefilledData.platformName?.toLowerCase()
      );
      if (matchedPlatform) {
        setPlatformId(matchedPlatform.id);
      } else if (platforms.length > 0) {
        setPlatformId(platforms[0].id);
      }

      if (prefilledData.orderDate) {
        setOrderDate(prefilledData.orderDate);
      }
      if (prefilledData.orderNumber) {
        setOrderNumber(prefilledData.orderNumber);
      }
      if (prefilledData.discount !== undefined) {
        setDiscount(prefilledData.discount);
      }
      if (prefilledData.tax !== undefined) {
        setTax(prefilledData.tax);
      }
      if (prefilledData.deliveryCharges !== undefined) {
        setDeliveryCharges(prefilledData.deliveryCharges);
      }

      if (prefilledData.items && prefilledData.items.length > 0) {
        const mappedItems = prefilledData.items.map(item => {
          const matchedMed = medicines.find(
            m => m.name.toLowerCase() === item.medicineName.toLowerCase() ||
                 m.brand.toLowerCase() === (item.brandName || '').toLowerCase()
          );

          return {
            isNewMedicine: !matchedMed,
            medicine_id: matchedMed ? matchedMed.id : (medicines[0]?.id || ''),
            newMedName: item.medicineName || '',
            newMedBrand: item.brandName || item.medicineName || '',
            newMedDosageForm: item.dosageForm || 'Tablet',
            newMedStrength: item.strength || '500mg',
            newMedDescription: '',
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            discount: item.discount || 0,
            expiry_date: item.expiryDate || '',
            batch_number: item.batchNumber || ''
          };
        });
        setItems(mappedItems);
      }

      clearPrefilledData();
    }
  }, [prefilledData, platforms, medicines, clearPrefilledData]);

  // Calculated totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0);
  const totalAmount = Math.max(0, subtotal - discount + tax + deliveryCharges);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        isNewMedicine: false,
        medicine_id: medicines[0]?.id || '',
        newMedName: '',
        newMedBrand: '',
        newMedDosageForm: 'Tablet',
        newMedStrength: '',
        newMedDescription: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        expiry_date: '',
        batch_number: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = [...items];
    nextItems.splice(index, 1);
    setItems(nextItems);
  };

  const handleItemChange = (index: number, key: keyof OrderItemFormState, value: any) => {
    const nextItems = [...items];
    nextItems[index] = {
      ...nextItems[index],
      [key]: value
    };
    setItems(nextItems);
  };

  const validate = () => {
    if (!platformId) {
      setErrorMsg('Please select a pharmacy platform.');
      return false;
    }
    if (!orderDate) {
      setErrorMsg('Please select the order date.');
      return false;
    }
    if (!orderNumber.trim()) {
      setErrorMsg('Please specify the invoice order number.');
      return false;
    }
    if (items.length === 0) {
      setErrorMsg('Please add at least one item to this order.');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.isNewMedicine) {
        if (!item.newMedName.trim()) {
          setErrorMsg(`Item #${i + 1} - New medicine name is required.`);
          return false;
        }
        if (!item.newMedBrand.trim()) {
          setErrorMsg(`Item #${i + 1} - New medicine brand/manufacturer is required.`);
          return false;
        }
        if (!item.newMedStrength.trim()) {
          setErrorMsg(`Item #${i + 1} - Strength specification is required.`);
          return false;
        }
      } else {
        if (!item.medicine_id) {
          setErrorMsg(`Item #${i + 1} - Please select an existing medicine.`);
          return false;
        }
      }

      if (item.quantity < 1) {
        setErrorMsg(`Item #${i + 1} - Quantity must be at least 1.`);
        return false;
      }
      if (item.unit_price < 0) {
        setErrorMsg(`Item #${i + 1} - Unit price cannot be negative.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setErrorMsg('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const itemsData = [];

      for (const item of items) {
        let medId = item.medicine_id;
        
        if (item.isNewMedicine) {
          // Register the new medicine on the fly
          const created = await addMedicine({
            name: item.newMedName,
            brand: item.newMedBrand,
            dosage_form: item.newMedDosageForm,
            strength: item.newMedStrength,
            description: item.newMedDescription
          });
          medId = created.id;
        }

        itemsData.push({
          medicine_id: medId,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          discount: Number(item.discount),
          expiry_date: item.expiry_date || null,
          batch_number: item.batch_number || null
        });
      }

      // Submit overall order details
      await createOrder({
        platform_id: platformId,
        order_date: new Date(orderDate).toISOString(),
        order_number: orderNumber,
        subtotal,
        discount: Number(discount),
        tax: Number(tax),
        delivery_charges: Number(deliveryCharges),
        total_amount: totalAmount,
        status: 'delivered'
      }, itemsData);

      setSuccess('Order successfully logged! Medicines loaded into cabinet stock.');
      await refreshData();
      
      // Reset form fields
      setOrderNumber('');
      setDiscount(0);
      setTax(0);
      setDeliveryCharges(0);
      setItems([
        {
          isNewMedicine: false,
          medicine_id: medicines[0]?.id || '',
          newMedName: '',
          newMedBrand: '',
          newMedDosageForm: 'Tablet',
          newMedStrength: '',
          newMedDescription: '',
          quantity: 1,
          unit_price: 0,
          discount: 0,
          expiry_date: '',
          batch_number: ''
        }
      ]);
      setIsCreating(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete order submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="orders-view-container">
      {/* SUCCESS / ERROR ALERTS */}
      {success && (
        <div className="md-alert md-alert--success">
          <span>{success}</span>
        </div>
      )}
      {errorMsg && (
        <div className="md-alert md-alert--error">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CONDITIONAL RENDERING: LIST OR CREATE FORM */}
      {!isCreating ? (
        <>
          <div className="section-header-row">
            <div>
              <h2 style={{ margin: 0 }}>Pharmacy Orders</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Track order entries and invoices from online & local health stores.
              </p>
            </div>
            <button className="md-btn md-btn--filled" onClick={() => setIsCreating(true)}>
              + Log New Order
            </button>
          </div>

          <div className="orders-list">
            {orders.map(order => {
              const platformName = platforms.find(p => p.id === order.platform_id)?.name || 'Pharmacy';
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="md-card md-card--outlined order-card-item">
                  <div className="order-summary-row" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                    <div className="order-info-block">
                      <span className="order-platform-tag">🛒 {platformName}</span>
                      <strong className="order-number-title">Inv: {order.order_number}</strong>
                      <span className="order-date-text">{new Date(order.order_date).toLocaleDateString()}</span>
                    </div>
                    <div className="order-price-block">
                      <strong className="order-amt">₹{order.total_amount.toFixed(2)}</strong>
                      <span className={`status-badge ${order.status}`}>{order.status}</span>
                    </div>
                  </div>

                  {/* Expandable Order Details Drawer */}
                  {isExpanded && (
                    <div className="expanded-order-details mt-4">
                      <h5 style={{ margin: '0 0 8px' }}>Billing Summary</h5>
                      <div className="billing-summary-grid">
                        <div className="billing-cell"><span>Subtotal:</span> <span>₹{order.subtotal.toFixed(2)}</span></div>
                        <div className="billing-cell"><span>Discount:</span> <span>-₹{order.discount.toFixed(2)}</span></div>
                        <div className="billing-cell"><span>Tax:</span> <span>₹{order.tax.toFixed(2)}</span></div>
                        <div className="billing-cell"><span>Delivery:</span> <span>₹{order.delivery_charges.toFixed(2)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="empty-state-card text-center md-card md-card--filled" style={{ padding: '32px' }}>
                <span>📦</span>
                <p style={{ marginTop: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>No pharmacy purchase invoices logged yet.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* CREATE ORDER FORM */
        <div className="md-card md-card--elevated create-order-form-container">
          <div className="form-header">
            <h3>Log New Pharmacy Invoice</h3>
            <button className="md-btn md-btn--text" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            {/* Primary Order Info */}
            <div className="grid-2">
              <div className="md-field-group">
                <label className="md-field-label">Pharmacy Platform</label>
                <select
                  className="md-field"
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  disabled={isSubmitting}
                >
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="md-field-group">
                <label className="md-field-label">Order / Invoice Date</label>
                <input
                  type="date"
                  className="md-field"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="md-field-group">
              <label className="md-field-label">Invoice / Order Reference ID</label>
              <input
                type="text"
                className="md-field"
                placeholder="e.g. TXN-99823122"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Medicines List Section */}
            <div className="medicines-section-box mt-4">
              <div className="box-header justify-between">
                <h4>Items to Add</h4>
                <button type="button" className="md-btn md-btn--tonal" style={{ height: '32px' }} onClick={handleAddItem} disabled={isSubmitting}>
                  + Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="order-item-form-card md-card md-card--filled mt-2">
                  <div className="item-card-header justify-between">
                    <h5>Item #{index + 1}</h5>
                    {items.length > 1 && (
                      <button type="button" className="md-btn md-btn--text" style={{ color: 'var(--md-sys-color-error)', height: '28px', padding: '0 8px' }} onClick={() => handleRemoveItem(index)}>
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Toggle new vs existing medicine */}
                  <div className="toggle-switch-group">
                    <input
                      type="checkbox"
                      id={`isNewMed-${index}`}
                      checked={item.isNewMedicine}
                      onChange={(e) => handleItemChange(index, 'isNewMedicine', e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor={`isNewMed-${index}`}>This is a new medicine brand (register on the fly)</label>
                  </div>

                  {/* Fields for medicine specification */}
                  {item.isNewMedicine ? (
                    <div className="new-medicine-fields mt-2">
                      <div className="grid-2">
                        <div className="md-field-group">
                          <label className="md-field-label">Medicine Generic Name</label>
                          <input
                            type="text"
                            className="md-field"
                            placeholder="e.g. Paracetamol"
                            value={item.newMedName}
                            onChange={(e) => handleItemChange(index, 'newMedName', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="md-field-group">
                          <label className="md-field-label">Brand / Manufacturer</label>
                          <input
                            type="text"
                            className="md-field"
                            placeholder="e.g. Crocin 650"
                            value={item.newMedBrand}
                            onChange={(e) => handleItemChange(index, 'newMedBrand', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="md-field-group">
                          <label className="md-field-label">Dosage Form</label>
                          <select
                            className="md-field"
                            value={item.newMedDosageForm}
                            onChange={(e) => handleItemChange(index, 'newMedDosageForm', e.target.value)}
                            disabled={isSubmitting}
                          >
                            {DOSAGE_FORMS.map(df => (
                              <option key={df} value={df}>{df}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md-field-group">
                          <label className="md-field-label">Strength / Spec</label>
                          <input
                            type="text"
                            className="md-field"
                            placeholder="e.g. 650mg"
                            value={item.newMedStrength}
                            onChange={(e) => handleItemChange(index, 'newMedStrength', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="md-field-group">
                        <label className="md-field-label">Description (Optional)</label>
                        <input
                          type="text"
                          className="md-field"
                          placeholder="e.g. For pain relief"
                          value={item.newMedDescription}
                          onChange={(e) => handleItemChange(index, 'newMedDescription', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="md-field-group mt-2">
                      <label className="md-field-label">Select Medicine</label>
                      <select
                        className="md-field"
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                        disabled={isSubmitting}
                      >
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.brand} ({m.name}) - {m.strength}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity, price, and stats fields */}
                  <div className="grid-2 mt-2">
                    <div className="md-field-group">
                      <label className="md-field-label">Quantity</label>
                      <input
                        type="number"
                        className="md-field"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))}
                        disabled={isSubmitting}
                        min="1"
                      />
                    </div>
                    <div className="md-field-group">
                      <label className="md-field-label">Unit Price (₹)</label>
                      <input
                        type="number"
                        className="md-field"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', Math.max(0, Number(e.target.value)))}
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid-2 mt-2">
                    <div className="md-field-group">
                      <label className="md-field-label">Item Discount (Optional)</label>
                      <input
                        type="number"
                        className="md-field"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', Math.max(0, Number(e.target.value)))}
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="md-field-group">
                      <label className="md-field-label">Expiry Date</label>
                      <input
                        type="date"
                        className="md-field"
                        value={item.expiry_date}
                        onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="md-field-group mt-2">
                    <label className="md-field-label">Batch Code (Optional)</label>
                    <input
                      type="text"
                      className="md-field"
                      placeholder="e.g. BATCH-A22"
                      value={item.batch_number}
                      onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Invoicing Totals Box */}
            <div className="billing-form-card md-card md-card--outlined mt-4">
              <h4>Invoice Accounting</h4>
              <div className="grid-2">
                <div className="md-field-group">
                  <label className="md-field-label">Order Discount (₹)</label>
                  <input
                    type="number"
                    className="md-field"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="md-field-group">
                  <label className="md-field-label">Order Tax (₹)</label>
                  <input
                    type="number"
                    className="md-field"
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="md-field-group">
                <label className="md-field-label">Delivery Charges (₹)</label>
                <input
                  type="number"
                  className="md-field"
                  value={deliveryCharges}
                  onChange={(e) => setDeliveryCharges(Math.max(0, Number(e.target.value)))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="computed-totals mt-2">
                <div className="totals-row">
                  <span>Subtotal:</span>
                  <strong>₹{subtotal.toFixed(2)}</strong>
                </div>
                <div className="totals-row grand-total">
                  <span>Calculated Total:</span>
                  <strong>₹{totalAmount.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="form-submit-row mt-4">
              <button type="submit" className="md-btn md-btn--filled" disabled={isSubmitting}>
                {isSubmitting ? 'Logging Invoice...' : 'Save & Import Stock'}
              </button>
              <button type="button" className="md-btn md-btn--text" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .orders-view-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .order-card-item {
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .order-card-item:hover {
          background-color: var(--md-sys-color-surface-variant);
        }
        .order-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-info-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .order-platform-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--md-sys-color-primary);
        }
        .order-number-title {
          font-size: 1rem;
        }
        .order-date-text {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
        }
        .order-price-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .order-amt {
          font-size: 1.15rem;
          color: #2e7d32;
        }
        .status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
          text-transform: uppercase;
        }
        .status-badge.delivered {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .billing-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          background-color: var(--md-sys-color-surface-variant);
          padding: 12px;
          border-radius: var(--md-shape-corner-s);
          border: 1px solid var(--md-sys-color-outline-variant);
        }
        .billing-cell {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .billing-cell span:first-child {
          color: var(--md-sys-color-on-surface-variant);
        }
        .create-order-form-container {
          padding: 24px;
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
          padding-bottom: 12px;
        }
        .form-header h3 {
          margin: 0;
        }
        .toggle-switch-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 8px;
        }
        .toggle-switch-group input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .item-card-header {
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .item-card-header h5 {
          margin: 0;
        }
        .computed-totals {
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
          padding: 12px;
          border-radius: var(--md-shape-corner-s);
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        .totals-row.grand-total {
          border-top: 1px solid var(--md-sys-color-outline-variant);
          padding-top: 4px;
          font-size: 1.05rem;
          margin-bottom: 0;
        }
        .form-submit-row {
          display: flex;
          gap: 12px;
        }
        .justify-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
