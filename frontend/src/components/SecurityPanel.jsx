import React, { useState } from 'react';

const SecurityPanel = ({ data }) => {
    if (!data) return null;

    return (
        <div className="card shadow-sm border-primary mt-4">
            <div className="card-header bg-primary text-white d-flex align-items-center">
                <i className="bi bi-shield-check me-2"></i>
                <h5 className="mb-0">Record Verification Proof</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <h6 className="text-muted"><i className="bi bi-eye-slash-fill me-1"></i> Privacy Protection</h6>
                        <div className="p-2 bg-light border rounded">
                            <small className="d-block text-uppercase fw-bold text-primary" style={{ fontSize: '0.7rem' }}>Protected Data (Hidden)</small>
                            <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.encryptedPhone || 'DATA_HIDDEN'}</code>
                        </div>
                        <div className="p-2 bg-light border rounded mt-2 border-success">
                            <small className="d-block text-uppercase fw-bold text-success" style={{ fontSize: '0.7rem' }}>Your Verified View</small>
                            <code className="text-break text-dark" style={{ fontSize: '0.85rem' }}>{data.decryptedPhone || 'ACCESS_RESTRICTED'}</code>
                        </div>
                    </div>

                    <div className="col-md-6 mb-3">
                        <h6 className="text-muted"><i className="bi bi-patch-check-fill me-1"></i> Entry Integrity</h6>
                        <div className="p-2 bg-light border rounded">
                            <small className="d-block text-uppercase fw-bold text-danger" style={{ fontSize: '0.7rem' }}>Digital Verification Key (Fixed)</small>
                            <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.dataHash || 'VERIFICATION_PENDING'}</code>
                        </div>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-top">
                    <h6 className="text-muted"><i className="bi bi-hdd-network-fill me-1"></i> Safe Transmission</h6>
                    <div className="p-2 bg-light border rounded">
                        <small className="d-block text-uppercase fw-bold text-secondary" style={{ fontSize: '0.7rem' }}>Transfer Format (Internal)</small>
                        <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.encodedContext || 'YXV0aF9jb250ZXh0X2xvZ2dlZF9pbg=='}</code>
                    </div>
                </div>

                <div className="alert alert-info mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
                    <strong>Verification Details:</strong>
                    Data protection ensures <strong>Privacy</strong> (only you and staff can see this).
                    Verification keys ensure <strong>Accuracy</strong> (the record hasn't been changed).
                    Transfer formats help <strong>Sync</strong> data between devices safely.
                </div>
            </div>
        </div>
    );
};

export default SecurityPanel;
