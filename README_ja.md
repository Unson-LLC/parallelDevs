<a href="https://www.uzi.sh">
  <img src="https://trieve.b-cdn.net/www.uzi.sh_.png">
</a>
<p align="center">
  <a
    href="https://cdn.trieve.ai/uzi-whitepaper.pdf"
    target="_blank"
    rel="noopener noreferrer"
    >ホワイトペーパー
  </a>
</p>

## インストール

```bash
go install github.com/devflowinc/uzi@latest
```

GOBINがPATHに含まれていることを確認してください。

```sh
export PATH="$PATH:$HOME/go/bin"
```

## 機能

- 🤖 複数のAIコーディングエージェントを並列実行
- 🌳 独立した開発環境のための自動Gitワークツリー管理
- 🖥️ 各エージェント用のTmuxセッション管理
- 🚀 ポート管理を備えた自動開発サーバーセットアップ
- 📊 エージェントの状態とコード変更のリアルタイム監視
- 🔄 エージェントのプロンプトと確認の自動処理
- 🎯 エージェントの変更を簡単にチェックポイントしてマージ

## 前提条件

- **Git**: バージョン管理とワークツリー管理のため
- **Tmux**: ターミナルセッション管理のため
- **Go**: インストールのため
- **お好みのAIツール**: `claude`、`codex`など

## 設定

### uzi.yaml

プロジェクトルートに`uzi.yaml`ファイルを作成してUziを設定します：

```yaml
devCommand: cd astrobits && yarn && yarn dev --port $PORT
portRange: 3000-3010
```

#### 設定オプション

- **`devCommand`**: 開発サーバーを起動するコマンド。ポート番号のプレースホルダーとして`$PORT`を使用します。
  - Next.jsの例: `npm install && npm run dev -- --port $PORT`
  - Viteの例: `npm install && npm run dev -- --port $PORT`
  - Djangoの例: `pip install -r requirements.txt && python manage.py runserver 0.0.0.0:$PORT`
- **`portRange`**: Uziが開発サーバーに使用できるポートの範囲（形式: `start-end`）

**重要**: 各エージェントは独自の依存関係を持つ独立したワークツリーで実行されるため、`devCommand`には必要なすべてのセットアップ手順（`npm install`、`pip install`など）を含める必要があります。

## 基本的なワークフロー

1. **タスクを指定してエージェントを開始：**

   ```bash
   uzi prompt --agents claude:3,codex:2 "認証機能を持つユーザー管理用のREST APIを実装"
   ```

2. **uzi autoを実行**

   uzi autoはすべてのツール呼び出しを自動的にEnterで確認します

   ```
   uzi auto
   ```

3. **エージェントの進捗を監視：**

   ```bash
   uzi ls -w  # ウォッチモード
   ```

4. **追加の指示を送信：**

   ```bash
   uzi broadcast "入力検証を必ず追加してください"
   ```

5. **完了した作業をマージ：**
   ```bash
   uzi checkpoint funny-elephant "feat: ユーザー管理APIを追加"
   ```

## コマンド

### `uzi prompt` (エイリアス: `uzi p`)

指定されたプロンプトで新しいエージェントセッションを作成します。

```bash
uzi prompt --agents claude:2,codex:1 "ReactでToDoアプリを構築"
```

**オプション:**

- `--agents`: `agent:count[,agent:count...]`形式でエージェントと数を指定
  - エージェント名に`random`を使用するとランダムなエージェント名になります
  - 例: `--agents claude:2,random:3`

### `uzi ls` (エイリアス: `uzi l`)

すべてのアクティブなエージェントセッションとその状態を一覧表示します。

```bash
uzi ls       # アクティブなセッションを一覧表示
uzi ls -w    # ウォッチモード - 毎秒更新
```

```
AGENT    MODEL  STATUS    DIFF  ADDR                     PROMPT
brian    codex  ready  +0/-0  http://localhost:3003  make a component that looks similar to @astrobits/src/components/Button/ that creates a Tooltip in the same style. Ensure that you include a reference to it and examples on the main page.
gregory  codex  ready  +0/-0  http://localhost:3001  make a component that `
```

### `uzi auto` (エイリアス: `uzi a`)

すべてのエージェントセッションを監視し、プロンプトを自動的に処理します。

```bash
uzi auto
```

**機能:**

- 信頼プロンプトに対して自動的にEnterを押す
- 継続確認を処理
- 中断されるまで（Ctrl+C）バックグラウンドで実行

### `uzi kill` (エイリアス: `uzi k`)

エージェントセッションを終了し、リソースをクリーンアップします。

```bash
uzi kill agent-name    # 特定のエージェントを終了
uzi kill all          # すべてのエージェントを終了
```

### `uzi run` (エイリアス: `uzi r`)

すべてのアクティブなエージェントセッションでコマンドを実行します。

```bash
uzi run "git status"              # すべてのエージェントで実行
uzi run --delete "npm test"       # 実行後にウィンドウを削除
```

**オプション:**

- `--delete`: コマンド実行後にtmuxウィンドウを削除

### `uzi broadcast` (エイリアス: `uzi b`)

すべてのアクティブなエージェントセッションにメッセージを送信します。

```bash
uzi broadcast "すべてのAPI呼び出しにエラーハンドリングを追加してください"
```

### `uzi checkpoint` (エイリアス: `uzi c`)

エージェントのワークツリーから現在のブランチに変更をコミットしてリベースします。

```bash
uzi checkpoint agent-name "feat: ユーザー認証を実装"
```

### `uzi reset`

すべてのUziデータと設定を削除します。

```bash
uzi reset
```

**警告**: これは`~/.local/share/uzi`内のすべてのデータを削除します

### 高度な使用方法

**異なるAIツールの実行:**

```bash
uzi prompt --agents=claude:2,aider:2,cursor:1 "認証システムをリファクタリング"
```

**ランダムなエージェント名の使用:**

```bash
uzi prompt --agents=random:5 "すべてのTypeScriptエラーを修正"
```

**すべてのエージェントでテストを実行:**

```bash
uzi run "npm test"
```