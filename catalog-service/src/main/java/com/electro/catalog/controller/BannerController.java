package com.electro.catalog.controller;

import com.electro.catalog.dto.BannerDto;
import com.electro.catalog.service.BannerService;
import com.electro.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BannerController {

    private final BannerService bannerService;

    /** Banner active cho storefront (hero carousel, sidebar, …). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BannerDto.Response>>> getActive(
            @RequestParam(required = false) String position) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy banner thành công",
                bannerService.getActivePublic(position)));
    }
}
