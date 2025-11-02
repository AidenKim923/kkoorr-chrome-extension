# 로드나인 웹상점 자동화 확장프로그램

로드나인(L9) 게임 아이템 구매 시 반복되는 클릭 작업을 자동화하는 Chrome 확장프로그램입니다.

## 기능

- **온스토브 웹상점**: 주문 페이지에서 상품 페이지로 자동 이동, 수량 및 약관 동의 자동 입력
- **PAYCO 결제**: 로그인 정보 자동 입력
- **넷마블 결제**: 컬쳐랜드 결제 수단 자동 선택 및 동의 체크

## 설치 방법

1. 이 저장소를 클론하거나 다운로드합니다
```bash
git clone https://github.com/your-username/repo-name.git
```

2. `config.example.js` 파일을 `config.js`로 복사합니다
```bash
cp config.example.js config.js
```

3. `config.js` 파일을 열어 본인의 정보를 입력합니다
```javascript
window.PAYCO_CONFIG = {
    memberId: "01012345678",  // 본인의 전화번호
    birth: "900101"            // 본인의 생년월일 (YYMMDD)
};
```

4. Chrome 브라우저에서 확장프로그램을 로드합니다
   - `chrome://extensions/` 접속
   - 우측 상단 "개발자 모드" 활성화
   - "압축해제된 확장 프로그램을 로드합니다" 클릭
   - 다운로드한 폴더 선택

## 사용법

확장프로그램을 설치하면 다음 사이트에서 자동으로 작동합니다:

- https://webstore.onstove.com/ko/l9/*
- https://bill.payco.com/*
- https://nmp.netmarble.com/cross-pay/V5/*

별도의 조작 없이 페이지 로드 시 자동으로 실행됩니다.

## 주의사항

- `config.js` 파일은 개인정보를 포함하고 있으므로 절대 공유하지 마세요
- 이 확장프로그램은 개인 사용 목적으로 제작되었습니다
- 사이트 구조 변경 시 작동하지 않을 수 있습니다

## 파일 구조

```
.
├── manifest.json          # 확장프로그램 설정
├── content.js            # 자동화 스크립트
├── config.js             # 개인 설정 (Git 제외)
├── config.example.js     # 설정 파일 예제
└── .gitignore           # Git 제외 파일 목록
```

## 라이선스

개인 사용 목적으로 자유롭게 사용 가능합니다.
