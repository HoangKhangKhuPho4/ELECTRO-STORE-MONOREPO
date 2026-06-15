package com.electro.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RefundDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateFromReturnRequest {
        private Integer returnSlipId;
        private String returnSlipCode;
        private Integer orderId;
        private String orderCode;
        private String serialNumber;
        private String customerName;
        private String customerPhone;
        private String productName;
        private Boolean isDefective;
        private String returnReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApproveRequest {
        private String notes;
        private String customerBankName;
        private String customerBankAccount;
        private String customerBankAccountName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RejectRequest {
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmManualTransferRequest {
        private String transferReference;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmCodRequest {
        private String customerBankName;
        private String customerBankAccount;
        private String customerBankAccountName;
        private String transferReference;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Voucher {
        private String voucherCode;
        private LocalDateTime issuedAt;
        private String recipientName;
        private String recipientBank;
        private String recipientAccount;
        private String reason;
        private BigDecimal amount;
        private String orderCode;
        private String returnSlipCode;
        private String refundCode;
        private String receiptImageUrl;
        private String paymentMethodLabel;
        private String gatewayTransactionId;
        private String approvedBy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Summary {
        private Integer id;
        private String refundCode;
        private String status;
        private String statusLabel;
        private String orderCode;
        private String returnSlipCode;
        private String serialNumber;
        private String customerName;
        private String customerPhone;
        private String productName;
        private BigDecimal refundAmount;
        private String paymentMethod;
        private String refundChannel;
        private String refundChannelLabel;
        private Boolean isDefective;
        private String voucherCode;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Detail {
        private Integer id;
        private String refundCode;
        private String status;
        private String statusLabel;
        private Integer orderId;
        private String orderCode;
        private String orderStatus;
        private String orderPaymentStatus;
        private Integer returnSlipId;
        private String returnSlipCode;
        private String serialNumber;
        private String customerName;
        private String customerPhone;
        private String productName;
        private BigDecimal refundAmount;
        private String paymentMethod;
        private String paymentMethodLabel;
        private String refundChannel;
        private String refundChannelLabel;
        private Boolean isDefective;
        private String returnReason;
        private String voucherCode;
        private String customerBankName;
        private String customerBankAccount;
        private String customerBankAccountName;
        private String gatewayRefundId;
        private String gatewayResponse;
        private String failureReason;
        private String transferReference;
        private String receiptImageUrl;
        private String originalGatewayTransactionId;
        private BigDecimal originalPaymentAmount;
        private String approvedBy;
        private LocalDateTime approvedAt;
        private String rejectedBy;
        private LocalDateTime rejectedAt;
        private String rejectionReason;
        private String executedBy;
        private LocalDateTime executedAt;
        private LocalDateTime completedAt;
        private String notes;
        private LocalDateTime createdAt;
    }
}
