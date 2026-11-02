-- 원보틀 카페 확정 스키마 (AGENTS.md 기준)
-- MySQL 8.0.16 이상 / utf8mb4
-- 문서 작성용: 아직 실행하지 않음. 적용 시 대상 DB를 먼저 선택한다.
-- 기존 객체 삭제, 샘플 데이터 삽입, 관리자 테이블 생성 없음.

CREATE TABLE MENU_CATEGORY (
    category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MENU (
    menu_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 0) NOT NULL,
    image_path VARCHAR(500) NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_category FOREIGN KEY (category_id)
        REFERENCES MENU_CATEGORY(category_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_menu_price CHECK (price >= 0),
    CONSTRAINT chk_menu_published CHECK (is_published IN (0, 1)),
    INDEX idx_menu_display (category_id, is_published, sort_order, menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE NOTICE (
    notice_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_notice_published CHECK (is_published IN (0, 1)),
    INDEX idx_notice_display (is_published, created_at, notice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
