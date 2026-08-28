package com.electro.order.service;

import com.electro.order.dto.CouponDto;
import com.electro.order.entity.Coupon;
import com.electro.order.exception.BadRequestException;
import com.electro.order.exception.ResourceNotFoundException;
import com.electro.order.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<CouponDto.Response> getAllCoupons(String keyword, Boolean isActive, Pageable pageable) {
        return couponRepository.searchCoupons(keyword, isActive, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponDto.Response getCouponById(Integer id) {
        return couponRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
    }

    @Override
    public CouponDto.Response createCoupon(CouponDto.CreateRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.existsByCode(code)) {
            throw new BadRequestException("Mã giảm giá đã tồn tại: " + code);
        }

        validateBusinessRules(
                request.getDiscountType(),
                request.getDiscountValue(),
                request.getDateStart(),
                request.getDateEnd(),
                request.getUsageLimit());

        Coupon coupon = new Coupon();
        applyCreate(coupon, request);
        coupon.setCode(code);
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    public CouponDto.Response updateCoupon(Integer id, CouponDto.UpdateRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));

        String discountType = request.getDiscountType() != null
                ? request.getDiscountType()
                : (coupon.getDiscountType() != null ? coupon.getDiscountType().name() : null);
        BigDecimal discountValue = request.getDiscountValue() != null
                ? request.getDiscountValue()
                : coupon.getDiscountValue();
        LocalDateTime dateStart = request.getDateStart() != null
                ? request.getDateStart()
                : coupon.getDateStart();
        LocalDateTime dateEnd = request.getDateEnd() != null
                ? request.getDateEnd()
                : coupon.getDateEnd();
        Integer usageLimit = request.getUsageLimit() != null
                ? request.getUsageLimit()
                : coupon.getUsageLimit();

        validateBusinessRules(discountType, discountValue, dateStart, dateEnd, usageLimit);

        if (request.getCode() != null) {
            String newCode = request.getCode().trim().toUpperCase();
            if (!newCode.equals(coupon.getCode()) && couponRepository.existsByCode(newCode)) {
                throw new BadRequestException("Mã giảm giá đã tồn tại: " + newCode);
            }
        }

        applyUpdate(coupon, request);
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    public void deleteCoupon(Integer id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));

        if (coupon.getUsedCount() != null && coupon.getUsedCount() > 0) {
            throw new BadRequestException(
                    "Không thể xóa mã đã được sử dụng " + coupon.getUsedCount()
                            + " lần. Hãy tắt mã thay vì xóa.");
        }

        couponRepository.deleteById(id);
    }

    @Override
    public CouponDto.Response toggleActive(Integer id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponDto.Response> getActiveCoupons() {
        return couponRepository.findActiveCoupons(LocalDateTime.now()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CouponDto.StatsResponse getCouponStats() {
        CouponDto.StatsResponse stats = new CouponDto.StatsResponse();
        stats.setTotal(couponRepository.count());
        stats.setActiveCount(couponRepository.countByIsActive(true));
        stats.setInactiveCount(couponRepository.countByIsActive(false));
        stats.setPercentCount(couponRepository.countByDiscountType(Coupon.DiscountType.PERCENT));
        return stats;
    }

    private void validateBusinessRules(
            String discountType,
            BigDecimal discountValue,
            LocalDateTime dateStart,
            LocalDateTime dateEnd,
            Integer usageLimit) {
        if (discountValue == null || discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Giá trị giảm phải lớn hơn 0");
        }

        if ("PERCENT".equalsIgnoreCase(discountType) && discountValue.compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException("Giảm theo % không được vượt quá 100%");
        }

        if (dateStart == null || dateEnd == null) {
            throw new BadRequestException("Ngày bắt đầu và ngày kết thúc là bắt buộc");
        }

        if (!dateStart.isBefore(dateEnd)) {
            throw new BadRequestException("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
        }

        if (usageLimit != null && usageLimit <= 0) {
            throw new BadRequestException("Giới hạn sử dụng phải lớn hơn 0");
        }
    }

    private CouponDto.Response toResponse(Coupon c) {
        CouponDto.Response r = new CouponDto.Response();
        r.setId(c.getId());
        r.setCode(c.getCode());
        r.setName(c.getName());
        r.setDescription(c.getDescription());
        r.setDiscountType(c.getDiscountType() != null ? c.getDiscountType().name() : null);
        r.setDiscountValue(c.getDiscountValue());
        r.setMinOrderValue(c.getMinOrderValue());
        r.setMaxDiscountAmount(c.getMaxDiscountAmount());
        r.setUsageLimit(c.getUsageLimit());
        r.setUsedCount(c.getUsedCount());
        r.setDateStart(c.getDateStart());
        r.setDateEnd(c.getDateEnd());
        r.setIsActive(c.getIsActive());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }

    private void applyCreate(Coupon coupon, CouponDto.CreateRequest request) {
        coupon.setCode(request.getCode().trim().toUpperCase());
        coupon.setName(request.getName());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(Coupon.DiscountType.valueOf(request.getDiscountType()));
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setDateStart(request.getDateStart());
        coupon.setDateEnd(request.getDateEnd());
        coupon.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
    }

    private void applyUpdate(Coupon coupon, CouponDto.UpdateRequest request) {
        if (request.getCode() != null) {
            coupon.setCode(request.getCode().trim().toUpperCase());
        }
        if (request.getName() != null) {
            coupon.setName(request.getName());
        }
        if (request.getDescription() != null) {
            coupon.setDescription(request.getDescription());
        }
        if (request.getDiscountType() != null) {
            coupon.setDiscountType(Coupon.DiscountType.valueOf(request.getDiscountType()));
        }
        if (request.getDiscountValue() != null) {
            coupon.setDiscountValue(request.getDiscountValue());
        }
        if (request.getMinOrderValue() != null) {
            coupon.setMinOrderValue(request.getMinOrderValue());
        }
        if (request.getMaxDiscountAmount() != null) {
            coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        }
        if (request.getUsageLimit() != null) {
            coupon.setUsageLimit(request.getUsageLimit());
        }
        if (request.getDateStart() != null) {
            coupon.setDateStart(request.getDateStart());
        }
        if (request.getDateEnd() != null) {
            coupon.setDateEnd(request.getDateEnd());
        }
        if (request.getIsActive() != null) {
            coupon.setIsActive(request.getIsActive());
        }
    }
}
