(function () {
    "use strict";

    // 설정 파일에서 개인정보 불러오기 (config.js가 없으면 빈 객체 사용)
    const config = window.PAYCO_CONFIG || {};

    const currentUrl = window.location.href;
    const MAX_RETRIES = 20;
    const RETRY_INTERVAL = 500;


    /**
     * 재시도 로직을 처리하는 공통 함수
     * @param {Function} callback - 실행할 함수 (성공 시 true 반환)
     * @param {number} maxRetries - 최대 재시도 횟수
     * @param {number} interval - 재시도 간격 (ms)
     */
    function retryUntilSuccess(callback, maxRetries = MAX_RETRIES, interval = RETRY_INTERVAL) {
        let tries = 0;
        const timer = setInterval(() => {
            if (callback() || tries >= maxRetries) {
                clearInterval(timer);
            }
            tries++;
        }, interval);
    }

    /**
     * input 요소에 값을 입력하고 필요한 이벤트를 트리거
     * @param {HTMLElement} element - 대상 요소
     * @param {string} value - 입력할 값
     */
    function simulateInput(element, value) {
        element.focus();
        element.value = value;

        const events = [
            new Event("input", { bubbles: true }),
            new Event("change", { bubbles: true }),
            new KeyboardEvent("keydown", { bubbles: true, key: value.slice(-1) }),
            new KeyboardEvent("keypress", { bubbles: true, key: value.slice(-1) }),
            new KeyboardEvent("keyup", { bubbles: true, key: value.slice(-1) })
        ];

        events.forEach(event => element.dispatchEvent(event));
    }

    /**
     * 체크박스를 체크하고 이벤트를 트리거
     * @param {HTMLElement} checkbox - 체크박스 요소
     */
    function checkCheckbox(checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // === 온스토브 웹상점 자동화 ===

    if (currentUrl.startsWith("https://webstore.onstove.com/ko/l9/order/")) {
        window.location.href = "https://webstore.onstove.com/ko/l9/item/7976";
        return;
    }

    if (currentUrl.startsWith("https://webstore.onstove.com/ko/l9/item/7976")) {
        retryUntilSuccess(() => {
            const inputBox = document.querySelector("input#check-num");
            const checkbox = document.querySelector("input#check3");

            if (inputBox && checkbox) {
                simulateInput(inputBox, "4");
                checkCheckbox(checkbox);
                return true;
            }
            return false;
        });
    }

    // === PAYCO 자동 로그인 ===

    if (currentUrl.startsWith("https://bill.payco.com/")) {
        retryUntilSuccess(() => {
            const memberInput = document.querySelector("#memberId");
            const birthInput = document.querySelector("#birth");

            if (memberInput && birthInput && config.memberId && config.birth) {
                simulateInput(memberInput, config.memberId);
                simulateInput(birthInput, config.birth);
                return true;
            }
            return false;
        });
    }

    // === 넷마블 컬쳐랜드 자동 선택 ===

    if (currentUrl.startsWith("https://nmp.netmarble.com/cross-pay/V5/")) {
        retryUntilSuccess(() => {
            const cultureland = document.querySelector('[data-key="2:CUL"]');
            const agreeCheckbox = document.querySelector('#iBuyAgreeCheckBox');
            const paymentButton = document.querySelector('.btn-wrap a, .btn-wrap button');

            // 컬쳐랜드 선택
            if (cultureland && !cultureland.classList.contains("active")) {
                cultureland.click();
            }

            // 동의 체크박스 선택
            if (agreeCheckbox && !agreeCheckbox.checked) {
                agreeCheckbox.click();
            }

            // 모든 조건이 충족되면 결제 버튼 클릭
            if ( cultureland?.classList.contains("active") && agreeCheckbox?.checked && paymentButton) {
                paymentButton.click();
                return true;
            }

            return false;
        });
    }
})();
