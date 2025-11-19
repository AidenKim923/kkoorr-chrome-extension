/**
 * Chrome Extension
 *
 * 주요 기능:
 * - PAYCO 자동 로그인
 * - 온스토브 웹상점 자동 처리
 * - 기프티쇼 자동 입력
 * - 아이템매니아 편의 기능
 * - 넷마블 결제 자동화
 *
 * @version 1.4
 */
(async function () {
  'use strict';

  // ========================================
  // 설정 로드 및 초기화
  // ========================================

  /**
   * config.js에서 기본 설정을 가져옴
   * window.PAYCO_CONFIG가 없을 경우 빈 객체 사용
   */
  const defaultConfig = window.PAYCO_CONFIG || {};

  /**
   * Chrome Storage에서 사용자 설정을 비동기로 로드
   * @returns {Promise<Object>} 사용자 설정 객체
   */
  const loadSettings = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(defaultConfig, (data) => {
        resolve(data);
      });
    });
  };

  // 사용자 설정 로드
  const userSettings = await loadSettings();

  /**
   * PAYCO 로그인용 설정
   * 다른 설정과 분리하여 보안상 중요한 정보만 관리
   */
  const config = {
    memberId: userSettings.memberId,
    birth: userSettings.birth,
  };

  // ========================================
  // 전역 상수 정의
  // ========================================

  const currentUrl = window.location.href;
  const MAX_RETRIES = 20;
  const RETRY_INTERVAL = 500;
  const CHARACTER_NAMES = userSettings.characterNames;
  const QUICK_REPLIES = userSettings.quickReplies;
  const GIFTSHOW_DEFAULT_PHONE = userSettings.giftshowDefaultPhone || '';
  const GIFTSHOW_SENDER_NAME = userSettings.giftshowSenderName || '';

  // ========================================
  // 유틸리티 함수들
  // ========================================

  /**
   * DOM 요소가 로드될 때까지 콜백을 반복 실행
   *
   * 페이지가 동적으로 로드되는 경우 요소가 즉시 존재하지 않을 수 있음
   * 일정 간격으로 재시도하여 요소를 찾고 작업을 수행
   *
   * @param {Function} callback - 실행할 콜백 함수 (성공 시 true 반환)
   * @param {number} maxRetries - 최대 재시도 횟수
   * @param {number} interval - 재시도 간격 (밀리초)
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
   * 입력 필드에 값을 설정하고 모든 관련 이벤트를 발생시킴
   *
   * React 등 프레임워크에서 감지할 수 있도록 다양한 이벤트를 발생시킴
   * - input: 값 변경 감지
   * - change: 폼 변경 감지
   * - keyboard events: 타이핑 시뮬레이션
   *
   * @param {HTMLElement} element - 입력 요소
   * @param {string} value - 설정할 값
   */
  function simulateInput(element, value) {
    if (!element) return;

    element.focus();
    element.value = value;

    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }),
      new KeyboardEvent('keypress', { bubbles: true, key: value.slice(-1) }),
      new KeyboardEvent('keyup', { bubbles: true, key: value.slice(-1) }),
    ];

    events.forEach((event) => element.dispatchEvent(event));
  }

  /**
   * 체크박스를 체크 상태로 변경
   *
   * @param {HTMLInputElement} checkbox - 체크박스 요소
   * @returns {boolean} 성공 여부
   */
  function checkElement(checkbox) {
    if (!checkbox) return false;

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /**
   * 요소 클릭 (존재 여부 확인 포함)
   *
   * @param {HTMLElement} element - 클릭할 요소
   * @returns {boolean} 성공 여부
   */
  function clickElement(element) {
    if (!element) return false;
    element.click();
    return true;
  }

  /**
   * Select 요소의 값을 변경
   *
   * @param {HTMLSelectElement} selectElement - Select 요소
   * @param {string} value - 설정할 값
   * @returns {boolean} 값이 변경되었는지 여부
   */
  function setSelectValue(selectElement, value) {
    if (!selectElement || selectElement.value === value) return false;

    selectElement.value = value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /**
   * 현재 URL이 특정 패턴으로 시작하는지 확인
   *
   * @param {string} pattern - 확인할 URL 패턴
   * @returns {boolean} 일치 여부
   */
  function matchesUrl(pattern) {
    return currentUrl.startsWith(pattern);
  }

  /**
   * 배열에서 랜덤 요소 선택
   *
   * @param {Array} array - 대상 배열
   * @returns {*} 랜덤하게 선택된 요소
   */
  function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 화면 상단 고정 버튼 생성
   *
   * 원본 버튼을 복제하여 화면 상단 좌측에 고정된 버튼을 생성
   * 스크롤해도 항상 보이도록 하여 접근성 향상
   *
   * @param {HTMLElement} originalButton - 복제할 원본 버튼
   * @param {string} text - 버튼에 표시할 텍스트
   */
  function createFixedButton(originalButton, text) {
    if (!originalButton) return;

    const clone = originalButton.cloneNode(true);
    originalButton.parentElement.insertBefore(
      clone,
      originalButton.parentElement.firstChild
    );

    clone.textContent = text;
    Object.assign(clone.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: '9999',
      padding: '10px 20px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    });

    clone.addEventListener('click', () => originalButton.click());
  }

  // ========================================
  // 사이트별 핸들러
  // ========================================

  /**
   * 각 웹사이트별 자동화 기능을 담당하는 핸들러 객체
   * 새로운 사이트 추가 시 여기에 핸들러를 추가하면 됨
   */
  const handlers = {
    /**
     * 온스토브 웹상점 관련 핸들러
     */
    onstove: {
      /**
       * 주문 페이지에서 아이템 페이지로 자동 리다이렉트
       *
       * 주문 페이지에 접속 시 특정 아이템 페이지로 자동 이동
       * URL: https://webstore.onstove.com/ko/l9/order/ → item/7976
       */
      orderRedirect() {
        if (matchesUrl('https://webstore.onstove.com/ko/l9/order/')) {
          window.location.href = 'https://webstore.onstove.com/ko/l9/item/7976';
        }
      },

      /**
       * 아이템 페이지에서 수량 및 동의 자동 입력
       *
       * - 수량 입력란에 '4' 자동 입력
       * - 구매 동의 체크박스 자동 체크
       */
      itemPage() {
        if (!matchesUrl('https://webstore.onstove.com/ko/l9/item/7976')) return;

        retryUntilSuccess(() => {
          const inputBox = document.querySelector('input#check-num');
          const checkbox = document.querySelector('input#check3');

          if (inputBox && checkbox) {
            simulateInput(inputBox, '4');
            checkElement(checkbox);
            return true;
          }
          return false;
        });
      },
    },

    /**
     * PAYCO 결제 관련 핸들러
     */
    payco: {
      /**
       * PAYCO 간편 로그인 자동 입력
       *
       * 설정된 전화번호와 생년월일을 자동으로 입력
       * config.js 또는 팝업 설정에서 관리되는 값 사용
       */
      autoLogin() {
        if (!matchesUrl('https://bill.payco.com/')) return;

        retryUntilSuccess(() => {
          const memberInput = document.querySelector('#memberId');
          const birthInput = document.querySelector('#birth');

          if (memberInput && birthInput && config.memberId && config.birth) {
            simulateInput(memberInput, config.memberId);
            simulateInput(birthInput, config.birth);
            return true;
          }
          return false;
        });
      },
    },

    /**
     * 넷마블 결제 관련 핸들러
     */
    netmarble: {
      /**
       * 문화상품권 결제 자동 선택 및 진행
       *
       * 동작 순서:
       * 1. 문화상품권 결제 수단 선택
       * 2. 구매 동의 체크박스 자동 체크
       * 3. 결제 버튼 자동 클릭
       */
      culturelandPayment() {
        if (!matchesUrl('https://nmp.netmarble.com/cross-pay/V5/')) return;

        retryUntilSuccess(() => {
          const cultureland = document.querySelector('[data-key="2:CUL"]');
          const agreeCheckbox = document.querySelector('#iBuyAgreeCheckBox');
          const paymentButton = document.querySelector('.btn-wrap a, .btn-wrap button');

          // 문화상품권이 선택되지 않았으면 선택
          if (cultureland && !cultureland.classList.contains('active')) {
            cultureland.click();
          }

          // 동의 체크박스가 체크되지 않았으면 체크
          if (agreeCheckbox && !agreeCheckbox.checked) {
            agreeCheckbox.click();
          }

          // 모든 준비가 완료되었는지 확인
          const allReady =
            cultureland?.classList.contains('active') &&
            agreeCheckbox?.checked &&
            paymentButton;

          // 모두 준비되었으면 결제 진행
          if (allReady) {
            paymentButton.click();
            return true;
          }

          return false;
        });
      },
    },

    /**
     * 아이템매니아 거래소 관련 핸들러
     */
    itemmania: {
      /**
       * 구매 등록 페이지 자동 입력
       *
       * 3단계로 나누어 처리:
       * 1. 기본 정보 입력 (수량, 가격, 제목)
       * 2. 거래 옵션 설정 (직거래, 신용등급, 캐릭터)
       * 3. 고정 버튼 생성 (접근성 향상)
       */
      buyPageAutoFill() {
        if (!matchesUrl('https://trade.itemmania.com/buy/')) return;

        // 1단계: 기본 정보 자동 입력
        retryUntilSuccess(() => {
          const qtyInput = document.querySelector('#user_quantity');
          const priceInput = document.querySelector('#user_price');
          const titleInput = document.querySelector('#user_title');

          if (qtyInput && priceInput && titleInput) {
            simulateInput(qtyInput, '4000');
            simulateInput(priceInput, '60000');
            simulateInput(titleInput, '혈원 분배용 다이아 삽니다');
            return true;
          }
          return false;
        });

        // 2단계: 거래 옵션 설정
        retryUntilSuccess(() => {
          const checkbox = document.querySelector('#direct_reg_trade.g_checkbox');
          const selectBox = document.querySelector('select[name="direct_condition_credit"]');
          const charInput = document.querySelector('#user_character');

          let checkboxDone = false;
          let selectDone = false;
          let charDone = false;

          // 직거래 체크박스 활성화
          if (checkbox) {
            if (!checkbox.checked) {
              clickElement(checkbox);
            }
            checkboxDone = true;
          }

          // 신용등급 선택 (값 '2' 선택)
          if (selectBox) {
            if (selectBox.value !== '2') {
              setSelectValue(selectBox, '2');
            }
            selectDone = true;
          }

          // 캐릭터 이름 자동 입력 (설정된 목록에서 랜덤 선택)
          if (charInput && !charInput.value) {
            const randomName = getRandomElement(CHARACTER_NAMES);
            simulateInput(charInput, randomName);
            charDone = true;
          } else if (charInput && charInput.value) {
            charDone = true;
          }

          return checkboxDone && selectDone && charDone;
        });

        // 3단계: 화면 상단에 고정 버튼 생성
        retryUntilSuccess(() => {
          const buyButton = document.querySelector('#ok_btn.buy_reg');

          if (buyButton) {
            // 중복 생성 방지
            const existingFixed = document.querySelector('[style*="position: fixed"][style*="top: 10px"]');
            if (!existingFixed) {
              createFixedButton(buyButton, '구매등록 (상단)');
            }
            return true;
          }
          return false;
        });
      },

      /**
       * 현금영수증 미발급 자동 선택
       *
       * 구매/판매 진행 중 페이지에서 현금영수증 미발급 라디오 버튼을 자동 선택
       * 양쪽 페이지 모두 지원
       */
      receiptNoIssue() {
        const buyView = 'https://trade.itemmania.com/myroom/buy/buy_ing_view.html';
        const sellView = 'https://trade.itemmania.com/myroom/sell/sell_ing_view.html';

        if (!matchesUrl(buyView) && !matchesUrl(sellView)) return;

        retryUntilSuccess(() => {
          const radio = document.querySelector('#moneyreceipt_check2');
          if (radio && !radio.checked) {
            clickElement(radio);
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        });
      },

      /**
       * 판매자 동의 팝업 자동 처리
       *
       * MutationObserver를 사용하여 팝업이 나타나는 것을 감지
       * 팝업이 나타나면 자동으로 동의 체크하고 확인 버튼 클릭
       *
       * 주의: 팝업은 동적으로 생성되므로 DOM 변화 감지 필요
       */
      sellerAgreementPopup() {
        if (!matchesUrl('https://trade.itemmania.com/buy/')) return;

        const observer = new MutationObserver(() => {
          const checkbox = document.querySelector('#seller_agreement');
          const confirmButton = document.querySelector('.btn_green');

          if (checkbox && confirmButton && !checkbox.checked) {
            clickElement(checkbox);
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));

            setTimeout(() => {
              clickElement(confirmButton);
            }, 300);
            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      },

      /**
       * 채팅방에 빠른 응답 버튼 추가
       *
       * 화면 우측에 고정된 버튼 패널을 생성하여 빠른 응답 가능
       *
       * 기능:
       * - 에이스/광속/찐: 여러 메시지를 순차적으로 전송 (0.5초 간격)
       * - 상점-재화/다하면인수: 단일 메시지 전송
       * - 버튼 hover 효과 포함
       *
       * 메시지는 config.js 또는 팝업 설정에서 관리
       */
      addQuickReplyButtons() {
        if (!matchesUrl('https://trade.itemmania.com/myroom/chat/new_chat.html')) return;

        retryUntilSuccess(() => {
          const chatRoom = document.querySelector('.chat_room');
          const textarea = document.querySelector('#write_chat');

          if (!chatRoom || !textarea) return false;

          if (document.querySelector('.quick-reply-container')) return true;

          const container = document.createElement('div');
          container.className = 'quick-reply-container';
          Object.assign(container.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          });

          const buttonIndexes = {
            에이스: 0,
            광속: 0,
            찐: 0,
          };

          const buttonOrder = ['에이스', '광속', '찐', '상점-재화', '다하면인수'];

          buttonOrder.forEach((label) => {
            if (!QUICK_REPLIES[label]) return;

            const button = document.createElement('button');
            button.textContent = label;
            Object.assign(button.style, {
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background 0.2s',
            });

            button.addEventListener('mouseenter', () => {
              button.style.background = '#45a049';
            });

            button.addEventListener('mouseleave', () => {
              button.style.background = '#4CAF50';
            });

            button.addEventListener('click', () => {
              const messages = QUICK_REPLIES[label];

              if (buttonIndexes.hasOwnProperty(label)) {
                const currentIndex = buttonIndexes[label];

                messages.forEach((message, idx) => {
                  setTimeout(() => {
                    simulateInput(textarea, message);

                    setTimeout(() => {
                      const sendButton = document.querySelector('button#send_btn.send_btn');
                      if (sendButton) {
                        sendButton.click();
                      }
                    }, 100);
                  }, idx * 500);
                });

                buttonIndexes[label] = (currentIndex + messages.length) % messages.length;
              } else {
                simulateInput(textarea, messages[0]);

                setTimeout(() => {
                  const sendButton = document.querySelector('button#send_btn.send_btn');
                  if (sendButton) {
                    sendButton.click();
                  }
                }, 100);
              }
            });

            container.appendChild(button);
          });

          document.body.appendChild(container);

          return true;
        });
      },
    },

    /**
     * 기프티쇼 자동 입력 핸들러
     */
    giftshow: {
      /**
       * 기프티쇼 전화번호 및 보내는 사람 이름 자동 입력
       *
       * 주요 기능:
       * 1. 드래그 가능한 플로팅 UI 제공
       * 2. 일괄 입력 (최대 200개)
       * 3. 중복 번호 허용 체크박스 자동 클릭
       * 4. 설정 저장 기능
       *
       * 복잡한 DOM 구조를 가진 사이트이므로 여러 선택자 fallback 제공
       */
      autoFillPhoneNumbers() {
        if (!window.location.href.includes('kshop.co.kr/custord/giftishowDecorate')) return;

        /**
         * 플로팅 컨트롤 박스 생성
         *
         * - 드래그 가능한 패널
         * - 보내는 사람 이름, 전화번호, 입력 개수 설정
         * - 자동 입력, 지우기, 설정 저장 버튼 제공
         */
        const createFloatingBox = () => {
          const existing = document.getElementById('giftshow-auto-filler');
          if (existing) existing.remove();

          const floatingBox = document.createElement('div');
          floatingBox.id = 'giftshow-auto-filler';
          floatingBox.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 280px;
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: 'Malgun Gothic', sans-serif;
          `;

          floatingBox.innerHTML = `
            <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 6px 6px 0 0; cursor: move;">
              <h3 style="margin: 0; font-size: 14px;">기프티쇼 자동 입력</h3>
            </div>
            <div style="padding: 15px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #555;">보내는 사람 이름:</label>
                <input type="text" id="gaf-sender" value="${GIFTSHOW_SENDER_NAME}" placeholder="보내는 사람"
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #555;">기본 번호:</label>
                <input type="text" id="gaf-phone" value="${GIFTSHOW_DEFAULT_PHONE}" placeholder="010-0000-0000"
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #555;">입력 개수:</label>
                <input type="number" id="gaf-count" value="1" min="1" max="200"
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
              </div>
              <div style="display: flex; gap: 10px;">
                <button id="gaf-fill" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">
                  자동 입력 실행
                </button>
                <button id="gaf-clear" style="padding: 10px 15px; background: #f44336; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;">
                  지우기
                </button>
              </div>
              <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button id="gaf-save" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                  설정 저장
                </button>
              </div>
              <div id="gaf-status" style="margin-top: 10px; padding: 8px; border-radius: 4px; font-size: 12px; text-align: center; display: none;"></div>
            </div>
          `;

          document.body.appendChild(floatingBox);

          let isDragging = false;
          let dragOffset = { x: 0, y: 0 };
          const header = floatingBox.querySelector('div');

          header.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffset.x = e.clientX - floatingBox.offsetLeft;
            dragOffset.y = e.clientY - floatingBox.offsetTop;
          });

          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            floatingBox.style.left = (e.clientX - dragOffset.x) + 'px';
            floatingBox.style.top = (e.clientY - dragOffset.y) + 'px';
            floatingBox.style.transform = 'none';
          });

          document.addEventListener('mouseup', () => {
            isDragging = false;
          });

          /**
           * 설정을 Chrome Storage에 저장
           */
          const saveSettings = () => {
            const senderInput = document.getElementById('gaf-sender').value;
            const phoneInput = document.getElementById('gaf-phone').value;
            const status = document.getElementById('gaf-status');

            chrome.storage.sync.set({
              giftshowSenderName: senderInput,
              giftshowDefaultPhone: phoneInput
            }, () => {
              showStatus(status, '설정이 저장되었습니다!', true);
            });
          };

          // 이벤트 리스너 등록
          document.getElementById('gaf-fill').addEventListener('click', fillPhoneNumbers);
          document.getElementById('gaf-clear').addEventListener('click', clearAllFields);
          document.getElementById('gaf-save').addEventListener('click', saveSettings);
        };

        // 중복 체크 실행 여부 플래그 (한 번만 실행)
        let duplicateCheckExecuted = false;

        /**
         * 휴대폰 번호 중복 허용 체크박스 자동 클릭
         *
         * 기프티쇼는 동일 번호 입력 시 중복 체크 옵션 활성화 필요
         * 여러 선택자 패턴을 시도하여 체크박스를 찾음
         *
         * @returns {boolean} 체크박스 클릭 성공 여부
         */
        const checkDuplicateAllowance = () => {
          if (duplicateCheckExecuted) {
            return true;
          }

          // 1순위: ID로 직접 찾기
          const iconCheckbox = document.getElementById('icon-checkbox');
          if (iconCheckbox) {
            iconCheckbox.click();
            duplicateCheckExecuted = true;
            return true;
          }

          // 2순위: 체크박스 컨테이너에서 텍스트로 찾기
          const checkboxContainers = document.querySelectorAll('.checkbox, [class*="checkbox"]');
          for (const container of checkboxContainers) {
            const text = container.textContent || container.innerText || '';
            if (text.includes('휴대폰번호') && text.includes('중복')) {
              const checkbox = container.querySelector('#icon-checkbox, input[type="checkbox"]');
              if (checkbox) {
                checkbox.click();
                duplicateCheckExecuted = true;
                return true;
              }
            }
          }

          // 3순위: Label에서 찾기
          const labels = document.querySelectorAll('label');
          for (const label of labels) {
            const text = label.textContent || label.innerText || '';
            if (text.includes('휴대폰번호') && text.includes('중복')) {
              const checkbox = label.querySelector('#icon-checkbox, input[type="checkbox"]');
              if (checkbox) {
                checkbox.click();
                duplicateCheckExecuted = true;
                return true;
              }

              // Label의 for 속성으로 체크박스 찾기
              const forId = label.getAttribute('for');
              if (forId) {
                const checkbox = document.getElementById(forId);
                if (checkbox) {
                  checkbox.click();
                  duplicateCheckExecuted = true;
                  return true;
                }
              }
            }
          }

          return false;
        };

        const setInputValue = (input, value) => {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;

          input.click();
          input.focus();

          nativeInputValueSetter.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));

          let currentValue = '';
          for (let i = 0; i < value.length; i++) {
            currentValue += value[i];
            nativeInputValueSetter.call(input, currentValue);
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: value[i] }));
            input.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: value[i] }));
            input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: value[i] }));
          }

          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
          input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        };

        const showStatus = (statusElement, message, isSuccess) => {
          statusElement.style.display = 'block';
          statusElement.textContent = message;
          statusElement.style.background = isSuccess ? '#c8e6c9' : '#ffcdd2';
          statusElement.style.color = isSuccess ? '#2e7d32' : '#c62828';

          setTimeout(() => {
            statusElement.style.display = 'none';
          }, isSuccess ? 2000 : 3000);
        };

        const fillPhoneNumbers = () => {
          const senderInput = document.getElementById('gaf-sender').value;
          const phoneInput = document.getElementById('gaf-phone').value;
          const count = parseInt(document.getElementById('gaf-count').value) || 1;
          const status = document.getElementById('gaf-status');

          setTimeout(checkDuplicateAllowance, 100);

          let filledCount = 0;
          let senderFilledCount = 0;

          const phoneFields = document.querySelectorAll('input[placeholder="(필수) 휴대폰번호"]');

          phoneFields.forEach((field, index) => {
            if (index >= count) return;
            setInputValue(field, phoneInput);
            filledCount++;
          });

          const senderSelectors = [
            'input[placeholder="누구 보내는 선물인가요? (최대 10자)"]',
            'input[placeholder*="보내는"]',
            'input[placeholder*="선물"]',
            'input[type="text"][maxlength="10"]'
          ];

          let senderFields = [];
          for (const selector of senderSelectors) {
            senderFields = document.querySelectorAll(selector);
            if (senderFields.length > 0) break;
          }

          if (senderFields.length === 0) {
            const allTextFields = document.querySelectorAll('input[type="text"]');
            const candidateFields = Array.from(allTextFields).filter(field => {
              const placeholder = field.placeholder || '';
              const value = field.value || '';
              return !placeholder.includes('휴대폰') &&
                     !placeholder.includes('전화') &&
                     !placeholder.includes('핸드폰') &&
                     value.length <= 10;
            });
            senderFields = candidateFields;
          }

          senderFields.forEach((field, index) => {
            if (index >= count) return;
            setInputValue(field, senderInput);
            senderFilledCount++;
          });

          if (filledCount === 0) {
            const altSelectors = [
              'input[placeholder*="휴대폰"]',
              'input[placeholder*="핸드폰"]',
              'input[placeholder*="전화번호"]',
              'input[placeholder="010-0000-0000"]',
              'input[type="tel"]'
            ];

            for (const selector of altSelectors) {
              const fields = document.querySelectorAll(selector);
              if (fields.length > 0) {
                fields.forEach((field, index) => {
                  if (index >= count) return;
                  setInputValue(field, phoneInput);
                  filledCount++;
                });

                if (filledCount > 0) break;
              }
            }
          }

          if (filledCount > 0 || senderFilledCount > 0) {
            const parts = [];
            if (senderFilledCount > 0) parts.push(`보내는 사람 ${senderFilledCount}개`);
            if (filledCount > 0) parts.push(`전화번호 ${filledCount}개`);
            showStatus(status, `${parts.join(', ')} 입력 완료!`, true);
          } else {
            showStatus(status, '입력 필드를 찾을 수 없습니다.', false);
          }
        };

        /**
         * 모든 입력 필드 초기화
         *
         * 보내는 사람 이름과 전화번호 필드를 모두 비움
         */
        const clearAllFields = () => {
          const senderFields = document.querySelectorAll('input[placeholder="누구 보내는 선물인가요? (최대 10자)"]');
          senderFields.forEach(field => {
            setInputValue(field, '');
          });

          const phoneFields = document.querySelectorAll('input[placeholder="(필수) 휴대폰번호"]');
          phoneFields.forEach(field => {
            setInputValue(field, '');
          });

          const altFields = document.querySelectorAll('input[placeholder*="휴대폰"], input[placeholder*="전화번호"], input[type="tel"]');
          altFields.forEach(field => {
            setInputValue(field, '');
          });

          const status = document.getElementById('gaf-status');
          showStatus(status, '모든 필드가 지워졌습니다.', true);
        };

        // 페이지 로드 후 UI 생성 및 중복 체크 실행
        setTimeout(createFloatingBox, 1000);
        setTimeout(checkDuplicateAllowance, 1500);
      },
    },
  };

  // ========================================
  // 초기화 및 실행
  // ========================================

  /**
   * 모든 핸들러 초기화
   *
   * URL에 따라 해당하는 핸들러만 실행됨
   * 각 핸들러 내부에서 URL 체크를 하므로 모두 호출해도 안전함
   *
   * 새로운 사이트 지원 추가 시:
   * 1. handlers 객체에 새 핸들러 추가
   * 2. 여기에 호출 코드 추가
   */
  function init() {
    handlers.onstove.orderRedirect();
    handlers.onstove.itemPage();
    handlers.payco.autoLogin();
    handlers.netmarble.culturelandPayment();
    handlers.itemmania.buyPageAutoFill();
    handlers.itemmania.receiptNoIssue();
    handlers.itemmania.sellerAgreementPopup();
    handlers.itemmania.addQuickReplyButtons();
    handlers.giftshow.autoFillPhoneNumbers();
  }

  // 즉시 실행
  init();
})();
