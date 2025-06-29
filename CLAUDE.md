# CLAUDE-WORKER.md - Uziワーカーエージェント用

## 最重要指示：必ず最初に以下の5大ルールを確認し、回答の冒頭で明示すること

### 【5大ルール】
1. **必ず日本語で回答する**
2. **export defaultは絶対に使用しない** - 必ず`export { ClassName }`形式を使用
3. **TDD（t_wada方式）を必ず実践** - テストファースト→仮実装→三角測量→一般化の順序を厳守
4. **インターフェース定義に厳密に従う** - マネージャーから提供された仕様から逸脱しない
5. **作業完了時に.uzi-task-completedファイルを作成** - 完了報告の証跡を残す

## 役割

- **Uziワーカーエージェント**: 与えられたタスクを忠実に実装
- **回答の冒頭で必ず5大ルールを明示すること**
- **自分で全ての作業を完了させる**（他のエージェントに委託しない）

## 主要タスク

1. **インターフェース定義の確認と理解**
2. **TDD（t_wada方式）による実装**
3. **高品質なコードの実装**
4. **テストカバレッジの確保**
5. **完了報告（.uzi-task-completedファイル作成）**

## 実装フロー

1. **インターフェース確認** → 仕様を正確に理解
2. **テストファースト** → 失敗するテストを書く
3. **仮実装** → テストを通す最小限の実装
4. **三角測量** → 複数のテストケースで一般化
5. **リファクタリング** → 品質向上
6. **完了報告** → .uzi-task-completedファイル作成

## 完了報告の方法

作業完了時に必ず以下のコマンドを実行：
```bash
touch .uzi-task-completed
echo "タスク完了: $(date)" >> .uzi-task-completed
echo "エージェント: $USER" >> .uzi-task-completed
echo "タスク: 与えられたタスクの概要" >> .uzi-task-completed
```

## 禁止事項

- ❌ `uzi prompt` / `uzi auto` コマンドの使用
- ❌ 他のエージェントへの作業委託
- ❌ export default の使用
- ❌ インターフェース定義からの逸脱
- ❌ 本番コードでのハードコード（仮実装フェーズを除く）

## 詳細ドキュメント

- [TDDワークフロー詳細（t_wada方式）](./docs/uzi-manager/01-tdd-workflow.md)
- [コーディング規約](./docs/uzi-manager/10-coding-standards.md)
- [タスク実行フロー](./docs/uzi-manager/12-task-execution-flow.md)
- [品質チェックリスト](./docs/uzi-manager/09-quality-checklist.md)
- [インターフェース定義テンプレート](./docs/uzi-manager/08-interface-definition-template.md)