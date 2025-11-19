# 꾸르매크로 (Chrome Extension)

꾸르컴퍼니에서 사용하는 결제 및 구매할때 불필요한 작업을 방지하는 크롬 익스텐션입니다.

## 주요 기능

### 1. 온스토브(로드나인) 웹상점 자동화
- 주문 페이지에서 상품 페이지로 자동 이동
- 수량(4개) 자동 입력
- 약관 동의 자동 체크

### 2. PAYCO 결제 자동 로그인
- 전화번호 자동 입력
- 생년월일 자동 입력

### 3. 넷마블 결제 자동화
- 컬쳐랜드 결제 수단 자동 선택
- 동의 체크박스 자동 선택
- 결제 버튼 자동 클릭

### 4. 아이템매니아 자동화
- **구매 페이지 자동 입력**
  - 수량: 4000 자동 입력
  - 가격: 60000 자동 입력
  - 제목: "혈원 분배용 다이아 삽니다" 자동 입력
  - 즉시구매 등록 자동 체크
  - VIP 등급 자동 선택
  - 캐릭터 이름 랜덤 선택
  - 구매등록 버튼을 페이지 상단에 고정

- **거래 페이지 자동화**
  - 현금영수증 미발급 자동 선택
  - 판매자 동의 팝업 자동 처리

- **채팅 빠른 응답**
  - 채팅에서 빠른 응답 버튼 제공
  - 커스터마이징 가능한 메시지

### 5. 기프티쇼 자동 입력
- 전화번호 일괄 입력 (최대 200개)
- 보내는 사람 이름 자동 입력
- 중복 번호 허용 자동 체크
- 드래그 가능한 플로팅 UI

### 6. 설정 UI
- 확장프로그램 아이콘 클릭으로 설정 페이지 접근
- PAYCO 로그인 정보 관리
- 기프티쇼 기본 전화번호 및 보내는 사람 이름 관리
- 캐릭터 이름 목록 관리
- 빠른 응답 메시지 커스터마이징
- Chrome Storage API를 통한 설정 동기화

## 설치 방법

1. 이 저장소를 클론하거나 다운로드합니다
```bash
git clone https://github.com/AidenKim923/kkoorr-chrome-extension.git
```

2. `config.example.js` 파일을 `config.js`로 복사합니다

3. `config.js` 파일을 열어 개인정보를 입력합니다
```javascript
window.PAYCO_CONFIG = {
  memberId: '01012345678',        // 실제 전화번호
  birth: '990923',                // 실제 생년월일 (YYMMDD)
  characterNames: ['캐릭터1', '캐릭터2'],
  giftshowDefaultPhone: '010-1234-5678',
  giftshowSenderName: '홍길동',
  quickReplies: {
    에이스: ['메시지1', '메시지2', '메시지3'],
    광속: ['메시지1', '메시지2', '메시지3'],
    찐: ['메시지1', '메시지2', '메시지3'],
    '상점-재화': ['상점-재화 관련 메시지'],
    다하면인수: ['완료 후 인수 관련 메시지']
  }
};
```

4. Chrome 브라우저에서 확장프로그램을 로드합니다
   - `chrome://extensions/` 접속
   - 우측 상단 "개발자 모드" 활성화
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - 다운로드한 폴더 선택

5. 확장프로그램 아이콘을 클릭하여 설정 페이지에서 개인 정보를 확인하고 저장합니다

## 사용법

### 자동 실행
확장프로그램을 설치하면 다음 사이트에서 자동으로 작동합니다:

- `https://webstore.onstove.com/ko/l9/order/*` - 로드나인 웹상점 1만다이아 상품 페이지로 자동 이동
- `https://webstore.onstove.com/ko/l9/item/7976` - 로드나인 웹상점 수량 및 약관 자동 입력
- `https://bill.payco.com/*` - PAYCO 로그인 정보 자동 입력
- `https://nmp.netmarble.com/cross-pay/V5/*` - 컬쳐랜드 결제 자동화
- `https://trade.itemmania.com/buy/*` - 구매 페이지 자동 입력
- `https://trade.itemmania.com/myroom/buy/buy_ing_view.html*` - 아이템매니아 구매 화면 현금영수증 미발급 선택
- `https://trade.itemmania.com/myroom/sell/sell_ing_view.html*` - 아이템매니아 판매 화면 현금영수증 미발급 선택
- `https://trade.itemmania.com/myroom/chat/new_chat.html*` - 아이템매니아 채팅 빠른 응답 버튼 제공
- `https://*.kshop.co.kr/custord/giftishowDecorate*` - 기프티쇼 자동 입력 UI 제공

### 설정 변경
- 확장프로그램 아이콘 클릭 → 설정 페이지에서 정보 수정 → 저장 버튼 클릭
- 설정은 Chrome 계정과 동기화됩니다

## 파일 구조

```
.
├── manifest.json          # 확장프로그램 설정
├── config.example.js      # 설정 템플릿 (Git에 포함)
├── config.js              # 실제 설정 (Git에서 제외)
├── content.js             # 메인 스크립트 (상세 주석 포함)
├── popup.html             # 설정 UI
├── popup.js               # 설정 로직
├── .gitignore             # Git 제외 파일 목록
└── README.md              # 이 파일
```

## 주의사항

- 사이트 구조 변경 시 작동하지 않을 수 있습니다
- `사용으로 인한 불이익`은 책임지지 않습니다

## 라이선스

개인 사용 목적으로 자유롭게 사용 가능합니다.
