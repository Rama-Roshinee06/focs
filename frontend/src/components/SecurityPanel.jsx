import React, { useState } from 'react';

const SecurityPanel = ({ data }) => {
    if (!data) return null;

    return (
        <div className="card shadow-sm border-primary mt-4">
            <div className="card-header bg-primary text-white d-flex align-items-center">
                <i className="bi bi-shield-lock-fill me-2"></i>
                <h5 className="mb-0">Security Implementation Proof (CIA Triad)</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <h6 className="text-muted"><i className="bi bi-eye-slash-fill me-1"></i> Confidentiality (AES-256)</h6>
                        <div className="p-2 bg-light border rounded">
                            <small className="d-block text-uppercase fw-bold text-primary" style={{ fontSize: '0.7rem' }}>Database State (Ciphertext)</small>
                            <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.encryptedPhone || 'ENC_DATA_UNAVAILABLE'}</code>
                        </div>
                        <div className="p-2 bg-light border rounded mt-2 border-success">
                            <small className="d-block text-uppercase fw-bold text-success" style={{ fontSize: '0.7rem' }}>User View (Decrypted Plaintext)</small>
                            <code className="text-break text-dark" style={{ fontSize: '0.85rem' }}>{data.decryptedPhone || 'ACCESS_DENIED'}</code>
                        </div>
                    </div>

                    <div className="col-md-6 mb-3">
                        <h6 className="text-muted"><i className="bi bi-patch-check-fill me-1"></i> Integrity (RSA-SHA256)</h6>
                        <div className="p-2 bg-light border rounded">
                            <small className="d-block text-uppercase fw-bold text-danger" style={{ fontSize: '0.7rem' }}>Digital Signature (Hash)</small>
                            <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.dataHash || 'SIGNATURE_PENDING'}</code>
                        </div>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-top">
                    <h6 className="text-muted"><i className="bi bi-hdd-network-fill me-1"></i> Data Transmission (Encoding)</h6>
                    <div className="p-2 bg-light border rounded">
                        <small className="d-block text-uppercase fw-bold text-secondary" style={{ fontSize: '0.7rem' }}>Base64 Encoded Context (Not Security)</small>
                        <code className="text-break" style={{ fontSize: '0.85rem' }}>{data.encodedContext || 'YXV0aF9jb250ZXh0X2xvZ2dlZF9pbg=='}</code>
                    </div>
                </div>

                <div className="alert alert-info mt-3 mb-0" style={{ fontSize: '0.8rem' }}>
                    <strong>Viva Note:</strong> Encryption ensures <strong>Confidentiality</strong> (only authorized users see data).
                    Signatures ensure <strong>Integrity</strong> (data wasn't tampered).
                    Encoding is for <strong>Transmission</strong> compatibility.
                </div>
            </div>
        </div>
    );
};

export default SecurityPanel;
