import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateCompanyCreditApi } from "../../../api/companyApi/companyApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

interface AddCreditLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moduleName: string;
  company: any | null;
}

export const AddCreditLimitModal: React.FC<AddCreditLimitModalProps> = ({
  isOpen, onClose, onSuccess, moduleName, company
}) => {
  const [customerAdd, setCustomerAdd] = useState("");
  const [vendorAdd, setVendorAdd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomerAdd("");
      setVendorAdd("");
    }
  }, [isOpen, company]);

  if (!isOpen || !company) return null;

  const currentCustomerLimit = Number(company.customerCreditLimit) || 0;
  const currentVendorLimit = Number(company.vendorCreditLimit) || 0;

  const customerAddNum = Number(customerAdd) || 0;
  const vendorAddNum = Number(vendorAdd) || 0;

  const newCustomerTotal = currentCustomerLimit + customerAddNum;
  const newVendorTotal = currentVendorLimit + vendorAddNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasCustomer = customerAdd.trim() !== "" && customerAddNum > 0;
    const hasVendor = vendorAdd.trim() !== "" && vendorAddNum > 0;

    if (!hasCustomer && !hasVendor) {
      return toast.error("Enter an amount to add to Customer and/or Vendor credit.");
    }

    setIsSubmitting(true);
    const payload: { customerCreditLimit?: number; vendorCreditLimit?: number } = {};
    if (hasCustomer) payload.customerCreditLimit = newCustomerTotal;
    if (hasVendor) payload.vendorCreditLimit = newVendorTotal;

    try {
      await updateCompanyCreditApi(company.id, payload, moduleName);
      toast.success("Credit limit added successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Failed to add credit limit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Credit Limit - ${company.name}`} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <Input
              label="Add to Customer Credit"
              name="customerAdd"
              type="number"
              step="0.01"
              value={customerAdd}
              onChange={(e) => setCustomerAdd(e.target.value)}
              placeholder="e.g. 500.00"
            />
            <p className="text-xs text-text-secondary mt-1">
              Current: {currentCustomerLimit.toFixed(4)} → New Total: {newCustomerTotal.toFixed(4)}
            </p>
          </div>

          <div>
            <Input
              label="Add to Vendor Credit"
              name="vendorAdd"
              type="number"
              step="0.01"
              value={vendorAdd}
              onChange={(e) => setVendorAdd(e.target.value)}
              placeholder="e.g. 500.00"
            />
            <p className="text-xs text-text-secondary mt-1">
              Current: {currentVendorLimit.toFixed(4)} → New Total: {newVendorTotal.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Credit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};