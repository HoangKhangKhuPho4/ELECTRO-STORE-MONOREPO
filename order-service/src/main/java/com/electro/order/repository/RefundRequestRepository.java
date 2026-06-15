package com.electro.order.repository;

import com.electro.order.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Integer> {

    List<RefundRequest> findAllByOrderByCreatedAtDesc();

    List<RefundRequest> findByStatusOrderByCreatedAtDesc(RefundRequest.RefundStatus status);

    Optional<RefundRequest> findByReturnSlipId(Integer returnSlipId);

    Optional<RefundRequest> findByRefundCode(String refundCode);

    List<RefundRequest> findByOrderId(Integer orderId);
}
