# Liry24 Admin MCP

## Value Proposition

Liry24 の既存管理者が、MCP 対応クライアントとの会話からサイトコンテンツと
安全なユーザー管理操作をまとめて実行できるようにする。

現在は `/admin` の各画面を個別に開いて操作する必要があり、複数リソースにまたがる
更新や内容の下書き・確認に手間がかかる。MCP は管理対象を検索し、変更案を作成し、
差分を確認した後に一括適用する。

**Core actions**

- posts、works、arts、socials、skills、careers、ranks、users を検索・参照する。
- 複数の作成、更新、削除、並べ替えを変更案として準備し、1 回の確認後に適用する。
- 署名付きアップロード URL の発行、HTTPS URL から R2 への安全な import を行う。

## Why LLM?

**Conversational win**: 「この経歴を追加し、関連するスキルの順番も直して」のような
複数リソースの意図を一度に表現できる。

**LLM adds**: 自然言語から操作対象と値を組み立て、post 本文やレビュー修正文案を
下書きし、人が確認できる差分にまとめる。

**What LLM lacks**: Liry24 の現在データ、管理権限、D1/R2/Better Auth への安全な
操作能力。これらを MCP の型付きツールと OAuth で提供する。

## Interaction Overview

専用 UI は作らず、MCP 対応クライアントの標準ツール表示を使う。

1. `liry24_admin_query` で対象を確認する。
2. `liry24_admin_prepare` が最大 50 操作を検証し、変更前後の差分と `planId` を返す。
3. アシスタントが差分を提示し、ユーザーが明示的に承認する。
4. `liry24_admin_apply` が承認済み plan を適用し、操作別結果と監査 ID を返す。
5. 部分失敗時は同じ `planId` で失敗した外部操作だけを再試行する。

## Product Context

- **Runtime**: Nuxt 4 / Nitro / Cloudflare Workers
- **Storage**: Cloudflare D1 and R2
- **Auth**: Better Auth `1.7.0-rc.4`;既存の `role === "admin"` のみ許可
- **MCP endpoint**: `https://admin.liry24.com/mcp`
- **Protocol**: MCP `2026-07-28` の Streamable HTTP のみ。legacy stateless transport は拒否する
- **Clients**: OAuth と MCP に対応したクライアント
- **No custom view**: Skybridge view、公開ディレクトリ申請、impersonation は対象外

## MCP Contract

### Tools

- `liry24_admin_query`: resource、id/search/filter、cursor、limit（最大 50）
- `liry24_admin_prepare`: 判別可能 union の operations（最大 50）
- `liry24_admin_apply`: `planId`
- `liry24_admin_issue_upload_url`: key、contentType、size

全 tool は JSON Schema、`structuredContent`、JSON text fallback、必須 `resultType` を
返す。書き込み tool には正しい destructive/read-only annotation を付ける。

### Operations

- posts: create draft、update unpublished、schedule、publish、request review、delete
- works/arts/socials/skills/careers/ranks: create、update、delete、reorder
- users: set role (`admin`/`user`)、ban、unban、revoke sessions
- uploads: HTTPS URL import

ユーザー削除と impersonation、自分自身の降格・ban・全 session 失効は禁止する。

## Auth and Transport

- Better Auth の `jwt()`、`mcp()`、`cimd()` を使用する。
- resource は `/mcp`、scope は `liry24:admin offline_access`。
- access token 15 分、refresh token 30 日、reuse window 30 秒。
- CIMD を優先し、CIMD 未対応 client 向けに DCR fallback を残す。
- CIMD の外部 HTTPS 取得は、非公開の `liry24-cimd-fetcher` service binding 経由で
  Node Container に委譲する。公式 `@better-auth/cimd/node` transport が DNS を一度だけ解決し、
  public-routable address に固定して接続し、redirect を追従しない。
- Container は Lite 1 instance、30 秒 idle sleep とし、CIMD のメタデータ本文や永続 cache は持たない。
- consent はログイン済み admin のみ許可する。
- `requireMcpAuth` が JWT の署名、issuer、audience、expiry、scope、DPoP/replay を検証し、
  アプリ側は現在の user role、ban、session だけを追加で検証する。
- Origin と MCP protocol headers、header/body method-name 整合性を検証する。

## Consistency and Safety

- prepare は業務データを変更せず、actor、snapshot/hash、diff、10 分の期限を持つ
  plan を保存する。
- D1 コンテンツ操作は単一 transaction で適用する。
- Better Auth user 操作と R2 import は項目別に冪等適用し、部分失敗 plan は
  24 時間、失敗項目だけ再試行できる。
- 監査ログには before/after/outcome を保存し、token、credential、署名 URL は
  保存しない。
- URL import は HTTPS のみ、redirect 3 回、10 MiB、SSRF 防御、MIME allowlist、
  key traversal 防止を行う。

## Posts Lifecycle

`liria24/otoi` の commit
`c76ecaa22f7e7728f3a8dc0dd50628d19d3b5917` の blogs を挙動の基準にする。

- 既存 slug 主キー、`/posts`、`content`、tags を維持する。
- `draft | scheduled | published`、excerpt、scheduledAt、publishedAt、
  authorUserId を追加する。
- 既存 rows は published、`publishedAt = createdAt` として移行する。
- 公開 API と sitemap は publish 済みかつ公開時刻到来済みだけを返す。
- publish 済み post は本文編集不可。削除は明示確認付きで維持する。
- Cloudflare AI binding の `openai/gpt-5.6-luna` で issues と suggestedContent を
  作成する。review 失敗は publish を妨げない。
- Nitro task と 1 分間隔の Wrangler Cron で予約公開と review retry を行う。

## Validation

- MCP 2026 client の接続・tool call と legacy transport の拒否を検証する。
- OAuth discovery、CIMD、DCR fallback、admin/ban/scope/audience/session 拒否を検証する。
- prepare/apply の期限、actor、競合、rollback、retry、self-lockout 防止を検証する。
- posts migration、公開条件、予約公開、AI review の成功・失敗を検証する。
- SSRF、redirect、size、MIME、key traversal を検証する。
- Bun tests、typecheck、lint、format check、Nuxt build、D1 migration verification、
  Codex plugin validation を通す。
