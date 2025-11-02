(async function () {
  'use strict';

  // ========================================
  // 설정 로드
  // ========================================

  // config.js에서 기본 설정을 가져오거나, 없으면 빈 객체로 초기화
  const defaultConfig = window.PAYCO_CONFIG || {};

  // Chrome Storage에서 설정을 로드하고, 없으면 defaultConfig를 사용
  const loadSettings = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(defaultConfig, (data) => {
        resolve(data);
      });
    });
  };

  // 설정 로드
  const userSettings = await loadSettings();

  // ========================================
  // 설정 및 상수
  // ========================================
  const config = {
    memberId: userSettings.memberId,
    birth: userSettings.birth,
  };
  const currentUrl = window.location.href;
  const MAX_RETRIES = 20;
  const RETRY_INTERVAL = 500;

  // 캐릭터 이름 목록 (설정에서 로드)
  const CHARACTER_NAMES = userSettings.characterNames;

  // 빠른 응답 메시지 목록 (설정에서 로드)
  const QUICK_REPLIES = userSettings.quickReplies;

  // ========================================
  // 유틸리티 함수
  // ========================================

  /**
   * 재시도 로직을 처리하는 공통 함수
   * @param {Function} callback - 실행할 함수 (성공 시 true 반환)
   * @param {number} maxRetries - 최대 재시도 횟수
   * @param {number} interval - 재시도 간격 (ms)
   */
  function retryUntilSuccess(
    callback,
    maxRetries = MAX_RETRIES,
    interval = RETRY_INTERVAL
  ) {
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
   * 체크박스를 체크하고 이벤트를 트리거
   * @param {HTMLElement} checkbox - 체크박스 요소
   */
  function checkElement(checkbox) {
    if (!checkbox) return false;

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /**
   * 요소를 클릭하고 이벤트를 트리거
   * @param {HTMLElement} element - 클릭할 요소
   */
  function clickElement(element) {
    if (!element) return false;
    element.click();
    return true;
  }

  /**
   * select 요소의 값을 변경하고 이벤트를 트리거
   * @param {HTMLElement} selectElement - select 요소
   * @param {string} value - 설정할 값
   */
  function setSelectValue(selectElement, value) {
    if (!selectElement || selectElement.value === value) return false;

    selectElement.value = value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /**
   * URL이 특정 패턴과 매치되는지 확인
   * @param {string} pattern - URL 패턴
   */
  function matchesUrl(pattern) {
    return currentUrl.startsWith(pattern);
  }

  /**
   * 배열에서 랜덤 요소 선택
   * @param {Array} array - 배열
   */
  function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 고정 버튼 생성
   * @param {HTMLElement} originalButton - 원본 버튼
   * @param {string} text - 버튼 텍스트
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

    // 기존 버튼 클릭 연결
    clone.addEventListener('click', () => originalButton.click());
  }

  // ========================================
  // 사이트별 자동화 핸들러
  // ========================================

  const handlers = {
    // 온스토브 웹상점 자동화
    onstove: {
      orderRedirect() {
        if (matchesUrl('https://webstore.onstove.com/ko/l9/order/')) {
          window.location.href = 'https://webstore.onstove.com/ko/l9/item/7976';
        }
      },

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

    // PAYCO 자동 로그인
    payco: {
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

    // 넷마블 컬쳐랜드 자동 선택
    netmarble: {
      culturelandPayment() {
        if (!matchesUrl('https://nmp.netmarble.com/cross-pay/V5/')) return;

        retryUntilSuccess(() => {
          const cultureland = document.querySelector('[data-key="2:CUL"]');
          const agreeCheckbox = document.querySelector('#iBuyAgreeCheckBox');
          const paymentButton = document.querySelector(
            '.btn-wrap a, .btn-wrap button'
          );

          // 컬쳐랜드 선택
          if (cultureland && !cultureland.classList.contains('active')) {
            cultureland.click();
          }

          // 동의 체크박스 선택
          if (agreeCheckbox && !agreeCheckbox.checked) {
            agreeCheckbox.click();
          }

          // 모든 조건 충족 시 결제 버튼 클릭
          const allReady =
            cultureland?.classList.contains('active') &&
            agreeCheckbox?.checked &&
            paymentButton;

          if (allReady) {
            paymentButton.click();
            return true;
          }

          return false;
        });
      },
    },

    // 아이템매니아 자동화
    itemmania: {
      buyPageAutoFill() {
        if (!matchesUrl('https://trade.itemmania.com/buy/')) return;

        // 기본 입력 필드 자동 채우기
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

        // 즉시구매 등록 체크박스 + VIP 선택 + 캐릭터 이름 랜덤 선택
        retryUntilSuccess(() => {
          const checkbox = document.querySelector(
            '#direct_reg_trade.g_checkbox'
          );
          const selectBox = document.querySelector(
            'select[name="direct_condition_credit"]'
          );
          const charInput = document.querySelector('#user_character');

          let checkboxDone = false;
          let selectDone = false;
          let charDone = false;

          // 1. 즉시구매 등록 체크박스 처리
          if (checkbox) {
            if (!checkbox.checked) {
              clickElement(checkbox);
            }
            checkboxDone = true;
          }

          // 2. VIP 선택 처리
          if (selectBox) {
            if (selectBox.value !== '2') {
              setSelectValue(selectBox, '2');
            }
            selectDone = true;
          }

          // 3. 캐릭터 이름 랜덤 선택
          if (charInput && !charInput.value) {
            const randomName = getRandomElement(CHARACTER_NAMES);
            simulateInput(charInput, randomName);
            charDone = true;
          } else if (charInput && charInput.value) {
            charDone = true;
          }

          return checkboxDone && selectDone && charDone;
        });

        // 4. 구매등록 버튼을 페이지 최상단으로 이동
        retryUntilSuccess(() => {
          const buyButton = document.querySelector('#ok_btn.buy_reg');

          if (buyButton) {
            // 이미 생성된 고정 버튼이 있는지 확인
            const existingFixed = document.querySelector(
              '[style*="position: fixed"][style*="top: 10px"]'
            );
            if (!existingFixed) {
              createFixedButton(buyButton, '▲ 구매등록 (상단)');
            }
            return true;
          }
          return false;
        });
      },

      receiptNoIssue() {
        const buyView =
          'https://trade.itemmania.com/myroom/buy/buy_ing_view.html';
        const sellView =
          'https://trade.itemmania.com/myroom/sell/sell_ing_view.html';

        if (!matchesUrl(buyView) && !matchesUrl(sellView)) return;

        retryUntilSuccess(() => {
          const radio = document.querySelector('#moneyreceipt_check2'); // '미발급'
          if (radio && !radio.checked) {
            clickElement(radio);
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        });
      },

      sellerAgreementPopup() {
        if (!matchesUrl('https://trade.itemmania.com/buy/')) return;

        const observer = new MutationObserver(() => {
          const checkbox = document.querySelector('#seller_agreement');
          const confirmButton = document.querySelector('.btn_green');

          // 팝업이 떴을 때만 실행
          if (checkbox && confirmButton && !checkbox.checked) {
            clickElement(checkbox);
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));

            // 렌더링 안정화를 위한 지연
            setTimeout(() => {
              clickElement(confirmButton);
              console.log('✅ 자동 판매신청 완료');
            }, 300);

            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      },

      addQuickReplyButtons() {
        if (!matchesUrl('https://trade.itemmania.com/myroom/chat/new_chat.html'))
          return;

        retryUntilSuccess(() => {
          const chatRoom = document.querySelector('.chat_room');
          const textarea = document.querySelector('#write_chat');

          if (!chatRoom || !textarea) return false;

          // 이미 버튼이 추가되었는지 확인
          if (document.querySelector('.quick-reply-container')) return true;

          // 버튼 컨테이너 생성
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

          // 각 버튼 타입에 대한 인덱스 추적
          const buttonIndexes = {
            에이스: 0,
            광속: 0,
            찐: 0,
          };

          // 원하는 버튼 순서 정의
          const buttonOrder = ['에이스', '광속', '찐', '상점-재화', '다하면인수'];

          // 버튼 생성
          buttonOrder.forEach((label) => {
            if (!QUICK_REPLIES[label]) return; // 해당 라벨의 메시지가 없으면 건너뜀

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

              // 에이스, 광속, 찐은 순환하며 모든 메시지 전송, 나머지는 단일 메시지
              if (buttonIndexes.hasOwnProperty(label)) {
                const currentIndex = buttonIndexes[label];

                // 현재 인덱스부터 시작해서 모든 메시지를 순차적으로 전송
                messages.forEach((message, idx) => {
                  setTimeout(() => {
                    // 텍스트 입력
                    simulateInput(textarea, message);

                    // 전송 버튼 클릭
                    setTimeout(() => {
                      const sendButton = document.querySelector(
                        'button#send_btn.send_btn'
                      );
                      if (sendButton) {
                        sendButton.click();
                      }
                    }, 100);
                  }, idx * 500); // 0.5초 간격
                });

                // 인덱스는 그대로 유지 (필요시 업데이트)
                buttonIndexes[label] =
                  (currentIndex + messages.length) % messages.length;
              } else {
                // 단일 메시지 전송
                simulateInput(textarea, messages[0]);

                setTimeout(() => {
                  const sendButton = document.querySelector(
                    'button#send_btn.send_btn'
                  );
                  if (sendButton) {
                    sendButton.click();
                  }
                }, 100);
              }
            });

            container.appendChild(button);
          });

          // 채팅방에 버튼 컨테이너 추가
          document.body.appendChild(container);

          return true;
        });
      },
    },
  };

  // ========================================
  // 실행
  // ========================================

  function init() {
    // 온스토브
    handlers.onstove.orderRedirect();
    handlers.onstove.itemPage();

    // PAYCO
    handlers.payco.autoLogin();

    // 넷마블
    handlers.netmarble.culturelandPayment();

    // 아이템매니아
    handlers.itemmania.buyPageAutoFill();
    handlers.itemmania.receiptNoIssue();
    handlers.itemmania.sellerAgreementPopup();
    handlers.itemmania.addQuickReplyButtons();
  }

  init();
})();
