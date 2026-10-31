import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { formatMoney } from '../../../utils/formatMoney';

export default function VariantModal({
  open,
  onClose,
  onSave,
  variant = null,
  baseSalesPrice = 0,
}) {
  const [attribute, setAttribute] = useState('');
  const [value, setValue] = useState('');
  const [extraPrice, setExtraPrice] = useState('0');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (variant) {
      setAttribute(variant.attribute || '');
      setValue(variant.value || '');
      setExtraPrice(variant.extra_price !== undefined ? String(variant.extra_price) : '0');
    } else {
      setAttribute('Brand');
      setValue('Odoo');
      setExtraPrice('560');
    }
    setErrors({});
  }, [variant, open]);

  const numericBase = Number(baseSalesPrice) || 0;
  const numericExtra = Number(extraPrice) || 0;
  const computedFinalPrice = numericBase + numericExtra;

  const validate = () => {
    const errs = {};
    if (!attribute.trim()) {
      errs.attribute = 'Attribute name is required (e.g. Brand, Memory, Plan).';
    }
    if (!value.trim()) {
      errs.value = 'Option value is required (e.g. Odoo, 32GB, Enterprise).';
    }
    if (extraPrice === '' || Number.isNaN(Number(extraPrice))) {
      errs.extraPrice = 'Valid extra price numeric amount required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: variant?.id || Date.now(),
      attribute: attribute.trim(),
      value: value.trim(),
      extra_price: Number(extraPrice),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={variant ? 'Edit Product Variant' : 'Add Product Variant'}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          id="variant-attr"
          label="Attribute"
          value={attribute}
          onChange={(e) => {
            setAttribute(e.target.value);
            if (errors.attribute) setErrors((prev) => ({ ...prev, attribute: null }));
          }}
          placeholder="e.g. Brand, Storage, License"
          error={Boolean(errors.attribute)}
          errorMessage={errors.attribute}
          required
        />

        <Input
          id="variant-val"
          label="Value / Option"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
          }}
          placeholder="e.g. Odoo, 500GB, 5 Users"
          error={Boolean(errors.value)}
          errorMessage={errors.value}
          required
        />

        <Input
          id="variant-extra-price"
          label="Extra Surcharge ($)"
          type="number"
          step="0.01"
          value={extraPrice}
          onChange={(e) => {
            setExtraPrice(e.target.value);
            if (errors.extraPrice) setErrors((prev) => ({ ...prev, extraPrice: null }));
          }}
          placeholder="0.00"
          error={Boolean(errors.extraPrice)}
          errorMessage={errors.extraPrice}
          required
        />

        {/* Live Computed Final Price Box */}
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between text-sm">
          <div>
            <span className="text-xs text-indigo-700 block font-medium">Computed Variant Final Price:</span>
            <span className="text-xs text-gray-500">
              Base ({formatMoney(numericBase)}) + Extra ({formatMoney(numericExtra)})
            </span>
          </div>
          <span className="text-lg font-bold text-indigo-700">
            {formatMoney(computedFinalPrice)}
          </span>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {variant ? 'Update Variant' : 'Add Variant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

