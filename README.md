# react-table-component

## 소스 압축 (`.gitignore` + 지정 경로 제외)

프로젝트 루트(`package.json`이 있는 디렉터리)에서 실행하세요.

**포함:** Git이 추적 중인 파일과, 아직 추적되지 않았지만 `**.gitignore`에 의해 무시되지 않는** 파일만 묶습니다.
**추가로 빠지는 항목:** `.claude`, `.cursor`, `AGENTS.md`, `AGNETS.md`, `BUG.md`, `CLAUDE.md`, `README.md`, `TODO.md` 및 그 하위 경로.

### macOS / Linux / Windows (권장: Git + `tar`)

`git ls-files`의 `--exclude-standard`가 `**.gitignore`와 동일한 기준**으로 제외합니다.
Windows는 **Git Bash**에서 실행하는 것을 권장합니다(널 문자 파이프 호환).

```bash
git ls-files -zco --exclude-standard -- . \
  ':(exclude).claude' \
  ':(exclude).cursor' \
  ':(exclude).vscode' \
  ':(exclude)AGENTS.md' \
  ':(exclude)AGNETS.md' \
  ':(exclude)BUG.md' \
  ':(exclude)CLAUDE.md' \
  ':(exclude)README.md' \
  ':(exclude)TODO.md' |
  tar -czvf ../react-table-component-src.tar.gz --null -T -
```

### 동작 요약


| 구분                  | 방식                                         |
| ------------------- | ------------------------------------------ |
| `.gitignore`에 있는 항목 | `git ls-files --exclude-standard`로 목록에서 제외 |
| 위에 적은 폴더·파일         | Git pathspec `:(exclude)…`로 추가 제외          |
| `.git` 폴더           | `git ls-files`에는 포함되지 않음(압축에 들어감 없음)       |


