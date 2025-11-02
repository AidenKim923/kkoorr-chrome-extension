// ========================================
// 기본값 설정
// ========================================
const DEFAULT_CONFIG = {
  memberId: '01040891067',
  birth: '880719',
  characterNames: ['가나디', '아히', '배고파스', '하아', '쥐쥐'],
  quickReplies: {
    에이스: [
      `(제3자 사기 조심하세요. 절대 게임상이나 카톡, 다른매체를 통해서 거래 신청을 유도하지않습니다.)

구글플레이스토어에서 리니지M or 리니지2M or 리니지W 검색해서 설치해주세요. 대포폰 분실폰 결제취소 문제 발생시 형사소송 강력하게 진행합니다
진행중에 모르시는거나 문제가 발생할경우 바로 말씀하세요 그래야 도와드립니다.`,
      `계정 드리기전에 거래자 성함을 문자로 보내주세요 010 3424 1067
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 3424 1067
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 3424 1067`,
      `설치나 패치중이시면 대화함에 패치중이라고 말씀해주세요
로그인창 나오면 문자 주세요

리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요`,
    ],
    광속: [
      `(제3자 사기 조심하세요. 절대 게임상이나 카톡, 다른매체를 통해서 거래 신청을 유도하지않습니다.)

구글플레이스토어에서 리니지M or 리니지2M or 리니지W 검색해서 설치해주세요. 대포폰 분실폰 결제취소 문제 발생시 형사소송 강력하게 진행합니다
진행중에 모르시는거나 문제가 발생할경우 바로 말씀하세요 그래야 도와드립니다.`,
      `계정 드리기전에 거래자 성함을 문자로 보내주세요 010 5852 9067
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 5852 9067
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 5852 9067`,
      `설치나 패치중이시면 대화함에 패치중이라고 말씀해주세요
로그인창 나오면 문자 주세요

리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요`,
    ],
    찐: [
      `(제3자 사기 조심하세요. 절대 게임상이나 카톡, 다른매체를 통해서 거래 신청을 유도하지않습니다.)

구글플레이스토어에서 리니지M or 리니지2M or 리니지W 검색해서 설치해주세요. 대포폰 분실폰 결제취소 문제 발생시 형사소송 강력하게 진행합니다
진행중에 모르시는거나 문제가 발생할경우 바로 말씀하세요 그래야 도와드립니다.`,
      `계정 드리기전에 거래자 성함을 문자로 보내주세요 010 9537 3396
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 9537 3396
계정 드리기전에 거래자 성함을 문자로 보내주세요 010 9537 3396`,
      `설치나 패치중이시면 대화함에 패치중이라고 말씀해주세요
로그인창 나오면 문자 주세요

리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요
리니지M or 리니지2M or 리니지W  설치해주세요`,
    ],
    '상점-재화': [
      '상점-재화 11만원짜리 4천다이아 짜리로 신청주신 개수만큼 구매해주시면됩니다.',
    ],
    다하면인수: ['다하면 문자 보내주세요 확인 후 인수해드립니다.'],
  },
};

// ========================================
// UI 관리
// ========================================

// 캐릭터 항목 생성
function createCharacterInput(value = '', index) {
  const div = document.createElement('div');
  div.className = 'char-item';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = `캐릭터 이름 ${index + 1}`;
  input.dataset.index = index;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '삭제';
  removeBtn.addEventListener('click', () => {
    div.remove();
  });

  div.appendChild(input);
  div.appendChild(removeBtn);

  return div;
}

// 캐릭터 목록 렌더링
function renderCharacterList(names) {
  const container = document.getElementById('characterList');
  container.innerHTML = '';

  names.forEach((name, index) => {
    container.appendChild(createCharacterInput(name, index));
  });
}

// 캐릭터 목록 수집
function collectCharacterNames() {
  const inputs = document.querySelectorAll('.char-item input');
  return Array.from(inputs)
    .map((input) => input.value.trim())
    .filter((name) => name !== '');
}

// ========================================
// 설정 로드/저장
// ========================================

// 설정 로드
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (data) => {
      resolve(data);
    });
  });
}

// 설정 저장
async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

// UI에 설정 표시
function displaySettings(settings) {
  // PAYCO 정보
  document.getElementById('memberId').value = settings.memberId || '';
  document.getElementById('birth').value = settings.birth || '';

  // 캐릭터 이름 목록
  renderCharacterList(settings.characterNames || []);

  // 빠른 응답 메시지
  const replies = settings.quickReplies || DEFAULT_CONFIG.quickReplies;

  // 에이스
  if (replies.에이스) {
    document.getElementById('ace-msg-0').value = replies.에이스[0] || '';
    document.getElementById('ace-msg-1').value = replies.에이스[1] || '';
    document.getElementById('ace-msg-2').value = replies.에이스[2] || '';
  }

  // 광속
  if (replies.광속) {
    document.getElementById('light-msg-0').value = replies.광속[0] || '';
    document.getElementById('light-msg-1').value = replies.광속[1] || '';
    document.getElementById('light-msg-2').value = replies.광속[2] || '';
  }

  // 찐
  if (replies.찐) {
    document.getElementById('jjin-msg-0').value = replies.찐[0] || '';
    document.getElementById('jjin-msg-1').value = replies.찐[1] || '';
    document.getElementById('jjin-msg-2').value = replies.찐[2] || '';
  }

  // 기타
  if (replies['상점-재화']) {
    document.getElementById('store-msg').value = replies['상점-재화'][0] || '';
  }
  if (replies.다하면인수) {
    document.getElementById('done-msg').value = replies.다하면인수[0] || '';
  }
}

// UI에서 설정 수집
function collectSettings() {
  const characterNames = collectCharacterNames();

  const quickReplies = {
    에이스: [
      document.getElementById('ace-msg-0').value,
      document.getElementById('ace-msg-1').value,
      document.getElementById('ace-msg-2').value,
    ],
    광속: [
      document.getElementById('light-msg-0').value,
      document.getElementById('light-msg-1').value,
      document.getElementById('light-msg-2').value,
    ],
    찐: [
      document.getElementById('jjin-msg-0').value,
      document.getElementById('jjin-msg-1').value,
      document.getElementById('jjin-msg-2').value,
    ],
    '상점-재화': [document.getElementById('store-msg').value],
    다하면인수: [document.getElementById('done-msg').value],
  };

  return {
    memberId: document.getElementById('memberId').value,
    birth: document.getElementById('birth').value,
    characterNames,
    quickReplies,
  };
}

// 상태 메시지 표시
function showStatus(message, isSuccess = true) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = isSuccess ? 'status success' : 'status error';

  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

// ========================================
// 이벤트 리스너
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  // 설정 로드 및 표시
  const settings = await loadSettings();
  displaySettings(settings);

  // 캐릭터 추가 버튼
  document.getElementById('addCharBtn').addEventListener('click', () => {
    const container = document.getElementById('characterList');
    const currentCount = container.children.length;
    container.appendChild(createCharacterInput('', currentCount));
  });

  // 저장 버튼
  document.getElementById('saveBtn').addEventListener('click', async () => {
    try {
      const settings = collectSettings();
      await saveSettings(settings);
      showStatus('설정이 저장되었습니다!', true);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showStatus('설정 저장에 실패했습니다.', false);
    }
  });

  // 초기화 버튼
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      try {
        await saveSettings(DEFAULT_CONFIG);
        displaySettings(DEFAULT_CONFIG);
        showStatus('설정이 초기화되었습니다.', true);
      } catch (error) {
        console.error('설정 초기화 실패:', error);
        showStatus('설정 초기화에 실패했습니다.', false);
      }
    }
  });
});
