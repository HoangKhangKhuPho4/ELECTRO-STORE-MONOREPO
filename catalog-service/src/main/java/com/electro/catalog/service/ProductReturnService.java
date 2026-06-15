package com.electro.catalog.service;

import com.electro.catalog.client.OrderRefundClient;
import com.electro.catalog.dto.ProductReturnDto;
import com.electro.catalog.entity.ProductItem;
import com.electro.catalog.entity.ProductItemStatus;
import com.electro.catalog.entity.ProductReturnSlip;
import com.electro.catalog.entity.ProductVariant;
import com.electro.catalog.exception.BadRequestException;
import com.electro.catalog.exception.ResourceNotFoundException;
import com.electro.catalog.repository.ProductItemRepository;
import com.electro.catalog.repository.ProductReturnSlipRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReturnService {

    private static final Logger log = LoggerFactory.getLogger(ProductReturnService.class);

    private final ProductReturnSlipRepository slipRepository;
    private final ProductItemRepository productItemRepository;
    private final InventoryService inventoryService;
    private final OrderRefundClient orderRefundClient;

    @Transactional(readOnly = true)
    public List<ProductReturnDto.Summary> list(String statusFilter) {
        List<ProductReturnSlip> rows;
        if (statusFilter != null && !statusFilter.isBlank()) {
            ProductReturnSlip.SlipStatus st = parseStatus(statusFilter);
            rows = slipRepository.findByStatusOrderByCreatedAtDesc(st);
        } else {
            rows = slipRepository.findAllByOrderByCreatedAtDesc();
        }
        return rows.stream().map(this::toSummary).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductReturnDto.Detail getDetail(Integer id) {
        return toDetail(loadSlip(id));
    }

    @Transactional(readOnly = true)
    public ProductReturnDto.LookupResponse lookup(String keyword) {
        String kw = keyword == null ? "" : keyword.trim();
        if (kw.isEmpty()) {
            throw new BadRequestException("Vui lòng nhập Serial, mã đơn hoặc mã vận đơn.");
        }
        ProductItem item = productItemRepository.findBySerialNumber(kw)
                .or(() -> productItemRepository.findByImeiOrSerialNumber(kw, kw))
                .orElseThrow(() -> new ResourceNotFoundException("ProductItem", "serialNumber", kw));

        ProductVariant variant = item.getVariant();
        String productName = variant != null && variant.getProduct() != null
                ? variant.getProduct().getName() : null;

        var pending = slipRepository.findFirstBySerialNumberAndStatus(
                item.getSerialNumber(), ProductReturnSlip.SlipStatus.PENDING);

        return ProductReturnDto.LookupResponse.builder()
                .serialNumber(item.getSerialNumber())
                .productItemId(item.getId())
                .variantId(variant != null ? variant.getId() : null)
                .productName(productName)
                .skuCode(variant != null ? variant.getSkuCode() : null)
                .variantName(variant != null ? variant.getVariantName() : null)
                .itemStatus(item.getStatus() != null ? item.getStatus().name() : null)
                .itemStatusLabel(itemStatusLabel(item.getStatus()))
                .hasPendingSlip(pending.isPresent())
                .pendingSlipId(pending.map(ProductReturnSlip::getId).orElse(null))
                .build();
    }

    @Transactional
    public ProductReturnDto.Detail open(ProductReturnDto.OpenRequest request) {
        String kw = request.getKeyword().trim();
        ProductReturnDto.LookupResponse lookup = lookup(kw);

        if (Boolean.TRUE.equals(lookup.getHasPendingSlip())) {
            throw new BadRequestException("Serial này đã có phiếu chờ xử lý. Mở phiếu hiện có để tiếp tục.");
        }

        ProductItem item = productItemRepository.findById(lookup.getProductItemId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductItem", "id", lookup.getProductItemId()));

        if (item.getStatus() == ProductItemStatus.AVAILABLE) {
            throw new BadRequestException("Serial đang AVAILABLE trong kho — không cần hoàn trả.");
        }
        if (item.getStatus() == ProductItemStatus.RESERVED) {
            throw new BadRequestException("Serial đang RESERVED — hoàn tất hoặc hủy đơn trước khi hoàn kho.");
        }

        ProductReturnSlip slip = ProductReturnSlip.builder()
                .slipCode(generateSlipCode())
                .status(ProductReturnSlip.SlipStatus.PENDING)
                .serialNumber(lookup.getSerialNumber())
                .productItemId(lookup.getProductItemId())
                .variantId(lookup.getVariantId())
                .orderId(request.getOrderId())
                .orderCode(request.getOrderCode())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .productName(lookup.getProductName())
                .skuCode(lookup.getSkuCode())
                .variantName(lookup.getVariantName())
                .trackingCode(request.getTrackingCode())
                .itemStatusBefore(item.getStatus() != null ? item.getStatus().name() : null)
                .build();

        return toDetail(slipRepository.save(slip));
    }

    @Transactional
    public ProductReturnDto.Detail process(Integer id, ProductReturnDto.ProcessRequest request) {
        ProductReturnSlip slip = loadSlip(id);
        if (slip.getStatus() != ProductReturnSlip.SlipStatus.PENDING) {
            throw new BadRequestException("Phiếu đã được xử lý.");
        }

        boolean defective = Boolean.TRUE.equals(request.getIsDefective());
        inventoryService.returnStockForSlip(slip.getSerialNumber(), defective,
                request.getReason(), request.getWarehouseNotes());

        slip.setStatus(ProductReturnSlip.SlipStatus.PROCESSED);
        slip.setIsDefective(defective);
        slip.setConditionType(defective
                ? ProductReturnSlip.ConditionType.DEFECTIVE
                : ProductReturnSlip.ConditionType.INTACT);
        slip.setReason(request.getReason());
        slip.setWarehouseNotes(request.getWarehouseNotes());
        slip.setProcessedAt(LocalDateTime.now());

        ProductReturnSlip saved = slipRepository.save(slip);
        triggerRefundRequest(saved, request);
        return toDetail(saved);
    }

    private void triggerRefundRequest(ProductReturnSlip slip, ProductReturnDto.ProcessRequest request) {
        if (slip.getOrderId() == null) {
            log.info("Slip {} has no orderId — skip refund request", slip.getSlipCode());
            return;
        }
        try {
            var refundReq = new OrderRefundClient.CreateFromReturnRequest(
                    slip.getId(),
                    slip.getSlipCode(),
                    slip.getOrderId(),
                    slip.getOrderCode(),
                    slip.getSerialNumber(),
                    slip.getCustomerName(),
                    slip.getCustomerPhone(),
                    slip.getProductName(),
                    slip.getIsDefective(),
                    request.getReason()
            );
            var refund = orderRefundClient.createFromReturn(refundReq);
            log.info("Refund request {} created for slip {}", refund.getRefundCode(), slip.getSlipCode());
        } catch (Exception e) {
            log.warn("Could not create refund request for slip {}: {}", slip.getSlipCode(), e.getMessage());
        }
    }

    private ProductReturnSlip loadSlip(Integer id) {
        return slipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductReturnSlip", "id", id));
    }

    private String generateSlipCode() {
        String prefix = "RT-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        long count = slipRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(s -> s.getSlipCode() != null && s.getSlipCode().startsWith(prefix))
                .count();
        return prefix + String.format("%04d", count + 1);
    }

    private ProductReturnSlip.SlipStatus parseStatus(String raw) {
        try {
            return ProductReturnSlip.SlipStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ: " + raw);
        }
    }

    private String itemStatusLabel(ProductItemStatus status) {
        if (status == null) return "—";
        return switch (status) {
            case AVAILABLE -> "Trong kho / Sẵn bán";
            case RESERVED -> "Đang giữ cho đơn";
            case SOLD -> "Đã xuất bán";
            case DEFECTIVE -> "Hàng lỗi";
            case IN_REPAIR -> "Đang bảo hành / sửa chữa";
        };
    }

    private String statusLabel(ProductReturnSlip.SlipStatus status) {
        return switch (status) {
            case PENDING -> "Chờ tiếp nhận";
            case PROCESSED -> "Đã xử lý";
        };
    }

    private ProductReturnDto.Summary toSummary(ProductReturnSlip s) {
        return ProductReturnDto.Summary.builder()
                .id(s.getId())
                .slipCode(s.getSlipCode())
                .status(s.getStatus().name())
                .statusLabel(statusLabel(s.getStatus()))
                .serialNumber(s.getSerialNumber())
                .orderCode(s.getOrderCode())
                .customerName(s.getCustomerName())
                .customerPhone(s.getCustomerPhone())
                .productName(s.getProductName())
                .skuCode(s.getSkuCode())
                .itemStatusBefore(s.getItemStatusBefore())
                .conditionType(s.getConditionType() != null ? s.getConditionType().name() : null)
                .isDefective(s.getIsDefective())
                .createdAt(s.getCreatedAt())
                .processedAt(s.getProcessedAt())
                .build();
    }

    private ProductReturnDto.Detail toDetail(ProductReturnSlip s) {
        return ProductReturnDto.Detail.builder()
                .id(s.getId())
                .slipCode(s.getSlipCode())
                .status(s.getStatus().name())
                .statusLabel(statusLabel(s.getStatus()))
                .serialNumber(s.getSerialNumber())
                .productItemId(s.getProductItemId())
                .variantId(s.getVariantId())
                .orderId(s.getOrderId())
                .orderCode(s.getOrderCode())
                .customerName(s.getCustomerName())
                .customerPhone(s.getCustomerPhone())
                .productName(s.getProductName())
                .skuCode(s.getSkuCode())
                .variantName(s.getVariantName())
                .trackingCode(s.getTrackingCode())
                .itemStatusBefore(s.getItemStatusBefore())
                .conditionType(s.getConditionType() != null ? s.getConditionType().name() : null)
                .isDefective(s.getIsDefective())
                .reason(s.getReason())
                .warehouseNotes(s.getWarehouseNotes())
                .createdAt(s.getCreatedAt())
                .processedAt(s.getProcessedAt())
                .build();
    }
}
