package com.electro.order.controller;

import com.electro.order.service.OrderStatisticsService;
import com.electro.order.service.FinanceStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders/internal/statistics")
@RequiredArgsConstructor
public class InternalStatisticsController {

    private final OrderStatisticsService orderStatisticsService;
    private final FinanceStatisticsService financeStatisticsService;

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return orderStatisticsService.getOverviewStatistics();
    }

    @GetMapping("/revenue/chart")
    public Map<String, Object> revenueChart(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return orderStatisticsService.getRevenueChart(period, startDate, endDate);
    }

    @GetMapping("/orders/by-status")
    public Map<String, Object> orderStatus() {
        return orderStatisticsService.getOrderStatusStats();
    }

    @GetMapping("/top-products")
    public List<Map<String, Object>> topProducts(@RequestParam(defaultValue = "10") int limit) {
        return orderStatisticsService.getTopSellingProducts(limit);
    }

    @GetMapping("/orders/recent")
    public Map<String, Object> recentOrders(@RequestParam(defaultValue = "10") int limit) {
        return orderStatisticsService.getRecentOrders(limit);
    }

    @GetMapping("/payment-methods")
    public Map<String, Object> paymentMethods() {
        return orderStatisticsService.getPaymentMethodStats();
    }

    @GetMapping("/action-kpis")
    public Map<String, Object> actionKpis() {
        return orderStatisticsService.getActionKpis();
    }

    @GetMapping("/revenue/by-product")
    public List<Map<String, Object>> revenueByProduct(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return orderStatisticsService.getRevenueByProduct(startDate, endDate);
    }

    @GetMapping("/finance/summary")
    public Map<String, Object> financeSummary(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return financeStatisticsService.getFinanceSummary(startDate, endDate);
    }

    @GetMapping("/finance/ledger")
    public Map<String, Object> financeLedger(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return financeStatisticsService.getFinanceLedger(startDate, endDate, page, limit);
    }
}
