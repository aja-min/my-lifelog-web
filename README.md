# Life Log

Google Driveの「Lifelog AI - 1日の要約」を、自分だけの日記として読み返すWebアプリです。Next.js 16.3.6 / App Router / TypeScript / Tailwind CSS 4。DB、OpenAI API、書き戻しは使いません。

## できること

- **Home**：最新日の一言・概要・重要な発見・カテゴリ、最近7件
- **Calendar**：月移動、記録のある日から詳細へ
- **日記**：出来事・アイデア・食事など、空でないセクションだけ表示。原文の折りたたみ表示
- **Search**：全日記の日本語全文検索、日付検索、検索語ハイライト。空白区切りはAND検索、英字大小・全角半角を正規化
- **Ideas**：小説・文章、人生・生活、その他の横断一覧と種類別表示
- **Next Actions**：日付ごとの閲覧専用一覧。チェック状態と期限は原文に基づく
- PCのサイドバー / iPhoneの下部ナビゲーション

## すぐ画面を見る（架空データ）

Node.js **22または24 LTS** とnpmを用意してください。

```bash
npm ci
cp .env.example .env.local
```

`.env.local` の `DEMO_MODE=true` に変更して起動します。

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。デモは **`next dev` のときだけ** 動作し、架空の記録だけを使います。`next start` / Vercelでは `DEMO_MODE=true` が設定されていても認証を省略しません。デモと実データが混ざることはありません。

この作業環境の `.env.local` には、確認できた対象フォルダIDとデモ設定を用意しています。再度 `cp` すると上書きされます。

## 認証を2つに分ける理由

| 用途                   | 方式                                              | 理由                                                                                         |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| アプリを開く本人の確認 | NextAuth.js + Google OAuth、メール1件の許可リスト | 独自パスワード管理やDBを不要にし、Googleのログイン保護を利用できる                           |
| Driveの読み取り        | サービスアカウント + `drive.readonly`             | 更新トークンの手動管理なしでVercelから安定して読み取れる。対象フォルダだけを閲覧者共有できる |

Google OAuthは `openid email profile` のみを要求します。Googleが検証済みのメール (`email_verified=true`) と `ALLOWED_EMAIL` が一致する場合だけログインできます。暗号化JWTセッションは8時間有効で、HTTPSではSecure / HttpOnly Cookieを利用します。アクセスのたびに許可メールを再確認するので、許可リストから外した既存セッションも記録を取得できません。

全日記ルートのレイアウトに加えて、**データ取得の入口でも認証**します。認証設定が不足していると `/login` に移動し、データを公開しません。Googleのトークンや秘密鍵をクライアントへ渡しません。外部画像と生HTMLはMarkdownから描画しません。外部リンクへの遷移で参照元を送信しません。アクセス解析や外部フォントもありません。

## 1. Google Cloudの準備

1. [Google Cloud Console](https://console.cloud.google.com/) で専用プロジェクトを作成・選択します。
2. 「APIとサービス」→「ライブラリ」で **Google Drive API** を検索して有効化します。
3. 「IAMと管理」→「サービスアカウント」→「サービスアカウントを作成」。例：`life-log-reader`。プロジェクトの管理者等のロールを付ける必要はありません。
4. 作成したアカウントの「キー」→「鍵を追加」→「新しい鍵を作成」→JSONを選びます。
5. ダウンロードしたJSONの `client_email` と `private_key` を、後述の環境変数に使います。JSON自体をこのリポジトリへ保存しないでください。

## 2. 対象Driveフォルダの共有

1. Google Driveで **「Lifelog AI - 1日の要約」** フォルダを開きます。
2. フォルダの「共有」で、サービスアカウントの `client_email` を**閲覧者**として追加します。「一般的なアクセス」は「制限付き」のままにします。
3. URLの `https://drive.google.com/drive/folders/` に続くIDを控えます。
4. 日次Markdownがこのフォルダの**直下**にあることを確認します。

```text
Lifelog AI - 1日の要約/
  Lifelog_20260924.md
  Lifelog_20260925.md
```

`Lifelog_YYYYMMDD.md` と完全一致し、日付として有効なファイルのみを使います。時間指定ファイル、サブフォルダ、音声、Google Docsは対象外です。指定したIDのフォルダ名も検証するため、別のLifelogフォルダを誤指定するとエラーになります。同じ日付のファイルが重複した場合は更新日時が最も新しい1件を採用します。

サービスアカウントには他の個人フォルダを共有しない構成を推奨します。Workspaceで外部共有やサービスアカウント鍵の作成が組織ポリシーにより制限されている場合は、管理者による設定が必要です。

## 3. Googleログインの設定

1. Cloud Consoleの「Google Auth Platform」（または「APIとサービス」→「OAuth同意画面」）でアプリ名・連絡先を設定します。
2. 個人Gmailでは対象を **外部** にして、テストユーザーに自分のGoogleメールアドレスを追加します。個人用の検証中はテストモードで利用できます。
3. OAuthスコープは `openid`、メール、プロフィールのみ。DriveスコープはOAuthクライアントに追加しません。
4. 「クライアント」→「クライアントを作成」→ **ウェブアプリケーション**。
5. ローカル用に次を登録します。

```text
承認済みのJavaScript生成元:
http://localhost:3000

承認済みのリダイレクトURI:
http://localhost:3000/api/auth/callback/google
```

6. 作成したクライアントID・クライアントシークレットを環境変数に設定します。

`127.0.0.1` と `localhost` は別の生成元です。実際のログイン検証では登録済みの `localhost` を使ってください。

## 4. `.env.local` を設定する

`.env.example` をコピーし、次を埋めます。`NEXT_PUBLIC_` プレフィックスは一切付けません。

```dotenv
DEMO_MODE=false
GOOGLE_DRIVE_FOLDER_ID=対象フォルダのID
GOOGLE_SERVICE_ACCOUNT_EMAIL=life-log-reader@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nJSON鍵の内容\n-----END PRIVATE KEY-----\n"

GOOGLE_CLIENT_ID=OAuthクライアントID
GOOGLE_CLIENT_SECRET=OAuthクライアントシークレット
ALLOWED_EMAIL=自分のGoogleメールアドレス
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ランダムな秘密文字列
```

秘密文字列は次で生成します。

```bash
openssl rand -base64 32
```

`private_key` はJSONの値をそのまま二重引用符で囲んで記載できます。コード側で `\n` を改行に変換します。サービスアカウント鍵とOAuthクライアントのシークレットは別物です。`ALLOWED_EMAIL` は1件のみで、Googleが返す実際のメールアドレスを使います。

`.env.local` はGit管理対象外です。環境変数を変えたら開発サーバーを再起動してください。

## 5. 実データでローカル起動

```bash
npm run dev
```

1. [http://localhost:3000](http://localhost:3000) を開く。
2. 自分のGoogleアカウントでログイン。
3. Homeに最新の記録が表示されることを確認。
4. Calendar、検索、Ideas、Next Actionsを確認。
5. 別ブラウザの未ログイン状態から日記URLを直接開き、ログイン画面に戻ることを確認。

アプリ認証とサービスアカウントが未設定なら、実Driveへの接続はまだ動作しません。開発時にはGoogle Driveコネクター経由で対象フォルダと実Markdownの構造を確認しましたが、その接続資格情報はこのWebアプリへ引き継がれません。実ファイルの本文はリポジトリに含めていません。

## 6. Vercelへデプロイ

1. このディレクトリを自分の**プライベートGitリポジトリ**に保存します。`.env.local`、JSON鍵、個人のMarkdownを追加しないでください。
2. [Vercel](https://vercel.com/new) でリポジトリをインポート。Framework Presetは **Next.js**、Node.jsは **22.xまたは24.x**。
3. Project Settings → Environment Variablesに上記の変数を登録します。Productionに必要な変数をすべて登録し、`DEMO_MODE=false` にします。
4. `NEXTAUTH_URL` を `https://あなたのプロジェクト.vercel.app` または独自ドメインに変更します。
5. GoogleのOAuthクライアントに本番の生成元・リダイレクトURIを追加します。

```text
https://あなたのプロジェクト.vercel.app
https://あなたのプロジェクト.vercel.app/api/auth/callback/google
```

6. Deployを実行。環境変数を後から変えた場合は **Redeploy** します。
7. 本番で自分のGoogleアカウントがログインでき、許可されないアカウントでは拒否されることを確認します。

Vercelの環境変数入力欄では、鍵の値に外側の引用符を含めず、実改行または `\n` を含む文字列を貼り付けます。Productionの秘密値はPreviewへ不要に共有しないでください。Previewで実データを使う場合は、固定ドメインと対応するOAuthコールバックURIを別途設定します。認証はアプリで必須にしているため、Vercel Deployment Protectionの有料機能には依存しません。

この実装作業ではVercelへの公開やGoogle Cloud資格情報の作成は行っていません。

## キャッシュとデータの扱い

- 全ページは動的レンダリングで、公開HTMLとして日記を事前生成しません。
- フォルダ直下のファイル一覧はNext.js Data Cacheに **300秒** キャッシュ。ページネーションで全件取得します。
- 本文は **フォルダID・サービスアカウント・ファイルID・更新日時** をキーにキャッシュ。変更がない本文は最大24時間再利用し、更新日時が変われば別キーで取得します。
- 5分経過後のアクセスが再検証を開始します。stale-while-revalidateのため、そのアクセスには直前の一覧を返し、完了後の次のアクセスに変更が反映される場合があります。自動定期アクセスやバックグラウンド常駐処理はありません。
- 初回は横断検索のため全日次本文を取得します。リクエストは同時5件まで。個人利用のMVPとしてシンプルに保ち、毎回の全ダウンロードを避けます。
- Google Driveが原本です。ただし表示に必要な本文のコピーはNext.js/Vercelのサーバーキャッシュにも保存されます。ローカルでは `.next` に保存されることがあります。Gitには含めません。
- 削除は一覧の再検証後に画面から消えます。サービスアカウントの共有解除だけでは、以前のキャッシュを即時に消去できません。緊急時は `ALLOWED_EMAIL` の無効化・再デプロイや `NEXTAUTH_SECRET` のローテーションでアプリへのアクセスも停止してください。
- 単一ファイル2MB以下を想定。破損・取得失敗時は成功したふりをせず、接続エラーを表示します。秘密情報や本文はサーバーログに出しません。

## 構成

```text
app/
  (journal)/            認証必須のHome / Calendar / Search / Ideas / Next Actions / Settings
    log/[date]/         日次詳細
  login/                Googleログイン・初期設定案内
  api/auth/[...nextauth]/ 認証用エンドポイント
components/              ナビゲーション・日記カード・安全なMarkdown表示
lib/
  auth.ts                閲覧認証・許可リスト
  googleDrive.ts         対象フォルダ限定の読み取りとキャッシュ
  types.ts               内部LifeLogモデル
  parseLifeLog.ts         Markdown AST → 内部モデル
  lifeLogs.ts            認証とデータ取得の境界
  search.ts              全文検索
  dates.ts               日付・カレンダー
  demo.ts                架空のデモ記録
fixtures/                実データの構造に合わせた匿名のテスト用Markdown
tests/                  パーサー・検索・日付とブラウザ検証
```

MarkdownはASTで解析し、見出しの番号・絵文字・階層、順序変更、番号付きリスト、タスク、改行に対応します。見出し内に既知の語があれば対応カテゴリに分類し、認識できないセクションは「その他の記録」と原文に保持します。該当カテゴリの見出し自体がない記録も、全文検索と原文表示で失われません。空欄・「なし」等だけのセクションは表示しません。

## 検証

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`typecheck` はNext.jsのルート型を生成してから `tsc --noEmit` を実行します。

ローカルでGoogle Chromeをインストール済みの場合、デモサーバーを別ターミナルで起動してブラウザ検証も実行できます。

```bash
# ターミナル1
DEMO_MODE=true npm run dev -- --hostname 127.0.0.1
# ターミナル2
nodetests/browser-check.mjs
```

未認証アクセスの検証（Google資格情報未設定の本番モードが対象）:

```bash
# ターミナル1（npm run build の後）
npm start -- --port 3001 --hostname 127.0.0.1
# ターミナル2
node tests/access-check.mjs
```

7ルートへの通常HTMLとRSCリクエストがログインへ誘導され、認証未設定のAPIが503で閉じていることを確認します。

PC（1440px）とiPhone相当（390px）で、リンク遷移・検索・カレンダー月移動・原文展開・横はみ出し・ブラウザエラーを確認します。スクリーンショットは `/tmp/lifelog-desktop.png` と `/tmp/lifelog-mobile.png` に出力します。資格情報を設定した実GoogleログインのE2E検証は、別途上記のセットアップ後に行ってください。

## トラブルシューティング

| 症状                             | 確認すること                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------- |
| 初期設定の案内が出る             | OAuth環境変数、許可メール、NEXTAUTH_URL/SECRETをすべて設定し、再起動              |
| Googleの `redirect_uri_mismatch` | 登録URIとブラウザのドメイン・ポート・`/api/auth/callback/google` の完全一致       |
| ログインが拒否される             | テストユーザー設定、許可メールがGoogleの実メールと一致しているか                  |
| Driveを読み込めない              | Drive API有効化、サービスアカウントのフォルダ閲覧権限、鍵の改行、フォルダID・名前 |
| 記録が空                         | フォルダ直下に有効な `Lifelog_YYYYMMDD.md` があるか。ショートカットは対象外       |
| 新しい日記が見えない             | 5分経過後にアクセスし、再検証完了後に再読み込み                                   |
| デプロイ後も設定が反映されない   | Production環境変数を確認してRedeploy                                              |

参考：[Next.js認証](https://nextjs.org/docs/app/guides/authentication)、[Google OAuthプロバイダー](https://next-auth.js.org/providers/google)、[Drive files.list](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list)、[Driveファイル共有](https://developers.google.com/workspace/drive/api/guides/manage-sharing)。
