# GCP 서비스 계정 설정 안내서

## 1. GCP 서비스 계정 키 생성

1. Google Cloud Console(https://console.cloud.google.com/)에 로그인
2. 프로젝트 "SHIPPING" 선택
3. 왼쪽 메뉴에서 "IAM 및 관리자" > "서비스 계정" 선택
4. 기존 서비스 계정을 선택하거나, "서비스 계정 만들기" 클릭하여 새로 생성
5. 서비스 계정에 다음 역할 부여:
   - App Engine 관리자
   - App Engine 배포자
   - Cloud Build 서비스 계정
   - 저장소 관리자
6. 서비스 계정 선택 > "키" 탭 > "키 추가" > "새 키 만들기" > JSON 형식 선택 > "만들기"
7. 다운로드된 JSON 키 파일 저장 (예: `service-account-key.json`)

## 2. GitHub Secrets 설정

1. GitHub 레포지토리로 이동
2. "Settings" > "Secrets and variables" > "Actions" 선택
3. "New repository secret" 클릭
4. `GCP_PROJECT_ID` 시크릿 추가:
   - Name: `GCP_PROJECT_ID`
   - Secret: `SHIPPING` (프로젝트 ID)

5. `GCP_SA_KEY` 시크릿 추가:
   - Name: `GCP_SA_KEY`
   - Secret: 서비스 계정 키 JSON 파일의 전체 내용을 복사하여 붙여넣기

**중요**: JSON 파일의 전체 내용을 그대로 복사해야 합니다. 형식은 아래와 같습니다:
```json
{
  "type": "service_account",
  "project_id": "SHIPPING",
  "private_key_id": "abcdef1234567890...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account-name@SHIPPING.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account-name%40SHIPPING.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## 3. 문제 해결

GitHub Actions에서 인증 오류가 계속 발생하는 경우:

1. 서비스 계정 키가 올바른 JSON 형식인지 확인
2. 시크릿 값에 줄바꿈이나 공백이 제대로 포함되어 있는지 확인
3. 시크릿을 삭제하고 다시 추가해보기
4. 서비스 계정에 필요한 권한이 모두 부여되었는지 확인 