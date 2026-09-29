import api from './api';

export const dbtService = {
  // F-73: Penny Drop Account Verification
  verifyPennyDrop: async (accountNumber, ifscCode, enteredName, applicationId = null) => {
    const response = await api.post('/dbt/penny-drop/verify', {
      account_number: accountNumber,
      ifsc_code: ifscCode,
      entered_name: enteredName,
      application_id: applicationId
    });
    return response.data;
  },

  // F-72: NPCI Aadhaar Seeding Check
  getNpciSeedingStatus: async (aadhaarNumber) => {
    const response = await api.get(`/dbt/npci/seeding-status?aadhaar_number=${encodeURIComponent(aadhaarNumber)}`);
    return response.data;
  },

  // F-74, F-75, F-76: Generate Payment Batch
  generatePaymentBatch: async (schemeId, cycleId, trancheNumber = 1, tranchePercentage = 100.0, splitEnabled = true) => {
    const response = await api.post('/dbt/batches/generate', {
      scheme_id: schemeId,
      cycle_id: cycleId,
      tranche_number: trancheNumber,
      tranche_percentage: tranchePercentage,
      split_enabled: splitEnabled
    });
    return response.data;
  },

  // List batches
  getPaymentBatches: async (schemeId = null, cycleId = null) => {
    let url = '/dbt/batches';
    const params = [];
    if (schemeId) params.push(`scheme_id=${encodeURIComponent(schemeId)}`);
    if (cycleId) params.push(`cycle_id=${encodeURIComponent(cycleId)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await api.get(url);
    return response.data;
  },

  // Batch details
  getPaymentBatchDetail: async (batchId) => {
    const response = await api.get(`/dbt/batches/${batchId}`);
    return response.data;
  },

  // F-71: Dispatch to PFMS
  dispatchBatchToPfms: async (batchId) => {
    const response = await api.post(`/dbt/batches/${batchId}/dispatch-pfms`);
    return response.data;
  },

  // F-71, F-80: Reconcile Bank Credits & Generate UTRs
  reconcileBatch: async (batchId) => {
    const response = await api.post(`/dbt/batches/${batchId}/reconcile`);
    return response.data;
  },

  // F-78: Retry Failed Transaction
  retryTransaction: async (transactionId, newAccountNumber = null, newIfsc = null) => {
    const response = await api.post(`/dbt/transactions/${transactionId}/retry`, {
      new_account_number: newAccountNumber,
      new_ifsc: newIfsc
    });
    return response.data;
  },

  // F-79: Reverse Transaction
  reverseTransaction: async (transactionId, reason) => {
    const response = await api.post(`/dbt/transactions/${transactionId}/reverse`, {
      reason: reason
    });
    return response.data;
  },

  // F-82: Generate Form TR-27 Treasury Bill
  generateTreasuryBill: async (batchId, district = "RANCHI") => {
    const response = await api.post(`/dbt/batches/${batchId}/treasury-bill`, {
      district: district
    });
    return response.data;
  },

  // Get Treasury Bill
  getTreasuryBill: async (batchId) => {
    try {
      const response = await api.get(`/dbt/treasury-bills/${batchId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // F-77: State Treasury Head of Account Ledger
  getTreasuryLedger: async (financialYear = "2026-2027") => {
    const response = await api.get(`/dbt/treasury-ledger?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  },

  // F-80: Student DBT Tracking Timeline
  getMyDbtTimeline: async () => {
    const response = await api.get('/dbt/student/my-dbt-timeline');
    return response.data;
  },

  // F-81: Payment Gateway / UPI Mock Adapter
  initiateUpiRefund: async (amount, purpose = "SCHOLARSHIP_REFUND") => {
    const response = await api.post('/dbt/upi/initiate-refund', {
      amount: amount,
      purpose: purpose
    });
    return response.data;
  },

  // F-83: CAG Compliance Export
  exportCagCompliance: async (financialYear = "2026-2027") => {
    const response = await api.get(`/dbt/audit/cag-compliance-export?financial_year=${encodeURIComponent(financialYear)}`);
    return response.data;
  }
};

export default dbtService;
